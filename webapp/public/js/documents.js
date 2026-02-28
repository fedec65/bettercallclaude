/**
 * Document Viewer Panel Manager
 * Displays legal documents (decisions, legislation, commentaries) retrieved by the AI.
 */

const DocumentPanel = {
  documents: [],
  activeTab: 0,
  viewer: null,
  tabs: null,

  init() {
    this.viewer = document.getElementById('document-viewer');
    this.tabs = document.getElementById('doc-tabs');
  },

  /**
   * Add a document from a tool result.
   */
  addDocument(doc) {
    this.documents.push(doc);
    this.activeTab = this.documents.length - 1;
    this.render();
  },

  /**
   * Process a tool result and extract documents.
   */
  addFromToolResult(toolName, result) {
    if (!result) return;

    // Court decisions from search_bge / search_decisions
    if (result.decisions && result.decisions.length > 0) {
      this.addDocument({
        type: 'decisions',
        title: `Search: ${result.total || result.decisions.length} decisions`,
        decisions: result.decisions,
      });
    }

    // Statute lookup results
    if (result.found && result.acts) {
      this.addDocument({
        type: 'statute',
        title: result.acts[0]?.abbreviation || result.acts[0]?.srNumber || 'Statute',
        acts: result.acts,
      });
    }

    // Article results
    if (result.found && result.articles) {
      this.addDocument({
        type: 'article',
        title: `Art. ${result.articles[0]?.articleNumber || '?'} SR ${result.srNumber || ''}`,
        articles: result.articles,
        fedlexUrl: result.fedlexUrl,
      });
    }

    // Legislation search results
    if (result.acts && !result.found && result.total !== undefined) {
      this.addDocument({
        type: 'legislation',
        title: `Legislation: ${result.total} results`,
        acts: result.acts,
      });
    }
  },

  /**
   * Render the document viewer.
   */
  render() {
    if (!this.viewer || !this.tabs) return;

    // Render tabs
    if (this.documents.length === 0) {
      this.tabs.innerHTML = '';
      this.viewer.innerHTML = `
        <div class="empty-state">
          <p>Legal documents will appear here when retrieved by the AI.</p>
          <p class="hint">Ask about a BGE decision or federal statute to see documents.</p>
        </div>
      `;
      return;
    }

    this.tabs.innerHTML = this.documents.map((doc, i) => `
      <button class="doc-tab ${i === this.activeTab ? 'active' : ''}" onclick="DocumentPanel.switchTab(${i})" title="${escapeHtml(doc.title)}">
        ${escapeHtml(doc.title)}
      </button>
    `).join('');

    // Render active document
    const doc = this.documents[this.activeTab];
    if (!doc) return;

    switch (doc.type) {
      case 'decisions':
        this.renderDecisions(doc);
        break;
      case 'statute':
        this.renderStatute(doc);
        break;
      case 'article':
        this.renderArticle(doc);
        break;
      case 'legislation':
        this.renderLegislation(doc);
        break;
      default:
        this.viewer.innerHTML = `<pre>${escapeHtml(JSON.stringify(doc, null, 2))}</pre>`;
    }
  },

  renderDecisions(doc) {
    this.viewer.innerHTML = doc.decisions.map(d => `
      <div class="doc-decision">
        <div class="doc-title">${escapeHtml(d.bgeReference || d.title || d.decisionId)}</div>
        <div class="doc-meta">
          ${escapeHtml(d.court || '')} | ${escapeHtml(d.date || '')} | ${escapeHtml(d.language || '')}
        </div>
        ${d.summary ? `<div class="doc-summary">${escapeHtml(d.summary).substring(0, 500)}${d.summary.length > 500 ? '...' : ''}</div>` : ''}
        ${d.sourceUrl ? `<a class="doc-link" href="${escapeHtml(d.sourceUrl)}" target="_blank" rel="noopener">View on entscheidsuche.ch &rarr;</a>` : ''}
      </div>
    `).join('');
  },

  renderStatute(doc) {
    this.viewer.innerHTML = doc.acts.map(a => `
      <div class="doc-decision">
        <div class="doc-title">SR ${escapeHtml(a.srNumber)} ${a.abbreviation ? '(' + escapeHtml(a.abbreviation) + ')' : ''}</div>
        <div class="doc-meta">
          ${a.actType ? escapeHtml(a.actType) + ' | ' : ''}${a.dateInForce ? 'In force: ' + escapeHtml(a.dateInForce) : ''}${a.domain ? ' | ' + escapeHtml(a.domain) : ''}
        </div>
        <div class="doc-summary">${escapeHtml(a.title || '')}</div>
        <a class="doc-link" href="https://www.fedlex.admin.ch/eli/cc/${encodeURIComponent(a.srNumber)}/de" target="_blank" rel="noopener">View on Fedlex &rarr;</a>
      </div>
    `).join('');
  },

  renderArticle(doc) {
    this.viewer.innerHTML = doc.articles.map(a => `
      <div class="doc-decision">
        <div class="doc-title">Art. ${escapeHtml(a.articleNumber)} ${a.actTitle ? '— ' + escapeHtml(a.actTitle) : ''}</div>
        ${a.title ? `<div class="doc-meta">${escapeHtml(a.title)}</div>` : ''}
        ${a.text ? `<div class="doc-summary" style="white-space:pre-wrap">${escapeHtml(a.text)}</div>` : '<div class="doc-summary" style="color:var(--text-muted)">Article text not available via SPARQL. See Fedlex link below.</div>'}
        ${doc.fedlexUrl ? `<a class="doc-link" href="${escapeHtml(doc.fedlexUrl)}" target="_blank" rel="noopener">View on Fedlex &rarr;</a>` : ''}
      </div>
    `).join('');
  },

  renderLegislation(doc) {
    this.renderStatute(doc);
  },

  switchTab(index) {
    this.activeTab = index;
    this.render();
  },

  /**
   * Clear all documents.
   */
  clear() {
    this.documents = [];
    this.activeTab = 0;
    this.render();
  },
};
