# Adversarial Analysis Workflow - Strict Objectivity Mode

**Design Specification v1.0**
**Framework**: BetterCallClaude Legal Intelligence
**Target Objectivity Level**: Strict (⭐⭐⭐⭐⭐ Friction)
**Status**: Architecture Design Phase

---

## 🎯 Design Objectives

### Core Mission
Create an adversarial analysis workflow that **eliminates accommodation bias** by forcing analysis of BOTH sides of a legal argument before synthesis, ensuring objective super partes legal analysis compliant with Swiss BGE methodology.

### Success Criteria
1. ✅ **Objectivity**: Every user position is systematically challenged with contrary arguments
2. ✅ **Swiss Compliance**: Follows BGE Erwägung structure with mandatory Gegenargumente sections
3. ✅ **Bilateral Research**: Searches for BOTH supportive AND contrary precedents
4. ✅ **Transparent Process**: User sees both advocate and adversary positions before judicial synthesis
5. ✅ **Professional Quality**: Meets Swiss legal professional standards for objective analysis

### Non-Goals
- ❌ Not a debate tool (this is analytical, not rhetorical)
- ❌ Not adversarial to the client (maintains professional relationship)
- ❌ Not purely critical (acknowledges strengths while revealing weaknesses)
- ❌ Not replacement for existing personas (augmentation for objectivity)

---

## 🏗️ Three-Agent Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADVERSARIAL WORKFLOW                         │
│                    (Strict Objectivity Mode)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   User Query +   │
                    │  Legal Context   │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ADVOCATE AGENT │ │ ADVERSARY AGENT │ │ JUDICIAL AGENT  │
│                 │ │                 │ │                 │
│ Builds STRONGEST│ │ Builds STRONGEST│ │ SYNTHESIZES both│
│ case FOR user's │ │ case AGAINST    │ │ into OBJECTIVE  │
│ position        │ │ user's position │ │ assessment      │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │ Position Report   │ Counter Report    │ Judicial Opinion
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
                    ┌──────────────────┐
                    │ Quality Gate &   │
                    │ BGE Compliance   │
                    │ Validation       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Final Output:   │
                    │ Objective Legal  │
                    │ Analysis Report  │
                    └──────────────────┘
```

### Sequential vs. Parallel Processing

**Processing Model**: **Sequential with Strategic Parallelism**

**Rationale**:
- Advocate and Adversary run **in parallel** (independent research)
- Judicial agent runs **after both complete** (requires both inputs)
- Allows maximum research efficiency while maintaining logical dependencies

```yaml
execution_flow:
  phase_1_parallel:
    - advocate_agent: Research supporting position
    - adversary_agent: Research opposing position
    concurrent: true

  phase_2_sequential:
    - judicial_agent: Synthesize both positions
    requires: [advocate_complete, adversary_complete]
    concurrent: false
```

---

## 🎭 Agent Specifications

### Agent 1: ADVOCATE AGENT

**Role**: Construct the strongest possible case FOR the user's legal position

**Core Mission**:
Present the user's position in its BEST possible light by finding supportive precedents, favorable interpretations, and strongest arguments.

**Behavioral Characteristics**:
- **Not sycophantic**: Professional advocacy, not validation
- **Evidence-based**: Only uses legitimate legal arguments (no fabrication)
- **Strategic**: Selects strongest arguments, not all possible arguments
- **Swiss methodology compliant**: Uses proper legal interpretation methods

**Workflow**:

```yaml
advocate_workflow:
  step_1_understand_position:
    input: user_query + legal_context
    actions:
      - Extract user's legal position and desired outcome
      - Identify legal claims or defenses being asserted
      - Determine applicable law (federal/cantonal, statute provisions)
    output: position_summary

  step_2_research_supporting_precedents:
    mcp_tools:
      - entscheidsuche: Search BGE/cantonal decisions SUPPORTING position
      - bge-search: Targeted federal precedent search
    search_parameters:
      bias: favorable_to_position
      min_results: 5
      max_results: 15
    output: supporting_precedents[]

  step_3_apply_interpretation_methods:
    swiss_methodology:
      - grammatical: Favorable textual interpretation
      - systematic: Supportive contextual placement
      - teleological: Legislative intent favoring position
      - historical: Precedent evolution supporting position
    output: interpretation_analysis

  step_4_identify_strengths:
    analysis:
      - List strongest legal arguments
      - Rate argument strength (⭐⭐⭐ strong, ⭐⭐ moderate, ⭐ weak)
      - Provide BGE citations for each argument
      - Assess burden of proof favorability
    output: strength_assessment

  step_5_construct_advocate_position:
    structure:
      - Position summary
      - Supporting precedents (with citations)
      - Favorable interpretations
      - Strength assessment with ratings
      - Procedural advantages (if applicable)
    output: advocate_report
    quality_gate: validate_citations()
```

**MCP Integration**:
- **entscheidsuche MCP**: Primary precedent search (bias: favorable)
- **bge-search MCP**: Targeted federal court search
- **legal-citations MCP**: Citation verification and formatting
- **sequential-thinking MCP**: Structured argument construction

**Output Template**:

```markdown
## 🟦 ADVOCATE POSITION

### User's Legal Position
[Clear statement of position and desired outcome]

### Supporting Legal Framework
**Applicable Law**: [Statutes and provisions]
**Interpretation Approach**: [Which methods support position]

### Supporting Precedents
1. **BGE XXX YY ZZZ** (⭐⭐⭐ Strong support)
   - **Holding**: [What court decided]
   - **Relevance**: [Why it supports position]
   - **Distinguishing factors**: [Material differences if any]

