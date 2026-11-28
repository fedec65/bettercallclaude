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
- **Icon**: `bettercallclaude/.claude-plugin/icon.png`
- **Privacy URL**: `https://bettercallclaude.ch/privacy`
- **Implementation baseline**: `1e30ec0` (v5.0.0 remote-only refactor + optional Ollama dependency refresh used for acceptance)
- **Final implementation commit**: `e322bf7` (final release-review fixes); subsequent acceptance-evidence edits are documentation-only. The merged submission SHA is recorded in the release/PR evidence after merge.

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

### Manual Acceptance — 2026-11-28

Host/plugin versions and isolated profile:
- **Claude Code 2.1.325** for user-observed scenarios; **Claude Code 2.1.332** for the CLI marketplace upgrade test.
- **Plugin source**: `1e30ec0` (`fix: update optional Ollama dependencies`).
- **Isolated profile**: `CLAUDE_CONFIG_DIR=.smoke/claude-config`, `env -u ANTHROPIC_API_KEY` for user-observed scenarios; `CLAUDE_CONFIG_DIR=.smoke/upgrade-config` for the upgrade test.

### Scenario 1 — Clean installation without Ollama (user-observed)

`/bettercallclaude:doctor` and `/bettercallclaude:setup` in the isolated profile:
- 9/9 remote services reported healthy.
- Agent route OK via `mcp__plugin_bettercallclaude_legal-citations__validate_citation`.
- Ollama reported as **optional / not configured**; no error about a missing local bundle.
- Note: a normal global config had five `bettercallclaude-http-*` duplicates that broke routing in that profile; the isolated profile plus unset `ANTHROPIC_API_KEY` resolved it. This was environment-specific, not a plugin regression.

### Scenario 2 — Real cloud-backed work (user-observed)

- `Art. 257 OR` research returned MCP sources; existence of **BGE 145 III 229** was confirmed.
- `/legal-loop <confirmed-goal-id> --dry-run` on the non-privileged Goal Record at `.smoke/citations.md` in **balanced** mode completed the legal-loop dry-run work+verdict with `classifier: none`, real MCP results, and no unavailable-Ollama error.
- The same permitted cloud path completed in **cloud** mode.

### Scenario 3 — Strict fail-closed behavior (user-observed)

With `CLAUDE_PLUGIN_USER_CONFIG privacy_mode=strict`:
- A synthetic `Anwaltsgeheimnis` query was blocked before remote transmission.
- The explanation offered optional Ollama / anonymization / user-selected mode change.
- Mode remained `strict` (no downgrade).
- A public citation-only lookup (`Art. 257 OR`) remained possible.

### Scenario 4 — Charting and optional local classification (user-observed)

- `/legal-chart` without Ollama produced `bcc-output/2026-11-28-locazione-commerciale-zh/wayfinder/map.md` with `classifier: none` and worked in **balanced** mode.
- Manual optional Ollama setup (per README): local daemon running, `ollama_check_status` reported online (`0.40.18`), and `ollama_classify_privacy` returned **PRIVILEGED** for synthetic Anwaltsgeheimnis text. Optional model-size recommendation labels looked wrong but are out of scope.

### Scenario 5 — Legal-persona analysis (user-observed)

`legal-persona` returned a non-empty coherent analysis for `.smoke/contract.md`; the short-input `{}` case was not an outage.

### Scenario 6 — CLI marketplace upgrade from v4.12.0 to v5.0.0 (agent-run CLI test)

> This scenario was executed by the agent via Claude Code CLI commands in an isolated config, distinct from Scenarios 1–5 which were user-observed host checks.

Run in a fresh isolated config (`.smoke/upgrade-config`) with a temporary local git clone (`.smoke/upgrade-marketplace/v4.12.0`). Global `~/.claude.json`, default Claude config, and existing user plugins were not touched (verified after the test).

