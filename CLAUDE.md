# CLAUDE.md — BetterCallClaude

## Project Overview

**BetterCallClaude** (v3.1.0) is a Swiss legal intelligence plugin for Claude Code and Claude Cowork. It provides AI-powered legal research, strategy, drafting, and citation verification for Swiss law practitioners, covering all 26 cantons and four national languages (DE/FR/IT/EN).

- **Author**: Federico Cesconi
- **License**: AGPL-3.0
- **GitHub**: `fedec65/bettercallclaude`
- **Node.js**: >= 18.0.0

---

## Repository Structure

```
bettercallmwebapp/
├── .claude-plugin/
│   └── marketplace.json         # Cowork marketplace manifest
├── .mcp.json                    # MCP server configuration (uses ${CLAUDE_PLUGIN_ROOT})
├── agents/                      # 18 agent definitions (Markdown + YAML frontmatter)
├── bettercallclaude/            # Packaged plugin subdirectory (mirrors root for Cowork)
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── agents/
│   ├── commands/
│   ├── hooks/
│   ├── mcp-servers/             # Pre-compiled bundles (git-tracked)
│   ├── scripts/
│   └── skills/
├── commands/                    # 17 slash command definitions (Markdown + YAML frontmatter)
├── docs/                        # Architecture docs, workflow guides, onboarding
├── hooks/
│   └── hooks.json               # PreToolUse hook (Anwaltsgeheimnis detection)
├── mcp-servers/                 # Pre-compiled MCP server bundles (git-tracked)
│   ├── bge-search/dist/
│   ├── entscheidsuche/dist/
│   ├── fedlex-sparql/dist/
│   ├── legal-citations/dist/
│   └── onlinekommentar/dist/
├── mcp-servers-src/             # TypeScript source for all 5 MCP servers
│   ├── package.json             # npm workspaces root
│   ├── shared/                  # @bettercallclaude/shared — common infrastructure
│   ├── bge-search/              # Federal Supreme Court search
│   ├── entscheidsuche/          # Swiss court decision search (all courts)
│   ├── fedlex-sparql/           # Federal legislation via SPARQL
│   ├── legal-citations/         # Citation validation and formatting
│   ├── onlinekommentar/         # Swiss legal commentaries
│   └── integration-tests/       # Cross-server integration tests
├── mcpb/manifests/              # .mcpb bundle manifests (Claude Desktop)
├── scripts/                     # Build, package, install scripts
│   ├── build-servers.sh         # esbuild bundling script
│   ├── build-mcpb.sh            # .mcpb bundle generation
│   ├── package-plugin.sh        # Creates dist/bettercallclaude-<version>.zip
│   ├── install-claude-desktop.sh
│   └── privacy-check.sh         # Hook script for Anwaltsgeheimnis detection
├── skills/                      # 10 auto-activated skills (SKILL.md per directory)
├── package.json                 # Root scripts (delegates to mcp-servers-src/)
├── CHANGELOG.md
├── CONNECTORS.md                # MCP server API documentation
└── README.md
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| MCP servers | TypeScript 5.x, `@modelcontextprotocol/sdk ^1.26` |
| Shared library | TypeORM, axios, sql.js, natural (NLP), winston, joi |
| Build | TypeScript compiler (`tsc`) + esbuild (single-file bundles) |
| Test | vitest (most servers), jest (shared, entscheidsuche, bge-search) |
| Package manager | npm with workspaces (npm >= 9) |
| CI | GitHub Actions (Node 18/20/22 matrix) |
| Plugin format | Claude Code plugin (agents/commands/skills as Markdown files) |

---

## Build System

### npm Scripts (root `package.json`)

```bash
npm run build          # cd mcp-servers-src && npm ci && npm run build (tsc compile)
npm run build:bundle   # bash scripts/build-servers.sh (esbuild single-file bundles)
npm run build:mcpb     # bash scripts/build-mcpb.sh (.mcpb bundles for Claude Desktop)
npm test               # cd mcp-servers-src && npm test (runs all workspace tests)
npm run package        # bash scripts/package-plugin.sh (creates dist/*.zip)
```

### MCP Server Build Pipeline

1. `npm run build` — compiles TypeScript in all workspaces via `tsc`
2. `npm run build:bundle` — bundles each server into a standalone `dist/index.js` using esbuild:
   - **Shared-dependent servers** (`entscheidsuche`, `bge-search`, `fedlex-sparql`): CommonJS format (`--format=cjs`), external `pg-native` and `better-sqlite3`
   - **Standalone servers** (`legal-citations`, `onlinekommentar`): ESM format with `createRequire` banner
   - WASM assets (`sql-wasm.wasm`) are copied for SQLite-dependent servers

### Critical Rule: Commit Compiled Bundles

`mcp-servers/*/dist/` files **must be committed to git**. End users install this plugin without Node.js build tooling. Always run `npm run build:bundle` and commit the updated dist files after any MCP server source changes.

---

## Development Workflow

### MCP Server Development

```bash
cd mcp-servers-src
npm ci                    # install all workspace dependencies
npm run build             # compile all servers (tsc)
npm test                  # run all tests

# Per-workspace commands (example)
cd mcp-servers-src/legal-citations
npm test                  # vitest run
npm run lint              # eslint
npm run format            # prettier
```

### Adding/Modifying a Server

1. Edit source in `mcp-servers-src/<server>/src/`
2. Run `npm run build` from `mcp-servers-src/`
3. Run `npm run build:bundle` from repo root
4. Verify `mcp-servers/<server>/dist/index.js` was updated
5. Also copy updated dist into `bettercallclaude/mcp-servers/<server>/dist/`
6. Commit both the source changes and the updated dist files

### Plugin Component Development (agents, commands, skills)

All plugin components are Markdown files with YAML frontmatter. Changes take effect immediately — no build step needed.

- Changes in `agents/` must be mirrored in `bettercallclaude/agents/`
- Changes in `commands/` must be mirrored in `bettercallclaude/commands/`
- Changes in `skills/` must be mirrored in `bettercallclaude/skills/`

---

## TypeScript Conventions

Root tsconfig (`mcp-servers-src/tsconfig.json`) enforces strict settings:

```json
{
  "target": "ES2022",
  "module": "commonjs",
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

- All server source lives under `src/` within each workspace
- Test files (`*.test.ts`) are excluded from production compilation
- Shared infrastructure is in `@bettercallclaude/shared` (local file dependency)

---

## Plugin Component Conventions

### YAML Frontmatter (Required)

Every agent, command, and skill file **must** start with a YAML frontmatter block. CI validates this:

```markdown
---
name: component-name
description: "What this component does"
tools:
  - Read
  - WebSearch
---

# Component Title
...
```

Commands do not include a `name` field (they get it from the filename), but do require `description`.

### Naming Conventions

- Agent filenames: `<role>.md` (e.g., `researcher.md`, `orchestrator.md`)
- Command filenames: `<verb>.md` (e.g., `legal.md`, `draft.md`, `briefing.md`)
- Skill directories: `<domain>/SKILL.md` (e.g., `swiss-legal-research/SKILL.md`)
- All names use kebab-case

### Skills Architecture

Skills are auto-activated — they don't need to be explicitly invoked. The `legal-briefing` skill detects complex queries and suggests briefing sessions automatically.

---

## MCP Servers

Five pre-compiled servers provide integration with Swiss legal databases:

| Server | Format | External Deps | Notes |
|--------|--------|---------------|-------|
| `entscheidsuche` | CommonJS | sql.js (WASM) | All Swiss courts search |
| `bge-search` | CommonJS | sql.js (WASM) | Federal Supreme Court only |
| `fedlex-sparql` | CommonJS | none | SPARQL queries to admin.ch |
| `legal-citations` | ESM | none | Citation validation/formatting |
| `onlinekommentar` | ESM | none | Legal commentary search |

The shared library (`@bettercallclaude/shared`) provides: HTTP client with retry/rate-limiting (axios + p-retry + bottleneck), database abstraction (TypeORM + sql.js), NLP utilities (natural + stopword), logging (winston), and validation (joi).

### MCP Configuration

`.mcp.json` uses `${CLAUDE_PLUGIN_ROOT}` for portability:

```json
{
  "mcpServers": {
    "bettercallclaude-bge-search": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-servers/bge-search/dist/index.js"]
    }
  }
}
```

**Cowork limitation**: 4 of 5 MCP servers cannot reach external APIs from inside the Cowork sandboxed VM. Install servers at the Claude Desktop level via `scripts/install-claude-desktop.sh` for full access.

---

## Privacy & Security Hook

A `PreToolUse` hook (`hooks/hooks.json`) intercepts Write, Edit, and Bash tool calls and scans for Anwaltsgeheimnis (attorney-client privilege) patterns per Art. 321 StGB and Art. 13 BGFA.

When privileged content is detected, the hook returns a `"permissionDecision": "ask"` response, prompting user confirmation before the tool call proceeds.

**Patterns detected** (case-insensitive, DE/FR/IT):
- German: `anwalt.*geheimnis`, `mandatsgeheimnis`, `berufsgeheimnis`, `vertraulich`, etc.
- French: `secret professionnel`, `confidentiel`, `strictement confidentiel`
- Italian: `segreto professionale`, `riservato`, `strettamente riservato`
- Legal citations: `Art. 321 StGB`, `Art. 13 BGFA`

The hook script (`scripts/privacy-check.sh`) must remain portable (bash + python3 only, no external npm packages).

---

## Testing

```bash
# Run all tests
npm test                            # from repo root

# Per-workspace (from mcp-servers-src/)
npm run test --workspace=shared     # vitest
npm run test --workspace=bge-search # vitest

# Integration tests (require live APIs)
cd mcp-servers-src/integration-tests
npm test
```

Test frameworks used:
- **vitest**: `legal-citations`, `onlinekommentar`, `shared`, `integration-tests`
- **jest**: `bge-search`, `entscheidsuche` (via `jest.config.js`)

Test coverage configured with v8 provider; excludes `node_modules/`, `dist/`, test files themselves.

---

## CI/CD

### CI (`ci.yml`) — triggered on push/PR to `main`

1. **Test MCP Servers** (matrix: Node 18, 20, 22):
   - `npm ci` in `mcp-servers-src/`
   - `npm run lint` (errors are non-fatal: `continue-on-error: true`)
   - `npm run build`
   - `npm test`

2. **Validate Plugin Structure** (Node 20):
   - Validates `marketplace.json` and `plugin.json` fields
   - Checks all required directories exist in `bettercallclaude/`
   - Verifies all 5 compiled `dist/index.js` bundles are present
   - Validates `.mcp.json` has `mcpServers` key
   - Checks YAML frontmatter on all skill, command, and agent files

### Release (`release.yml`) — triggered on `v*` tags

1. Build MCP servers (`npm run build`)
2. Build .mcpb bundles (`scripts/build-mcpb.sh`)
3. Package plugin ZIP (`scripts/package-plugin.sh`)
4. Create GitHub Release with attached `.mcpb` and `.zip` artifacts

---

## Version Management

Version is tracked in four places — keep them in sync:

| File | Field |
|------|-------|
| `package.json` | `"version"` |
| `bettercallclaude/.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `"metadata.version"` |
| `docs/` or `version.md` | Version string |

When bumping versions, update all four files in the same commit.

---

## Agent Architecture

The plugin uses a **dual-interface architecture**:

- **Commands** (`/bettercallclaude:<name>`): Direct, single-purpose operations
- **Agents**: Autonomous multi-step workflows invoked by commands or each other

### Routing Flow

```
User query
    └─> /bettercallclaude:legal (gateway command)
            └─> Complexity scoring (1-10)
                    ├─> 1-3: Direct agent routing
                    ├─> 4-6: Inline clarifying questions + routing
                    └─> 7-10: Full briefing session
                                    └─> Briefing Coordinator Agent
                                            └─> Specialist panel (2-5 agents)
                                                    └─> Execution plan
                                                            └─> Orchestrator Agent
                                                                    └─> Pipeline execution
```

### Agent Nesting Rules

- Maximum 3 levels of agent nesting
- No circular agent invocations
- Sub-agents inherit parent's context and autonomy mode
- Orchestrator summarizes multi-agent output via `summarizer` agent by default

### Workflow Templates (Orchestrator)

| Template | Pipeline |
|----------|---------|
| `litigation-prep` | researcher → risk → strategist → procedure → drafter |
| `due-diligence` | parallel[corporate, fiscal, compliance, realestate] → risk → drafter |
| `contract-lifecycle` | researcher → corporate → fiscal → drafter → citation |
| `regulatory-assessment` | parallel[compliance, data-protection] → risk → drafter |

---

## Packaging

```bash
npm run package
# Creates: dist/bettercallclaude-<version>.zip
```

The package includes: `agents/`, `commands/`, `skills/`, `hooks/`, `mcp-servers/*/dist/`, `scripts/privacy-check.sh`, `.mcp.json`, `.claude-plugin/plugin.json`, documentation.

It excludes: TypeScript source, `node_modules/`, build tools, development scripts.

The `bettercallclaude/` subdirectory is the Cowork marketplace layout. The packaging script reads from there, not from the root-level directories.

---

## Key Quality Rules

- **Never fabricate citations** — All BGE/ATF/DTF references must be verified via MCP tools before inclusion in output
- **Always include professional disclaimer** — Every agent output must note that results require qualified lawyer review
- **Citation verification is mandatory** — Run the citation agent as a quality gate on any deliverable containing legal references
- **Agent conflicts must be explicit** — When agents produce conflicting recommendations, flag and resolve explicitly (never silently merge)
- **Anwaltsgeheimnis compliance** — Never store or recall confidential client data; the privacy hook enforces this at tool-use level
- **Multi-lingual consistency** — Match the user's input language; automatically switch citation formats (BGE/ATF/DTF) based on language

---

## Common Tasks Reference

| Task | Command |
|------|---------|
| Build and test MCP servers | `npm run build && npm test` |
| Bundle servers for distribution | `npm run build:bundle` |
| Run a single server workspace | `cd mcp-servers-src && npm run test --workspace=legal-citations` |
| Create release package | `npm run package` |
| Add a new agent | Create `agents/<name>.md` with YAML frontmatter, mirror to `bettercallclaude/agents/` |
| Add a new command | Create `commands/<name>.md` with frontmatter, mirror to `bettercallclaude/commands/` |
| Add a new skill | Create `skills/<name>/SKILL.md` with frontmatter, mirror to `bettercallclaude/skills/` |
