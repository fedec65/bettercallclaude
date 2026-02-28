/**
 * ReAct-Style Tool-Calling Loop for DeepSeek-R1
 *
 * DeepSeek-R1 doesn't have native function calling. This module implements
 * a ReAct (Reasoning + Acting) pattern where the model outputs tool calls
 * in a structured format, we execute them, and feed results back.
 *
 * The model outputs: <tool_call>{"name": "...", "arguments": {...}}</tool_call>
 * We parse these, execute the tool, and add the result as a user message.
 */

import { streamChat, type ChatMessage, type OllamaStreamChunk } from './ollama.js';
import { type Tool, type ToolRegistry } from '../tools/registry.js';

const MAX_REACT_ITERATIONS = 10;
const TOOL_CALL_REGEX = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;

export interface ToolCallEvent {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultEvent {
  name: string;
  result: unknown;
  duration: number;
}

export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; data: ToolCallEvent }
  | { type: 'tool_result'; data: ToolResultEvent }
  | { type: 'document'; data: unknown }
  | { type: 'error'; message: string }
  | { type: 'done'; totalTokens?: number };

/**
 * Build the tool description block to inject into the system prompt.
 */
export function buildToolDescriptions(tools: Tool[]): string {
  if (tools.length === 0) return '';

  const toolDescs = tools.map((t) => {
    const params = Object.entries(t.parameters.properties || {})
      .map(([name, schema]) => {
        const s = schema as { type: string; description?: string; enum?: string[] };
        const required = (t.parameters.required || []).includes(name) ? ' (required)' : '';
        const enumStr = s.enum ? ` [${s.enum.join('|')}]` : '';
        return `    - ${name}: ${s.type}${enumStr}${required} — ${s.description || ''}`;
      })
      .join('\n');
    return `- **${t.name}**: ${t.description}\n  Parameters:\n${params}`;
  }).join('\n\n');

  return `
## Available Tools

You have access to Swiss legal research tools. To use a tool, output a tool call in this EXACT format (including the XML tags):

<tool_call>{"name": "tool_name", "arguments": {"param": "value"}}</tool_call>

You may make multiple tool calls in a single response. After each tool call, you will receive the result. Then continue your analysis.

When you have enough information to answer, provide your final response WITHOUT any tool_call tags.

${toolDescs}
`;
}

/**
 * Parse tool calls from model output.
 */
function parseToolCalls(text: string): ToolCallEvent[] {
  const calls: ToolCallEvent[] = [];
  let match;
  TOOL_CALL_REGEX.lastIndex = 0;

  while ((match = TOOL_CALL_REGEX.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.name && typeof parsed.name === 'string') {
        calls.push({
          name: parsed.name,
          arguments: parsed.arguments || {},
        });
      }
    } catch {
      // Skip malformed tool calls
    }
  }

  return calls;
}

/**
 * Extract <think>...</think> blocks from DeepSeek-R1 output.
 * Returns { thinking, response } where response has thinking blocks removed.
 */
function extractThinking(text: string): { thinking: string; response: string } {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  let thinking = '';
  let match;

  while ((match = thinkRegex.exec(text)) !== null) {
    thinking += match[1].trim() + '\n';
  }

  const response = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return { thinking: thinking.trim(), response };
}

/**
 * Remove tool call tags from text to get the "clean" response.
 */
function stripToolCalls(text: string): string {
  return text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim();
}

/**
 * Execute the ReAct tool-calling loop with streaming.
 * Yields StreamEvents as they occur.
 */
export async function* reactLoop(
  ollamaUrl: string,
  model: string,
  systemPrompt: string,
  toolDescriptions: string,
  messages: ChatMessage[],
  toolRegistry: ToolRegistry,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const fullSystemPrompt = systemPrompt + '\n\n' + toolDescriptions;
  const conversationMessages: ChatMessage[] = [
    { role: 'system', content: fullSystemPrompt },
    ...messages,
  ];

  for (let iteration = 0; iteration < MAX_REACT_ITERATIONS; iteration++) {
    // Collect the full response while streaming tokens
    let fullResponse = '';
    let inThinkBlock = false;
    let thinkBuffer = '';
    let totalTokens = 0;

    for await (const chunk of streamChat(ollamaUrl, model, conversationMessages, signal)) {
      const content = chunk.message?.content || '';
      fullResponse += content;
      totalTokens = chunk.eval_count || totalTokens;

      // Detect <think> blocks for streaming
      if (content.includes('<think>')) {
        inThinkBlock = true;
        thinkBuffer = '';
        continue;
      }
      if (inThinkBlock) {
        if (content.includes('</think>')) {
          inThinkBlock = false;
          yield { type: 'thinking', content: thinkBuffer.trim() };
          thinkBuffer = '';
          continue;
        }
        thinkBuffer += content;
        continue;
      }

      // Don't stream tokens that are part of tool call tags
      if (!fullResponse.includes('<tool_call>') || fullResponse.includes('</tool_call>')) {
        const cleanContent = content.replace(/<\/?tool_call>/g, '');
        if (cleanContent) {
          yield { type: 'token', content: cleanContent };
        }
      }
    }

    // Check for any remaining think blocks
    const { thinking } = extractThinking(fullResponse);
    if (thinking && !thinkBuffer) {
      // Was already streamed above
    }

    // Parse tool calls from the full response
    const toolCalls = parseToolCalls(fullResponse);

    if (toolCalls.length === 0) {
      // No tool calls — this is the final response
      yield { type: 'done', totalTokens };
      return;
    }

    // Execute tool calls and collect results
    const toolResults: string[] = [];

    for (const call of toolCalls) {
      yield { type: 'tool_call', data: call };

      const startTime = Date.now();
      try {
        const tool = toolRegistry.get(call.name);
        if (!tool) {
          const errorMsg = `Unknown tool: ${call.name}`;
          yield { type: 'error', message: errorMsg };
          toolResults.push(`Tool ${call.name}: ERROR — ${errorMsg}`);
          continue;
        }

        const result = await tool.execute(call.arguments);
        const duration = Date.now() - startTime;

        yield { type: 'tool_result', data: { name: call.name, result, duration } };

        // Check if the result contains legal documents to show in document viewer
        if (result && typeof result === 'object') {
          const r = result as Record<string, unknown>;
          if (r.decisions || r.articles || r.legislation) {
            yield { type: 'document', data: result };
          }
        }

        // Format result for the model
        const resultStr = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        toolResults.push(`Tool ${call.name} result:\n${resultStr}`);
      } catch (err) {
        const duration = Date.now() - startTime;
        const errorMsg = (err as Error).message;
        yield { type: 'error', message: `Tool ${call.name} failed: ${errorMsg}` };
        yield { type: 'tool_result', data: { name: call.name, result: { error: errorMsg }, duration } };
        toolResults.push(`Tool ${call.name}: ERROR — ${errorMsg}`);
      }
    }

    // Add the assistant's response and tool results to conversation
    conversationMessages.push({
      role: 'assistant',
      content: fullResponse,
    });

    conversationMessages.push({
      role: 'user',
      content: `Tool results:\n\n${toolResults.join('\n\n')}\n\nPlease continue your analysis using these results. If you have enough information, provide your final answer without any tool_call tags.`,
    });
  }

  yield { type: 'error', message: 'Maximum tool-calling iterations reached' };
  yield { type: 'done' };
}
