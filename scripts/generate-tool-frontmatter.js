#!/usr/bin/env node
/**
 * Generate and apply `tools:` YAML frontmatter for skills and commands.
 *
 * Usage:
 *   node scripts/generate-tool-frontmatter.js          # dry-run (print only)
 *   node scripts/generate-tool-frontmatter.js --apply  # modify files in place
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
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

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
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
  if (server === 'ollama') {
    return `mcp__bettercallclaude-ollama__${tool}`;
  }
  return `mcp__bettercallclaude-http-${server}__${tool}`;
}

function analyzeFile(filePath) {
  const text = readFile(filePath);
  const bare = extractBareToolNames(text);
  const resolved = {};
  for (const tool of bare) {
    const server = resolveServer(tool, text);
    resolved[tool] = { server, fq: fullyQualified(tool, server) };
  }
  return { bare, resolved, text };
}

function skillTools(skillName) {
  const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return [];
  const { resolved } = analyzeFile(skillPath);
  return Object.values(resolved).map(r => r.fq);
}

function commandTools(cmdFile) {
  const text = readFile(cmdFile);
  const bare = extractBareToolNames(text);
  const tools = new Set(GENERIC_TOOLS);

  for (const tool of bare) {
    const server = resolveServer(tool, text);
    tools.add(fullyQualified(tool, server));
  }

  const base = path.basename(cmdFile);
  const skills = COMMAND_SKILL_MAP[base] || [];
  for (const skill of skills) {
    for (const fq of skillTools(skill)) tools.add(fq);
  }

  return [...tools];
}

function insertToolsIntoFrontmatter(content, tools) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return null;

  const fm = fmMatch[1];
  const rest = content.slice(fmMatch[0].length);

  const toolsYaml = 'tools:\n' + tools.map(t => `  - ${t}`).join('\n');

  // Insert after description line, or append at end of frontmatter
  const lines = fm.split('\n');
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

  lines.splice(insertAt, 0, toolsYaml);
  return `---\n${lines.join('\n')}\n---\n${rest}`;
}

function processFile(filePath, tools) {
  const content = readFile(filePath);
  const updated = insertToolsIntoFrontmatter(content, tools);
  if (!updated) {
    console.error(`Could not parse frontmatter: ${filePath}`);
    return false;
  }
  if (apply) {
    fs.writeFileSync(filePath, updated);
    console.log(`Updated: ${path.relative(root, filePath)}`);
  } else {
    console.log(`--- ${path.relative(root, filePath)}`);
    console.log(updated.split('\n').slice(0, 20).join('\n'));
    console.log('...');
  }
  return true;
}

console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`);

let ok = 0;
let fail = 0;

for (const skillDir of fs.readdirSync(skillsDir)) {
  const skillPath = path.join(skillsDir, skillDir, 'SKILL.md');
  if (!fs.existsSync(skillPath)) continue;
  const { resolved } = analyzeFile(skillPath);
  const tools = new Set(GENERIC_TOOLS);
  for (const r of Object.values(resolved)) tools.add(r.fq);
  if (processFile(skillPath, [...tools])) ok++;
  else fail++;
}

for (const cmdFile of fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'))) {
  const cmdPath = path.join(commandsDir, cmdFile);
  if (processFile(cmdPath, commandTools(cmdPath))) ok++;
  else fail++;
}

console.log(`\nDone: ${ok} ok, ${fail} failed`);
