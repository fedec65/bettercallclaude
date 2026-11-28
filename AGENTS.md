# BetterCallClaude - Agent Guide

> **Version**: 5.0.0  
> **License**: AGPL-3.0  
> **Language**: English (primary), German/French/Italian (legal terminology)  

## Recent work (session memory)
- **2026-11-26 — v5.0.0 prepared**: canonical plugin becomes remote-only. The bundled local Ollama STDIO server is removed from the shipped plugin; `.mcp.json` now declares nine remote MCP servers only (eight HTTP on `mcp.bettercallclaude.ch` + `swiss-caselaw` SSE on `mcp.opencaselaw.ch`). Optional local privacy classification can be built from `mcp-servers-src/ollama` and registered in a separate manual MCP configuration. Documentation (README, CONNECTORS, PRIVACY, AGENT_ARCHITECTURE, SUBMISSION_MATERIALS, AGENTS, CONTRIBUTING, SECURITY) aligned to the remote-only canonical packaging plus optional manual Ollama path. Hook filename corrected to `privacy-check.js`.

- **2026-09-20 — v4.11.9 released**: all 21 agents switched to `model: inherit` (was 17 sonnet / 2 opus / 2 haiku), so every dispatched agent runs on the user-selected conversation model. `CONTRIBUTING.md` model policy updated from "must declare model / opus-sonnet-haiku tiers" to "inherit for all agents". Devin Review flagged inherit as a bug citing the old rule — answered on PR #74 that the rule is superseded.

- **2026-09-01 — v4.11.8 prepared**: safety net for the v4.11.6 dual-naming fix. (1) `/doctor` gained an **agent-route probe** (new Step 3): it dispatches `citation-specialist` via `Task` from the top-level command (Task is not granted to nested subagents on Cowork — learned in 4.11.7) to run one `validate_citation` call, so a broken agent route now fails doctor instead of passing as it did for the v4.11.5 reporter. (2) **`scripts/check-tool-names.js`** enforces that every `mcp__…` entry in agents/commands/skills `tools:` frontmatter has its twin under the other naming convention (scoped `mcp__plugin_bettercallclaude_<server>__<tool>` ↔ bare `mcp__<server>__<tool>`); wired into CI as "Check MCP tool-name parity". Audit of shipped tree: 68 files / 1658 entries, all paired. Root-cause lesson recorded: **never hardcode a single MCP naming convention** — hosts differ.

- **2026-09-01 — v4.11.7 prepared**: briefing flow flattening. `/bettercallclaude:briefing` used to invoke `swiss-legal-briefing-coordinator` once and the coordinator spawned the panel + ran Q&A internally; Cowork Desktop does not grant `Task` to nested subagents (verified: panel dispatch silently fell back to "single-agent mode"), so the user saw a synthesised brief with no observable signal that the panel had not actually run. Fix: the command now owns panel dispatch via Task at the top-level session (where it works on every host), the coordinator becomes a pure planner (Mode A = classify+roster, Mode D = build plan from Q&A history) with no spawns and no `Task` in its frontmatter. Briefing agent has `Task` removed (was added in 9c26273 but turned out to be a no-op on Cowork — keeping it would have been misleading). Files: `bettercallclaude/commands/briefing.md` (added `Task`, rewrote New Briefing into Phases A–F), `bettercallclaude/agents/briefing.md` (removed `Task`, restructured into two modes, dropped memory schema that moved to the command). Follow-up issue #69 (open): prefer `fedlex-sparql` over `swiss-caselaw` for art. 257 retrieval — deferred.

- **2026-08-31 — v4.11.6 released**: agents/skills/commands `tools:` frontmatter whitelists every MCP tool under both names (`mcp__plugin_bettercallclaude_<server>__<tool>` + `mcp__<server>__<tool>`) — fixes the "No such tool available: mcp__fedlex-sparql__get_article" the user reporter saw (14/14 failures on the agent route, other 3 routes fine). `generate-tool-frontmatter.js` now covers `agents/` and is idempotent. PR #68 dev→main; Devin review found coordinators missing `Task` → added to orchestrator+briefing (9c26273, later superseded by the 4.11.7 flattening). Asset `bettercallclaude-4.11.6.zip` shipped via GitHub release `v4.11.6`.

