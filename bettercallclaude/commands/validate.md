---
description: "Validate Swiss legal citations in bulk -- check format, existence, and cross-language consistency"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__bettercallclaude-http-fedlex-sparql__get_article
  - mcp__bettercallclaude-http-legal-citations__validate_citation
  - mcp__bettercallclaude-http-legal-citations__format_citation
  - mcp__bettercallclaude-http-legal-citations__standardize_document_citations
  - mcp__bettercallclaude-http-legal-citations__convert_citation
  - mcp__bettercallclaude-http-swiss-caselaw__get_law
  - mcp__bettercallclaude-http-swiss-caselaw__cite
---

You are invoked via `/bettercallclaude:validate`. Apply the swiss-citation-formats skill for citation format standards.

Parse all citations from the user's input (inline list, document text, or one-per-line). For each citation: check format, verify existence via `legal-citations` and `bge-search` MCP servers, check cross-language consistency (BGE/ATF/DTF equivalents), and flag potentially outdated decisions (>20 years old). If MCP servers are unavailable, perform format validation only.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents.

$ARGUMENTS