| Step | Command | Result |
|------|---------|--------|
| Inspect help | `claude plugin --help` | Listed `marketplace`, `install`, `update`, etc. |
| Inspect help | `claude plugin marketplace --help` | Listed `add`, `update`, etc. |
| Inspect help | `claude plugin update --help` | Confirmed `-y`, `--json`, `--scope` options |
| Prepare isolated testbed | `mkdir -p .smoke/upgrade-config .smoke/upgrade-marketplace` | Created fresh directories |
| Clone v4.12.0 source | `git clone --branch v4.12.0 --single-branch https://github.com/fedec65/bettercallclaude.git .smoke/upgrade-marketplace/v4.12.0` | Checked out `d4b0461` |
| Add local marketplace | `CLAUDE_CONFIG_DIR=.smoke/upgrade-config env -u ANTHROPIC_API_KEY claude plugin marketplace add ./.smoke/upgrade-marketplace/v4.12.0` | `bettercallclaude-marketplace` added from folder |
| Install v4.12.0 | `CLAUDE_CONFIG_DIR=.smoke/upgrade-config env -u ANTHROPIC_API_KEY claude plugin install bettercallclaude@bettercallclaude-marketplace -y` | Installed `bettercallclaude` 4.12.0 |
| Verify v4.12.0 bundle | `cat .smoke/upgrade-marketplace/v4.12.0/bettercallclaude/.mcp.json` | Contained `ollama` STDIO entry |
| Verify v4.12.0 bundle | `ls .smoke/upgrade-marketplace/v4.12.0/bettercallclaude/mcp-servers/ollama/dist/` | `index.js` bundle present (2.26 MB) |
| Move marketplace clone to v5 head | `git remote add mainrepo /Users/federicocesconi/Dev/BetterCallClaude/.git && git fetch mainrepo && git checkout mainrepo/feat/anthropic-directory-readiness-v5` | HEAD now `1e30ec0` |
| Refresh marketplace catalog | `CLAUDE_CONFIG_DIR=.smoke/upgrade-config env -u ANTHROPIC_API_KEY claude plugin marketplace update bettercallclaude-marketplace` | Marketplace updated successfully |
| Update plugin | `CLAUDE_CONFIG_DIR=.smoke/upgrade-config env -u ANTHROPIC_API_KEY claude plugin update bettercallclaude@bettercallclaude-marketplace -y --json` | `{"oldVersion":"4.12.0","newVersion":"5.0.0","updateOutcome":"updated"}` |
| Verify installed version | `CLAUDE_CONFIG_DIR=.smoke/upgrade-config env -u ANTHROPIC_API_KEY claude plugin list` | `bettercallclaude@bettercallclaude-marketplace` version **5.0.0**, scope user, enabled |
| Verify MCP servers | `claude plugin details bettercallclaude@bettercallclaude-marketplace` | **MCP servers (9)**: entscheidsuche, bge-search, legal-citations, fedlex-sparql, onlinekommentar, legal-persona, tas-jurisprudence, workflows-ch, swiss-caselaw |
| Verify `.mcp.json` | `cat .smoke/upgrade-config/plugins/cache/bettercallclaude-marketplace/bettercallclaude/5.0.0/.mcp.json` | 9 remote HTTP/SSE entries, **no `ollama` key** |
| Verify no local bundle | `find .smoke/upgrade-config/plugins/cache/bettercallclaude-marketplace/bettercallclaude/5.0.0 -type d -name mcp-servers` | No `mcp-servers` directory in active 5.0.0 installation |
| Verify icon | `file .smoke/upgrade-config/plugins/cache/bettercallclaude-marketplace/bettercallclaude/5.0.0/.claude-plugin/icon.png` | `PNG image data, 512 x 512` present |
| Verify privacy URL | `cat .smoke/upgrade-config/plugins/cache/bettercallclaude-marketplace/bettercallclaude/5.0.0/.claude-plugin/plugin.json` | `privacyPolicyUrl`: `https://bettercallclaude.ch/privacy` |

Upgrade findings:
- **Active v5.0.0 installation is clean**: 9 remote MCP servers, no Ollama key, no `mcp-servers/ollama` bundle, icon and privacy URL present. This is what the enabled plugin loads at runtime.
- **Inactive CLI-managed cache**: The CLI also retained the previous 4.12.0 version in its plugin cache (`.smoke/upgrade-config/plugins/cache/bettercallclaude-marketplace/bettercallclaude/4.12.0`). That cached copy still contains the old `mcp-servers/ollama/dist/index.js` bundle, but it is **inactive CLI-managed retention**, not part of the active installation, and is not referenced by the enabled v5.0.0 plugin. `claude plugin prune --dry-run` reported nothing to prune.
- Global user plugins were not modified: the pre-existing `bettercallclaude@bettercallclaude-marketplace` installation outside the isolated config remained at 4.1.4 disabled.

### Submission Gate Status

All six spec manual checks passed:
1. Clean installation without Ollama — pass
2. Real cloud-backed work — pass
3. Strict fail-closed behavior — pass
4. Charting and optional local classification — pass
5. v4.x marketplace upgrade cleanup — pass (active v5.0.0 clean; old cache noted)
6. Evidence recorded — pass

The plugin is ready for release and directory submission.