- **2026-08-30 — v4.11.5 released**: ollama connector fixed on Cowork. Root cause: the host bridge drops any `.mcp.json` server that references `${user_config.*}` (log: `user_config is not supported on the desktop host bridge; dropping server`). Fix: removed the `env` block and the dead `ollama_host` userConfig key. Verified end-to-end on Cowork (`/doctor` 10/10, `ollama_check_status` online, 22 local models). Details: `docs/project-management/2026-08-30-ollama-cowork-userconfig-fix.md`.
- **Known-good release flow**: edit on `main` → `git stash` → `checkout dev` → `merge --ff-only main` → `stash pop` → test (`node bettercallclaude/scripts/privacy-check.test.js`, 82 expected) → `bash scripts/package-plugin.sh` → commit dev → PR #N (dev→main) → wait for Devin review → merge → `checkout main && pull` → `git tag vX.Y.Z <merge> && git push origin vX.Y.Z` → `gh run watch` → verify release asset.
- **Cowork debug tip**: plugin host logs at `~/Library/Logs/Claude/main.log`; plugin runs inside a gVisor VM (gateway `172.16.10.1`) but loopback to the host Mac **does** work (proven by ollama 4.11.5 test).

---

## Project Overview

BetterCallClaude is a **Swiss Legal Intelligence Plugin** for Claude Code CLI and Cowork Desktop. It provides deep integration with Swiss legal databases, multi-lingual legal analysis (DE/FR/IT/EN), and built-in Anwaltsgeheimnis (attorney-client privilege) protection.

The project implements a dual-interface architecture combining granular commands for precise control with autonomous agents for complex multi-step legal workflows.

### Key Capabilities

- **BGE/ATF/DTF precedent research** - Search Swiss Federal Supreme Court decisions
- **Litigation strategy** - Risk assessment, cost-benefit analysis, procedural pathway evaluation
- **Legal drafting** - Contracts, court briefs, legal opinions with proper citation formatting
- **Adversarial analysis** - Three-agent workflow (advocate, adversary, judicial analyst)
- **Citation verification** - Cross-language citation validation (BGE/ATF/DTF formats)
- **All 26 Swiss cantons** - Full cantonal coverage with court systems and citation formats

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | none for remote MCP connectors; Node.js >= 20 for timeline rendering and optional Ollama build | Remote MCP servers run on hosted infrastructure |
| Language | TypeScript 5.7 | Optional Ollama classifier source (`mcp-servers-src/ollama`) |
| Bundler | esbuild | Optional Ollama classifier bundle |
| Testing | vitest, jest | Optional Ollama classifier and hook tests |
| Protocol | MCP (Model Context Protocol) | Tool/communication standard |
| Transport | HTTP / SSE | Remote MCP server communication |

### MCP Servers

| Server | Transport | Purpose |
|--------|-----------|---------|
| `entscheidsuche` | HTTP | Swiss court decision search (federal + cantonal) |
| `bge-search` | HTTP | Federal Supreme Court decision search |
| `legal-citations` | HTTP | Citation verification and formatting |
| `fedlex-sparql` | HTTP | Federal legislation database (SPARQL) |
| `onlinekommentar` | HTTP | Swiss legal commentaries |
| `legal-persona` | HTTP | Swiss judicial persona analysis and deadline computation |
| `tas-jurisprudence` | HTTP | CAS/TAS sports arbitration awards search |
| `workflows-ch` | HTTP | Custom workflow definitions: validation, persistence, run logging |
| `swiss-caselaw` | SSE | Case-law search, citation graphs, doctrine (opencaselaw.ch) |
| `ollama` | STDIO (local, optional) | Privacy classification (Anwaltsgeheimnis detection), built from `mcp-servers-src/ollama` |

The nine remote HTTP/SSE servers connect to `https://mcp.bettercallclaude.ch` or `https://mcp.opencaselaw.ch`. The optional `ollama` classifier, if built and registered manually, runs locally for attorney-client privilege detection (Art. 321 StGB).

---

## Project Structure

