---
description: "Show complete BetterCallClaude command reference, available agents, skills, and usage examples"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
---

# BetterCallClaude Command Reference

Display the complete reference for the BetterCallClaude plugin. Output the following formatted guide exactly as shown.

---

## Quick Start

BetterCallClaude provides Swiss legal intelligence through three interfaces:

1. **Commands** -- Explicit slash commands for specific tasks
2. **Agents** -- Specialist subagents for domain-specific work
3. **Skills** -- Auto-activated knowledge that enriches all responses

---

## Commands (30)

### Core Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:legal` | Intelligent gateway -- analyzes intent, routes to agents, manages workflows |
| `/bettercallclaude:legal --refine` | Prompt refinement mode -- reformulates vague queries into precise legal prompts |
| `/bettercallclaude:research` | Search BGE/ATF/DTF precedents, analyze statutes, verify citations |
| `/bettercallclaude:strategy` | Litigation strategy, risk assessment, settlement evaluation |
| `/bettercallclaude:draft` | Draft contracts, court submissions, legal opinions |

### Jurisdiction Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:federal` | Force federal law mode (ZGB, OR, StGB, BV analysis) |
| `/bettercallclaude:cantonal` | Force cantonal law mode for a specific canton |

### Analysis Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:doc-analyze` | Analyze legal documents: issues, clauses, citations, compliance |
| `/bettercallclaude:legal-timeline` | Build a sourced case chronology: provenance per event, contested facts, date conflicts, gaps, deadlines |
| `/bettercallclaude:precedent` | Search and analyze BGE precedent chains and evolution |
| `/bettercallclaude:nda-triage` | Triage NDAs against Swiss law: GREEN / YELLOW / RED (single or batch) |
| `/bettercallclaude:validate` | Batch validate Swiss legal citations for format and existence |
| `/bettercallclaude:adversarial` | Three-agent adversarial analysis: advocate, adversary, judge |

### Workflow Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:workflow` | Define and execute multi-agent pipelines, including your saved custom workflows |
| `/bettercallclaude:create-workflow` | Create a custom multi-agent pipeline: interview, server-side chain validation, save |
| `/bettercallclaude:briefing` | Structured pre-execution briefing with specialist panel and plan building |
| `/bettercallclaude:legal-chart` | Chart a big/foggy matter as a wayfinder decision map |
| `/bettercallclaude:legal-way` | Work one decision ticket from a wayfinder map |
| `/bettercallclaude:legal-5step` | End-to-end 5-step pipeline: intake, research, strategy, adversarial, draft |
| `/bettercallclaude:legal-goal` | Define a checkable success condition for /legal-loop (named profile or free text) |
| `/bettercallclaude:legal-loop` | Iterate a worker-evaluator cycle against a Goal Record until pass or stop limit |
| `/bettercallclaude:translate` | Translate legal documents between DE, FR, IT, EN |

### Reference Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:cite` | Format and verify individual Swiss legal citations |
| `/bettercallclaude:refine` | Refine vague legal queries into precise, effective prompts |
| `/bettercallclaude:start` | First-use onboarding: MCP check, playbook setup, tailored examples |
| `/bettercallclaude:setup` | Check MCP server connectivity |
| `/bettercallclaude:doctor` | Diagnose MCP server connectivity per server, with plain-language fixes |
| `/bettercallclaude:privacy` | View or change privacy mode (strict / balanced / cloud) |
| `/bettercallclaude:version` | Display plugin version, components, and system status |
| `/bettercallclaude:summarize` | Consolidate multi-agent pipeline output with length control (--short/--medium/--long) |
| `/bettercallclaude:help` | This command reference |

---

## Agents (21)

### Core Pipeline Agents

| Agent | Domain |
|-------|--------|
| researcher | Swiss legal research, BGE/ATF/DTF search, statutory analysis |
| strategist | Litigation strategy, risk assessment, cost-benefit analysis |
| drafter | Legal document drafting in Swiss format |
| citation | BGE citation verification and multi-lingual formatting |
| compliance | FINMA, AML/KYC, regulatory compliance checks |
| chronology-builder | Sourced timeline event extraction from case documents |

### Specialized Domain Agents

| Agent | Domain |
|-------|--------|
| data-protection | GDPR, nDSG/FADP privacy analysis |
| risk | Case outcome probability, damages quantification, Monte Carlo simulation |
| procedure | ZPO/StPO deadlines, procedural rules, forum selection |
| translator | DE/FR/IT legal terminology and document translation |
| fiscal | Tax law, DTAs, transfer pricing, fiscal structuring |
| corporate | AG/GmbH governance, M&A, commercial contracts |
| cantonal | All 26 Swiss cantonal legal systems |
| realestate | Property law, Grundbuch, Lex Koller |
| advocate | Builds the strongest case for a position (adversarial mode) |
| adversary | Challenges and stress-tests the case (adversarial mode) |
| judicial | Synthesizes advocate and adversary into balanced assessment |
| briefing | Pre-execution intake, specialist panel consultation, execution plan building |
| orchestrator | Multi-agent pipeline coordination and workflow management |
| summarizer | Pipeline output consolidation, deduplication, length-calibrated summaries |
| prompt-engineer | Prompt refinement — transforms vague queries into precise, effective legal prompts |

