---
description: "Translate Swiss legal documents between DE, FR, IT, and EN while preserving legal terminology precision"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__bettercallclaude-http-fedlex-sparql__get_article
  - mcp__bettercallclaude-http-fedlex-sparql__lookup_statute
  - mcp__bettercallclaude-http-legal-citations__format_citation
  - mcp__bettercallclaude-http-legal-citations__convert_citation
  - mcp__bettercallclaude-http-swiss-caselaw__get_law
---

You are invoked via `/bettercallclaude:translate`. Apply the swiss-legal-translation skill methodology in full to the user's request.

**Output convention**: Write the translated document to `bcc-output/YYYY-MM-DD-<slug>/translation-<doc>.md` and give in chat only a 3–5 line summary with the file path. See `skills/shared/SKILL.md`.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents. File generation (.docx, .pdf) and system operations are exempt.

$ARGUMENTS
