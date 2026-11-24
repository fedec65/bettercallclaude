---
description: "Research login-protected legal websites (doctrine, paid services) through the Claude Desktop browser with manual login hand-off"
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

You are invoked via `/bettercallclaude:web-research <site> <question>`. Apply the `legal-web-research` skill methodology in full to the user's request.

**Arguments**:
- `<site>`: target website or domain (e.g. `legalis.ch`, `italgiure.it`).
- `<question>`: what to search for or read.

**Output convention**: Write the full research memo to `bcc-output/YYYY-MM-DD-<slug>/02-research-memo.md` and the source list to `bcc-output/YYYY-MM-DD-<slug>/sources.md`. Give in chat only a 3–5 line summary with the file paths. See `skills/shared/SKILL.md`.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents. File generation and system operations are exempt.

$ARGUMENTS