```
BetterCallClaude/
├── bettercallclaude/              # Main plugin directory (Cowork marketplace layout)
│   ├── .claude-plugin/
│   │   └── plugin.json            # Plugin manifest (name, version, description)
│   ├── .mcp.json                  # MCP server configuration (remote URLs only)
│   ├── agents/                    # 22 agent definitions (*.md with YAML frontmatter)
│   │   ├── orchestrator.md        # Workflow coordinator
│   │   ├── researcher.md          # Legal research specialist
│   │   ├── strategist.md          # Case strategy
│   │   ├── drafter.md             # Document drafting
│   │   ├── advocate.md            # Adversarial workflow (advocate)
│   │   ├── adversary.md           # Adversarial workflow (challenger)
│   │   ├── judicial.md            # Adversarial workflow (synthesizer)
│   │   └── ... (15 more agents)
│   ├── commands/                  # 31 command definitions (*.md with YAML frontmatter)
│   │   ├── legal.md               # Intelligent gateway
│   │   ├── research.md            # Precedent search
│   │   ├── strategy.md            # Litigation strategy
│   │   ├── draft.md               # Document drafting
│   │   ├── adversarial.md         # Three-agent analysis
│   │   └── ... (15 more commands)
│   ├── skills/                    # 18 skill modules (SKILL.md with YAML frontmatter)
│   │   ├── swiss-legal-research/
│   │   ├── swiss-legal-strategy/
│   │   ├── swiss-legal-drafting/
│   │   ├── swiss-citation-formats/
│   │   ├── citation-content-verify/ # Substantive citation verification (existence + entailment)
│   │   ├── legal-chronology/        # Sourced case chronology (events, conflicts, gaps, deadlines)
│   │   └── ... (11 more skills)
│   ├── hooks/
│   │   └── hooks.json             # PreToolUse hook for privacy detection
│   └── scripts/                   # Runtime scripts (privacy-check.js, timeline-render.mjs)
│
├── mcp-servers-src/               # Optional Ollama classifier source
│   └── ollama/                    # Local privacy classification server source
│
├── scripts/                       # Build and packaging scripts
│   ├── package-plugin.sh          # Creates distributable plugin zip
│   └── fetch-onlinekommentar-data.js
│
├── docs/                          # Documentation
│   ├── AGENT_ARCHITECTURE.md      # Agent system design
│   ├── CONNECTORS.md              # MCP server API documentation
│   ├── PRIVACY.md                 # Privacy and data-flow notes
│   ├── SUBMISSION_MATERIALS.md    # Plugin directory submission facts
│   ├── workflows/                 # Workflow documentation
│   └── images/                    # Screenshots, diagrams
│
├── tests/                         # Python test structure (legacy/development)
├── .github/workflows/             # CI/CD
│   ├── ci.yml                     # Source audit, marketplace/plugin.json validation,
│   │                              # directory readiness, skill frontmatter, hook quoting,
│   │                              # MCP tool-name parity, privacy tests, packaging/ZIP audit
│   └── release.yml                # Release automation
├── package.json                   # Root package (build orchestration)
├── README.md                      # User-facing documentation
├── CONNECTORS.md                  # MCP server integration guide
├── CHANGELOG.md                   # Version history
└── LICENSE                        # AGPL-3.0
```

---

## Build and Test Commands

### Prerequisites

- Node.js >= 20 for packaging, the included privacy hook, `/legal-timeline`, and building the optional Ollama classifier from source; the optional build matches the esbuild `node20` target
- npm >= 9

### Development Commands

```bash
# Package the plugin into a distributable zip (no local build required)
npm run package

# Build the optional Ollama classifier from source
npm run build:ollama
```

### Direct Script Execution

```bash
# Create distributable plugin zip
bash scripts/package-plugin.sh
```

---

## Code Style Guidelines

### TypeScript (optional Ollama classifier source)

- **Target**: ES2022, **module: Node16 / ESM** (`"type": "module"` in `package.json`)
- **Strict mode**: Enabled (`strict: true`)
- **Unused checks**: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- **Naming**: PascalCase for classes/interfaces, camelCase for functions/variables
- **Formatting**: Prettier with default config

### YAML Frontmatter (Agents/Commands/Skills)

All markdown files in `agents/`, `commands/`, and `skills/` must include YAML frontmatter:

```yaml
---
name: agent-name
description: "Brief description of purpose"
tools:
  - Read
  - Grep
  - Bash
---
```

### File Naming Conventions

- **Agents**: `kebab-case.md` (e.g., `prompt-engineer.md`)
- **Commands**: `kebab-case.md` (e.g., `doc-analyze.md`)
- **Skills**: Directory in `kebab-case/`, containing `SKILL.md`

---

## Testing Instructions

