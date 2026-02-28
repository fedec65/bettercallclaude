/**
 * Ollama API Client
 * Handles streaming chat completions with DeepSeek-R1 (or any Ollama model).
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  eval_count?: number;
}

/**
 * Stream a chat completion from Ollama.
 * Yields parsed chunks as they arrive.
 */
export async function* streamChat(
  ollamaUrl: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): AsyncGenerator<OllamaStreamChunk> {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama error ${response.status}: ${body}`);
  }

  if (!response.body) {
    throw new Error('No response body from Ollama');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Ollama sends newline-delimited JSON
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const chunk: OllamaStreamChunk = JSON.parse(trimmed);
        yield chunk;
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim());
    } catch {
      // Skip
    }
  }
}

/**
 * Non-streaming chat completion (collects full response).
 * Used internally by the ReAct loop.
 */
export async function chatCompletion(
  ollamaUrl: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama error ${response.status}: ${body}`);
  }

  const data = await response.json() as { message: { content: string } };
  return data.message.content;
}

/**
 * Check Ollama connectivity and model availability.
 */
export async function checkOllamaHealth(ollamaUrl: string, model: string): Promise<{
  connected: boolean;
  modelAvailable: boolean;
  error?: string;
}> {
  try {
    // Check Ollama is running
    const tagsResp = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!tagsResp.ok) {
      return { connected: false, modelAvailable: false, error: `Ollama returned ${tagsResp.status}` };
    }

    const tags = await tagsResp.json() as { models: Array<{ name: string }> };
    const modelAvailable = tags.models?.some(
      (m) => m.name === model || m.name.startsWith(model + ':')
    ) ?? false;

    return { connected: true, modelAvailable };
  } catch (err) {
    return {
      connected: false,
      modelAvailable: false,
      error: (err as Error).message,
    };
  }
}
