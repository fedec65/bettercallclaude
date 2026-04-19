#!/usr/bin/env node
/**
 * BetterCallClaude Privacy Check Hook
 *
 * PreToolUse hook that detects potential attorney-client privileged content
 * (Anwaltsgeheimnis / Art. 321 StGB, Art. 13 BGFA) across DE/FR/IT before it
 * leaves the machine via Write, Edit, MultiEdit, WebFetch, or any MCP tool.
 *
 * Strategy:
 *   - Strong patterns (attorney-specific terms, legal article references)
 *     always trigger a permission prompt.
 *   - Weak patterns (bare "confidential", "vertraulich", "confidentiel",
 *     "riservato") require a discriminator — a legal-context file path or
 *     another privilege marker in the content — so routine document footers
 *     do not flood the user with permission prompts.
 *
 * Per Anthropic hooks spec, stdin is:
 *   {
 *     session_id, cwd, hook_event_name: "PreToolUse",
 *     tool_name: "Write" | "Edit" | "MultiEdit" | "WebFetch" | "mcp__<server>__<tool>" | ...,
 *     tool_input: { ... }
 *   }
 *
 * A legacy flat shape (tool input fields at the top level) is also accepted
 * as a safety net.
 *
 * Output:
 *   - stdout JSON {hookSpecificOutput:{permissionDecision:"ask", ...}}
 *     written only when privileged content is detected.
 *   - Exit code 0 in all non-error paths.
 */

'use strict';

// ---------------------------------------------------------------------------
// Entry point — reads stdin, classifies content, writes hookSpecificOutput.
// ---------------------------------------------------------------------------

function main() {
  process.stdin.setEncoding('utf8');
  let input = '';
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    let data;
    try { data = JSON.parse(input); } catch { process.exit(0); }

    const toolName = typeof data.tool_name === 'string' ? data.tool_name : '';
    // Accept both the canonical {tool_input: {...}} shape and a legacy flat shape.
    const toolInput = (data.tool_input && typeof data.tool_input === 'object')
      ? data.tool_input
      : data;

    const content = extractTextFromInput(toolName, toolInput);
    const pathHint = extractPathHint(toolInput);

    if (!content.trim()) { process.exit(0); }

    const category = classify(content, pathHint);
    if (!category) { process.exit(0); }

    const reason =
      `Possible attorney-client privileged content detected (category: ${category}). ` +
      'Swiss law: Art. 321 StGB / Art. 13 BGFA. ' +
      'Confirm this content is cleared to leave the machine.';

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: reason,
      },
    }));
    process.exit(0);
  });
}

// ---------------------------------------------------------------------------
// Content extraction
// ---------------------------------------------------------------------------

/** Collect every string in the tool input relevant to content egress. */
function extractTextFromInput(toolName, input) {
  const parts = [];

  // Canonical scalar fields across built-in tools
  const scalarFields = [
    'content',      // Write
    'new_string',   // Edit
    'old_string',   // Edit (for context gating)
    'prompt',       // WebFetch, Task
    'query',        // WebSearch, many MCP search tools
    'url',          // WebFetch
    'command',      // Bash (only scanned when matcher includes Bash)
  ];
  for (const k of scalarFields) {
    if (typeof input[k] === 'string') parts.push(input[k]);
  }

  // MultiEdit: tool_input.edits[].{new_string,old_string}
  if (Array.isArray(input.edits)) {
    for (const e of input.edits) {
      if (e && typeof e === 'object') {
        if (typeof e.new_string === 'string') parts.push(e.new_string);
        if (typeof e.old_string === 'string') parts.push(e.old_string);
      }
    }
  }

  // MCP tools: input shape is arbitrary. Walk every string leaf.
  if (toolName.startsWith('mcp__')) {
    walkStrings(input, (s) => parts.push(s));
  }

  return parts.join('\n');
}

/** Extract a filesystem path hint from the tool input, if present. */
function extractPathHint(input) {
  const candidates = ['file_path', 'path', 'target_file', 'target', 'notebook_path'];
  for (const k of candidates) {
    if (typeof input[k] === 'string') return input[k];
  }
  return '';
}

function walkStrings(node, emit, depth) {
  if (depth === undefined) depth = 0;
  if (depth > 6) return; // hard cap to avoid pathological MCP payloads
  if (typeof node === 'string') { emit(node); return; }
  if (Array.isArray(node)) {
    for (const n of node) walkStrings(n, emit, depth + 1);
    return;
  }
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) walkStrings(v, emit, depth + 1);
  }
}

// ---------------------------------------------------------------------------
// Pattern classification
// ---------------------------------------------------------------------------

