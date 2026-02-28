/**
 * Chat Panel Manager
 * Handles message rendering, SSE streaming, and user input.
 */

const ChatPanel = {
  messagesContainer: null,
  input: null,
  sendBtn: null,
  history: [],   // conversation history sent to backend
  isStreaming: false,
  currentAbort: null,

  init() {
    this.messagesContainer = document.getElementById('messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');

    // Send on click
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    // Send on Ctrl+Enter
    this.input.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 200) + 'px';
    });
  },

  /**
   * Send a message to the backend.
   */
  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isStreaming) return;

    // Add user message to UI
    this.addMessage('user', text);
    this.history.push({ role: 'user', content: text });
    this.input.value = '';
    this.input.style.height = 'auto';

    // Start streaming
    this.isStreaming = true;
    this.sendBtn.disabled = true;
    App.setStatus('Thinking...');

    // Create assistant message element for streaming
    const msgEl = this.createMessageElement('assistant');
    let contentEl = msgEl.querySelector('.msg-content');
    let fullText = '';
    let thinkingBlocks = [];
    let toolCalls = [];

    try {
      this.currentAbort = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agent: App.currentAgent,
          history: this.history.slice(-20), // Last 20 messages for context
        }),
        signal: this.currentAbort.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.substring(6));
            this.handleStreamEvent(event, msgEl, contentEl, {
              fullText: () => fullText,
              setFullText: (t) => { fullText = t; },
              thinkingBlocks,
              toolCalls,
            });
          } catch (e) {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        fullText += '\n\n*[Cancelled]*';
      } else {
        fullText += `\n\n**Error:** ${err.message}`;
        console.error('Chat error:', err);
      }
    }

    // Final render
    this.renderMessageContent(msgEl, fullText, thinkingBlocks, toolCalls);
    msgEl.classList.remove('streaming-cursor');

    // Add to history
    if (fullText.trim()) {
      this.history.push({ role: 'assistant', content: fullText });
    }

    this.isStreaming = false;
    this.sendBtn.disabled = false;
    this.currentAbort = null;
    App.setStatus('Ready');
    this.scrollToBottom();
  },

  /**
   * Handle a single SSE stream event.
   */
  handleStreamEvent(event, msgEl, contentEl, state) {
    switch (event.type) {
      case 'token': {
        // Filter out tool_call tags from display
        let token = event.content || '';
        // Accumulate full text
        state.setFullText(state.fullText() + token);
        // Live render
        contentEl.innerHTML = renderMarkdown(this.cleanText(state.fullText()));
        msgEl.classList.add('streaming-cursor');
        this.scrollToBottom();
        break;
      }

      case 'thinking': {
        // Progressive thinking — accumulate into a single block
        if (state.thinkingBlocks.length === 0) {
          state.thinkingBlocks.push(event.content);
        } else {
          state.thinkingBlocks[state.thinkingBlocks.length - 1] += event.content;
        }
        App.setStatus('Thinking...');
        this.renderMessageContent(msgEl, state.fullText(), state.thinkingBlocks, state.toolCalls);
        break;
      }

      case 'tool_call': {
        const tc = event.data;
        state.toolCalls.push({ name: tc.name, args: tc.arguments, status: 'running' });
        App.setStatus(`Calling tool: ${tc.name}...`);
        App.setToolActivity(`${tc.name}...`);
        this.renderMessageContent(msgEl, state.fullText(), state.thinkingBlocks, state.toolCalls);
        break;
      }

      case 'tool_result': {
        const tr = event.data;
        // Update the tool call status
        const lastTc = state.toolCalls.findLast(t => t.name === tr.name && t.status === 'running');
        if (lastTc) {
          lastTc.status = 'done';
          lastTc.duration = tr.duration;
        }
        App.setToolActivity('');

        // Feed to document viewer and citations panel
        DocumentPanel.addFromToolResult(tr.name, tr.result);
        CitationsPanel.addFromToolResult(tr.name, tr.result);

        this.renderMessageContent(msgEl, state.fullText(), state.thinkingBlocks, state.toolCalls);
        break;
      }

      case 'document': {
        DocumentPanel.addFromToolResult('', event.data);
        break;
      }

      case 'error': {
        state.setFullText(state.fullText() + `\n\n**Error:** ${event.message}`);
        contentEl.innerHTML = renderMarkdown(state.fullText());
        break;
      }

      case 'done': {
        if (event.totalTokens) {
          App.setTokenCount(event.totalTokens);
        }
        break;
      }
    }
  },

  /**
   * Clean text by removing tool_call tags for display.
   */
  cleanText(text) {
    return text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').replace(/<\/?think>/g, '').trim();
  },

  /**
   * Render a complete message with thinking blocks and tool calls.
   */
  renderMessageContent(msgEl, text, thinkingBlocks, toolCalls) {
    const contentEl = msgEl.querySelector('.msg-content');
    let html = '';

    // Thinking blocks (collapsible, auto-expand while streaming)
    const isStreaming = this.isStreaming;
    for (let i = 0; i < thinkingBlocks.length; i++) {
      const expandedClass = isStreaming ? ' expanded' : '';
      const arrow = isStreaming ? '&#9660;' : '&#9654;';
      html += `
        <div class="thinking-block">
          <div class="thinking-toggle" onclick="this.nextElementSibling.classList.toggle('expanded'); this.querySelector('.arrow').textContent = this.nextElementSibling.classList.contains('expanded') ? '&#9660;' : '&#9654;'">
            <span class="arrow">${arrow}</span> Reasoning${isStreaming ? '...' : ''}
          </div>
          <div class="thinking-content${expandedClass}">${escapeHtml(thinkingBlocks[i])}</div>
        </div>
      `;
    }

    // Tool calls
    for (const tc of toolCalls) {
      const statusIcon = tc.status === 'running' ? '<span class="spinner"></span>' : '&#10003;';
      const duration = tc.duration ? ` (${tc.duration}ms)` : '';
      html += `
        <div class="tool-call-block">
          ${statusIcon} <span class="tool-name">${escapeHtml(tc.name)}</span>
          <span class="tool-duration">${duration}</span>
          <div style="color:var(--text-muted);font-size:0.72rem;margin-top:0.2rem">${escapeHtml(JSON.stringify(tc.args || {}))}</div>
        </div>
      `;
    }

    // Main text content
    const cleanedText = this.cleanText(text);
    if (cleanedText) {
      html += renderMarkdown(cleanedText);
    }

    contentEl.innerHTML = html;
    this.scrollToBottom();
  },

  /**
   * Add a message to the chat.
   */
  addMessage(role, content) {
    const el = this.createMessageElement(role);
    el.querySelector('.msg-content').innerHTML = renderMarkdown(content);
    this.scrollToBottom();
  },

  /**
   * Create a new message element and append it.
   */
  createMessageElement(role) {
    const el = document.createElement('div');
    el.className = `message ${role}`;
    el.innerHTML = `<div class="msg-content"></div>`;
    this.messagesContainer.appendChild(el);
    return el;
  },

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  },

  /**
   * Clear the conversation.
   */
  clear() {
    this.history = [];
    this.messagesContainer.innerHTML = '';
    if (this.currentAbort) {
      this.currentAbort.abort();
    }
    this.isStreaming = false;
    this.sendBtn.disabled = false;
  },
};
