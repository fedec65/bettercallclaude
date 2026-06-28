---
description: "Show complete BetterCallClaude command reference, available agents, skills, and usage examples"
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

## Commands (24)

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
| `/bettercallclaude:doc-analyze` | Analyze legal documents: issues, clauses, citations, compliance (playbook-aware) |
| `/bettercallclaude:nda-triage` | Triage NDAs: GREEN/YELLOW/RED against Swiss law and playbook thresholds (single or batch) |
| `/bettercallclaude:precedent` | Search and analyze BGE precedent chains and evolution |
| `/bettercallclaude:validate` | Batch validate Swiss legal citations for format and existence |
| `/bettercallclaude:adversarial` | Three-agent adversarial analysis: advocate, adversary, judge |

### Workflow Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:workflow` | Define and execute multi-agent pipelines |
| `/bettercallclaude:briefing` | Structured pre-execution briefing with specialist panel and plan building |
| `/bettercallclaude:translate` | Translate legal documents between DE, FR, IT, EN |
| `/bettercallclaude:legal-goal` | Define a checkable legal success condition (profile or free-text) for iterative verification |
| `/bettercallclaude:legal-loop` | Run worker-evaluator iteration cycle against a Goal Record until success or stop limit |

### Onboarding & Diagnostics

| Command | Description |
|---------|-------------|
| `/bettercallclaude:start` | Welcome and onboarding — checks connectivity, guides playbook creation, shows usage examples |
| `/bettercallclaude:doctor` | Diagnose MCP server connectivity — tests each server, reports status and impact |

### Reference Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:cite` | Format and verify individual Swiss legal citations |
| `/bettercallclaude:setup` | ⚠ Alias for `/start` — will be removed in v5.0 |
| `/bettercallclaude:refine` | Refine vague legal queries into precise, effective prompts |
| `/bettercallclaude:version` | Display plugin version, components, and system status |
| `/bettercallclaude:summarize` | Consolidate multi-agent pipeline output with length control (--short/--medium/--long) |
| `/bettercallclaude:legal-5step` | Execute the 5-step end-to-end Swiss legal framework: intake → research → strategy → adversarial → draft |
| `/bettercallclaude:privacy` | View or change the privacy mode (strict/balanced/cloud) |
| `/bettercallclaude:help` | This command reference |

---

## Agents (20)

### Core Pipeline Agents

| Agent | Domain |
|-------|--------|
| researcher | Swiss legal research, BGE/ATF/DTF search, statutory analysis |
| strategist | Litigation strategy, risk assessment, cost-benefit analysis |
| drafter | Legal document drafting in Swiss format |
| citation | BGE citation verification and multi-lingual formatting |
| compliance | FINMA, AML/KYC, regulatory compliance checks |

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

## Skills (13)

Skills activate automatically when Claude detects relevant context.

| Skill | Auto-Activates When |
|-------|---------------------|
| swiss-legal-research | Legal research queries, BGE/ATF/DTF references, jurisdiction resolution |
| swiss-legal-drafting | Document creation, contract drafting requests |
| swiss-legal-strategy | Litigation planning, risk assessment questions |
| swiss-legal-translation | Translation requests between DE/FR/IT/EN legal texts |
| swiss-document-analysis | Legal document review, clause analysis, compliance checks |
| swiss-citation-formats | Citation formatting, BGE/ATF/DTF references in text |
| adversarial-analysis | Three-agent adversarial legal analysis requests |
| legal-intake | Vague or complex queries — Socratic refinement (single-domain) or structured briefing (multi-domain) |
| legal-evaluator | Verdict engine for /legal-loop — judges artifacts against Goal Records using MCP verification |
| data-protection-law | DSG/FADP, GDPR adequacy, privacy compliance questions |
| compliance-frameworks | FINMA, AML/KYC, financial regulatory compliance |
| privacy-routing | Sensitive client data patterns detected (Anwaltsgeheimnis) |
| legal-5step-framework | Sequential 5-step legal pipeline with quality gates and checkpoints |

---

## MCP Servers (9)

| Server | Purpose | Transport |
|--------|---------|-----------|
| entscheidsuche | Swiss court decision search (Bundesgericht + cantonal courts) | HTTP |
| bge-search | Federal Supreme Court decision search and validation | HTTP |
| legal-citations | Citation verification and multi-lingual formatting | HTTP |
| fedlex-sparql | Swiss federal legislation database queries | HTTP |
| onlinekommentar | Swiss legal commentary access | HTTP |
| legal-persona | Swiss-law document intelligence (strategy, drafting, analysis) | HTTP |
| tas-jurisprudence | CAS/TAS sports arbitration awards and jurisprudence | HTTP |
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

**BetterCallClaude v4.9.0 -- Swiss Legal Intelligence for Cowork Desktop**

If the user provided additional input, respond to it in the context of this help reference.

## User Query

$ARGUMENTS
