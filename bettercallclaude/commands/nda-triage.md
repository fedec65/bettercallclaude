---
description: "Triage NDAs against Swiss law — classify as GREEN (standard) / YELLOW (review) / RED (issues) using playbook thresholds and Swiss legal criteria. Supports single file or batch (folder) mode."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_entscheidsuche__get_decision_details
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__standardize_document_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_case_brief
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_law
---

# NDA Triage — Swiss Law

You are invoked via `/bettercallclaude:nda-triage`. Apply the swiss-document-analysis skill in **NDA triage mode** to analyze one or more NDAs against Swiss legal criteria and the user's local playbook.

**Output convention**: Write triage reports to `bcc-output/YYYY-MM-DD-<slug>/nda-triage-<doc>.md`. In batch mode, also write a summary table. Give in chat only the verdict (GREEN/YELLOW/RED) with a 2–3 line summary per NDA. See `skills/shared/SKILL.md`.

## Playbook Loading

Before starting the triage, search for the local playbook in this order:
1. `.claude/bettercallclaude.local.md`
2. `bettercallclaude.local.md` in any shared folder
3. `.claude/legal.local.md` (Anthropic compat — read compatible sections, note ignored US-centric positions)
4. No file found → use Swiss defaults and note: *"No local playbook found. Using Swiss defaults. Create a `bettercallclaude.local.md` for firm-specific thresholds — see `templates/` for examples."*

Extract from the playbook:
- NDA maximum acceptable duration
- Scope of "confidential information" definition
- Konventionalstrafe thresholds (Art. 160 ff. OR)
- Governing law and jurisdiction preferences
- Escalation rules and thresholds

## Single File vs. Batch Mode

- **Single file**: The user provides one NDA document → produce a full triage report.
- **Batch mode**: The user provides a folder or multiple files → produce a **summary table** (file | verdict | key issues) followed by individual reports for each NDA.

Detect batch mode when the input references a folder path, multiple files, or uses glob patterns.

## Triage Classification (Swiss Criteria)

### GREEN — Standard Approval
All of the following:
- Governing law: Swiss law
- Jurisdiction: forum in Switzerland
- Duration: within playbook threshold (default: 5 years if no playbook)
- Obligations: reciprocal (mutual NDA)
- No anomalous Konventionalstrafe
- Scope of confidentiality: standard perimeter
- No conflict with mandatory Swiss law (zwingendes Recht)

### YELLOW — Legal Review Recommended
One or more of:
- Governing law: foreign law but forum reachable (Lugano Convention)
- Konventionalstrafe present but within playbook thresholds
- Duration exceeds playbook threshold
- Non-solicitation clauses present
- Significant asymmetries between parties
- Unilateral NDA (only one party bound)

### RED — Substantive Issues
One or more of:
- Waiver of mandatory rights (zwingendes Recht)
- Unlimited warranties or indemnities
- Derogation from Art. 100 OR (liability for intent/gross negligence)
- Exotic forum outside Lugano Convention
- Entanglement with problematic non-compete clauses (Art. 340 ff. OR if employment context)
- Evident nDSG violations (e.g. unrestricted cross-border data transfer without safeguards)
- Perpetual or irrevocable confidentiality obligations without reasonable carve-outs

## Output Format

### Single NDA Report

```
## NDA Triage Report

**File**: [filename]
**Verdict**: [GREEN / YELLOW / RED] — [2-3 sentence rationale]

### Clause-by-Clause Analysis
| Clause | Assessment | Legal Basis | Suggested Redline |
|--------|-----------|-------------|-------------------|
| Governing law | [evaluation] | [reference] | [if applicable] |
| Jurisdiction | [evaluation] | [reference] | [if applicable] |
| Duration | [evaluation] | [reference] | [if applicable] |
| Confidentiality scope | [evaluation] | [reference] | [if applicable] |
| Konventionalstrafe | [evaluation] | [reference] | [if applicable] |
| Non-solicitation | [evaluation] | [reference] | [if applicable] |
| Non-compete | [evaluation] | [reference] | [if applicable] |
| Liability / Indemnity | [evaluation] | [reference] | [if applicable] |
| Data protection | [evaluation] | [reference] | [if applicable] |
| Termination | [evaluation] | [reference] | [if applicable] |

### Escalation (YELLOW/RED only)
[List of items requiring human review per playbook escalation rules]

### Source Verification
[References verified via fedlex-sparql: list. Unverified references marked accordingly.]
```

### Batch Summary Table

```
## NDA Batch Triage — Summary

| # | File | Verdict | Key Issues |
|---|------|---------|------------|
| 1 | [name] | GREEN/YELLOW/RED | [brief] |
| 2 | [name] | GREEN/YELLOW/RED | [brief] |
| ... | ... | ... | ... |

[Individual reports follow below]
```

## Source Verification

Verify cited legal references via MCP `fedlex-sparql` → `get_article(sr, art)` when the server is available. If unavailable, mark references as *"(non verificato / nicht verifiziert / not verified)"*.

## Mandatory Law Override

If the playbook contains positions that conflict with mandatory Swiss law (zwingendes Recht), flag them explicitly:
> **Warning**: Playbook position "[position]" conflicts with [mandatory provision]. The mandatory provision prevails — this playbook position is not applied.

## Plugin Scope Constraint

For all NDA triage and analysis work, use **exclusively** BetterCallClaude agents, skills, and MCP servers. Do not delegate legal work to generic or external skills, agents, or tools outside this plugin. Infrastructure operations (file reading, file generation) are exempt.

## User Query

$ARGUMENTS
