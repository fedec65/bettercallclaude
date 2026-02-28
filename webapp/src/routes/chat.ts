/**
 * Chat API Route
 * POST /api/chat — main chat endpoint with SSE streaming
 *
 * Request body:
 *   { message: string, agent?: string, history?: ChatMessage[] }
 *
 * Response: Server-Sent Events stream with event types:
 *   - token: streaming text token from LLM
 *   - thinking: DeepSeek reasoning content
 *   - tool_call: tool being invoked
 *   - tool_result: tool execution result
 *   - document: legal document data (for document viewer)
 *   - error: error message
 *   - done: stream complete
 */

import { Router, type Request, type Response } from 'express';
import type { AgentDefinition } from '../agents/agent-loader.js';
import type { ToolRegistry } from '../tools/registry.js';
import { reactLoop, buildToolDescriptions, type StreamEvent } from '../llm/tool-calling.js';
import type { ChatMessage } from '../llm/ollama.js';

export function createChatRouter(
  agents: Map<string, AgentDefinition>,
  toolRegistry: ToolRegistry,
  ollamaUrl: string,
  ollamaModel: string
): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const { message, agent: agentId, history } = req.body as {
      message: string;
      agent?: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      // Resolve agent
      const agentDef = agentId ? agents.get(agentId) : agents.get('researcher');
      const systemPrompt = agentDef?.systemPrompt ||
        'You are a Swiss legal research assistant. Help users with Swiss law questions.';

      // Build tool descriptions
      const tools = toolRegistry.getAll();
      const toolDesc = buildToolDescriptions(tools);

      // Build conversation messages
      const messages: ChatMessage[] = [];
      if (history && Array.isArray(history)) {
        messages.push(...history);
      }
      messages.push({ role: 'user', content: message });

      // Set up abort controller for client disconnect
      const abortController = new AbortController();
      req.on('close', () => abortController.abort());

      // Run the ReAct loop
      for await (const event of reactLoop(
        ollamaUrl,
        ollamaModel,
        systemPrompt,
        toolDesc,
        messages,
        toolRegistry,
        abortController.signal
      )) {
        if (abortController.signal.aborted) break;
        sendEvent(event);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Client disconnected — silently end
      } else {
        sendEvent({ type: 'error', message: (err as Error).message });
        sendEvent({ type: 'done' });
      }
    }

    res.end();
  });

  return router;
}