### Privacy Hook Tests

```bash
node bettercallclaude/scripts/privacy-check.test.js
```

### Optional Ollama Classifier Build Verification

```bash
cd mcp-servers-src/ollama
npm run build:bundle
```

### CI Validation

The CI pipeline (`/.github/workflows/ci.yml`) validates:

1. **Marketplace manifest** — `.claude-plugin/marketplace.json` schema
2. **Plugin manifest** — `bettercallclaude/.claude-plugin/plugin.json` required fields
3. **Plugin subdirectory contents** — `agents/`, `commands/`, `skills/`, `hooks/`, `scripts/`, `.mcp.json` exist
4. **Directory readiness** — `scripts/check-directory-readiness.js source`
5. **`.mcp.json` configuration** — servers are declared
6. **Hook command quoting** — `${CLAUDE_PLUGIN_ROOT}` is properly quoted in hooks, timeline command, and chronology skill
7. **Skill frontmatter** — every `bettercallclaude/skills/*/SKILL.md` has YAML frontmatter
8. **MCP tool-name parity** — `scripts/check-tool-names.js`
9. **Privacy tests** — `bettercallclaude/scripts/privacy-check.test.js`
10. **Packaging / ZIP audit** — `bash scripts/package-plugin.sh`

---

## Security Considerations

### Anwaltsgeheimnis (Attorney-Client Privilege)

The project implements privacy protection per **Art. 321 StGB** (Swiss Criminal Code):

1. **PreToolUse Hook** (`bettercallclaude/hooks/hooks.json`):
   - Runs `privacy-check.js` before Write/Edit/Bash operations
   - Scans for privilege indicators in DE/FR/IT

2. **Privacy Modes**:
   | Mode | Behavior |
   |------|----------|
   | `strict` | Privileged or indeterminate content is denied before remote use; public operations may continue |
   | `balanced` | Privileged content triggers confirmation |
   | `cloud` | Standard processing with explicit markers only |

3. **Optional Local Processing**:
   - `ollama` MCP server can be built from `mcp-servers-src/ollama` and registered manually
   - No external API calls for privileged content classification when running locally
   - Anthropic processing remains unchanged; prompts and responses still pass through Anthropic

### MCP Server Security

- HTTP servers use HTTPS (TLS) only
- Rate limiting: 60 req/min per IP
- No API keys required for HTTP servers
- Standard plugin ships no compiled bundles

---

## Deployment Process

### Plugin Distribution

1. **Development** - Edit agents, commands, skills, hooks, `.mcp.json`
2. **Build optional Ollama** - Run `npm run build:ollama` only if the optional classifier changed
3. **Package** - Run `npm run package` to create `dist/bettercallclaude-<version>.zip`
4. **Release** - GitHub Actions creates release with plugin zip

### Marketplace Installation

**Cowork Desktop**:
1. Customize > Browse plugins > Personal > +
2. Add marketplace from GitHub: `fedec65/bettercallclaude`
3. Install BetterCallClaude card

**Claude Code CLI**:
```bash
claude plugin marketplace add fedec65/bettercallclaude
claude plugin install bettercallclaude@bettercallclaude-marketplace
```

### MCP Server Deployment

- **HTTP/SSE servers**: Deployed to Railway at `mcp.bettercallclaude.ch` / `mcp.opencaselaw.ch`
- **Optional STDIO server** (`ollama`): Built locally from `mcp-servers-src/ollama` by the user

---

## Key Architecture Decisions

1. **HTTP-first MCP Transport**: All shipped servers use HTTP/SSE for zero-config Cowork Desktop installation
2. **Readable Plugin Bundle**: The canonical plugin contains Markdown agents/commands/skills, JSON hooks, and `.mcp.json` — no compiled MCP bundles
3. **YAML Frontmatter**: Declarative agent/command/skill definitions
4. **Dual Interface**: Granular commands + autonomous agents
5. **Privacy by Design**: PreToolUse hook always active; optional local Ollama classifier built from source

---

## Useful Resources

- **MCP SDK**: `@modelcontextprotocol/sdk` v1.32.2
- **Documentation**: See `docs/AGENT_ARCHITECTURE.md` for agent system design
- **API Reference**: See `CONNECTORS.md` for MCP server API details
- **Website**: https://bettercallclaude.ch
- **MCP Health**: https://mcp.bettercallclaude.ch/health
