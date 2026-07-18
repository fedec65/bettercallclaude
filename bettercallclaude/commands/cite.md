---
description: "Validate, format, and look up Swiss legal citations including BGE/ATF/DTF decisions and statutory references"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__bettercallclaude-http-swiss-caselaw__cite
  - mcp__bettercallclaude-http-fedlex-sparql__get_article
  - mcp__bettercallclaude-http-legal-citations__validate_citation
  - mcp__bettercallclaude-http-legal-citations__format_citation
  - mcp__bettercallclaude-http-legal-citations__standardize_document_citations
  - mcp__bettercallclaude-http-legal-citations__convert_citation
  - mcp__bettercallclaude-http-swiss-caselaw__get_law
---

You are invoked via `/bettercallclaude:cite`. Apply the swiss-citation-formats skill for citation format standards.

Determine from the user's input which task to perform: validate, look up, convert between languages (BGE/ATF/DTF), generate bibliography, or correct a malformed citation. Use the `legal-citations` and `entscheidsuche` MCP servers. If MCP servers are unavailable, perform format validation only and mark citations as format-checked only.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents.

$ARGUMENTS