# BetterCallClaude — Official Plugin Directory Submission Materials

Prepared for submission to Anthropic's official plugin directory.

---

## Plugin Name

`bettercallclaude`

## One-Line Description

Swiss Legal Intelligence — BGE/ATF/DTF precedent research, case strategy, legal drafting, and citation verification across all 26 Swiss cantons with Anwaltsgeheimnis privacy protection.

## Source Repository

https://github.com/fedec65/BetterCallClaude

## Category

Legal / Domain-Specific

## Website

https://bettercallclaude.ch

---

## What It Does

BetterCallClaude transforms Claude into a Swiss legal research and analysis assistant. It covers the full spectrum of Swiss legal work:

- **Precedent research** — Search BGE/ATF/DTF databases, cantonal court decisions, and federal legislation via 9 remote MCP servers connected to live Swiss legal databases (entscheidsuche.ch, Fedlex SPARQL, OnlineKommentar, opencaselaw.ch).
- **Case strategy** — Risk assessment, cost-benefit analysis, procedural pathway evaluation, and settlement modeling.
- **Adversarial analysis** — Three-agent workflow (advocate builds the case, adversary challenges it, judicial analyst synthesizes with Erwagung methodology and probability scores).
- **Legal drafting** — Contracts, court submissions, legal opinions with jurisdiction-aware terminology and citation formatting.
- **Citation verification** — Validate and convert citations between DE/FR/IT/EN formats across BGE/ATF/DTF reference systems.
- **Multi-agent workflows** — Pre-built pipelines for due diligence, litigation preparation, contract lifecycle, and real estate closings; custom workflows are saved remotely under a personal user ID.
- **Privacy protection** — Built-in Anwaltsgeheimnis (attorney-client privilege, Art. 321 StGB) detection hook that intercepts privileged content before it leaves the local environment; optional local Ollama classifier can be built from source.

## Components

| Type | Count | Examples |
|------|-------|---------|
| Agents | 22 | Researcher, Strategist, Drafter, Advocate, Adversary, Judicial Analyst, Citation Specialist, Compliance Officer, Risk Analyst, Data Protection Specialist, etc. |
| Commands | 31 | `/legal`, `/research`, `/strategy`, `/draft`, `/cite`, `/adversarial`, `/briefing`, `/workflow`, `/translate`, `/web-research`, `/legal-timeline`, `/nda-triage`, etc. |
| Skills | 18 | Swiss legal research, strategy, drafting, citation formats, jurisdictions, privacy routing, adversarial analysis, legal wayfinder, legal chronology, etc. |
| MCP Servers | 9 | bge-search, entscheidsuche, fedlex-sparql, legal-citations, onlinekommentar, legal-persona, tas-jurisprudence, workflows-ch, swiss-caselaw |

## Key Differentiators

### 1. Only Swiss Legal Intelligence Plugin

No other Claude plugin covers Swiss law. BetterCallClaude provides deep coverage of federal and cantonal law across all 26 Swiss cantons, including court hierarchies, citation formats, and cantonal procedural specifics.

### 2. Multi-Lingual (DE/FR/IT/EN)

Matches Switzerland's official languages. Automatic language detection switches between BGE (German), ATF (French), and DTF (Italian) citation formats and legal terminology. English is supported as a working language with Swiss legal term mapping.

### 3. 9 Remote MCP Servers with Live Data

Connected to real Swiss legal databases — not static datasets. Servers query entscheidsuche.ch (cantonal and federal court decisions), the Federal Supreme Court BGE database, Fedlex SPARQL (federal legislation), legal citation databases, OnlineKommentar (legal commentaries), judicial persona analysis, CAS/TAS sports arbitration, custom workflows, and opencaselaw.ch. No local build or Ollama is required for the standard plugin.

### 4. Professional Ethics Built-In

Attorney-client privilege (Anwaltsgeheimnis) protection is enforced automatically via a PreToolUse hook. The hook detects privileged content patterns in DE/FR/IT before any external tool call proceeds, prompting user confirmation. Three privacy modes: strict, balanced, cloud.