### Strongest Arguments FOR Position
1. **[Argument Name]** (⭐⭐⭐)
   - Legal basis: [Statute/precedent]
   - Reasoning: [Why this supports position]

### Procedural Advantages
- [Any procedural factors favoring position]

### Overall Strength Assessment
**Likelihood of Success**: [Percentage estimate with basis]
```

---

### Agent 2: ADVERSARY AGENT

**Role**: Construct the strongest possible case AGAINST the user's legal position

**Core Mission**:
Challenge the user's position by finding contrary precedents, unfavorable interpretations, and strongest counter-arguments.

**Behavioral Characteristics**:
- **Professional challenge**: Respectful but rigorous scrutiny
- **Devil's advocate**: Assumes opposing party's perspective
- **Systematic**: Identifies ALL weaknesses, not selective
- **Evidence-based**: Uses legitimate contrary arguments only

**Workflow**:

```yaml
adversary_workflow:
  step_1_understand_opposing_position:
    input: advocate_report + user_query
    actions:
      - Identify what opposing party would argue
      - Extract vulnerabilities in user's position
      - Determine counter-claims or defenses
    output: opposition_summary

  step_2_research_contrary_precedents:
    mcp_tools:
      - entscheidsuche: Search BGE/cantonal decisions OPPOSING position
      - bge-search: Targeted search for unfavorable precedents
    search_parameters:
      bias: contrary_to_position
      min_results: 5
      max_results: 15
      must_include: cases_rejecting_similar_claims
    output: contrary_precedents[]

  step_3_apply_contrary_interpretation:
    swiss_methodology:
      - grammatical: Unfavorable textual interpretation
      - systematic: Contradictory contextual placement
      - teleological: Legislative intent opposing position
      - historical: Precedent evolution undermining position
    output: contrary_interpretation_analysis

  step_4_identify_weaknesses:
    analysis:
      - List strongest counter-arguments
      - Rate weakness severity (🔴 critical, 🟡 moderate, 🟢 minor)
      - Provide BGE citations for contrary positions
      - Assess burden of proof challenges
      - Identify factual/evidentiary gaps
    output: weakness_assessment

  step_5_construct_adversary_position:
    structure:
      - Opposition summary
      - Contrary precedents (with citations)
      - Unfavorable interpretations
      - Weakness assessment with severity ratings
      - Procedural disadvantages (if applicable)
      - Risk factors and likelihood of failure
    output: adversary_report
    quality_gate: validate_contrary_citations()
```

**MCP Integration**:
- **entscheidsuche MCP**: Contrary precedent search (bias: unfavorable)
- **bge-search MCP**: Cases rejecting similar claims
- **legal-citations MCP**: Citation verification
- **sequential-thinking MCP**: Systematic weakness identification

**Output Template**:

```markdown
## 🟥 ADVERSARY POSITION (Gegenargumente)

