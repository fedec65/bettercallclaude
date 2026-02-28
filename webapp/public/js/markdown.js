/**
 * Markdown Renderer
 * Wraps marked.js for rendering legal markdown with proper styling.
 */

// Configure marked options
if (typeof marked !== 'undefined') {
  marked.setOptions({
    gfm: true,
    breaks: true,
  });
}

/**
 * Render markdown text to HTML.
 */
function renderMarkdown(text) {
  if (!text) return '';
  if (typeof marked === 'undefined') {
    // Fallback: basic text with line breaks
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
  try {
    return marked.parse(text);
  } catch (err) {
    console.error('Markdown parse error:', err);
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }
}

/**
 * Escape HTML entities.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
