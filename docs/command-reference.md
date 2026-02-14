# BetterCallClaude Command Reference

**Complete reference for all `/legal-` commands and hybrid activation system**

---

## Table of Contents

1. [Overview](#overview)
2. [Activation Methods](#activation-methods)
3. [Persona Commands](#persona-commands)
4. [Mode Override Commands](#mode-override-commands)
5. [Command Combinations](#command-combinations)
6. [Multi-Lingual Usage](#multi-lingual-usage)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

BetterCallClaude supports **two activation methods** for maximum flexibility:

| Method | Trigger | Use Case |
|--------|---------|----------|
| **Natural Language** | Legal keywords | Fast, intuitive, everyday use |
| **Explicit Commands** | `/legal-` prefix | Professional assurance, audit trails |

**Both methods activate the same powerful framework** - choose based on your needs.

---

## Activation Methods

### Natural Language (Auto-Detection)

**How it works**: Framework automatically detects legal keywords and activates personas

**Trigger Keywords**:
- Research: "search BGE", "find precedents", "Art. X", "relevant case law"
- Strategy: "case strategy", "litigation approach", "settlement value"
- Drafting: "draft contract", "legal opinion", "prepare brief"

**Example**:
```
Query: "Search BGE for Art. 97 OR contractual liability cases"

Result:
🎭 Persona: Legal Researcher [auto-detected]
📖 Mode: Federal Law
🇨🇭 Jurisdiction: Swiss Federal Law

[BGE precedent analysis...]
```

**Advantages**:
- ✅ Fast and intuitive
- ✅ No need to remember commands
- ✅ Natural conversation flow
- ✅ Seamless Claude Code integration

---

### Explicit Commands (Professional Assurance)

**How it works**: Use `/legal-` prefix to explicitly force framework activation

**Available Commands**:
- `/legal-research` - Legal Researcher persona
- `/legal-strategy` - Case Strategist persona
- `/legal-draft` - Legal Drafter persona
- `/legal-federal` - Federal Law Mode
- `/legal-cantonal [ZH|BE|GE|BS|VD|TI]` - Cantonal Law Mode
- `/legal-help` - Command reference

**Example**:
```
Query: /legal-research Art. 97 OR contractual liability

Result:
🎭 Persona: Legal Researcher (/legal-research activated)
📖 Mode: Federal Law
🇨🇭 Jurisdiction: Swiss Federal Law
⚡ Activation: Explicit command override

[BGE precedent analysis...]
```

**Advantages**:
- ✅ Professional assurance - explicit framework activation
- ✅ Audit trail - documented in deliverables
- ✅ Override ambiguity - force specific mode
- ✅ Client confidence - demonstrate framework usage
- ✅ Mixed sessions - toggle legal/general work

---

## Persona Commands

### `/legal-research` - Legal Researcher

**Activates**: Legal Researcher persona for precedent research and statutory analysis

**Capabilities**:
- BGE/ATF/DTF precedent search and analysis
- Swiss statutory analysis (ZGB, OR, StGB, StPO, ZPO, BV)
- Multi-lingual legal research (DE/FR/IT/EN)
- Citation verification and formatting

**Usage**:
```bash
# Basic research
/legal-research Art. 97 OR contractual liability

# BGE precedent search
/legal-research BGE precedents on foreseeability under Art. 99 OR

# Multi-lingual research
/legal-research ATF sur la responsabilité contractuelle (art. 97 CO)

# Cantonal research
/legal-research Zürich court decisions on commercial disputes
```

**Response Format**:
```
🎭 Persona: Legal Researcher (/legal-research activated)
📖 Mode: [Federal Law | Cantonal Law | Multi-Lingual]
🇨🇭 Jurisdiction: [Swiss Federal | Canton Name]

[Legal research with proper Swiss legal framework...]
```

**MCP Servers Active**:
- entscheidsuche (court decision search)
- legal-citations (citation verification)
- sequential-thinking (complex legal reasoning)

**Related Workflows**: [Research Precedents Tutorial](workflows/research-precedents.md)

---

### `/legal-strategy` - Case Strategist

**Activates**: Case Strategist persona for litigation planning and risk assessment

**Capabilities**:
- Litigation strategy development
- Evidence-based risk probability assessment
- Procedural strategy analysis (ZPO federal + cantonal)
- Settlement value calculation
- Cost-benefit analysis

**Usage**:
```bash
# Basic strategy analysis
/legal-strategy Analyze breach of contract case, CHF 500,000 damages

# Risk assessment
/legal-strategy Assess chances of success: written contract, 3-month delay, force majeure defense

# Procedural planning
/legal-strategy What procedural options in Zürich Commercial Court, CHF 500,000 claim

# Settlement calculation
/legal-strategy Calculate settlement range: 65% success probability, CHF 75,000 litigation costs
```

**Response Format**:
```
🎭 Persona: Case Strategist (/legal-strategy activated)
📖 Mode: [Federal Law + Cantonal Law | Specific Canton]
⚖️ Analysis Type: [Strategic Assessment | Risk Analysis | Procedural Planning]

[Strategic analysis with quantified probabilities and recommendations...]
```

**Analysis Frameworks**:
- Risk probability assessment (probability tree analysis)
- Procedural strategy (ZPO federal + cantonal)
- Settlement analysis (economic + non-economic factors)
- Evidence evaluation (strengths/weaknesses scoring)

**Related Workflows**: [Case Strategy Tutorial](workflows/case-strategy.md)

---

### `/legal-draft` - Legal Drafter

**Activates**: Legal Drafter persona for Swiss-standard document creation

**Capabilities**:
- Contract drafting under Swiss OR
- Court submissions (complaints, responses, appeals)
- Legal opinions and memoranda
- Multi-lingual document creation (DE/FR/IT/EN)

**Usage**:
```bash
# Contract drafting
/legal-draft Service agreement under Swiss OR, 6 months, CHF 150,000, IP transfer

# Court submission
/legal-draft Complaint for Zürich Commercial Court, breach of contract Art. 97 OR, CHF 500,000

# Legal opinion
/legal-draft Legal opinion on liability under Art. 41 OR for product defect case

# Multi-lingual document
/legal-draft Contrat de service en français selon CO suisse
```

**Response Format**:
```
🎭 Persona: Legal Drafter (/legal-draft activated)
📖 Mode: [Federal Law | Cantonal Law | Multi-Lingual]
📄 Document Type: [Contract | Court Submission | Legal Opinion]
🇨🇭 Jurisdiction: [Swiss Federal | Canton Name]

[Professional legal document with proper Swiss formatting...]
```

**Document Types Supported**:
- **Contracts**: Service agreements, sales contracts, lease agreements, employment contracts, NDAs
- **Court Submissions**: Complaints, responses, appeals, motions, evidence submissions
- **Legal Documents**: Legal opinions, memoranda, demand letters, settlement agreements

**Related Workflows**: [Document Drafting Tutorial](workflows/draft-contracts.md)

---

## Mode Override Commands

### `/legal-federal` - Force Federal Law Mode

**Forces**: Swiss federal law analysis exclusively

**Coverage**:
- **Civil Law**: ZGB (Swiss Civil Code), OR (Code of Obligations)
- **Criminal Law**: StGB (Swiss Criminal Code), StPO (Criminal Procedure)
- **Procedural Law**: ZPO (Civil Procedure)
- **Constitutional Law**: BV (Federal Constitution)

**Usage**:
```bash
# Federal statute analysis
/legal-federal
Explain Art. 41 OR unlawful act requirements

# BGE precedent research
/legal-federal
Search BGE for good faith principle (Art. 2 ZGB)

# Constitutional question
/legal-federal
Analyze Art. 9 BV (good faith) in administrative context

# Override mixed signals
/legal-federal
Art. 97 OR liability in Zürich commercial case
(Forces federal OR analysis, ignores Zürich cantonal aspects)
```

**Response Format**:
```
🎭 Persona: [Auto-detected based on query]
📖 Mode: Federal Law (/legal-federal activated)
🇨🇭 Jurisdiction: Swiss Federal Law

[Federal legal analysis with BGE precedents and federal statutes...]
```

**Works With All Personas**:
- Legal Researcher + `/legal-federal` = Federal precedent research
- Case Strategist + `/legal-federal` = Federal law litigation strategy
- Legal Drafter + `/legal-federal` = Federal law document drafting

---

### `/legal-cantonal [CANTON]` - Force Cantonal Law Mode

**Forces**: Specific cantonal law analysis

**Supported Cantons** (v1.0):

| Code | Canton | Language | Legal System |
|------|--------|----------|--------------|
| **ZH** | Zürich | German | Commercial law hub |
| **BE** | Bern | DE/FR | Bilingual, capital |
| **GE** | Genève | French | International law |
| **BS** | Basel-Stadt | German | Pharmaceutical law |
| **VD** | Vaud | French | Western Switzerland |
| **TI** | Ticino | Italian | Southern Switzerland |

**Usage**:
```bash
# Zürich cantonal law
/legal-cantonal ZH
Court fees for commercial litigation in Zürich

# Geneva cantonal procedure (French)
/legal-cantonal GE
Procédure de référé au Tribunal de première instance de Genève

# Ticino cantonal law (Italian)
/legal-cantonal TI
Procedura civile presso il Tribunale di Lugano

# Bern bilingual analysis
/legal-cantonal BE
Gerichtsgebühren im Kanton Bern / Frais de justice dans le canton de Berne
```

**Response Format**:
```
🎭 Persona: [Auto-detected based on query]
📖 Mode: Cantonal Law (/legal-cantonal [CANTON] activated)
🏛️ Canton: [Canton Name]
🌐 Language: [Primary canton language]

[Cantonal legal analysis with cantonal court decisions and regulations...]
```

**Hybrid Analysis**:
Federal substantive law + Cantonal procedure is supported:
```
/legal-cantonal ZH
Art. 97 OR breach of contract litigation in Zürich Commercial Court

Result: Federal OR law (Art. 97) + Zürich cantonal procedure (ZPO implementation)
```

---

## Command Combinations

### Sequential Commands

Combine persona and mode commands for precise control:

```bash
# Example 1: Federal Research
/legal-federal
/legal-research BGE on Art. 97 OR contractual liability

# Example 2: Zürich Strategy
/legal-cantonal ZH
/legal-strategy Commercial litigation options in Handelsgericht

# Example 3: Geneva Drafting (French)
/legal-cantonal GE
/legal-draft Complaint for Tribunal de première instance
```

### Mixed Workflows

Toggle between explicit commands and natural language:

```bash
# Start with explicit command for audit trail
/legal-research Art. 97 OR

[Receives BGE list...]

# Continue naturally for follow-up
"Explain the key holding in BGE 144 III 93"

[Natural language continues in same mode]

# Use explicit command to switch modes
/legal-cantonal ZH
How does this apply in Zürich jurisdiction?
```

---

## Multi-Lingual Usage

All commands work seamlessly in **DE/FR/IT/EN**:

### German Commands
```bash
/legal-research Art. 97 OR Vertragsverletzung
/legal-strategy Breach of Contract Fall, CHF 500'000 Schadensersatz
/legal-draft Dienstleistungsvertrag gemäss OR
```

### French Commands
```bash
/legal-research art. 97 CO violation de contrat
/legal-strategy Analyse de stratégie pour violation de contrat, CHF 500'000
/legal-draft Contrat de service selon CO suisse
```

### Italian Commands
```bash
/legal-research art. 97 CO violazione del contratto
/legal-strategy Analisi strategica per violazione contrattuale, CHF 500'000
/legal-draft Contratto di servizio secondo CO svizzero
```

### English Commands
```bash
/legal-research Art. 97 OR breach of contract
/legal-strategy Analyze breach of contract case, CHF 500,000 damages
/legal-draft Service agreement under Swiss OR
```

**Citation Formats Adapt**:
- German: Art. 1 Abs. 2 OR | BGE 145 III 229
- French: art. 1 al. 2 CO | ATF 145 III 229
- Italian: art. 1 cpv. 2 CO | DTF 145 III 229
- English: Art. 1 para. 2 OR | BGE 145 III 229

---

## Examples

### Example 1: Complete Research Workflow

```bash
# Step 1: Explicit research activation
/legal-research Art. 97 OR contractual liability

Response:
🎭 Persona: Legal Researcher (/legal-research activated)
📖 Mode: Federal Law
BGE Precedents on Art. 97 OR:
1. BGE 144 III 93 - Foreseeability requirement...
2. BGE 142 III 102 - Burden of proof...

# Step 2: Natural follow-up
"Explain the key holding in BGE 144 III 93"

Response:
[Detailed analysis of BGE 144 III 93...]

# Step 3: Compare precedents
"How does BGE 144 III 93 compare to BGE 140 III 86?"

Response:
[Comparative analysis...]
```

### Example 2: Litigation Strategy Development

```bash
# Step 1: Explicit strategy activation
/legal-strategy Breach of contract case:
- Written contract, clear delivery deadlines
- Defendant missed deadline by 3 months
- Plaintiff documented CHF 300,000 losses
- Contract silent on liquidated damages
- Defendant claims force majeure (COVID-19)

Response:
🎭 Persona: Case Strategist (/legal-strategy activated)

STRENGTHS & WEAKNESSES ANALYSIS:
✅ STRENGTHS:
1. Clear contractual obligation (9/10)
2. Documented breach (9/10)
3. Damage documentation (7/10)

❌ WEAKNESSES:
1. Foreseeability issue (BGE 144 III 93) (8/10 concern)
2. Force majeure defense (6/10 concern)
...

# Step 2: Risk probability assessment
"Calculate probability of success with expected value"

Response:
RISK PROBABILITY ASSESSMENT:
Liability Established: 63% (90% breach × 70% FM defense fails)
Full Damages Awarded: 40% (50% foreseeability × 80% amount)
Overall Success: 25%
Expected Value: CHF 142,500
Net Expected Value: CHF 67,500-92,500 (after costs)

# Step 3: Settlement analysis
"Calculate appropriate settlement range"

Response:
SETTLEMENT VALUE ANALYSIS:
Maximum Demand: CHF 250,000 (83%)
Target Settlement: CHF 180,000-200,000 (60-67%)
Minimum Acceptable: CHF 125,000 (42%)
Walk-Away Point: CHF 100,000 (33%)
...
```

### Example 3: Document Drafting Workflow

```bash
# Step 1: Explicit drafting activation
/legal-draft Service agreement under Swiss OR:
- Scope: Custom CRM system development
- Duration: 6 months with 2-month extension option
- Compensation: CHF 150,000 milestone-based
- IP rights: Client ownership upon full payment
- Liability: Limited to contract value (Art. 100 OR compliance)
- Governing law: Swiss law, Zürich jurisdiction

Response:
🎭 Persona: Legal Drafter (/legal-draft activated)
📖 Mode: Federal Law
📄 Document Type: Contract

DIENSTLEISTUNGSVERTRAG
(SERVICE AGREEMENT)

§ 1 VERTRAGSGEGENSTAND / SUBJECT MATTER
(Art. 363 ff. OR)
...

§ 5 HAFTUNG / LIABILITY
(Art. 100 OR - Haftungsbeschränkung)
5.1 Die Haftung des Auftragnehmers ist auf den Vertragswert
    (CHF 150,000) beschränkt.
...

# Step 2: Add specific clause
"Add a detailed IP transfer clause compliant with Art. 332 OR"

Response:
§ 6 GEISTIGES EIGENTUM / INTELLECTUAL PROPERTY
(Art. 332 OR - Arbeitnehmererfindungen)
...

# Step 3: Review for enforceability
"Review the liability limitation clause for enforceability under Swiss law"

Response:
LEGAL ANALYSIS: Art. 100 OR Liability Limitation

Enforceability Assessment:
✅ Valid: Contractual liability limitation to contract value
✅ Compliant: Art. 100 Abs. 1 OR permits limitation
⚠️ Exception: Gross negligence and intent excluded (mandatory)
...
```

---

## Troubleshooting

### Command Not Working

**Issue**: Command doesn't activate framework

**Solutions**:
1. Check syntax: `/legal-research` not `/legal research` (no space after colon)
2. Verify canton code: Valid codes are ZH, BE, GE, BS, VD, TI
3. Ensure command is on new line or at start of message

**Example**:
```bash
❌ Wrong: /legal research Art. 97 OR
✅ Right: /legal-research Art. 97 OR

❌ Wrong: /legal-cantonal ZU  # Invalid canton code
✅ Right: /legal-cantonal ZH
```

### Auto-Detection Not Activating

**Issue**: Natural language doesn't trigger persona

**Solutions**:
1. Use explicit command: `/legal-research` to force activation
2. Include legal keywords: "BGE", "Art. X", "precedent", "contract"
3. Be more specific with legal terminology

**Example**:
```bash
❌ Vague: "Tell me about contracts"
✅ Specific: "Search BGE for Art. 97 OR contract liability cases"

Or use explicit command:
✅ /legal-research contracts
```

### Wrong Persona Activated

**Issue**: Auto-detection activates wrong persona

**Solutions**:
1. Use explicit command to override: `/legal-strategy` instead of relying on auto-detection
2. Combine with mode override if needed: `/legal-federal` then `/legal-research`

**Example**:
```bash
# If auto-detection unclear, be explicit:
/legal-strategy Analyze litigation approach for...
```

### Mixed Language Issues

**Issue**: Response in unexpected language

**Solutions**:
1. Explicitly state preferred language in query
2. Use cantonal command for language context: `/legal-cantonal GE` for French
3. Query in preferred language consistently

**Example**:
```bash
# Force French with Geneva canton
/legal-cantonal GE
Analyse juridique en français...

# Or state explicitly
/legal-research (in French) art. 97 CO
```

---

## Quick Reference Card

| Command | Activates | Use Case |
|---------|-----------|----------|
| `/legal-research` | Legal Researcher | BGE search, statutory analysis |
| `/legal-strategy` | Case Strategist | Litigation planning, risk assessment |
| `/legal-draft` | Legal Drafter | Contracts, court submissions |
| `/legal-federal` | Federal Law Mode | Force federal law exclusively |
| `/legal-cantonal [ZH\|BE\|GE\|BS\|VD\|TI]` | Cantonal Law Mode | Force specific canton law |
| `/legal-help` | Help System | Show this reference |

---

## Additional Resources

- **Getting Started Guide**: [docs/getting-started.md](getting-started.md)
- **Research Workflow**: [docs/workflows/research-precedents.md](workflows/research-precedents.md)
- **Strategy Workflow**: [docs/workflows/case-strategy.md](workflows/case-strategy.md)
- **Drafting Workflow**: [docs/workflows/draft-contracts.md](workflows/draft-contracts.md)
- **Framework Configuration**: [.claude/BETTERASK.md](../.claude/BETTERASK.md)
- **Command Files**: [.claude/commands/](../.claude/commands/)

---

**BetterCallClaude v1.0.0-alpha - Professional Legal Intelligence Framework**

For support: [GitHub Issues](https://github.com/yourusername/bettercallclaude/issues)
