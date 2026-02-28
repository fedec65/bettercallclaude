/**
 * BetterCallM App Controller
 * Initializes all panels, loads agents, handles settings.
 */

const App = {
  currentAgent: 'researcher',
  agents: [],

  async init() {
    // Initialize panels
    ChatPanel.init();
    DocumentPanel.init();
    CitationsPanel.init();

    // Load agents
    await this.loadAgents();

    // Check health
    await this.checkHealth();

    // Set up event handlers
    document.getElementById('clear-chat').addEventListener('click', () => {
      ChatPanel.clear();
      DocumentPanel.clear();
      CitationsPanel.clear();
      this.setStatus('Ready');
    });

    document.getElementById('agent-select').addEventListener('change', (e) => {
      this.currentAgent = e.target.value;
    });

    // Settings dialog
    document.getElementById('settings-btn').addEventListener('click', () => {
      document.getElementById('settings-dialog').showModal();
    });

    document.getElementById('settings-cancel').addEventListener('click', () => {
      document.getElementById('settings-dialog').close();
    });

    document.getElementById('settings-save').addEventListener('click', () => {
      // Settings are server-side env vars — this is informational
      document.getElementById('settings-dialog').close();
    });

    // Resize handles
    this.initResizeHandles();

    // Periodic health check
    setInterval(() => this.checkHealth(), 30000);

    this.setStatus('Ready');
  },

  /**
   * Load available agents from the API.
   */
  async loadAgents() {
    try {
      const resp = await fetch('/api/agents');
      const data = await resp.json();
      this.agents = data.agents || [];

      const select = document.getElementById('agent-select');
      select.innerHTML = this.agents.map(a =>
        `<option value="${escapeHtml(a.id)}" ${a.id === 'researcher' ? 'selected' : ''} title="${escapeHtml(a.description)}">${escapeHtml(a.name || a.id)}</option>`
      ).join('');
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  },

  /**
   * Check Ollama and server health.
   */
  async checkHealth() {
    const dot = document.getElementById('connection-status');
    const modelInfo = document.getElementById('model-info');
    dot.className = 'status-dot checking';
    dot.title = 'Checking connection...';

    try {
      const resp = await fetch('/api/health');
      const health = await resp.json();

      if (health.ollama?.connected && health.ollama?.modelAvailable) {
        dot.className = 'status-dot connected';
        dot.title = 'Connected to Ollama';
        modelInfo.textContent = health.model || '--';
      } else if (health.ollama?.connected) {
        dot.className = 'status-dot checking';
        dot.title = `Model "${health.model}" not found. Run: ollama pull ${health.model}`;
        modelInfo.textContent = `${health.model} (not pulled)`;
      } else {
        dot.className = 'status-dot disconnected';
        dot.title = `Cannot connect to Ollama: ${health.ollama?.error || 'Unknown error'}`;
        modelInfo.textContent = 'Ollama offline';
      }
    } catch (err) {
      dot.className = 'status-dot disconnected';
      dot.title = 'Server unreachable';
      modelInfo.textContent = '--';
    }
  },

  /**
   * Initialize panel resize handles.
   */
  initResizeHandles() {
    const handles = document.querySelectorAll('.resize-handle');

    handles.forEach(handle => {
      let startX, startWidthLeft, startWidthRight, leftPanel, rightPanel;

      const onMouseDown = (e) => {
        e.preventDefault();
        startX = e.clientX;
        handle.classList.add('active');

        if (handle.dataset.resize === 'left') {
          leftPanel = document.querySelector('.chat-panel');
          rightPanel = document.querySelector('.document-panel');
        } else {
          leftPanel = document.querySelector('.document-panel');
          rightPanel = document.querySelector('.citations-panel');
        }

        startWidthLeft = leftPanel.offsetWidth;
        startWidthRight = rightPanel.offsetWidth;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e) => {
        const dx = e.clientX - startX;
        const newLeftWidth = startWidthLeft + dx;
        const newRightWidth = startWidthRight - dx;

        if (newLeftWidth > 200 && newRightWidth > 150) {
          leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
          rightPanel.style.flex = `0 0 ${newRightWidth}px`;
        }
      };

      const onMouseUp = () => {
        handle.classList.remove('active');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      handle.addEventListener('mousedown', onMouseDown);
    });
  },

  /**
   * Update the status bar text.
   */
  setStatus(text) {
    document.getElementById('status-text').textContent = text;
  },

  /**
   * Update tool activity indicator.
   */
  setToolActivity(text) {
    document.getElementById('tool-activity').textContent = text;
  },

  /**
   * Update token count display.
   */
  setTokenCount(count) {
    document.getElementById('token-count').textContent = count ? `${count} tokens` : '';
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
