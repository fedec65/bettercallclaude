#!/usr/bin/env node
/**
 * Generate and apply `tools:` YAML frontmatter for agents, skills, and commands.
 *
 * Every MCP tool is emitted under BOTH naming conventions, because hosts
 * disagree on how plugin MCP servers are registered:
 *   - mcp__plugin_bettercallclaude_<server>__<tool>  (Cowork Desktop, most installs)
 *   - mcp__<server>__<tool>                          (some Cowork installs, Claude Code CLI)
 * A whitelist entry that matches no registered tool is inert, so listing both
 * forms is safe on every host (verified: agents with fully mismatched tool
 * lists still ran, just without MCP access).
 *
 * Usage:
 *   node scripts/generate-tool-frontmatter.js          # dry-run (print only)
 *   node scripts/generate-tool-frontmatter.js --apply  # modify files in place
 *
 * Files that already have a `tools:` block keep their curated list verbatim;
 * each prefixed MCP entry gets its unprefixed twin inserted right after it
 * (idempotent, order-preserving). Files without a `tools:` block get one
 * computed from their body text (agents are never recomputed — their lists
 * are hand-curated).
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const agentsDir = path.join(root, 'bettercallclaude', 'agents');
const skillsDir = path.join(root, 'bettercallclaude', 'skills');
const commandsDir = path.join(root, 'bettercallclaude', 'commands');
const apply = process.argv.includes('--apply');

// Server → list of tools (from agent frontmatter in v4.9.1)
const SERVER_TOOLS = {
  'bge-search': ['search_bge', 'get_bge_decision'],
  entscheidsuche: ['search_decisions', 'search_canton', 'get_decision_details', 'find_similar_cases', 'get_legal_provision_interpretation', 'analyze_precedent_success_rate'],
  'fedlex-sparql': ['search_legislation', 'get_article', 'lookup_statute', 'find_related'],
  'legal-citations': ['validate_citation', 'format_citation', 'parse_citation', 'get_provision_text', 'standardize_document_citations', 'convert_citation'],
  onlinekommentar: ['search_commentaries', 'get_commentary_for_article', 'list_legislative_acts'],
  'swiss-caselaw': ['search_decisions', 'get_decision', 'get_erwaegung', 'get_regeste', 'get_case_brief', 'find_leading_cases', 'find_citations', 'get_law', 'get_legislation', 'get_doctrine', 'get_commentary', 'search_laws', 'get_materialien', 'cite'],
  'legal-persona': ['legal_analyze', 'legal_draft', 'legal_strategy', 'compute_deadlines', 'present_adversarial_analysis', 'present_intake_form'],
  'tas-jurisprudence': ['cas_search', 'cas_get_award', 'cas_recent', 'cas_by_sport'],
  ollama: ['ollama_check_status', 'ollama_list_models', 'ollama_generate', 'ollama_classify_privacy', 'ollama_chat'],
};

const TOOL_TO_SERVERS = {};
for (const [server, tools] of Object.entries(SERVER_TOOLS)) {
  for (const tool of tools) {
    if (!TOOL_TO_SERVERS[tool]) TOOL_TO_SERVERS[tool] = [];
    TOOL_TO_SERVERS[tool].push(server);
  }
}

const COMMAND_SKILL_MAP = {
  'adversarial.md': ['adversarial-analysis'],
  'briefing.md': ['legal-intake'],
  'cantonal.md': ['swiss-legal-research'],
  'cite.md': ['swiss-citation-formats'],
  'doc-analyze.md': ['swiss-document-analysis'],
  'draft.md': ['swiss-legal-drafting'],
  'federal.md': ['swiss-legal-research'],
  'legal-5step.md': ['legal-5step-framework', 'swiss-legal-research', 'swiss-legal-strategy', 'adversarial-analysis', 'swiss-legal-drafting', 'swiss-citation-formats'],
  'legal-loop.md': ['legal-evaluator'],
  'legal.md': ['swiss-legal-research', 'legal-intake'],
  'nda-triage.md': ['swiss-document-analysis'],
  'precedent.md': ['swiss-legal-research'],
  'refine.md': ['legal-intake'],
  'research.md': ['swiss-legal-research'],
  'strategy.md': ['swiss-legal-strategy'],
  'summarize.md': ['shared'],
  'translate.md': ['swiss-legal-translation'],
  'validate.md': ['swiss-citation-formats'],
};

const GENERIC_TOOLS = ['Read', 'Grep', 'Glob', 'Bash', 'WebSearch', 'WebFetch'];

const PREFIXED_TOOL_RE = /^mcp__plugin_bettercallclaude_(.+?)__(.+)$/;

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

// Given a fully-qualified tool name, return it plus its twin under the other
// naming convention (empty extra entry when the name is not prefixed).
function dualNames(fq) {
  const m = fq.match(PREFIXED_TOOL_RE);
  if (!m) return [fq];
  return [fq, `mcp__${m[1]}__${m[2]}`];
}

// Insert the unprefixed twin after each prefixed MCP entry, deduplicating.
function dualizeTools(tools) {
  const seen = new Set();
  const out = [];
  const push = (t) => {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  };
  for (const t of tools) {
    for (const n of dualNames(t)) push(n);
  }
  return out;
}

function extractBareToolNames(text) {
  const found = new Set();
  for (const tool of Object.keys(TOOL_TO_SERVERS)) {
    const re = new RegExp(`\\b${tool}\\b`, 'g');
    if (re.test(text)) found.add(tool);
  }
  return [...found];
}

function resolveServer(tool, text) {
  const candidates = TOOL_TO_SERVERS[tool] || [];
  if (candidates.length === 1) return candidates[0];

  const serverHints = {
    'swiss-caselaw': /swiss-caselaw/i,
    entscheidsuche: /entscheidsuche/i,
    'bge-search': /bge-search/i,
    'fedlex-sparql': /fedlex-sparql/i,
    'legal-citations': /legal-citations/i,
    onlinekommentar: /onlinekommentar/i,
    'legal-persona': /legal-persona/i,
    'tas-jurisprudence': /tas-jurisprudence/i,
    ollama: /ollama/i,
  };

  for (const server of candidates) {
    if (serverHints[server] && serverHints[server].test(text)) {
      return server;
    }
  }

  const defaults = {
    search_decisions: 'swiss-caselaw',
    get_decision: 'swiss-caselaw',
    get_law: 'swiss-caselaw',
    get_article: 'fedlex-sparql',
    cite: 'swiss-caselaw',
    get_commentary: 'swiss-caselaw',
    search_legislation: 'fedlex-sparql',
    search_bge: 'bge-search',
    validate_citation: 'legal-citations',
    format_citation: 'legal-citations',
  };
  return defaults[tool] || candidates[0];
}

function fullyQualified(tool, server) {
  return `mcp__plugin_bettercallclaude_${server}__${tool}`;
}

// Locate an existing `tools:` block inside frontmatter lines.
function findToolsBlock(lines) {
  const start = lines.indexOf('tools:');
  if (start === -1) return null;
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith('  - ')) end++;
  return { start, end };
}

function parseTools(fm) {
  const lines = fm.split('\n');
  const block = findToolsBlock(lines);
  if (!block) return null;
  return lines.slice(block.start + 1, block.end).map((l) => l.replace(/^  - /, ''));
}

// Replace the existing `tools:` block in place, or insert one after the
// description line when absent. Idempotent.
function applyToolsBlock(content, tools) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  const rest = content.slice(fmMatch[0].length);
  const lines = fm.split('\n');
  const toolsYaml = ['tools:', ...tools.map((t) => `  - ${t}`)];

  const block = findToolsBlock(lines);
  if (block) {
    lines.splice(block.start, block.end - block.start, ...toolsYaml);
  } else {
    let insertAt = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('description:')) {
        insertAt = i + 1;
        // Skip multi-line description continuation
        while (insertAt < lines.length && lines[insertAt].match(/^\s+/) && !lines[insertAt].includes(':')) {
          insertAt++;
        }
        break;
      }
    }
    if (insertAt === -1) insertAt = lines.length;
    lines.splice(insertAt, 0, ...toolsYaml);
  }
  return `---\n${lines.join('\n')}\n---\n${rest}`;
}

function skillTools(skillName) {
  const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return [];
  const text = readFile(skillPath);
  const tools = [];
  for (const tool of extractBareToolNames(text)) {
    tools.push(fullyQualified(tool, resolveServer(tool, text)));
  }
  return tools;
}

function commandTools(cmdFile) {
  const text = readFile(cmdFile);
  const tools = new Set(GENERIC_TOOLS);

  for (const tool of extractBareToolNames(text)) {
    tools.add(fullyQualified(tool, resolveServer(tool, text)));
  }

  const base = path.basename(cmdFile);
  const skills = COMMAND_SKILL_MAP[base] || [];
  for (const skill of skills) {
    for (const fq of skillTools(skill)) tools.add(fq);
  }

  return [...tools];
}

// Agents: transform the curated list only (add twins), never recompute.
function agentTools(agentFile) {
  const content = readFile(agentFile);
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return { error: 'no frontmatter' };
  const existing = parseTools(fmMatch[1]);
  if (!existing) return { error: 'no tools block' };
  return { tools: dualizeTools(existing) };
}

// Skills/commands: keep an existing curated list (dualize it); compute one
// from body text only when absent.
function fileTools(filePath, compute) {
  const content = readFile(filePath);
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return { error: 'no frontmatter' };
  const existing = parseTools(fmMatch[1]);
  const tools = existing ? dualizeTools(existing) : dualizeTools(compute());
  return { tools, hadTools: !!existing };
}

function processFile(filePath, tools) {
  const content = readFile(filePath);
  const updated = applyToolsBlock(content, tools);
  if (!updated) {
    console.error(`Could not parse frontmatter: ${filePath}`);
    return false;
  }
  const rel = path.relative(root, filePath);
  if (apply) {
    if (updated !== content) {
      fs.writeFileSync(filePath, updated);
      console.log(`Updated: ${rel} (${tools.length} tools)`);
    } else {
      console.log(`Unchanged: ${rel}`);
    }
  } else {
    console.log(`${rel}: ${tools.length} tools (dual-convention)`);
  }
  return true;
}

console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);

let ok = 0;
let fail = 0;

for (const agentFile of fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'))) {
  const agentPath = path.join(agentsDir, agentFile);
  const r = agentTools(agentPath);
  if (r.error) {
    console.error(`Skipping ${agentFile}: ${r.error}`);
    fail++;
    continue;
  }
  if (processFile(agentPath, r.tools)) ok++;
  else fail++;
}

for (const skillDir of fs.readdirSync(skillsDir)) {
  const skillPath = path.join(skillsDir, skillDir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) continue;
  const r = fileTools(skillPath, () => {
    const text = readFile(skillPath);
    return [...GENERIC_TOOLS, ...extractBareToolNames(text).map((t) => fullyQualified(t, resolveServer(t, text)))];
  });
  if (r.error) {
    console.error(`Skipping ${skillDir}: ${r.error}`);
    fail++;
    continue;
  }
  if (processFile(skillPath, r.tools)) ok++;
  else fail++;
}

for (const cmdFile of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md'))) {
  const cmdPath = path.join(commandsDir, cmdFile);
  const r = fileTools(cmdPath, () => commandTools(cmdPath));
  if (r.error) {
    console.error(`Skipping ${cmdFile}: ${r.error}`);
    fail++;
    continue;
  }
  if (processFile(cmdPath, r.tools)) ok++;
  else fail++;
}

console.log(`\nDone: ${ok} ok, ${fail} failed`);
