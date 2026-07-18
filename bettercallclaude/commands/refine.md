---
description: "Refine vague legal queries into structured prompts through Socratic dialogue, with workflow recommendations and multi-lingual terminology guidance"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__bettercallclaude-http-legal-persona__present_intake_form
---

You are invoked via `/bettercallclaude:refine`. Apply the legal-intake skill's Refine mode to the user's query.

Supported flags: `--quick`, `--optimize`. You can also say: "analisi rapida" or "quick refinement" → `--quick`, "ottimizza il prompt" → `--optimize`.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents.

$ARGUMENTS
