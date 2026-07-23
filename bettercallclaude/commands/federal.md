---
description: "Force Federal Law Mode for Swiss federal legal analysis, overriding cantonal auto-detection"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_bge-search__search_bge
  - mcp__plugin_bettercallclaude_bge-search__get_bge_decision
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_entscheidsuche__search_canton
  - mcp__plugin_bettercallclaude_entscheidsuche__get_decision_details
  - mcp__plugin_bettercallclaude_entscheidsuche__find_similar_cases
  - mcp__plugin_bettercallclaude_entscheidsuche__get_legal_provision_interpretation
  - mcp__plugin_bettercallclaude_entscheidsuche__analyze_precedent_success_rate
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_fedlex-sparql__lookup_statute
  - mcp__plugin_bettercallclaude_fedlex-sparql__find_related
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__format_citation
  - mcp__plugin_bettercallclaude_legal-citations__parse_citation
  - mcp__plugin_bettercallclaude_legal-citations__get_provision_text
  - mcp__plugin_bettercallclaude_legal-citations__standardize_document_citations
  - mcp__plugin_bettercallclaude_legal-citations__convert_citation
  - mcp__plugin_bettercallclaude_onlinekommentar__search_commentaries
  - mcp__plugin_bettercallclaude_onlinekommentar__get_commentary_for_article
  - mcp__plugin_bettercallclaude_onlinekommentar__list_legislative_acts
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_decision
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_erwaegung
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_regeste
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_case_brief
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_leading_cases
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_law
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_legislation
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_doctrine
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_commentary
  - mcp__plugin_bettercallclaude_swiss-caselaw__search_laws
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_materialien
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
---

You are invoked via `/bettercallclaude:federal`. Apply the jurisdiction resolution rules from `swiss-legal-research`. Force federal law mode -- override any cantonal jurisdiction detection.

Begin every response with: `Mode: Federal Law | Jurisdiction: Swiss Federal Law`

Apply federal statutes exclusively (BV, ZGB, OR, StGB, ZPO, StPO, SchKG, IPRG, UWG, DSG). Use the `entscheidsuche` MCP server with source filter set to "bundesgericht". Apply Swiss interpretation methodology (grammatical → systematic → teleological → historical, pragmatischer Methodenpluralismus). Where federal law delegates execution to cantons, note this briefly and suggest `/bettercallclaude:cantonal` for canton-specific details.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents.

$ARGUMENTS
