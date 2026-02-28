/**
 * Citations Panel Manager
 * Tracks and displays legal citations found in the conversation.
 */

const CitationsPanel = {
  citations: [],
  container: null,
  countBadge: null,

  init() {
    this.container = document.getElementById('citations-list');
    this.countBadge = document.getElementById('citation-count');
  },

  /**
   * Add a citation from a tool result.
   */
  addCitation(citation) {
    // Deduplicate by normalized reference
    const normalized = citation.normalized || citation.citation || '';
    if (this.citations.some(c => (c.normalized || c.citation) === normalized)) {
      return;
    }

    this.citations.push(citation);
    this.render();
  },

  /**
   * Add citations from a tool result event.
   */
  addFromToolResult(toolName, result) {
    if (!result) return;

    // From search_bge / search_decisions results
    if (result.decisions) {
      for (const d of result.decisions) {
        if (d.bgeReference) {
          this.addCitation({
            citation: d.bgeReference,
            normalized: d.bgeReference,
            type: 'bge',
            status: 'valid',
            url: d.sourceUrl,
            court: d.court,
            date: d.date,
          });
        }
      }
    }

    // From validate_citation / validate_bge_citation results
    if (result.normalized && result.valid !== undefined) {
      this.addCitation({
        citation: result.normalized,
        normalized: result.normalized,
        type: result.type || 'bge',
        status: result.valid ? 'valid' : 'invalid',
        url: result.sourceUrl || result.fedlexUrl,
        translations: result.translations,
      });
    }

    // From extract_citations results
    if (result.citations && Array.isArray(result.citations)) {
      for (const c of result.citations) {
        this.addCitation({
          citation: c.citation,
          normalized: c.citation,
          type: c.type || 'unknown',
          status: c.valid === true ? 'valid' : c.valid === false ? 'invalid' : 'unverified',
        });
      }
    }
  },

  /**
   * Render the citations list.
   */
  render() {
    if (!this.container) return;

    if (this.citations.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <p>Citations will be tracked here as they appear in the conversation.</p>
        </div>
      `;
      if (this.countBadge) this.countBadge.textContent = '0';
      return;
    }

    if (this.countBadge) this.countBadge.textContent = String(this.citations.length);

    this.container.innerHTML = this.citations.map(c => `
      <div class="citation-item">
        <div class="citation-ref">${escapeHtml(c.normalized || c.citation)}</div>
        <div class="citation-type">${escapeHtml(c.type || 'unknown')}${c.court ? ' — ' + escapeHtml(c.court) : ''}${c.date ? ' (' + escapeHtml(c.date) + ')' : ''}</div>
        <span class="citation-status ${c.status || 'unverified'}">${c.status || 'unverified'}</span>
        ${c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.url)}</a>` : ''}
        ${c.translations ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem">DE: ${escapeHtml(c.translations.de || '')} | FR: ${escapeHtml(c.translations.fr || '')} | IT: ${escapeHtml(c.translations.it || '')}</div>` : ''}
      </div>
    `).join('');
  },

  /**
   * Clear all citations.
   */
  clear() {
    this.citations = [];
    this.render();
  },
};