### 5. Adversarial Analysis Methodology

Three-agent adversarial workflow modeled on actual Swiss court deliberation: advocate builds the strongest case, adversary systematically challenges it, judicial analyst synthesizes using Swiss Erwagung (consideration) structure with calibrated probability scores.

### 6. Briefing Sessions with Cross-Session Persistence

Complex legal matters get a collaborative intake phase before agent execution. A specialist panel (2-5 agents) asks targeted questions, builds a precise execution plan, and supports pause/resume across sessions.

### 7. Open Source (AGPL-3.0)

Fully transparent codebase. Community-driven development. No vendor lock-in.

---

## Differentiation from Anthropic's Own Legal Plugin

| Aspect | Anthropic `legal` | BetterCallClaude |
|--------|-------------------|------------------|
| Scope | Generic (contracts, NDAs, compliance for in-house teams) | Swiss-specific (all 26 cantons, federal and cantonal law) |
| Languages | English | DE, FR, IT, EN |
| Data Sources | None (relies on Claude's training data) | 9 remote MCP servers connected to Swiss legal databases |
| Precedent Research | No | BGE/ATF/DTF search with citation chain tracking |
| Privacy | No | Anwaltsgeheimnis (Art. 321 StGB) enforcement hook |
| Adversarial Analysis | No | Three-agent Erwagung methodology |
| Target Users | General in-house legal teams | Swiss lawyers and legal professionals |

The two plugins are complementary, not competing. BetterCallClaude targets a specific jurisdiction that the generic legal plugin does not cover.

---

## Technical Details

- **License**: AGPL-3.0
- **Runtime**: No local runtime required for the standard plugin (readable Markdown/JavaScript)
- **MCP servers**: 9 remote HTTPS/SSE servers; optional local Ollama classifier built manually from `mcp-servers-src/ollama`
- **Plugin manifest**: `.claude-plugin/plugin.json` with full metadata
- **Hooks**: PreToolUse privacy detection via `hooks/hooks.json`
- **No hardcoded secrets**: All API keys via environment variables
- **Icon**: `docs/images/bettercallclaude_logo.png`
- **Privacy URL**: `docs/PRIVACY.md`
- **Implementation baseline**: `d15d1a1` (v5.0.0 remote-only refactor); the release task will record the final submission commit

---

## Form Field Suggestions

When filling out the submission form, use these prepared answers:

**Plugin name**: `bettercallclaude`

**Description (short)**: Swiss Legal Intelligence — BGE/ATF/DTF precedent research, case strategy, legal drafting, and citation verification across all 26 Swiss cantons.

**Description (long)**: BetterCallClaude transforms Claude into a Swiss legal research and analysis assistant. It includes 22 specialized agents, 31 commands, 18 skills, and 9 remote MCP servers connected to live Swiss legal databases. Coverage spans federal and cantonal law across all 26 Swiss cantons with multi-lingual support (DE/FR/IT/EN), adversarial analysis using Swiss Erwagung methodology, and built-in Anwaltsgeheimnis (attorney-client privilege) protection. Optional local Ollama classification can be built from source.

**Repository URL**: https://github.com/fedec65/BetterCallClaude

**Author**: Federico Cesconi

**Website**: https://bettercallclaude.ch

**Category**: Legal / Domain-Specific

**Keywords**: swiss-law, legal-research, bge-atf-dtf, litigation, legal-drafting, citation-verification, multilingual, compliance, data-protection, mcp-servers

---

## Reviewer Notes

- **v5.0.0 is remote-only by default.** The canonical plugin ships nine remote MCP servers (eight HTTP on `mcp.bettercallclaude.ch`, one SSE on `mcp.opencaselaw.ch`). No local Node.js runtime, no compiled-in MCP server, and no Ollama daemon are required for installation or normal use.
- **Optional local Ollama is built from source.** Users who want local privacy classification can run `npm run build:ollama` from `mcp-servers-src/ollama` and register the resulting `dist/index.js` in a separate manual MCP configuration.
- **The shipped plugin does not contain a local Ollama server directory.** The `.mcp.json` contains only remote URLs.
- **Marketplace synchronization caveat:** manual MCP configurations kept inside the marketplace-managed plugin directory can be overwritten on sync; the documentation tells users to keep manual Ollama configuration outside that directory and back it up before upgrading.
- **Component counts verified:** 22 agents, 31 commands, 18 skills, 9 remote MCP servers.

---

## Automated Verification — 2026-11-27

Source baseline: `6b571cc99856b35c34976c212213a94b2849b8a8`
Automated acceptance run from `/Users/federicocesconi/Dev/BetterCallClaude/.worktrees/feat-anthropic-directory-readiness-v5`.

### Commands and Results

| Step | Command | Result |
|------|---------|--------|
| 1 | `node scripts/check-directory-readiness.test.js` | 5/5 directory-readiness tests passed |
| 1 | `node bettercallclaude/scripts/privacy-check.test.js` | 82/82 privacy tests passed |
| 1 | `node scripts/check-tool-names.js` | 71 files, 1658 MCP entries, all paired under both naming conventions |
| 1 | `node scripts/check-directory-readiness.js source` | Directory readiness OK: source v5.0.0, nine remote MCP servers |
| 1 | `bash scripts/package-plugin.sh` | Package created successfully |
| 1 | `node scripts/check-directory-readiness.js zip dist/bettercallclaude-5.0.0.zip` | Directory readiness OK: dist/bettercallclaude-5.0.0.zip, nine remote MCP servers |
| 2 | `node -e "version check"` | plugin.json: 5.0.0, marketplace.json: 5.0.0, package.json: 5.0.0 |
| 2 | `unzip -Z1 dist/bettercallclaude-5.0.0.zip \| rg forbidden paths` | No forbidden paths found |
| 2 | `cmp /Users/federicocesconi/Downloads/bcc-icon.png /tmp/bcc-packaged-icon.png` | Packaged icon byte-identical to supplied asset |
| 3 | `npm audit fix` in `mcp-servers-src/ollama` | 0 vulnerabilities after non-forced fix |
| 3 | `npm audit --omit=dev` in `mcp-servers-src/ollama` | found 0 vulnerabilities |
| 3 | `npm audit` in `mcp-servers-src/ollama` | found 0 vulnerabilities |
| 3 | `npm run build:ollama` | Optional Ollama bundle built at `mcp-servers-src/ollama/dist/index.js` |
| 3 | `git check-ignore mcp-servers-src/ollama/dist/index.js` | Build output is gitignored |
| 3 | `node scripts/check-directory-readiness.js source` | Source remains compliant after optional build |
| 4 | `curl -sS -o /dev/null -w '%{http_code}' https://bettercallclaude.ch/privacy` | 200 |
| 4 | `git status --short` | Only `?? docs/superpowers/` (pre-existing untracked user content) |

### Optional Ollama Dependency Audit

The optional `mcp-servers-src/ollama` dependency tree was audited and fixed on 2026-11-27. `npm audit fix` (without `--force`) resolved 10 vulnerabilities (3 moderate, 6 high, 1 critical), including the direct `@modelcontextprotocol/sdk` dependency. Both `npm audit --omit=dev` and full `npm audit` now report zero vulnerabilities. `@modelcontextprotocol/sdk` resolved from 1.29.0 to 1.32.2, remaining within the declared `^1.26.0` range. The canonical plugin ZIP is unaffected because the Ollama bundle remains gitignored and is not packaged. The dependency-fix commit is recorded in the repository history.

### Artifact Evidence

- **ZIP filename:** `dist/bettercallclaude-5.0.0.zip`
- **ZIP size:** 508K
- **ZIP file count:** 122 files
- **ZIP contents:** 976534 bytes uncompressed

### Public URL Status

- https://bettercallclaude.ch/privacy — HTTP 200

### Manual Acceptance Status

**Manual Cowork testing has not yet been performed.** This record covers automated acceptance only and does not constitute release or directory-submission approval.
