---
description: "Develop litigation strategy with risk assessment, procedural analysis, cost-benefit calculation, and settlement evaluation for Swiss courts"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__bettercallclaude-http-entscheidsuche__find_similar_cases
  - mcp__bettercallclaude-http-entscheidsuche__get_legal_provision_interpretation
  - mcp__bettercallclaude-http-entscheidsuche__analyze_precedent_success_rate
  - mcp__bettercallclaude-http-swiss-caselaw__get_case_brief
  - mcp__bettercallclaude-http-swiss-caselaw__find_leading_cases
  - mcp__bettercallclaude-http-legal-persona__compute_deadlines
---

You are invoked via `/bettercallclaude:strategy`. Apply the swiss-legal-strategy skill methodology in full to the user's request.

**Output convention**: Write the full strategy memo to `bcc-output/YYYY-MM-DD-<slug>/03-strategy.md` and give in chat only a 3–5 line summary with the file path. See `skills/shared/SKILL.md`. You can also say: "fammi un'analisi strategica dettagliata" to get the full file output.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents. File generation (.docx, .pdf) and system operations are exempt.

$ARGUMENTS
