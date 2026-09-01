[![Version](https://img.shields.io/badge/version-4.11.8-blue)](https://github.com/fedec65/bettercallclaude/releases)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-green)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Cowork%20Desktop-orange)](https://claude.ai)
[![Website](https://img.shields.io/badge/web-bettercallclaude.ch-brightgreen)](https://bettercallclaude.ch)
[![MCP Servers](https://img.shields.io/badge/MCP%20servers-10-purple)](https://mcp.bettercallclaude.ch/health)
[![Buy Me a Coffee](https://img.shields.io/badge/support-Buy%20Me%20a%20Coffee-yellow)](https://buymeacoffee.com/federicocesconi)

<p align="center">
  <img src="docs/images/bettercallclaude_logo.png" alt="BetterCallClaude" width="480">
</p>

<p align="center"><strong>Swiss Legal Intelligence Plugin for Cowork Desktop</strong></p>

BetterCallClaude transforms legal research, case strategy, and document drafting for Swiss lawyers. It provides deep integration with Swiss legal databases, multi-lingual analysis (DE/FR/IT/EN), and built-in Anwaltsgeheimnis (attorney-client privilege) protection -- 21 agents, 30 commands, 17 skills, and 10 MCP servers covering BGE/ATF/DTF precedent research, litigation strategy, adversarial analysis, legal drafting, citation verification, document intelligence, and CAS/TAS sports arbitration across all 26 Swiss cantons.

> **Claude Code CLI users**: this repository is Cowork Desktop only. The CLI version is at [fedec65/bettercallclaude-cli](https://github.com/fedec65/bettercallclaude-cli).

---

## Overview

BetterCallClaude provides a structured methodology for handling legal work with AI assistance. The framework consists of five interconnected phases.

![BetterCallClaude Framework](docs/images/bettercallclaude_framework.png)

---

## What's New in v4.11.8

**v4.11.8 — `/doctor` now catches a broken agent route.** In v4.11.5 an outage left plugin agents unable to reach any connector ("No such tool available") while `/doctor` reported everything green, because doctor only tested the main-session route. `/doctor` now also dispatches the plugin's citation-specialist agent for a one-shot `validate_citation` call and reports "Route agent: OK" — or, if the agent route is broken, says so plainly with update instructions. A new CI check additionally enforces that every MCP tool in agent/command/skill whitelists is registered under both naming conventions hosts use, so this regression class cannot silently return.

## What's New in v4.11.5

**v4.11.5 — Ollama server actually starts on Cowork Desktop.** The v4.11.4 fallback never ran: Cowork's host bridge drops any server whose `.mcp.json` entry references `${user_config.*}` (`user_config is not supported on the desktop host bridge; dropping server`), so the whole ollama server was rejected at load. The template and the dead `ollama_host` plugin setting are removed — the bundled server now starts and talks to your local Ollama daemon at `http://localhost:11434` directly. Update the plugin, restart Cowork, then run `/bettercallclaude:setup` to see the ollama server connected.

**v4.11.4 — Ollama connector fixed on Cowork Desktop.** Since v4.3.0 the bundled ollama server received an empty `ollama_host` setting on Cowork (the app exposes no userConfig settings UI), which broke every local translation/summarisation call with `Failed to parse URL from /api/version`. The server now falls back to the default `http://localhost:11434` automatically — reinstall or update the plugin and no action is needed.

**v4.11.3 — Workflow IDs that survive Cowork restarts.** Cowork Desktop wipes its sandbox filesystem on restart, which used to reset your generated workflow ID. The workflow commands now also read your ID from a `BetterCallClaude workflow user ID: …` line in Settings → General → Instructions for Claude — one line to paste once, stored by the app, permanent. The generation message tells new users how.

**v4.11.2 — Server-enforced unique workflow namespaces.** The new `claim_user_id` tool on the workflows-ch server reserves your User ID in the database (UNIQUE constraint), so no two users can ever share a workflow namespace. Generated `bcc-…` IDs are claimed before they're saved, with automatic retry on collision.

**v4.11.1 — Private workflow namespaces for everyone.** Custom workflows are now stored under a unique per-user ID: if you don't set the **User ID** plugin setting, a random `bcc-…` ID is generated once and saved to `~/.betterask/config.yaml`. No shared `default` namespace anymore.

**v4.11.0 — Custom workflows.** Build your own multi-agent pipelines once and reuse them: `/bettercallclaude:create-workflow` interviews you, validates the agent chain server-side (compatible hand-offs only), and saves it; `/bettercallclaude:workflow` then lists your saved workflows next to the built-in templates and runs them with the same engine. Backed by the new `workflows-ch` MCP server (30 commands, 10 MCP servers total).

**Also in recent releases — v4.10.0 legal wayfinder**: `/legal-chart` decomposes a matter into a decision map — destination, decisions so far, fog, out-of-scope — with one ticket per open decision. `/legal-way` then works the map ticket by ticket (research, grilling, prototype, task) until the route to the deliverable is clear and hands off to execution. A fog check in `/briefing` routes oversized matters to the chart instead of forcing a static execution plan.

**Also in recent releases — v4.9.6 privacy fix**: the Anwaltsgeheimnis PreToolUse hook silently failed on plugin paths containing spaces (e.g. a user name with a space) — privilege detection was off with no error shown. The hook command now quotes the plugin root correctly, with regression guards (standalone tests + a CI check). If you handle privileged client content, update.

**Also in recent releases — v4.9.5 `/legal-timeline`**: build a sourced case chronology from your case documents: every event carries its document and locus, contested facts and date conflicts are made visible (never silently resolved), evidentiary gaps of 30+ days are flagged, and procedural deadlines are computed via MCP with cantonal holiday calendars. Three outputs (Markdown table, interactive HTML, Word export) under `bcc-output/timeline/`.

**Content counts**: 21 agents, 30 commands, 17 skills, 10 MCP servers in `.mcp.json` (8 remote HTTP on `mcp.bettercallclaude.ch` + `swiss-caselaw` SSE on `mcp.opencaselaw.ch` + `ollama` local STDIO).

[Full changelog →](CHANGELOG.md)

**Cowork Desktop dedicated release** -- This repository is exclusively for Claude Cowork Desktop. The Claude Code CLI version is at [fedec65/bettercallclaude-cli](https://github.com/fedec65/bettercallclaude-cli).

- **HTTP-only transport**: 9 of 10 MCP servers connect via `mcp.bettercallclaude.ch` / `mcp.opencaselaw.ch` -- no local Node.js build required for those
- **Local STDIO server** (`ollama`): bundled and only touches `http://localhost:11434` for privacy-routed translation/summarisation
- **Simplified setup**: `/setup` checks connectivity only -- no transport switching needed in Cowork

---

## Installation

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
| `/bettercallclaude:legal-chart` | Chart a big or foggy matter as a wayfinder decision map -- one ticket per open decision, planning only. |
| `/bettercallclaude:legal-way` | Work one decision ticket from a wayfinder map; hands off to execution only when every decision is made. |
| `/bettercallclaude:workflow` | Define and execute multi-agent legal workflows (due diligence, litigation prep, contract lifecycle, real estate closing), including saved custom workflows. |
| `/bettercallclaude:create-workflow` | Create a reusable custom workflow by combining agents -- interview-based: pick agents, order them, define the output; saved for future use with `/workflow`. |
| `/bettercallclaude:legal-5step` | Execute the 5-step Swiss legal framework end to end: intake, research, strategy, adversarial stress test, verified drafting. |
| `/bettercallclaude:legal-goal` | Define a checkable legal success condition for `/legal-loop`. |
| `/bettercallclaude:legal-loop` | Iterate a worker-evaluator cycle against a Goal Record until the success condition is met or a stop limit is reached. |
| `/bettercallclaude:translate` | Translate Swiss legal documents between DE, FR, IT, and EN while preserving legal terminology precision. |
| `/bettercallclaude:doc-analyze` | Analyze Swiss legal documents -- identify legal issues, extract key clauses, verify citations, assess compliance. |
| `/bettercallclaude:legal-timeline` | Build a sourced legal chronology from case documents -- provenance per event, contested-fact status, date conflicts, gaps, deadlines. |
| `/bettercallclaude:nda-triage` | Triage NDAs against Swiss law -- GREEN / YELLOW / RED using playbook thresholds; single file or batch mode. |
| `/bettercallclaude:summarize` | Consolidate multi-agent pipeline output -- deduplicate disclaimers, terminology, and citations with length control (`--short`/`--medium`/`--long`). |
| `/bettercallclaude:start` | First-use onboarding -- checks MCP connectivity, guides playbook creation, shows tailored usage examples. |
| `/bettercallclaude:setup` | Check MCP server connectivity and display status for all 10 servers. |
| `/bettercallclaude:doctor` | Diagnose MCP server connectivity per server, with plain-language status, impact, and suggested fixes. |
| `/bettercallclaude:privacy` | View or change the privacy mode (strict / balanced / cloud) for Anwaltsgeheimnis handling. |
| `/bettercallclaude:version` | Display plugin version, installed components, and system status. |
| `/bettercallclaude:help` | Show complete command reference, available agents, skills, and usage examples. |

### Usage Examples

```
/bettercallclaude:legal I need to assess our exposure under Art. 97 OR for late delivery

/bettercallclaude:refine I have problems with my landlord

/bettercallclaude:research Art. 97 OR contractual liability for late delivery

/bettercallclaude:strategy Commercial lease dispute in Zurich, landlord claims CHF 200k damages

/bettercallclaude:draft Employment contract for a software engineer in Geneva, bilingual DE/FR

/bettercallclaude:adversarial Is the non-compete clause in this employment contract enforceable?

/bettercallclaude:workflow litigation-prep Personal injury claim against manufacturer

/bettercallclaude:briefing Prepare full litigation for Art. 97 OR breach, CHF 500K, Zurich

/bettercallclaude:cantonal ZH Commercial court jurisdiction for contract disputes over CHF 30k

/bettercallclaude:doc-analyze @contract.pdf Review this commercial lease agreement
```

---

## Agents

| Agent | Domain |
|-------|--------|
| **Research & Drafting** | |
| researcher | Swiss legal research, BGE/ATF/DTF search, statutory analysis |
| strategist | Litigation strategy, risk assessment, cost-benefit analysis |
| drafter | Legal document drafting in Swiss format |
| citation | BGE citation verification and multi-lingual formatting |
| compliance | FINMA, AML/KYC, regulatory compliance checks |
| chronology-builder | Sourced timeline event extraction from case documents |
| **Domain Specialists** | |
| data-protection | GDPR, nDSG/FADP privacy analysis |
| risk | Case outcome probability, damages quantification, Monte Carlo simulation |
| procedure | ZPO/StPO deadlines, procedural rules, forum selection |
| translator | DE/FR/IT legal terminology and document translation |
| fiscal | Tax law, DTAs, transfer pricing, fiscal structuring |
| corporate | AG/GmbH governance, M&A, commercial contracts |
| cantonal | All 26 Swiss cantonal legal systems |
| realestate | Property law, Grundbuch, Lex Koller |
| **Adversarial Analysis** | |
| advocate | Builds the strongest case for a position |
| adversary | Challenges and stress-tests the case |
| judicial | Synthesizes advocate and adversary into balanced assessment |
| **Briefing & Orchestration** | |
| briefing | Pre-execution intake, specialist panel consultation, execution plan building |
| orchestrator | Multi-agent pipeline coordination and workflow management |
| summarizer | Pipeline output consolidation, deduplication, length-calibrated summaries |
| prompt-engineer | Prompt refinement — transforms vague queries into precise, effective legal prompts |

---

## Key Features

- **Briefing sessions** -- Complex queries trigger a collaborative intake phase with specialist panels, targeted questions, and structured execution plans before agents start working. Supports `--resume` for cross-session persistence.
- **Adversarial analysis** -- Three-agent workflow: advocate builds the case, adversary challenges it, judicial analyst synthesizes using Swiss Erwagung methodology with probability scores.
- **Multi-agent workflows** -- Predefined pipelines for due diligence, litigation prep, contract lifecycle, and real estate closings.
- **All 26 cantons** -- Full cantonal coverage with court systems, citation formats, and MCP search via entscheidsuche.ch. Federal law is the default; mentioning a canton triggers cantonal mode.
- **Multi-language** -- Automatic language detection for DE/FR/IT/EN with correct legal terminology and citation formats.

---

## Custom Workflows and Your User ID

With `/bettercallclaude:create-workflow` you can save your own agent pipelines and reuse them via `/bettercallclaude:workflow`. Saved workflows live on the `workflows-ch` server under a **personal user ID** — your private namespace, guaranteed unique by the server (no two users can ever share one).

**You don't need to do anything to get an ID.** The first time you use a workflow feature, one is generated for you (`bcc-…`), reserved on the server, and shown to you once in a short message.

**Make your ID permanent (Cowork Desktop, one minute).** Cowork wipes its sandbox on every restart, which would otherwise reset a generated ID. To keep yours forever:

1. Copy your ID from the generation message (or ask any time: *"what is my BetterCallClaude workflow user ID?"*).
2. Open Cowork → **Settings → General → Instructions for Claude**.
3. Add this line: `BetterCallClaude workflow user ID: bcc-…` (your ID).

Done. Every future session reads the ID from your instructions — restarts, updates, and new conversations included. Add the same line on a second machine and your workflows are there too.

Two things to know:

- **Keep the ID private.** It is the only key to your namespace — anyone who knows it can read your saved workflows.
- **Claude Code CLI** users can set the **User ID for custom workflows** plugin setting instead of the instructions line; the plugin setting takes precedence.

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

BetterCallClaude includes built-in Anwaltsgeheimnis (attorney-client privilege, Art. 321 StGB) compliance. A `PreToolUse` hook scans outgoing tool calls for privilege indicators in German (Anwaltsgeheimnis, Mandantengeheimnis, vertraulich), French (secret professionnel, confidentiel), and Italian (segreto professionale, confidenziale).

| Mode | Behavior |
|------|----------|
| `strict` | All external calls require confirmation. Local processing preferred via Ollama. |
| `balanced` | Privileged content triggers confirmation. Non-privileged content processed normally. |
| `cloud` | Standard cloud processing with privacy hook active for explicit privilege markers only. |

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