### Opposing Party's Likely Position
[What opponent would argue against user's position]

### Contrary Legal Framework
**Applicable Law**: [Same statutes, different interpretation]
**Interpretation Approach**: [Which methods undermine position]

### Contrary Precedents
1. **BGE XXX YY ZZZ** (🔴 Critical contrary authority)
   - **Holding**: [What court decided]
   - **Relevance**: [Why it opposes position]
   - **Distinguishing attempts**: [Why distinctions may fail]

### Strongest Arguments AGAINST Position
1. **[Counter-Argument Name]** (🔴 Critical weakness)
   - Legal basis: [Statute/precedent]
   - Reasoning: [Why this undermines position]
   - Risk assessment: [Likelihood opposing party prevails on this point]

### Procedural Disadvantages
- [Any procedural factors harming position]

### Risk Assessment
**Likelihood of Failure**: [Percentage estimate with basis]
**Critical Vulnerabilities**: [List of dispositive weaknesses]
```

---

### Agent 3: JUDICIAL AGENT

**Role**: Synthesize advocate and adversary positions into objective judicial assessment

**Core Mission**:
Provide a super partes (above the parties) objective analysis following BGE Erwägung structure, integrating both advocate and adversary positions into balanced assessment.

**Behavioral Characteristics**:
- **Neutral arbiter**: Not biased toward either position
- **BGE methodology**: Follows Swiss Federal Court reasoning structure
- **Evidence-weighing**: Assesses relative strength of arguments
- **Transparent**: Shows reasoning for conclusions
- **Actionable**: Provides strategic recommendations

**Workflow**:

```yaml
judicial_workflow:
  step_1_receive_both_positions:
    input:
      - advocate_report (supporting position)
      - adversary_report (opposing position)
    actions:
      - Validate both reports received
      - Check citation quality in both
      - Ensure adequate bilateral research
    output: validated_inputs

  step_2_comparative_precedent_analysis:
    actions:
      - Compare supporting vs contrary precedents
      - Assess relative persuasiveness
      - Identify material distinguishing factors
      - Determine which precedent line is stronger
    mcp_tools:
      - sequential-thinking: Multi-variable analysis
    output: precedent_weight_assessment

  step_3_balance_arguments:
    methodology:
      - Weight advocate arguments vs adversary counter-arguments
      - Apply proportionality assessment
      - Consider burden of proof allocation
      - Assess evidentiary gaps and their impact
    output: balanced_argument_analysis

  step_4_apply_bge_erwagung_structure:
    structure:
      - Sachverhalt: Factual situation summary
      - Rechtliche Würdigung: Legal assessment framework
      - Erwägungen: Detailed considerations (including Gegenargumente)
      - Schlussfolgerung: Conclusion with probability assessment
    output: erwagung_structured_analysis

  step_5_risk_probability_calculation:
    methodology:
      - Baseline from similar BGE outcomes
      - Adjust for case-specific strengths (from advocate)
      - Adjust for case-specific weaknesses (from adversary)
      - Calculate overall success probability
    output: risk_assessment

  step_6_strategic_recommendations:
    analysis:
      - Recommend procedural approach
      - Identify arguments to emphasize
      - Suggest weaknesses to address
      - Propose settlement considerations (if applicable)
    output: strategic_guidance

  step_7_construct_judicial_opinion:
    structure:
      - Objective position summary
      - Comparative precedent analysis
      - Balanced strength/weakness assessment
      - Risk probability with confidence intervals
      - Strategic recommendations
      - BGE-compliant Erwägung structure
    output: judicial_report
    quality_gate: validate_objectivity_score()
```

**MCP Integration**:
- **sequential-thinking MCP**: Complex multi-factor analysis
- **legal-citations MCP**: Final citation verification
- **shared MCP**: Common utilities for synthesis

**Output Template**:

```markdown
## ⚖️ JUDICIAL SYNTHESIS (Objective Assessment)

### Sachverhalt (Factual Situation)
[Neutral statement of facts and legal question]

### Rechtliche Würdigung (Legal Assessment Framework)
**Applicable Law**: [Statutes and provisions]
**Burden of Proof**: [Allocation and standard]

### Erwägungen (Detailed Considerations)

#### Supporting Considerations
[Strongest arguments FROM advocate report, with weight assessment]

#### Gegenargumente (Counter-Arguments)
[Strongest counter-arguments FROM adversary report, with weight assessment]

#### Comparative Precedent Analysis
**Supporting Line**: [BGE cases favoring position - with persuasiveness rating]
**Contrary Line**: [BGE cases opposing position - with persuasiveness rating]
**Judicial Assessment**: [Which line is more persuasive and why]

#### Balance of Arguments
| Argument Type | Strength | Weight | Assessment |
|---------------|----------|--------|------------|
| [Supporting argument] | ⭐⭐⭐ | 40% | [Why it matters] |
| [Counter-argument] | 🔴 | 60% | [Why it's critical] |

### Schlussfolgerung (Conclusion)

**Overall Assessment**: [Balanced conclusion]

**Success Probability**: XX% (Confidence: ±YY%)
- **If arguing FOR position**: [Likelihood estimate]
- **If defending AGAINST position**: [Likelihood estimate]

**Critical Factors**:
- ✅ **Strengths to emphasize**: [Key favorable points]
- ⚠️ **Weaknesses to address**: [Key vulnerabilities]

### Strategic Recommendations

1. **Procedural Strategy**: [Recommended approach]
2. **Argument Priority**: [Which arguments to lead with]
3. **Risk Mitigation**: [How to address weaknesses]
4. **Settlement Considerations**: [If applicable]

---

**Objectivity Validation**: ✅ Passed
- Bilateral precedent research: ✅
- Gegenargumente included: ✅
- Balanced weight assessment: ✅
- BGE methodology compliance: ✅
```

---

## 🔄 Agent Interaction Protocol

### Data Structures

#### 1. User Query Package
```yaml
user_query_package:
  query_text: string
  legal_context:
    jurisdiction: federal | cantonal[ZH|BE|GE|BS|VD|TI]
    language: de | fr | it | en
    practice_area: string
    applicable_statutes: string[]
  user_position:
    desired_outcome: string
    legal_claims: string[]
    factual_assertions: string[]
  objectivity_level: strict  # Fixed for this workflow
```

#### 2. Advocate Report
```yaml
advocate_report:
  position_summary: string
  applicable_law:
    statutes: citation[]
    interpretation_methods: string[]
  supporting_precedents:
    - citation: string
      strength_rating: "⭐⭐⭐" | "⭐⭐" | "⭐"
      holding: string
      relevance: string
      distinguishing_factors: string[]
  strongest_arguments:
    - argument_name: string
      strength_rating: "⭐⭐⭐" | "⭐⭐" | "⭐"
      legal_basis: citation
      reasoning: string
  procedural_advantages: string[]
  success_likelihood: percentage
  timestamp: datetime
  validation_status: passed | failed
```

#### 3. Adversary Report
```yaml
adversary_report:
  opposition_summary: string
  contrary_legal_framework:
    statutes: citation[]  # Same law, different interpretation
    interpretation_methods: string[]
  contrary_precedents:
    - citation: string
      severity_rating: "🔴" | "🟡" | "🟢"
      holding: string
      relevance: string
      why_distinctions_fail: string[]
  strongest_counter_arguments:
    - argument_name: string
      severity_rating: "🔴" | "🟡" | "🟢"
      legal_basis: citation
      reasoning: string
      risk_assessment: string
  procedural_disadvantages: string[]
  failure_likelihood: percentage
  critical_vulnerabilities: string[]
  timestamp: datetime
  validation_status: passed | failed
```

#### 4. Judicial Report
```yaml
judicial_report:
  sachverhalt: string  # Factual situation
  rechtliche_wurdigung:  # Legal framework
    applicable_law: citation[]
    burden_of_proof: string
  erwagungen:  # Considerations
    supporting_considerations:
      - from_advocate: string
        weight: percentage
        assessment: string
    gegenargumente:  # Counter-arguments section
      - from_adversary: string
        weight: percentage
        assessment: string
    precedent_comparison:
      supporting_line:
        citations: citation[]
        persuasiveness: percentage
      contrary_line:
        citations: citation[]
        persuasiveness: percentage
      judicial_assessment: string
    argument_balance:
      - type: supporting | counter
        strength: string
        weight: percentage
        assessment: string
  schlussfolgerung:  # Conclusion
    overall_assessment: string
    success_probability:
      percentage: number
      confidence_interval: number
    critical_factors:
      strengths_to_emphasize: string[]
      weaknesses_to_address: string[]
  strategic_recommendations:
    procedural_strategy: string
    argument_priority: string[]
    risk_mitigation: string[]
    settlement_considerations: string
  objectivity_validation:
    bilateral_research: boolean
    gegenargumente_included: boolean
    balanced_assessment: boolean
    bge_compliance: boolean
  timestamp: datetime
```

### Communication Flow

```
┌────────────────────────────────────────────────────────┐
│ PHASE 1: PARALLEL RESEARCH                             │
└────────────────────────────────────────────────────────┘

User Query Package
      │
      ├─────────────────────────┬─────────────────────────┐
      │                         │                         │
      ▼                         ▼                         ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  ADVOCATE    │       │  ADVERSARY   │       │   JUDICIAL   │
│   AGENT      │       │    AGENT     │       │    AGENT     │
│              │       │              │       │   (waiting)  │
│ Research:    │       │ Research:    │       │              │
│ Supportive   │       │ Contrary     │       │              │
│ precedents   │       │ precedents   │       │              │
└──────┬───────┘       └──────┬───────┘       └──────────────┘
       │                      │
       │ Advocate Report      │ Adversary Report
       │                      │
       └──────────────────────┴───────────────┐
                                              │
┌────────────────────────────────────────────▼────────────────┐
│ PHASE 2: VALIDATION GATE                                    │
│ - Check both reports received                               │
│ - Validate citations in both                                │
│ - Ensure adequate bilateral research                        │
│ - If validation fails → retry or error                      │
└────────────────────────────────────┬────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────┐
│ PHASE 3: JUDICIAL SYNTHESIS                                 │
│                                                              │
│  ┌──────────────┐                                          │
│  │   JUDICIAL   │ ← Advocate Report                        │
│  │    AGENT     │ ← Adversary Report                       │
│  │              │                                           │
│  │ Synthesis:   │                                           │
│  │ - Compare precedents                                    │
│  │ - Balance arguments                                      │
│  │ - Apply BGE Erwägung structure                          │
│  │ - Calculate risk probability                             │
│  │ - Generate strategic recommendations                     │
│  └──────┬───────┘                                          │
│         │                                                    │
│         │ Judicial Report                                   │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────┐
│ PHASE 4: QUALITY GATE                                      │
│ - Validate objectivity score                               │
│ - Check BGE methodology compliance                          │
│ - Verify balanced assessment                               │
│ - Confirm bilateral precedent inclusion                     │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
                    Final Output to User
```

---

## 🔐 Quality Gates & Validation

### Gate 1: Input Validation (Pre-Workflow)

**Purpose**: Ensure workflow has sufficient context to proceed

**Checks**:
```yaml
input_validation:
  required_fields:
    - user_query_text: min_length 20
    - legal_context.jurisdiction: valid_value
    - legal_context.language: valid_value

  quality_checks:
    - Is legal question clear enough for analysis?
    - Is applicable law identifiable?
    - Is user's position stated or inferable?

  failure_action:
    - Request clarification from user
    - Do not proceed to agent execution
```

### Gate 2: Report Validation (Post-Research)

**Purpose**: Ensure both advocate and adversary completed quality research

**Advocate Report Validation**:
```yaml
advocate_validation:
  citation_check:
    min_precedents: 3
    citation_format: BGE/ATF/DTF valid format
    citation_verification: legal-citations MCP confirms

  argument_quality:
    min_arguments: 3
    strength_ratings_present: true
    legal_basis_cited: true

  swiss_methodology:
    interpretation_methods_applied: true
    at_least_one_bge_citation: true

  failure_action:
    - retry_research with expanded search
    - if retry fails → escalate to judicial with warning
```

**Adversary Report Validation**:
```yaml
adversary_validation:
  citation_check:
    min_contrary_precedents: 3
    citation_format: BGE/ATF/DTF valid format
    citation_verification: legal-citations MCP confirms

  counter_argument_quality:
    min_counter_arguments: 3
    severity_ratings_present: true
    risk_assessment_present: true

  bilateral_research_check:
    adversary_precedents_different_from_advocate: true
    at_least_one_critical_weakness_identified: true

  failure_action:
    - retry_research with contrary bias emphasis
    - if retry fails → escalate to judicial with warning
```

### Gate 3: Objectivity Validation (Post-Synthesis)

**Purpose**: Ensure judicial report maintains objectivity and BGE compliance

**Objectivity Scoring**:
```yaml
objectivity_score_calculation:
  bilateral_research:
    weight: 25%
    check: Both advocate and adversary precedents included
    pass_threshold: Both present

  gegenargumente_section:
    weight: 25%
    check: Counter-arguments section explicitly included
    pass_threshold: Present and substantive

  balanced_weight_assessment:
    weight: 30%
    check: Arguments weighted, not just listed
    calculation: |
      balance_score = min(
        advocate_weight / adversary_weight,
        adversary_weight / advocate_weight
      )
    pass_threshold: balance_score >= 0.4  # Not more than 60/40 split

  bge_methodology_compliance:
    weight: 20%
    check: Erwägung structure followed
    required_sections:
      - Sachverhalt
      - Rechtliche Würdigung
      - Erwägungen (with Gegenargumente)
      - Schlussfolgerung
    pass_threshold: All sections present

  overall_score:
    formula: weighted_sum(all_components)
    pass_threshold: >= 0.75

  failure_action:
    - if score < 0.75 → regenerate judicial report
    - if regeneration fails → escalate with objectivity warning
```

**BGE Compliance Check**:
```yaml
bge_compliance:
  required_elements:
    - Sachverhalt section present
    - Rechtliche Würdigung identifies applicable law
    - Erwägungen includes both sides
    - Gegenargumente explicitly labeled
    - Schlussfolgerung provides clear conclusion
    - All BGE citations properly formatted

  multi_lingual_check:
    - If language != de, verify terminology consistency
    - Ensure Art./art. format matches language
    - Verify BGE/ATF/DTF citation format matches language

  pass_criteria:
    all_required_elements: true
    multi_lingual_compliance: true
```

---

## 🔗 Integration with Existing BetterCallClaude Personas

### Integration Architecture

```
┌────────────────────────────────────────────────────────────┐
│          EXISTING PERSONA LAYER                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   LEGAL      │  │     CASE     │  │    LEGAL     │    │
│  │  RESEARCHER  │  │  STRATEGIST  │  │   DRAFTER    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
          │                 │                  │
┌─────────┼─────────────────┼──────────────────┼──────────────┐
│         │  OBJECTIVITY    │                  │              │
│         │  LAYER          │                  │              │
│         │  (Strict Mode)  │                  │              │
│         ▼                 ▼                  │              │
│  ┌────────────────────────────────────┐     │              │
│  │  ADVERSARIAL WORKFLOW              │     │              │
│  │                                     │     │              │
│  │  ┌──────────┐  ┌──────────┐       │     │              │
│  │  │ ADVOCATE │  │ADVERSARY │       │     │              │
│  │  │  AGENT   │  │  AGENT   │       │     │              │
│  │  └────┬─────┘  └────┬─────┘       │     │              │
│  │       │             │              │     │              │
│  │       └─────┬───────┘              │     │              │
│  │             ▼                      │     │              │
│  │       ┌──────────┐                 │     │              │
│  │       │ JUDICIAL │                 │     │              │
│  │       │  AGENT   │                 │     │              │
│  │       └────┬─────┘                 │     │              │
│  └────────────┼────────────────────────┘     │              │
│               │                              │              │
└───────────────┼──────────────────────────────┼──────────────┘
                │                              │
                ▼                              ▼
          Enhanced Case                   Enhanced Legal
          Strategy Report                 Draft (if applicable)
```

### Coordination with Legal Researcher Persona

**Scenario**: User asks legal research question with `--objectivity strict`

**Workflow**:
1. **Legal Researcher** activated (as normal)
2. **Objectivity layer** intercepts
3. **Adversarial Workflow** executes:
   - Advocate uses Legal Researcher for supportive research
   - Adversary uses Legal Researcher for contrary research
   - Both run in parallel
4. **Judicial synthesis** produces final output
5. User receives: Objective research report (not just supportive findings)

**Integration Points**:
```yaml
legal_researcher_integration:
  shared_tools:
    - entscheidsuche MCP
    - bge-search MCP
    - legal-citations MCP

  data_exchange:
    - Legal Researcher provides precedent search capabilities
    - Advocate/Adversary specify search bias parameter
    - Legal Researcher returns results to respective agent

  workflow_coordination:
    - Legal Researcher operates as service layer
    - Adversarial workflow as orchestration layer
    - No changes to Legal Researcher persona required
```

### Coordination with Case Strategist Persona

**Scenario**: User asks for case strategy with `--objectivity strict`

**Workflow**:
1. **Case Strategist** activated (as normal)
2. **Objectivity layer** intercepts
3. **Adversarial Workflow** executes:
   - Advocate builds strongest case FOR client
   - Adversary builds strongest case AGAINST client
   - Judicial synthesizes into balanced strategy
4. **Case Strategist** receives judicial report
5. **Case Strategist** uses balanced assessment for:
   - Settlement value calculation
   - Procedural strategy selection
   - Risk probability refinement
6. User receives: Objective strategy (not overly optimistic)

**Integration Points**:
```yaml
case_strategist_integration:
  input_enhancement:
    - Case Strategist receives judicial report instead of raw query
    - Judicial report already contains:
      - Balanced precedent analysis
      - Strength/weakness assessment
      - Risk probability estimate

  workflow_modification:
    - Case Strategist skips its own strength/weakness analysis
    - Uses judicial report's balanced assessment
    - Focuses on strategic recommendations and settlement calculation

  enhanced_outputs:
    - More realistic success probability
    - Better settlement value estimation
    - Identified weaknesses to address before litigation
```

### Coordination with Legal Drafter Persona

**Scenario**: User asks to draft legal document with `--objectivity strict`

**Workflow**:
1. **Legal Drafter** activated (as normal)
2. **Objectivity layer** intercepts ONLY if:
   - Document type: Legal opinion, memorandum, or brief
   - Document type: NOT contract (contracts don't need adversarial analysis)
3. **Adversarial Workflow** executes (for opinions/briefs):
   - Advocate identifies strongest arguments to include
   - Adversary identifies weaknesses to address
   - Judicial provides balanced framework
4. **Legal Drafter** uses judicial framework to:
   - Structure legal opinion with balanced analysis
   - Include Gegenargumente section
   - Draft brief acknowledging and addressing weaknesses
5. User receives: More credible legal opinion (not one-sided advocacy)

**Integration Points**:
```yaml
legal_drafter_integration:
  conditional_activation:
    activate_adversarial_if:
      - document_type in [legal_opinion, memorandum, court_brief]
    skip_adversarial_if:
      - document_type in [contract, agreement, NDA]

  template_enhancement:
    legal_opinion_template:
      - Add Gegenargumente section from adversary
      - Include balanced precedent analysis from judicial
      - Acknowledge weaknesses (enhances credibility)

  court_brief_template:
    - Address anticipated counter-arguments
    - Distinguish contrary precedents proactively
    - Demonstrate thoroughness
```

---

## 🎮 Workflow State Machine

### State Definitions

```yaml
workflow_states:
  IDLE:
    description: "Workflow not active"
    transitions: [INITIALIZING]

  INITIALIZING:
    description: "Receiving user query and validating input"
    actions:
      - Parse user query
      - Detect objectivity level
      - Validate input completeness
    transitions:
      - PARALLEL_RESEARCH (if validation passes)
      - ERROR (if validation fails)

  PARALLEL_RESEARCH:
    description: "Advocate and Adversary running in parallel"
    concurrent_agents:
      - advocate: RESEARCHING_SUPPORT
      - adversary: RESEARCHING_OPPOSITION
    transitions:
      - VALIDATING_REPORTS (when both complete)
      - PARTIAL_COMPLETION (if one completes, other fails)
      - ERROR (if both fail)

  VALIDATING_REPORTS:
    description: "Quality gate checking both reports"
    actions:
      - Validate advocate report citations
      - Validate adversary report citations
      - Check bilateral research completeness
    transitions:
      - JUDICIAL_SYNTHESIS (if validation passes)
      - RETRY_RESEARCH (if validation fails but retry possible)
      - ERROR (if validation fails and no retry)

  JUDICIAL_SYNTHESIS:
    description: "Judicial agent synthesizing both positions"
    actions:
      - Compare precedents
      - Balance arguments
      - Apply BGE Erwägung structure
      - Calculate risk probability
      - Generate strategic recommendations
    transitions:
      - VALIDATING_OBJECTIVITY (when synthesis complete)
      - ERROR (if synthesis fails)

  VALIDATING_OBJECTIVITY:
    description: "Final quality gate for objectivity compliance"
    actions:
      - Calculate objectivity score
      - Check BGE methodology compliance
      - Verify balanced assessment
    transitions:
      - COMPLETED (if score >= 0.75)
      - RETRY_SYNTHESIS (if score < 0.75 but retry possible)
      - COMPLETED_WITH_WARNING (if retry exhausted but acceptable)
      - ERROR (if score critically low)

  COMPLETED:
    description: "Workflow successfully completed"
    actions:
      - Return judicial report to user
      - Log success metrics
    transitions: [IDLE]

  COMPLETED_WITH_WARNING:
    description: "Completed but with objectivity concerns"
    actions:
      - Return judicial report with warning
      - Log quality concern
    transitions: [IDLE]

  ERROR:
    description: "Workflow encountered unrecoverable error"
    actions:
      - Log error details
      - Return error message to user
      - Suggest fallback (e.g., lower objectivity level)
    transitions: [IDLE]

  RETRY_RESEARCH:
    description: "Retrying research phase with adjusted parameters"
    max_retries: 2
    actions:
      - Expand search parameters
      - Request additional precedents
    transitions:
      - PARALLEL_RESEARCH
      - ERROR (if max retries exhausted)

  RETRY_SYNTHESIS:
    description: "Retrying judicial synthesis with adjusted weighting"
    max_retries: 1
    actions:
      - Rebalance argument weights
      - Enhance Gegenargumente section
    transitions:
      - JUDICIAL_SYNTHESIS
      - COMPLETED_WITH_WARNING (if max retries exhausted)
```

### State Transition Diagram

```
                    ┌──────────┐
                    │   IDLE   │
                    └────┬─────┘
                         │
                         ▼
                ┌────────────────┐
                │ INITIALIZING   │
                │ (Input Valid?) │
                └────┬──────┬────┘
                     │      │
              valid  │      │ invalid
                     │      │
                     ▼      ▼
           ┌──────────────────┐    ┌───────┐
           │PARALLEL_RESEARCH │    │ ERROR │
           │                  │    └───┬───┘
           │ ┌──────────────┐ │        │
           │ │  Advocate    │ │        │
           │ │ RESEARCHING  │ │        │
           │ └──────────────┘ │        │
           │ ┌──────────────┐ │        │
           │ │  Adversary   │ │        │
           │ │ RESEARCHING  │ │        │
           │ └──────────────┘ │        │
           └────┬──────────────┘        │
                │                       │
         (both complete)                │
                │                       │
                ▼                       │
      ┌──────────────────┐              │
      │VALIDATING_REPORTS│              │
      │  (Quality OK?)   │              │
      └──────┬──────┬────┘              │
             │      │                   │
      passed │      │ failed            │
             │      │                   │
             │      ▼                   │
             │  ┌──────────────┐        │
             │  │RETRY_RESEARCH│        │
             │  │(if attempts  │        │
             │  │   remain)    │        │
             │  └──────┬───────┘        │
             │         │                │
             │         └────────────────┘
             │
             ▼
    ┌──────────────────┐
    │JUDICIAL_SYNTHESIS│
    │                  │
    │ - Compare        │
    │ - Balance        │
    │ - Erwägung       │
    │ - Calculate risk │
    └────────┬─────────┘
             │
             ▼
  ┌────────────────────────┐
  │VALIDATING_OBJECTIVITY  │
  │  (Score >= 0.75?)      │
  └──┬──────┬──────────┬───┘
     │      │          │
passed│ retry│      low│
     │      │          │
     │      ▼          ▼
     │  ┌────────┐  ┌────────────────────┐
     │  │RETRY_  │  │COMPLETED_WITH_     │
     │  │SYNTH.  │  │WARNING             │
     │  └────┬───┘  └──────┬─────────────┘
     │       │             │
     │       └─────────────┼────────┐
     │                     │        │
     ▼                     ▼        ▼
┌─────────┐           ┌────────────────┐
│COMPLETED│           │      IDLE      │
└────┬────┘           └────────────────┘
     │
     └──────────────────┐
                        │
                        ▼
                   ┌────────┐
                   │  IDLE  │
                   └────────┘
```

### Error Handling and Recovery

**Error Types**:

```yaml
error_handling:
  input_validation_error:
    recovery: Request clarification from user
    fallback: None (cannot proceed without valid input)

  research_failure:
    types:
      - No precedents found
      - MCP server timeout
      - Citation verification failure
    recovery:
      - Expand search parameters
      - Retry with broader query
      - Use alternative search strategy
    max_retries: 2
    fallback: Proceed with limited research (with warning)

  synthesis_failure:
    types:
      - Objectivity score too low
      - BGE structure incomplete
      - Insufficient bilateral analysis
    recovery:
      - Rebalance argument weights
      - Enhance Gegenargumente section
      - Add missing BGE structure elements
    max_retries: 1
    fallback: Return report with objectivity warning

  catastrophic_failure:
    types:
      - All retries exhausted
      - MCP servers unavailable
      - Critical validation failures
    action:
      - Log detailed error
      - Notify user of failure
      - Suggest:
        - Try lower objectivity level (--objectivity balanced)
        - Contact support if persistent
    fallback: None (return error message)
```

---

## 🚀 Activation Patterns

### Trigger Conditions

**Primary Trigger**: User sets `--objectivity strict`

**Secondary Triggers** (Auto-suggest strict mode):
- High-stakes litigation (amount > CHF 100,000)
- Criminal defense matters
- Constitutional law challenges
- Novel legal questions without clear precedent
- User explicitly requests "objective analysis" or "devil's advocate"

**Activation Logic**:

```yaml
activation_rules:
  explicit_flag:
    - if --objectivity strict → ALWAYS activate

  auto_suggest_strict:
    conditions:
      - practice_area: criminal_defense
      - practice_area: constitutional
      - claim_value: > 100000 CHF
      - query_contains: ["objective", "challenge", "devil's advocate", "gegenargumente"]
    action: Suggest to user: "Consider --objectivity strict for this analysis?"

  never_activate:
    - if --objectivity none
    - if document_type: contract (use Legal Drafter directly)
    - if query_type: simple_citation_lookup
```

### Integration with `/legal` Command Routing

**Modified Routing**:

```markdown
User: /legal @strategist Art. 97 OR breach, CHF 500,000 dispute --objectivity strict

Routing Logic:
1. Detect @strategist → Route to Case Strategist
2. Detect --objectivity strict → Intercept with Adversarial Workflow
3. Execute:
   - Adversarial Workflow runs (Advocate → Adversary → Judicial)
   - Judicial report passed to Case Strategist
   - Case Strategist enhances with settlement calc and procedural strategy
4. Return: Enhanced objective strategy report
```

### Configuration Persistence

**Session-Level Settings**:

```yaml
session_configuration:
  objectivity_level: strict  # Persists for session

  override_behavior:
    - User can change mid-session: /legal --objectivity balanced
    - New setting applies to subsequent queries only
    - Does not retroactively change completed analyses

  reset_behavior:
    - Session ends → resets to user's default (from config.yaml)
    - Explicit reset: /legal --objectivity reset
```

**User Profile Defaults** (`~/.betterask/config.yaml`):

```yaml
objectivity:
  default_level: balanced  # User's preference

  practice_area_overrides:
    criminal_defense: strict  # Always strict for criminal
    constitutional: strict
    corporate: balanced
    contracts: light

  auto_suggest_strict:
    claim_value_threshold: 100000  # CHF
    novel_legal_question: true
    high_stakes_indicator: true
```

---

## 📊 Performance and Scalability

### Execution Time Estimates

```yaml
performance_estimates:
  parallel_research_phase:
    advocate_agent: 15-30 seconds
    adversary_agent: 15-30 seconds
    total_parallel: 15-30 seconds (concurrent execution)

  validation_gates:
    report_validation: 2-5 seconds
    objectivity_validation: 2-5 seconds

  judicial_synthesis:
    synthesis_execution: 20-40 seconds

  total_workflow_time:
    optimal: 40-80 seconds
    with_retries: 60-120 seconds
    worst_case: 150 seconds (with max retries)
```

### Token Usage Estimates

```yaml
token_estimates:
  user_query_package: 200-500 tokens

  advocate_report: 1500-3000 tokens
  adversary_report: 1500-3000 tokens
  judicial_report: 2500-4000 tokens

  total_output: 5500-10000 tokens

  mcp_server_calls:
    entscheidsuche: 500-1000 tokens per search
    sequential-thinking: 1000-2000 tokens per analysis
    legal-citations: 100-200 tokens per verification

  total_workflow_consumption:
    optimal: 15,000-25,000 tokens
    with_retries: 20,000-35,000 tokens
```

### Scalability Considerations

**Concurrent User Support**:
```yaml
scalability:
  mcp_server_capacity:
    entscheidsuche: Rate limited by external API
    sequential-thinking: Local processing, high capacity
    legal-citations: Lightweight, high capacity

  bottlenecks:
    primary: entscheidsuche API rate limits
    secondary: LLM token throughput

  mitigation:
    - Cache precedent searches (1 hour TTL)
    - Batch similar queries when possible
    - Queue management for high-demand periods
```

---

## ✅ Success Metrics

### Quantitative Metrics

```yaml
success_metrics:
  objectivity_score:
    target: >= 0.85 (on 0-1 scale)
    measurement: Average across all analyses

  citation_accuracy:
    target: >= 95%
    measurement: Valid BGE citations / total citations

  bilateral_research_completeness:
    target: >= 90%
    measurement: Analyses with both advocate and adversary precedents

  gegenargumente_inclusion:
    target: 100%
    measurement: Reports with Gegenargumente section present

  user_satisfaction:
    target: >= 4.2/5
    measurement: Post-analysis survey rating

  time_to_completion:
    target: <= 90 seconds (median)
    measurement: End-to-end workflow execution time
```

### Qualitative Metrics

```yaml
qualitative_assessment:
  professional_credibility:
    evaluation: Lawyer review of sample outputs
    target: "Meets professional standards" rating

  bge_methodology_compliance:
    evaluation: Comparison against actual BGE decisions
    target: Structure matches BGE Erwägung format

  strategic_value:
    evaluation: User feedback on actionability
    target: "Insights improved case strategy" confirmation

  bias_reduction:
    evaluation: Before/after comparison with non-adversarial analysis
    target: Measurable reduction in optimistic bias
```

---

## 🔮 Future Enhancements (Post-v1.0)

### Phase 2 Enhancements

```yaml
phase_2_features:
  dynamic_friction_adjustment:
    description: "AI-driven friction level recommendation"
    trigger: "Analyze query complexity and suggest optimal objectivity level"
    implementation: "ML model trained on historical analysis outcomes"

  precedent_strength_ml:
    description: "Machine learning for precedent persuasiveness scoring"
    benefit: "More accurate weight assignment in judicial synthesis"
    data_source: "Historical BGE decisions and outcomes"

  multi_round_adversarial:
    description: "Iterative advocate-adversary debate"
    workflow: "Advocate → Adversary → Advocate rebuttal → Adversary counter → Judicial"
    use_case: "Ultra-high stakes cases requiring deepest analysis"
```

### Phase 3 Enhancements

```yaml
phase_3_features:
  comparative_cantonal_analysis:
    description: "Adversarial analysis across multiple cantons"
    workflow: "Advocate (Canton A) vs Adversary (Canton B) → Judicial comparison"
    use_case: "Cross-cantonal legal strategy"

  temporal_precedent_evolution:
    description: "Track how precedent interpretation evolved over time"
    benefit: "Identify shifting BGE trends and predict future directions"

  collaborative_adversarial:
    description: "Multiple lawyers collaborate on same adversarial analysis"
    workflow: "Shared advocate/adversary reports with collaborative editing"
    use_case: "Firm-wide case strategy development"
```

---

## 📝 Documentation and Training

### User Documentation Requirements

```markdown
# Required Documentation

## 1. User Guide: Understanding Adversarial Analysis
- What is adversarial analysis and why it matters
- When to use --objectivity strict
- How to interpret three-part output (Advocate/Adversary/Judicial)
- Understanding objectivity scores and validation

## 2. Quick Start Guide
- Basic usage examples
- Common scenarios (litigation, compliance, risk assessment)
- Interpreting results for strategic decision-making

## 3. Technical Reference
- Complete workflow specification
- Agent interaction details
- Quality gate criteria
- Error messages and troubleshooting

## 4. Best Practices
- Preparing effective queries for adversarial analysis
- When to use different objectivity levels
- Integrating adversarial output with case strategy
```

### Training Requirements

```yaml
training_program:
  target_audience:
    - Swiss lawyers (primary)
    - Legal assistants (secondary)
    - Law students (tertiary)

  training_modules:
    module_1:
      title: "Introduction to Objectivity Enforcement"
      duration: 30 minutes
      content:
        - Accommodation bias problem
        - Four-tier objectivity system
        - When to use adversarial analysis

    module_2:
      title: "Interpreting Adversarial Reports"
      duration: 45 minutes
      content:
        - Understanding advocate position
        - Understanding adversary position
        - Reading judicial synthesis
        - Acting on strategic recommendations

    module_3:
      title: "Advanced Usage and Integration"
      duration: 60 minutes
      content:
        - Combining with case strategy
        - Using in legal opinion drafting
        - Multi-lingual adversarial analysis
        - Troubleshooting common issues

  certification:
    optional: true
    assessment: "Analyze sample case using adversarial workflow"
    pass_criteria: "Correctly interpret all three agent outputs"
```

---

## 🎓 Conclusion

This adversarial workflow design provides BetterCallClaude with a robust mechanism for enforcing objectivity through systematic bilateral analysis. By forcing explicit consideration of both supportive and contrary positions before synthesis, the framework eliminates accommodation bias while maintaining Swiss legal methodology compliance.

**Key Design Achievements**:
1. ✅ Three-agent architecture with clear roles and responsibilities
2. ✅ Parallel execution for research efficiency
3. ✅ Multi-level quality gates ensuring objectivity
4. ✅ Seamless integration with existing persona system
5. ✅ BGE Erwägung structure compliance
6. ✅ Scalable and performant workflow design

**Next Steps**:
1. **Validate design** with Swiss legal professionals
2. **Prototype implementation** of core workflow
3. **Test with sample cases** across practice areas
4. **Iterate based on feedback** before full deployment
5. **Develop comprehensive documentation** and training materials

---

**Design Status**: ✅ Architecture Complete
**Next Phase**: Implementation Planning
**Framework**: BetterCallClaude v1.0.0-alpha
**Document Version**: 1.0 (2025-01-05)
