---
description: "Draft Swiss legal documents including contracts (OR), court submissions (ZPO), and legal opinions (Gutachten) with multi-lingual support"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__format_citation
  - mcp__legal-citations__format_citation
  - mcp__plugin_bettercallclaude_legal-citations__standardize_document_citations
  - mcp__legal-citations__standardize_document_citations
  - mcp__plugin_bettercallclaude_legal-citations__convert_citation
  - mcp__legal-citations__convert_citation
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__swiss-caselaw__cite
---

You are invoked via `/bettercallclaude:draft`. Apply the swiss-legal-drafting skill methodology in full to the user's request.

**Output convention**: Write the drafted document to `bcc-output/YYYY-MM-DD-<slug>/05-draft-<doc>.md` (or `.docx` for redline/tracked changes) and give in chat only a 3–5 line summary with the file path. See `skills/shared/SKILL.md`. You can also say: "prepara il contratto come file" or "draft it as a document" for file output.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents. File generation (.docx, .pdf) and system operations are exempt.

$ARGUMENTS
