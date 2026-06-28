---
description: "Display BetterCallClaude plugin version, installed components, and system status"
---

# BetterCallClaude Version and Status

When this command is invoked, display the plugin status report below. Check actual MCP server availability by attempting to list their tools. Replace status indicators accordingly.

## Status Report

Output the following formatted block:

```
======================================================
  BetterCallClaude - Swiss Legal Intelligence Plugin
======================================================
  Version:      4.9.0
  Format:       Claude Code Plugin (Cowork Desktop)
  Author:       Federico Cesconi
  License:      AGPL-3.0
======================================================

  COMMANDS (26)
  -------------
  [x] legal          - Intelligent gateway and router
  [x] research       - BGE/ATF/DTF precedent search
  [x] strategy       - Litigation strategy and risk
  [x] draft          - Legal document generation
  [x] federal        - Federal law mode
  [x] cantonal       - Cantonal law mode
  [x] cite           - Citation formatting
  [x] doc-analyze    - Document analysis
  [x] nda-triage     - NDA triage (GREEN/YELLOW/RED)
  [x] precedent      - Precedent chain analysis
  [x] validate       - Batch citation validation
  [x] adversarial    - Three-agent adversarial analysis
  [x] workflow       - Multi-agent pipeline execution
  [x] briefing       - Structured pre-execution briefing
  [x] translate      - Legal translation DE/FR/IT/EN
  [x] legal-5step    - 5-step end-to-end legal pipeline
  [x] legal-goal     - Define checkable success condition
  [x] legal-loop     - Worker-evaluator iteration cycle
  [x] start          - Welcome and onboarding
  [x] doctor         - MCP server diagnostics
  [x] setup          - Alias for start (deprecated, v5.0 removal)
  [x] version        - This status display
  [x] refine         - Prompt refinement and reformulation
  [x] summarize      - Consolidate multi-agent output
  [x] privacy        - View/change privacy mode
  [x] help           - Command reference

  PLAYBOOK
  --------
  Supports bettercallclaude.local.md for firm-specific
  positions, risk thresholds, and output preferences.
  Compatible with legal.local.md (Anthropic format).

  AGENTS (20)
  -----------
  [x] researcher      [x] strategist     [x] drafter
  [x] citation        [x] compliance     [x] data-protection
  [x] risk            [x] procedure      [x] translator
  [x] fiscal          [x] corporate      [x] cantonal
  [x] realestate      [x] advocate       [x] adversary
  [x] judicial        [x] briefing       [x] orchestrator
  [x] summarizer      [x] prompt-engineer

  SKILLS (13)
  ----------
  [x] swiss-legal-research     [x] swiss-legal-drafting
  [x] swiss-legal-strategy     [x] swiss-citation-formats
  [x] swiss-document-analysis  [x] privacy-routing
  [x] swiss-legal-translation  [x] adversarial-analysis
  [x] compliance-frameworks    [x] data-protection-law
  [x] legal-intake             [x] legal-5step-framework
  [x] legal-evaluator

  MCP SERVERS (9)
  ---------------
  [ ] entscheidsuche    - Swiss court decision search        (HTTP)
  [ ] bge-search        - Federal Supreme Court decisions    (HTTP)
  [ ] legal-citations   - Citation verification              (HTTP)
  [ ] fedlex-sparql     - Federal legislation database       (HTTP)
  [ ] onlinekommentar   - Legal commentary access            (HTTP)
  [ ] legal-persona     - Document intelligence (strategy/draft) (HTTP)
  [ ] tas-jurisprudence - CAS/TAS sports arbitration awards  (HTTP)
  [ ] swiss-caselaw     - Case law, citation graphs, doctrine (SSE)
  [ ] ollama            - Privacy classification             (Local)

  HTTP Service: https://mcp.bettercallclaude.ch
  Run /bettercallclaude:doctor to check connectivity

  LANGUAGES
  ---------
  [x] German (DE)   - OR, ZGB, StGB, BGE
  [x] French (FR)   - CO, CC, CP, ATF
  [x] Italian (IT)  - CO, CC, CP, DTF
  [x] English (EN)  - Swiss-specific terminology

  JURISDICTIONS
  -------------
  [x] Federal law (Bundesrecht)
  [x] All 26 Swiss cantons supported

  SYSTEM REQUIREMENTS
  -------------------
  - Claude Code or Cowork with plugin support
  - MCP servers connect via HTTP (no local setup needed)
  - No API keys required for any functionality
  - Node.js 18+ required for ollama server

======================================================
  https://github.com/fedec65/BetterCallClaude
======================================================
```

For each MCP server, attempt to verify availability:
- If tools from that server respond, mark as `[x]` (active).
- If tools are unavailable, mark as `[ ]` (not configured).

If the user asks a follow-up question, answer it in context of the version and status information.

## User Query

$ARGUMENTS
