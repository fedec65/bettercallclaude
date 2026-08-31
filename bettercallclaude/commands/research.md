---
description: "Search Swiss legal precedents (BGE/ATF/DTF), analyze statutes, and verify citations with multi-lingual support"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_bge-search__search_bge
  - mcp__bge-search__search_bge
  - mcp__plugin_bettercallclaude_bge-search__get_bge_decision
  - mcp__bge-search__get_bge_decision
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_entscheidsuche__search_canton
  - mcp__entscheidsuche__search_canton
  - mcp__plugin_bettercallclaude_entscheidsuche__get_decision_details
  - mcp__entscheidsuche__get_decision_details
  - mcp__plugin_bettercallclaude_entscheidsuche__find_similar_cases
  - mcp__entscheidsuche__find_similar_cases
  - mcp__plugin_bettercallclaude_entscheidsuche__get_legal_provision_interpretation
  - mcp__entscheidsuche__get_legal_provision_interpretation
  - mcp__plugin_bettercallclaude_entscheidsuche__analyze_precedent_success_rate
  - mcp__entscheidsuche__analyze_precedent_success_rate
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_fedlex-sparql__lookup_statute
  - mcp__fedlex-sparql__lookup_statute
  - mcp__plugin_bettercallclaude_fedlex-sparql__find_related
  - mcp__fedlex-sparql__find_related
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__format_citation
  - mcp__legal-citations__format_citation
  - mcp__plugin_bettercallclaude_legal-citations__parse_citation
  - mcp__legal-citations__parse_citation
  - mcp__plugin_bettercallclaude_legal-citations__get_provision_text
  - mcp__legal-citations__get_provision_text
  - mcp__plugin_bettercallclaude_legal-citations__standardize_document_citations
  - mcp__legal-citations__standardize_document_citations
  - mcp__plugin_bettercallclaude_legal-citations__convert_citation
  - mcp__legal-citations__convert_citation
  - mcp__plugin_bettercallclaude_onlinekommentar__search_commentaries
  - mcp__onlinekommentar__search_commentaries
  - mcp__plugin_bettercallclaude_onlinekommentar__get_commentary_for_article
  - mcp__onlinekommentar__get_commentary_for_article
  - mcp__plugin_bettercallclaude_onlinekommentar__list_legislative_acts
  - mcp__onlinekommentar__list_legislative_acts
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_decision
  - mcp__swiss-caselaw__get_decision
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_erwaegung
  - mcp__swiss-caselaw__get_erwaegung
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_regeste
  - mcp__swiss-caselaw__get_regeste
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_case_brief
  - mcp__swiss-caselaw__get_case_brief
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_leading_cases
  - mcp__swiss-caselaw__find_leading_cases
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_citations
  - mcp__swiss-caselaw__find_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_law
  - mcp__swiss-caselaw__get_law
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_legislation
  - mcp__swiss-caselaw__get_legislation
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_doctrine
  - mcp__swiss-caselaw__get_doctrine
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_commentary
  - mcp__swiss-caselaw__get_commentary
  - mcp__plugin_bettercallclaude_swiss-caselaw__search_laws
  - mcp__swiss-caselaw__search_laws
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_materialien
  - mcp__swiss-caselaw__get_materialien
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__swiss-caselaw__cite
---

You are invoked via `/bettercallclaude:research`. Apply the swiss-legal-research skill methodology in full to the user's request.

**Output convention**: Write the full research memo to `bcc-output/YYYY-MM-DD-<slug>/02-research-memo.md` and give in chat only a 3–5 line summary with the file path. See `skills/shared/SKILL.md`. You can also say: "scrivi il risultato nella cartella" or "save the result to file" to request file output.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents. File generation (.docx, .pdf) and system operations are exempt.

$ARGUMENTS