// Strong: high-precision privilege markers. Word-boundary-anchored.
const STRONG_PATTERNS = [
  // German — attorney-specific
  { rx: /\banwalts?\s*geheimnis(s?e)?\b/i,                cat: 'anwaltsgeheimnis' },
  { rx: /\bmandats\s*geheimnis(s?e)?\b/i,                 cat: 'mandatsgeheimnis' },
  { rx: /\bberufs\s*geheimnis(s?e)?\b/i,                  cat: 'berufsgeheimnis' },
  { rx: /\bgesch(ä|ae)fts\s*geheimnis(s?e)?\b/i,          cat: 'geschaeftsgeheimnis' },
  { rx: /\bstreng(\s+|-)?vertraulich\b/i,                 cat: 'streng-vertraulich' },

  // French
  { rx: /\bsecret\s+professionnel\b/i,                    cat: 'secret-professionnel-fr' },
  { rx: /\bsecret\s+d[' ]affaires?\b/i,                   cat: 'secret-d-affaires-fr' },
  { rx: /\bstrictement\s+confidentiel(le)?\b/i,           cat: 'strictement-confidentiel-fr' },

  // Italian
  { rx: /\bsegreto\s+professionale\b/i,                   cat: 'segreto-professionale-it' },
  { rx: /\bsegreto\s+commerciale\b/i,                     cat: 'segreto-commerciale-it' },
  { rx: /\bsegreto\s+del\s+mandato\b/i,                   cat: 'segreto-del-mandato-it' },
  { rx: /\bstrettamente\s+riservato\b/i,                  cat: 'strettamente-riservato-it' },

  // Legal article references — language-agnostic
  { rx: /\bArt\.?\s*321\s*(StGB|CP|CPS)\b/i,              cat: 'art-321-stgb' },
  { rx: /\bArt\.?\s*13\s*BGFA\b/i,                        cat: 'art-13-bgfa' },
  { rx: /\bArt\.?\s*162\s*(StGB|CP|CPS)\b/i,              cat: 'art-162-stgb' },
  { rx: /\bArt\.?\s*47\s*BankG\b/i,                       cat: 'art-47-bankg' },
  { rx: /\bArt\.?\s*35\s*FINMAG\b/i,                      cat: 'art-35-finmag' },
];

// Weak: low-precision terms. Trigger only with a discriminator present.
const WEAK_PATTERNS = [
  { rx: /\bvertraulich\b/i,        cat: 'vertraulich-bare' },
  { rx: /\bconfidentiel(le)?\b/i,  cat: 'confidentiel-bare' },
  { rx: /\briservato\b/i,          cat: 'riservato-bare' },
  { rx: /\bconfidential\b/i,       cat: 'confidential-bare' },
];

// Legal-context path segments that raise a weak match to actionable.
const DISCRIMINATOR_PATH = new RegExp(
  '(^|[\\\\/])' +
  '(klient(en)?|mandant(en)?|client|clients|case|cases|dossier|dossiers' +
  '|fall|faelle|f(ä|ae)lle|akten?|privileged|matter|matters|case[-_]files)' +
  '([\\\\/.]|$)',
  'i'
);

// Legal-context content markers (client/case references, process terms).
const DISCRIMINATOR_CONTENT = new RegExp(
  '\\b(' +
  'mandant(in|en)?|mandataire|mandante|mandatario' +
  '|klient(in|en)?|cliente|client' +
  '|dossier|aktenzeichen|case\\s+number|numero\\s+di\\s+pratica|référence' +
  '|prozess|procès|procedura|procedimento' +
  ')\\b',
  'i'
);

function classify(content, pathHint) {
  for (const p of STRONG_PATTERNS) {
    if (p.rx.test(content)) return p.cat;
  }
  for (const p of WEAK_PATTERNS) {
    if (p.rx.test(content) && hasDiscriminator(content, pathHint)) {
      return p.cat + '+context';
    }
  }
  return null;
}

function hasDiscriminator(content, pathHint) {
  if (pathHint && DISCRIMINATOR_PATH.test(pathHint)) return true;
  if (DISCRIMINATOR_CONTENT.test(content)) return true;
  // Two distinct weak markers co-occurring is itself suspicious.
  let weakHits = 0;
  for (const p of WEAK_PATTERNS) if (p.rx.test(content)) weakHits++;
  return weakHits >= 2;
}

// ---------------------------------------------------------------------------
// Module export for tests; run as script when invoked directly.
// ---------------------------------------------------------------------------

module.exports = {
  classify,
  extractTextFromInput,
  extractPathHint,
  hasDiscriminator,
  STRONG_PATTERNS,
  WEAK_PATTERNS,
};

if (require.main === module) {
  main();
}
