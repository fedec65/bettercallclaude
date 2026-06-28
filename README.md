[![Version](https://img.shields.io/badge/version-4.9.0-blue)](https://github.com/fedec65/bettercallclaude/releases)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-green)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Cowork%20Desktop-orange)](https://claude.ai)
[![Website](https://img.shields.io/badge/web-bettercallclaude.ch-brightgreen)](https://bettercallclaude.ch)
[![MCP Servers](https://img.shields.io/badge/MCP%20servers-9-purple)](https://mcp.bettercallclaude.ch/health)
[![Buy Me a Coffee](https://img.shields.io/badge/support-Buy%20Me%20a%20Coffee-yellow)](https://buymeacoffee.com/federicocesconi)

<p align="center">
  <img src="docs/images/bettercallclaude_logo.png" alt="BetterCallClaude" width="480">
</p>

<p align="center"><strong>Swiss Legal Intelligence Plugin for Cowork Desktop</strong></p>

BetterCallClaude transforms legal research, case strategy, and document drafting for Swiss lawyers. It provides deep integration with Swiss legal databases, multi-lingual analysis (DE/FR/IT/EN), and built-in Anwaltsgeheimnis (attorney-client privilege) protection -- 20 agents, 26 commands, 13 skills, and 9 MCP servers covering BGE/ATF/DTF precedent research, litigation strategy, adversarial analysis, legal drafting, citation verification, document intelligence, NDA triage, iterative quality loops, and CAS/TAS sports arbitration across all 26 Swiss cantons.

> **Claude Code CLI users**: this repository is Cowork Desktop only. The CLI version is at [fedec65/bettercallclaude-cli](https://github.com/fedec65/bettercallclaude-cli).

---

## Swiss Law, Not Delaware

Anthropic's official Legal plugin (`anthropics/knowledge-work-plugins`) provides contract review and NDA triage for US law (Delaware, New York, California). **BetterCallClaude covers Switzerland**: federal law, all 26 cantons, four national languages, verified citations from official sources, and attorney-client privilege protection.

The two plugins coexist. For Swiss-law matters, BetterCallClaude takes precedence. For US-law matters, the Anthropic plugin applies.

| | Anthropic Legal Plugin | BetterCallClaude Swiss |
|---|---|---|
| **Jurisdiction** | US (DE/NY/CA default) | Switzerland (federal + 26 cantons) |
| **Primary sources** | Model knowledge | 8+ MCP servers on official sources (BGE, Fedlex, entscheidsuche, ...) |
| **Languages** | EN | DE/FR/IT/EN |
| **Citations** | -- | Swiss standards verified via MCP (BGE/ATF/DTF) |
| **Attorney-client privilege** | -- | Privacy-routing hook (Art. 321 StGB) |
| **Adversarial analysis** | -- | 3-agent advocate/adversary/judge with probability scores |
| **NDA triage** | GREEN/YELLOW/RED (US criteria) | GREEN/YELLOW/RED (Swiss criteria: Art. 160 ff. OR, Lugano, zwingendes Recht) |
| **Local playbook** | `legal.local.md` | `bettercallclaude.local.md` (+ `legal.local.md` compat) |

See [MIGRATION-FROM-ANTHROPIC-LEGAL.md](docs/MIGRATION-FROM-ANTHROPIC-LEGAL.md) for the full migration and coexistence guide.

---

## Overview

BetterCallClaude provides a structured methodology for handling legal work with AI assistance. The framework consists of five interconnected phases.

![BetterCallClaude Framework](docs/images/bettercallclaude_framework.png)

---

## What's New in v4.9.0

**v4.9.0 — Goal-loop iterative verification: `/legal-goal` and `/legal-loop`.**

- **`/legal-goal`**: define a machine-checkable legal success condition — from named profiles (`citations-clean`, `draft-passes-gate`, `adversarial-converge`, `nda-batch-clean`, `reg-watch`) or free-text objectives. Produces a persisted Goal Record; never starts work itself.
- **`/legal-loop`**: run a worker-evaluator iteration cycle against a Goal Record. A *separate judge agent* verifies each iteration using MCP tools (citation validation, claim support, source retrieval). Stops on success, max iterations, stagnation, or privacy violation. Persists an auditable verdict trail.
- **Evaluator skill** (`legal-evaluator`): shared verdict engine enforcing worker-judge separation. Uses `validate_citation`, `review_citations`, `check_claim_support` and Swiss source retrieval tools. Returns structured pass/fail verdicts with score and itemised findings.
- **5 pre-wired profiles**: `citations-clean` (flagship anti-hallucination gate), `draft-passes-gate`, `adversarial-converge`, `nda-batch-clean`, `reg-watch` (schedulable regulatory monitoring).

**Content counts**: 20 agents, 26 commands, 13 skills, 9 MCP servers.

[Full changelog →](CHANGELOG.md)

**Cowork Desktop dedicated release** -- This repository is exclusively for Claude Cowork Desktop. The Claude Code CLI version is at [fedec65/bettercallclaude-cli](https://github.com/fedec65/bettercallclaude-cli).

- **HTTP-only transport**: 8 of 9 MCP servers connect via `mcp.bettercallclaude.ch` / `mcp.opencaselaw.ch` -- no local Node.js build required for those
- **Local STDIO server** (`ollama`): bundled and only touches `http://localhost:11434` for privacy-routed translation/summarisation
- **Onboarding**: `/bettercallclaude:start` guides you from installation to first deliverable

---

## Getting Started (Cowork Desktop)

> **[Quickstart guide →](docs/QUICKSTART-COWORK.md)** (DE/FR/IT/EN, zero jargon, one page)

1. Install from [claude.com/plugins](https://claude.com/plugins) — search **BetterCallClaude** and click **Install**
2. Share a folder containing your case files or documents
3. Type `/bettercallclaude:start` to begin — BetterCallClaude checks connectivity, helps create your local playbook, and shows usage examples tailored to your profile

All results are saved as files in your shared folder (`bcc-output/`) — the chat shows only a brief summary.

MCP servers connect automatically. No setup, no API keys required.

---

## Installation (Advanced)

> **Full installation guide with screenshots:** [BetterCallClaude Tutorial →](https://github.com/fedec65/bettercallclaude_tutorial)

1. In Cowork, click **Customize** > **Browse plugins** > **Personal** > **+** > **Add marketplace from GitHub**
2. Enter `fedec65/bettercallclaude` and click **Sync**
3. Click **Install** on the BetterCallClaude card

MCP servers connect automatically via HTTP. No Node.js, no local setup, no API keys required.

---

## Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:legal` | Intelligent gateway -- analyzes intent, routes to the appropriate specialist agent, and manages multi-step legal workflows. Use `--refine` to transform vague queries first. |
| `/bettercallclaude:refine` | Transform vague legal queries into structured prompts through Socratic dialogue. Recommends optimal workflows and introduces Swiss legal terminology. |
| `/bettercallclaude:research` | Search Swiss legal precedents and compile research memoranda. Supports BGE/ATF/DTF databases, doctrine references, and cross-jurisdictional analysis. |
| `/bettercallclaude:strategy` | Develop litigation strategy with risk assessment, cost-benefit analysis, and procedural pathway evaluation. |
| `/bettercallclaude:draft` | Draft Swiss legal documents including contracts, court briefs, legal opinions, and memoranda with proper citation formatting. |
| `/bettercallclaude:cite` | Verify and format Swiss legal citations across all four national languages (BGE/ATF/DTF formats). |
| `/bettercallclaude:validate` | Validate Swiss legal citations in bulk -- check format, existence, and cross-language consistency. |
| `/bettercallclaude:precedent` | Search and analyze BGE/ATF/DTF precedents with precedent chain tracking and evolution analysis. |
| `/bettercallclaude:federal` | Analyze a legal question under federal Swiss law (ZGB, OR, StGB, BV, and related federal statutes). |
| `/bettercallclaude:cantonal` | Analyze a legal question under cantonal law for a specific canton. |
| `/bettercallclaude:adversarial` | Run three-agent adversarial analysis -- advocate builds the case, adversary challenges it, judicial analyst synthesizes. |
| `/bettercallclaude:briefing` | Structured pre-execution briefing -- assembles a specialist panel, collects case context, and builds an execution plan before agents start working. |
| `/bettercallclaude:workflow` | Define and execute multi-agent legal workflows (due diligence, litigation prep, contract lifecycle, real estate closing). |
| `/bettercallclaude:translate` | Translate Swiss legal documents between DE, FR, IT, and EN while preserving legal terminology precision. |
| `/bettercallclaude:doc-analyze` | Analyze Swiss legal documents -- identify legal issues, extract key clauses, verify citations, assess compliance. Playbook-aware deviation analysis when `bettercallclaude.local.md` is present. |
| `/bettercallclaude:nda-triage` | Triage NDAs against Swiss law: GREEN (standard) / YELLOW (review) / RED (issues). Single file or batch mode. Uses playbook thresholds. |
| `/bettercallclaude:summarize` | Consolidate multi-agent pipeline output -- deduplicate disclaimers, terminology, and citations with length control (`--short`/`--medium`/`--long`). |
| `/bettercallclaude:start` | Welcome and onboarding — checks connectivity, guides playbook creation, shows usage examples. |
| `/bettercallclaude:doctor` | Diagnose MCP server connectivity — tests each server, reports status and impact. |
| `/bettercallclaude:setup` | ⚠ Alias for `/start` — will be removed in v5.0. |
| `/bettercallclaude:version` | Display plugin version, installed components, and system status. |
| `/bettercallclaude:legal-5step` | Execute the 5-step end-to-end Swiss legal framework: intake → research → strategy → adversarial → draft. |
| `/bettercallclaude:privacy` | View or change the privacy mode (`strict` / `balanced` / `cloud`). Settings stored in `~/.betterask/config.yaml`. |
| `/bettercallclaude:help` | Show complete command reference, available agents, skills, and usage examples. |

### Skills

| Skill | Description |
|-------|-------------|
| `legal-5step-framework` | Coordinates the 5-step pipeline, enforces data flow between agents, manages quality gates and checkpoints. |

### Usage Examples

**For law firms:**
```
"Analizza questo NDA e dimmi se è accettabile"

"Cerca la giurisprudenza recente sulla disdetta anticipata del contratto di locazione a Zurigo"

"Prepara una Klageschrift per inadempimento contrattuale"
```

**For in-house counsel:**
```
"Controlla questi 5 NDA nella cartella e dammi un riepilogo"

"Il nostro fornitore vuole modificare la clausola di responsabilità — è accettabile?"

"Prepara un briefing sul nuovo nDSG per il management"
```

**With slash commands:**
```
/bettercallclaude:legal I need to assess our exposure under Art. 97 OR for late delivery

/bettercallclaude:research Art. 97 OR contractual liability for late delivery

/bettercallclaude:nda-triage @nda-folder/ Batch triage all NDAs

/bettercallclaude:adversarial Is the non-compete clause enforceable?

/bettercallclaude:doctor
```

### Renamed Commands

| Old Command | New Command | Status |
|-------------|-------------|--------|
| `/bettercallclaude:setup` | `/bettercallclaude:start` | Alias active until v5.0 |

---

## Key Features

- **Briefing sessions** -- Complex queries trigger a collaborative intake phase with specialist panels, targeted questions, and structured execution plans before agents start working. Supports `--resume` for cross-session persistence.
- **Adversarial analysis** -- Three-agent workflow: advocate builds the case, adversary challenges it, judicial analyst synthesizes using Swiss Erwagung methodology with probability scores.
- **Multi-agent workflows** -- Predefined pipelines for due diligence, litigation prep, contract lifecycle, and real estate closings.
- **All 26 cantons** -- Full cantonal coverage with court systems, citation formats, and MCP search via entscheidsuche.ch. Federal law is the default; mentioning a canton triggers cantonal mode.
- **Multi-language** -- Automatic language detection for DE/FR/IT/EN with correct legal terminology and citation formats.

---

## MCP Servers

All servers connect automatically after installation. No configuration required.

| Server | Purpose | Transport |
|--------|---------|-----------|
| `entscheidsuche` | Swiss court decision search (Bundesgericht + cantonal) | HTTP |
| `bge-search` | Federal Supreme Court decision search | HTTP |
| `legal-citations` | Citation verification and formatting | HTTP |
| `fedlex-sparql` | Federal legislation database (SPARQL) | HTTP |
| `onlinekommentar` | Swiss legal commentaries | HTTP |
| `legal-persona` | Swiss-law document intelligence (strategy, drafting, analysis) | HTTP |
| `tas-jurisprudence` | CAS/TAS sports arbitration decisions | HTTP |
| `swiss-caselaw` | Case law, citation graphs, appeal chains (opencaselaw.ch) | SSE |
| `ollama` | Local privacy classification for Anwaltsgeheimnis | Local |

The seven HTTP servers connect to `https://mcp.bettercallclaude.ch` (rate limit: 60 req/min per IP). The `swiss-caselaw` server connects to `https://mcp.opencaselaw.ch`. No API keys required for any server.

See [CONNECTORS.md](bettercallclaude/CONNECTORS.md) for detailed API documentation.

---

## Privacy

BetterCallClaude includes a built-in Anwaltsgeheimnis (attorney-client privilege, Art. 321 StGB) detection hook as an additional layer of protection. A `PreToolUse` hook scans outgoing tool calls for privilege indicators in German, French, Italian, and English before content leaves the machine. Strong privilege markers (e.g. Anwaltsgeheimnis, secret professionnel, Art. 321 StGB) trigger a confirmation prompt; weaker indicators (e.g. bare "vertraulich", "confidentiel") also prompt when legal context is detected. The user always retains the ability to approve or reject.

| Mode | Behavior |
|------|----------|
| `strict` | Same pattern matching as balanced but blocks (`deny`) instead of prompting. Content without privilege markers passes through so MCP servers remain usable. Ollama (local) always exempt. |
| `balanced` | Strong privilege markers prompt for confirmation (`ask`). Weak markers with legal context also prompt. Non-privileged content processed normally. Default mode. |
| `cloud` | Strong privilege markers prompt for confirmation (`ask`). Weak markers allowed without prompt. Maximum capability, reduced privacy. |

> **Disclaimer**: Privacy routing is an assistive technology and does not guarantee compliance with Art. 321 StGB or Art. 13 BGFA. Lawyers remain professionally responsible for protecting client confidentiality. Always verify that appropriate privacy measures are in place before processing sensitive legal content.

> **Known limitations**: The hook uses regex-based pattern matching on text content. Concatenated keywords (e.g. `segretoprofessionale`), accent variations, content encoded as base64, and content inside binary file attachments may bypass detection. The hook is designed to catch accidental leakage, not adversarial evasion. For Bash commands, file paths referencing privileged directories are checked, but the actual file content is not read.

---

## Language Support

| Language | Code | Legal Context |
|----------|------|---------------|
| German | DE | Primary: ZGB, OR, StGB, BGE. Used in ZH, BE, BS, and German-speaking cantons. |
| French | FR | Official: CC, CO, CP, ATF. Used in GE, VD, and French-speaking cantons. |
| Italian | IT | Official: CC, CO, CP, DTF. Used in TI and Italian-speaking regions. |
| English | EN | Working language with Swiss legal term mapping. |

---

## Requirements

- Claude Cowork Desktop (latest version)
- Node.js >= 18 (for the ollama privacy classifier only -- all other servers connect via HTTP)

---

## CLI Version

Prefer working from the terminal? **[BetterCallClaude CLI](https://github.com/fedec65/bettercallclaude-cli)** is the Claude Code CLI edition with local stdio MCP transport, configurable HTTP fallback, and the same 20 agents, 19 commands, and 14 skills.

---

## Author

Federico Cesconi -- [fedec65/bettercallclaude](https://github.com/fedec65/bettercallclaude) -- [bettercallclaude.ch](https://bettercallclaude.ch)

## License

AGPL-3.0 -- See [LICENSE](LICENSE) for full terms.

[Support the project](https://buymeacoffee.com/federicocesconi)

---

## For Developers

This repo contains the plugin only (agents, commands, skills, hooks, `.mcp.json`, and the bundled `ollama` local STDIO server). MCP server source code and the HTTP aggregator deployed to Railway at `mcp.bettercallclaude.ch` live in the separate [`fedec65/BetterCallClaudeMCP`](https://github.com/fedec65/BetterCallClaudeMCP) repo.

```bash
npm run package        # Create distributable plugin zip
```

To change an MCP server's behaviour, open a PR in
[`fedec65/BetterCallClaudeMCP`](https://github.com/fedec65/BetterCallClaudeMCP).
Railway auto-redeploys on merge to `main`.

See [CONNECTORS.md](bettercallclaude/CONNECTORS.md) for MCP server API documentation and [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor workflow.

---

## Professional Disclaimer

BetterCallClaude is a legal research and analysis tool. All outputs produced by this plugin:

- Require professional lawyer review and validation before use.
- Do not constitute legal advice.
- May contain errors, omissions, or outdated information.
- Must be verified against official sources (admin.ch, court databases, official gazettes).
- Must be adapted to the specific circumstances of each case.

Lawyers maintain full professional responsibility for all legal work products. This tool assists legal professionals but does not replace professional judgment, independent verification, or the duty of care owed to clients.