---

## Skills (17)

Skills activate automatically when Claude detects relevant context.

| Skill | Auto-Activates When |
|-------|---------------------|
| swiss-legal-research | Legal research queries, BGE/ATF/DTF references |
| swiss-legal-drafting | Document creation, contract drafting requests |
| swiss-legal-strategy | Litigation planning, risk assessment questions |
| swiss-legal-translation | Translation requests between DE/FR/IT/EN legal texts |
| swiss-document-analysis | Legal document review, clause analysis, NDA triage |
| swiss-citation-formats | Citation formatting, BGE/ATF/DTF references in text |
| citation-content-verify | Substantive check that citations exist AND support the claim (pre-delivery gate) |
| legal-chronology | Case chronology from documents: sourced events, contested facts, date conflicts, gaps, deadlines |
| adversarial-analysis | Three-agent adversarial legal analysis requests |
| data-protection-law | DSG/FADP, GDPR adequacy, privacy compliance questions |
| compliance-frameworks | FINMA, AML/KYC, financial regulatory compliance |
| privacy-routing | Sensitive client data patterns detected (Anwaltsgeheimnis) |
| legal-intake | Complex queries needing structured intake or refinement before execution |
| legal-5step-framework | End-to-end 5-step legal analysis pipeline |
| legal-evaluator | Verdict engine for /legal-loop worker-evaluator cycles |
| legal-wayfinder | Decision-map decomposition for matters too big or foggy for one session |
| shared (output-conventions) | Deliverable-as-file output conventions for all commands |

---

## MCP Servers (10)

| Server | Purpose | Transport |
|--------|---------|-----------|
| entscheidsuche | Swiss court decision search (Bundesgericht + cantonal courts) | HTTP |
| bge-search | Federal Supreme Court decision search and validation | HTTP |
| legal-citations | Citation verification and multi-lingual formatting | HTTP |
| fedlex-sparql | Swiss federal legislation database queries | HTTP |
| onlinekommentar | Swiss legal commentary access | HTTP |
| legal-persona | Swiss judicial personas — profiles, voting patterns, doctrinal positions | HTTP |
| tas-jurisprudence | CAS/TAS sports arbitration awards and jurisprudence | HTTP |
| workflows-ch | Custom workflow definitions: validation, persistence, run logging | HTTP |
| swiss-caselaw | Case law search, citation graphs, appeal chains, doctrine (opencaselaw.ch) | SSE |
| ollama | Local privacy classification for privileged content | Local |

---

## Usage Examples

### Research
```
/bettercallclaude:research Art. 97 OR contractual liability precedents
```

### Strategy
```
/bettercallclaude:strategy CHF 500,000 breach of contract, Zurich Commercial Court
```

### Drafting
```
/bettercallclaude:draft Service agreement, 12 months, IP transfer clause
```

### Full Workflow
```
/bettercallclaude:workflow --template litigation-prep "Art. 97 OR breach, CHF 300,000"
```

### Adversarial Analysis
```
/bettercallclaude:adversarial Tenant claims landlord breached Art. 259a OR
```

### Briefing Session
```
/bettercallclaude:briefing "Prepare full litigation for Art. 97 OR breach, CHF 500K, Zurich"
/bettercallclaude:briefing --resume brief_20260225_contract
/bettercallclaude:briefing --list
```

### Prompt Refinement (when queries aren't getting good results)
```
/bettercallclaude:legal --refine "my tenant is not paying"
# → Asks clarifying questions, then reformulates into:
# "Art. 257d OR -- Mietzinsrückstand, Kündigung und fristlose Räumung,
#  Kanton Zürich, Vermieterperspektive, Forschungsantwort gewünscht"
```

### Multi-Lingual
```
/bettercallclaude:research art. 97 CO violation de contrat
/bettercallclaude:translate @vertrag.md --to fr
```

---

## Tips

1. Be specific: "Art. 97 OR foreseeability" is better than "contract damages".
2. Include citations: Reference articles and BGE numbers when you have them.
3. Specify jurisdiction: Mention the canton for cantonal law questions.
4. Choose language: Query in your preferred language (DE/FR/IT/EN).
5. Use workflows: For complex matters, let the gateway coordinate multiple agents.

---

**BetterCallClaude v4.11.5 -- Swiss Legal Intelligence for Cowork Desktop**

If the user provided additional input, respond to it in the context of this help reference.

## User Query

$ARGUMENTS
