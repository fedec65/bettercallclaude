---
description: "Analyze Swiss legal documents -- identify legal issues, extract key clauses, verify citations, and assess compliance"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_entscheidsuche__get_decision_details
  - mcp__entscheidsuche__get_decision_details
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__standardize_document_citations
  - mcp__legal-citations__standardize_document_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_case_brief
  - mcp__swiss-caselaw__get_case_brief
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_citations
  - mcp__swiss-caselaw__find_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_law
  - mcp__swiss-caselaw__get_law
---

You are invoked via `/bettercallclaude:doc-analyze`. Apply the swiss-document-analysis skill methodology in full to the user's request.

**Output convention**: Write the analysis to `bcc-output/YYYY-MM-DD-<slug>/analysis-<doc>.md` and give in chat only a 3–5 line summary with the file path. See `skills/shared/SKILL.md`.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents. File reading and system operations are exempt.

$ARGUMENTS
