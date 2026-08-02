---
description: "Validate Swiss legal citations in bulk -- check format, existence, and cross-language consistency"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__format_citation
  - mcp__plugin_bettercallclaude_legal-citations__standardize_document_citations
  - mcp__plugin_bettercallclaude_legal-citations__convert_citation
  - mcp__plugin_bettercallclaude_legal-citations__extract_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_law
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_relevant_erwaegung
  - mcp__plugin_bettercallclaude_swiss-caselaw__check_claim_support
---

You are invoked via `/bettercallclaude:validate`. Apply the swiss-citation-formats skill for citation format standards.

Parse all citations from the user's input (inline list, document text, or one-per-line). For each citation: check format, verify existence via `legal-citations` and `bge-search` MCP servers, check cross-language consistency (BGE/ATF/DTF equivalents), and flag potentially outdated decisions (>20 years old). If MCP servers are unavailable, perform format validation only.

For substantive verification — whether each citation also *supports the claim it is attached to* — apply the `citation-content-verify` skill (existence + content entailment per citation, with a delivery gate for UNVERIFIED/MISMATCH). Use it whenever the input is a draft with legal assertions rather than a bare citation list.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents.

$ARGUMENTS
