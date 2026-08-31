---
name: legal-5step-framework
description: "End-to-end 5-step Swiss legal pipeline: (1) intake/fact extraction, (2) BGE/statute research, (3) strategy/risk assessment, (4) adversarial stress test, (5) verified document drafting. Trigger when: user asks for full analysis, 'run all steps', 'full pipeline', or 'end-to-end'. Do NOT trigger for: single-step tasks (use individual commands), citation-only work, or translation. Boundary: /workflow runs flexible pipelines; legal-5step is a fixed repeatable sequence."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_entscheidsuche__find_similar_cases
  - mcp__entscheidsuche__find_similar_cases
  - mcp__plugin_bettercallclaude_entscheidsuche__analyze_precedent_success_rate
  - mcp__entscheidsuche__analyze_precedent_success_rate
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_erwaegung
  - mcp__swiss-caselaw__get_erwaegung
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_citations
  - mcp__swiss-caselaw__find_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_law
  - mcp__swiss-caselaw__get_law
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__swiss-caselaw__cite
---

# BetterCallClaude 5-Step Legal Framework

You coordinate the BetterCallClaude 5-step Swiss legal pipeline. Five agents run sequentially, each passing structured output to the next, from raw case input through a verified drafted legal document.

## Framework

```
INTAKE → RESEARCH → STRATEGY → ADVERSARIAL → DRAFT
  (1)       (2)        (3)          (4)         (5)
```

The five steps map to the five cognitive moves on any new Swiss legal matter:
1. What are the facts and issues?
2. What does the law say?
3. What should we do?
4. Are we right?
5. How do we say it?

## Step Definitions

### Step 1: INTAKE
**Agent**: doc-analyzer | **Skill**: `swiss-legal-research` (jurisdiction resolution), `privacy-routing`

Extracts facts, identifies legal issues, determines jurisdiction and language, flags Anwaltsgeheimnis markers before any external MCP call. Privilege flag propagates through Steps 2–5.

**Output**:
- Structured fact list
- Legal issues ranked by relevance
- Jurisdiction: federal or cantonal (XX)
- Language: DE/FR/IT/EN
- Privilege flag: true/false

### Step 2: RESEARCH
**Agent**: researcher | **Skill**: `swiss-legal-research`  
**MCP servers**: `swiss-caselaw`, `bge-search`, `entscheidsuche`, `fedlex-sparql`, `onlinekommentar`

Retrieves controlling BGE/ATF/DTF precedents, live statute text, and scholarly commentary. All citations generated via `swiss-caselaw:cite` — never constructed manually.

**Output**:
- Research memorandum with verified citations
- Statute text retrieved live from `fedlex-sparql` or `swiss-caselaw:get_law`
- Doctrine from `onlinekommentar`

**Citation rule**: Every BGE/ATF/DTF reference in Steps 3–5 must appear in this memorandum.

### Step 3: STRATEGY
**Agent**: strategist + risk-analyst | **Skill**: `swiss-legal-strategy`  
**MCP tools**: `entscheidsuche:analyze_precedent_success_rate`, `entscheidsuche:find_similar_cases`

Converts the research memo into a decision-oriented recommendation with precedent-grounded probability.

**Output**:
- Claim strength: Strong / Moderate / Weak
- Success probability: X% (grounded in `analyze_precedent_success_rate`)
- Procedural pathway: ZPO track, forum, timeline
- Risk matrix: Critical / Moderate / Minor
- Settlement range and BATNA
- Recommendation: litigate / settle / ADR

**Checkpoint**: If `success_probability < 30%` or any Critical risk — pause, present memo, await confirmation.

### Step 4: ADVERSARIAL
**Agent**: advocate + adversary + judicial-analyst | **Skill**: `adversarial-analysis`  
**MCP tools**: `swiss-caselaw:find_citations`, `swiss-caselaw:get_erwaegung`, `bge-search`

Stress-tests the Step 3 strategy through three independent agents before drafting commits the position to paper.

**Output**:
- AdvocateReport: strongest case FOR, with BGE support
- AdversaryReport: systematic challenge with counter-precedents
- JudicialSynthesis: Erwägung-style balanced conclusion with probability scores
- strategy_delta: % change from Step 3 estimate

**Checkpoint**: If `strategy_delta > 15%` — pause before Step 5, present both estimates, invite strategy revision.

### Step 5: DRAFT
**Agent**: drafter + citation-specialist | **Skill**: `swiss-legal-drafting`, `swiss-citation-formats`  
**MCP tools**: `swiss-caselaw:cite`, `legal-citations` (format validation)

Produces the legal document from the confirmed position. No new legal arguments introduced — everything traces to Step 2.

**Document selection**:

| Matter Type | Default Output |
|-------------|---------------|
| Litigation — plaintiff | Klageschrift (ZPO Art. 221) |
| Litigation — defendant | Klageantwort (ZPO Art. 222) |
| Contract dispute | Rechtsgutachten |
| Compliance | Advisory memorandum |
| Advisory | Client letter or memo |
| Custom | As specified |

**Citation formats by language**:

| Language | BGE | Article | Paragraph |
|----------|-----|---------|-----------|
| DE | BGE 147 III 265 E. 3.1 | Art. 97 Abs. 1 OR | Abs. |
| FR | ATF 147 III 265 consid. 3.1 | art. 97 al. 1 CO | al. |
| IT | DTF 147 III 265 consid. 3.1 | art. 97 cpv. 1 CO | cpv. |
| EN | BGE 147 III 265 at 3.1 | Art. 97(1) OR | para. |

## Data Flow

```
Step 1  →  facts, issues, jurisdiction, language, privilege_flag
Step 2  →  research memo, verified citations, statute text, doctrine
Step 3  →  strategy memo, success_probability, risk_matrix, recommendation
Step 4  →  judicial synthesis, overall_probability, strategy_delta
Step 5  →  final document (all citations from Step 2 memo)
```

## Quality Gates

| Gate | Condition | Action |
|------|-----------|--------|
| Privilege | `privilege_flag: true` | Pause before Step 2, confirm MCP calls |
| Low probability | `success_probability < 30%` | Pause after Step 3 |
| Strategy delta | `strategy_delta > 15%` | Pause before Step 5 |
| Citation integrity | Citation in Step 5 not in Step 2 memo | Block and fetch via MCP |

## Professional Disclaimer

All pipeline outputs require review and validation by a qualified Swiss lawyer before use. This framework does not constitute legal advice. Lawyers maintain full professional responsibility for all legal work products.
