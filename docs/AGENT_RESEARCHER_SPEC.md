# /agent:researcher Implementation Specification

> **Version**: 1.0.0-draft
> **Priority**: P0 (Critical for MVP)
> **Estimated Effort**: 3 weeks
> **Dependencies**: MCP servers (entscheidsuche, bge-search, cantonal-courts, legal-citations)

## Executive Summary

The `/agent:researcher` is the foundational legal research agent that enables the 80% time savings target for BetterCallClaude. It performs deep, multi-source legal research with automatic citation verification and synthesis.

---

## Table of Contents

1. [Agent Overview](#agent-overview)
2. [Workflow Architecture](#workflow-architecture)
3. [MCP Server Integration](#mcp-server-integration)
4. [Input/Output Specification](#inputoutput-specification)
5. [Autonomy Behavior](#autonomy-behavior)
6. [Error Handling](#error-handling)
7. [Implementation Details](#implementation-details)
8. [Testing Strategy](#testing-strategy)

---

## Agent Overview

### Identity

```yaml
agent_id: researcher
agent_version: 1.0.0
category: Core Legal Intelligence
autonomy_default: balanced
max_sub_agents: 2
checkpoint_frequency: 3min
```

### Capabilities

| Capability | Description |
|------------|-------------|
| **BGE Search** | Search Federal Supreme Court decisions with semantic understanding |
| **Cantonal Search** | Search cantonal court decisions (ZH, BE, GE, BS, VD, TI) |
| **Doctrine Search** | Search legal literature and commentary |
| **Citation Verification** | Verify all citations are current and correctly formatted |
| **Synthesis** | Combine findings into structured research memo |
| **Multi-Lingual** | Search and synthesize in DE/FR/IT/EN |

### Success Metrics

| Metric | Target |
|--------|--------|
| Research completeness | >90% of relevant precedents found |
| Citation accuracy | >95% correctly verified |
| Time vs. manual | 80% reduction |
| False positives | <5% irrelevant results |

---

## Workflow Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  /agent:researcher WORKFLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT: Research question + Case context                        │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                            │
│  │ 1. UNDERSTAND   │ Parse question, identify legal issues      │
│  │    (analyze)    │ Extract key terms, jurisdictions           │
│  └─────────────────┘                                            │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                            │
│  │ 2. PLAN         │ Determine search strategy                  │
│  │    (strategize) │ Select sources, prioritize queries         │
│  └─────────────────┘                                            │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ 3. SEARCH       │────▶│ MCP: bge-search │                    │
│  │    (parallel)   │────▶│ MCP: cantonal   │                    │
│  │                 │────▶│ MCP: doctrine   │                    │
│  └─────────────────┘     └─────────────────┘                    │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ 4. VERIFY       │────▶│ /agent:citation │                    │
│  │    (invoke)     │     │   -checker      │                    │
│  └─────────────────┘     └─────────────────┘                    │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                            │
│  │ 5. SYNTHESIZE   │ Analyze findings, identify patterns        │
│  │    (generate)   │ Resolve conflicts, rank by relevance       │
│  └─────────────────┘                                            │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐                                            │
│  │ 6. DELIVER      │ Generate research memo                     │
│  │    (output)     │ Format citations, executive summary        │
│  └─────────────────┘                                            │
│       │                                                         │
│       ▼                                                         │
│  OUTPUT: Research memo with verified citations                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Step Breakdown

#### Step 1: UNDERSTAND

**Purpose**: Parse the research question and extract actionable search parameters.

**Inputs**:
- Research question (string)
- Case context (optional CaseContext object)

**Process**:
1. Parse natural language question
2. Identify legal domain (contract, tort, criminal, etc.)
3. Extract key legal terms and concepts
4. Determine relevant jurisdictions (federal, cantonal)
5. Identify time constraints (if any)
6. Detect language requirements

**Outputs**:
```typescript
interface ResearchParameters {
  legalDomain: string[];
  keyTerms: string[];
  concepts: string[];
  jurisdictions: {
    federal: boolean;
    cantons: string[];
  };
  timeRange?: {
    from: Date;
    to: Date;
  };
  languages: string[];
  originalQuestion: string;
}
```

**Checkpoint**: After parameter extraction

---

#### Step 2: PLAN

**Purpose**: Create optimized search strategy based on parameters.

**Inputs**:
- ResearchParameters from Step 1

**Process**:
1. Prioritize sources based on legal domain
2. Generate search queries for each source
3. Estimate result volume
4. Plan parallel execution paths
5. Set relevance thresholds

**Outputs**:
```typescript
interface SearchStrategy {
  sources: SearchSource[];
  queries: SearchQuery[];
  parallelPaths: ParallelPath[];
  relevanceThreshold: number;
  maxResults: number;
}

interface SearchSource {
  name: string;  // e.g., "bge-search", "cantonal-zh"
  priority: number;
  expectedVolume: number;
}

interface SearchQuery {
  source: string;
  query: string;
  filters: Record<string, unknown>;
  language: string;
}
```

**User Confirmation** (CAUTIOUS mode): Present search strategy for approval

---

#### Step 3: SEARCH

**Purpose**: Execute parallel searches across all configured sources.

**Inputs**:
- SearchStrategy from Step 2

**Process**:
1. Initialize MCP server connections
2. Execute queries in parallel (max 5 concurrent)
3. Collect raw results
4. Apply initial relevance filtering
5. Deduplicate across sources
6. Rank by relevance score

**MCP Calls**:
```typescript
// BGE Search
await mcpCall("bge-search", "search", {
  query: "Werkvertrag Mängelhaftung",
  filters: { year_from: 2015 },
  limit: 50
});

// Cantonal Search (parallel for each canton)
await Promise.all(cantons.map(canton =>
  mcpCall("cantonal-courts", "search", {
    canton,
    query: "...",
    limit: 30
  })
));
```

**Outputs**:
```typescript
interface SearchResults {
  sources: {
    [sourceName: string]: RawResult[];
  };
  totalFound: number;
  deduplicated: number;
  processingTimeMs: number;
}

interface RawResult {
  id: string;
  title: string;
  citation: string;
  date: Date;
  court: string;
  summary: string;
  relevanceScore: number;
  fullTextUrl?: string;
}
```

**Checkpoint**: After search completion

---

#### Step 4: VERIFY

**Purpose**: Verify all citations using the citation-checker sub-agent.

**Inputs**:
- SearchResults from Step 3

**Process**:
1. Extract all citations from results
2. Invoke `/agent:citation-checker` sub-agent
3. Receive verification report
4. Flag outdated or incorrect citations
5. Suggest alternatives for problematic citations

**Sub-Agent Invocation**:
```typescript
const verificationResult = await this.invokeSubAgent(
  CitationCheckerAgent,
  "Verify citations from research results",
  undefined,  // inherit autonomy mode
  { citations: extractedCitations }
);
```

**Outputs**:
```typescript
interface VerificationReport {
  verified: VerifiedCitation[];
  outdated: OutdatedCitation[];
  errors: CitationError[];
  overallAccuracy: number;
}
```

**User Confirmation** (BALANCED mode): Report any problematic citations

---

#### Step 5: SYNTHESIZE

**Purpose**: Analyze findings and create coherent synthesis.

**Inputs**:
- SearchResults from Step 3
- VerificationReport from Step 4

**Process**:
1. Group results by legal issue
2. Identify consensus positions
3. Flag conflicting precedents
4. Determine precedent hierarchy
5. Extract key principles
6. Identify gaps in research

**Outputs**:
```typescript
interface Synthesis {
  keyFindings: Finding[];
  precedentChain: Precedent[];
  conflicts: Conflict[];
  gaps: Gap[];
  recommendations: string[];
}

interface Finding {
  issue: string;
  conclusion: string;
  supportingCitations: string[];
  confidence: number;
}
```

**Checkpoint**: After synthesis

---

#### Step 6: DELIVER

**Purpose**: Generate final research memo.

**Inputs**:
- All previous outputs
- Original question
- Case context

**Process**:
1. Generate executive summary
2. Structure findings by issue
3. Format citations properly (Swiss legal format)
4. Include methodology section
5. Add limitations and caveats
6. Generate recommended next steps

**Outputs**:
```typescript
interface ResearchMemo {
  title: string;
  executiveSummary: string;
  methodology: string;
  findings: FormattedFinding[];
  citations: FormattedCitation[];
  limitations: string[];
  nextSteps: string[];
  appendices: Appendix[];
  metadata: {
    researchDate: Date;
    totalSources: number;
    verifiedCitations: number;
    processingTimeMs: number;
  };
}
```

---

## MCP Server Integration

### Required MCP Servers

| Server | Purpose | API Methods |
|--------|---------|-------------|
| **bge-search** | Federal Supreme Court | `search`, `getDecision`, `getCitedBy` |
| **cantonal-courts** | Cantonal courts | `search`, `getDecision`, `listCourts` |
| **entscheidsuche** | Unified search | `search`, `advancedSearch` |
| **legal-citations** | Citation verification | `verify`, `format`, `findAlternatives` |

### MCP Call Patterns

```typescript
// Parallel search pattern
async searchAllSources(queries: SearchQuery[]): Promise<SearchResults> {
  const bgePromise = this.mcpCall("bge-search", "search", queries.bge);
  const cantonalPromises = queries.cantonal.map(q =>
    this.mcpCall("cantonal-courts", "search", q)
  );

  const [bgeResults, ...cantonalResults] = await Promise.all([
    bgePromise,
    ...cantonalPromises
  ]);

  return this.mergeResults(bgeResults, cantonalResults);
}
```

---

## Input/Output Specification

### Input Schema

```typescript
interface ResearcherInput {
  // Required
  question: string;  // Natural language research question

  // Optional
  caseContext?: CaseContext;  // Inherited or provided
  jurisdiction?: {
    federal?: boolean;
    cantons?: string[];
  };
  timeRange?: {
    from?: Date;
    to?: Date;
  };
  languages?: string[];
  depth?: "quick" | "standard" | "deep";  // default: standard
  maxSources?: number;  // default: 50
  outputFormat?: "memo" | "bullets" | "json";  // default: memo
}
```

### Output Schema

```typescript
interface ResearcherOutput {
  // Main deliverable
  memo: ResearchMemo;

  // Structured data
  findings: Finding[];
  citations: VerifiedCitation[];

  // Metadata
  metadata: {
    question: string;
    sourcesSearched: number;
    resultsFound: number;
    citationsVerified: number;
    processingTimeMs: number;
    autonomyMode: AutonomyMode;
  };

  // For follow-up
  suggestedQueries: string[];
  relatedTopics: string[];
}
```

---

## Autonomy Behavior

### CAUTIOUS Mode

```
Step 1: UNDERSTAND
  → Show extracted parameters
  → Confirm: "Is this interpretation correct?"

Step 2: PLAN
  → Show search strategy
  → Confirm: "Proceed with this search plan?"

Step 3: SEARCH
  → Show progress for each source
  → Confirm: "Continue searching remaining sources?"

Step 4: VERIFY
  → Show each citation being verified
  → Confirm: "Accept verified citations?"

Step 5: SYNTHESIZE
  → Show draft synthesis
  → Confirm: "Is this synthesis accurate?"

Step 6: DELIVER
  → Show draft memo
  → Confirm: "Finalize and deliver?"
```

### BALANCED Mode (Default)

```
Step 1-2: Execute silently

CHECKPOINT 1: After planning
  → Show: "Searching X sources for Y legal issues"
  → Confirm: "Proceed?"

Step 3-4: Execute with progress updates

CHECKPOINT 2: After verification
  → Show: "Found N results, M citations verified"
  → Show any problematic citations
  → Confirm: "Continue to synthesis?"

Step 5-6: Execute silently

FINAL: Present completed memo
```

### AUTONOMOUS Mode

```
Execute all steps without interruption
Progress updates every 60 seconds
Final delivery with complete audit log
```

---

## Error Handling

### Recoverable Errors

| Error | Recovery Action |
|-------|-----------------|
| MCP timeout | Retry with exponential backoff (3 attempts) |
| Source unavailable | Continue with remaining sources, note in limitations |
| Citation not found | Mark as unverified, suggest alternatives |
| Rate limit | Queue and retry after cooldown |

### Non-Recoverable Errors

| Error | Action |
|-------|--------|
| All sources unavailable | Fail with partial results |
| Invalid question | Request clarification |
| Case context required | Prompt for case context |

### Error Recovery Protocol

```typescript
async handleSearchError(error: Error, source: string): Promise<void> {
  // 1. Create checkpoint
  this.createCheckpoint("pre_recovery", `Error in ${source}`);

  // 2. Attempt recovery
  if (this.isRetryable(error)) {
    await this.retryWithBackoff(source, 3);
  }

  // 3. If still failing, preserve partial
  this.updateState("failedSources", [...this.getState("failedSources", []), source]);

  // 4. Escalate if in autonomous mode
  if (this.autonomyMode === AutonomyMode.AUTONOMOUS) {
    this.autonomyMode = AutonomyMode.CAUTIOUS;
    await this.requestUserConfirmation(
      `Source ${source} unavailable. Continue with remaining sources?`
    );
  }
}
```

---

## Implementation Details

### Class Structure

```python
# src/agents/researcher.py

from .base import AgentBase, AgentResult, AutonomyMode, CaseContext
from typing import Optional, Dict, Any

class ResearcherAgent(AgentBase):
    """
    Legal research agent for Swiss law.
    Performs deep, multi-source research with citation verification.
    """

    @property
    def agent_id(self) -> str:
        return "researcher"

    @property
    def agent_version(self) -> str:
        return "1.0.0"

    async def execute(
        self,
        task: str,
        depth: str = "standard",
        max_sources: int = 50,
        **kwargs
    ) -> AgentResult:
        """
        Execute legal research workflow.

        Args:
            task: Research question
            depth: "quick" | "standard" | "deep"
            max_sources: Maximum sources to search
        """
        self.mark_start()
        self.create_checkpoint("auto", "Research started")

        try:
            # Step 1: Understand
            params = await self._understand(task)
            self.create_checkpoint("auto", "Parameters extracted")

            # Step 2: Plan
            strategy = await self._plan(params)
            if self.autonomy_mode != AutonomyMode.AUTONOMOUS:
                await self._confirm_strategy(strategy)

            # Step 3: Search
            results = await self._search(strategy)
            self.create_checkpoint("auto", "Search completed")

            # Step 4: Verify
            verification = await self._verify(results)

            # Step 5: Synthesize
            synthesis = await self._synthesize(results, verification)
            self.create_checkpoint("auto", "Synthesis completed")

            # Step 6: Deliver
            memo = await self._deliver(synthesis, params)

            return self._create_success_result(memo)

        except Exception as e:
            self._handle_error(e)
            return self._create_failure_result(e)

    # ... implementation of private methods
```

### TypeScript Implementation

```typescript
// packages/agents/src/researcher.ts

import { AgentBase, AgentResult, AutonomyMode } from "./base";

export class ResearcherAgent extends AgentBase {
  get agentId(): string {
    return "researcher";
  }

  get agentVersion(): string {
    return "1.0.0";
  }

  async execute(
    task: string,
    options: ResearcherOptions = {}
  ): Promise<AgentResult<ResearchMemo>> {
    this.markStart();
    this.resetState();
    this.createCheckpoint("auto", "Research started");

    try {
      // Implementation follows Python structure
      const params = await this.understand(task);
      const strategy = await this.plan(params);
      const results = await this.search(strategy);
      const verification = await this.verify(results);
      const synthesis = await this.synthesize(results, verification);
      const memo = await this.deliver(synthesis, params);

      return this.createSuccessResult(memo);
    } catch (error) {
      this.handleError(error as Error);
      return this.createFailureResult(error as Error);
    }
  }

  // ... private methods
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe("ResearcherAgent", () => {
  describe("understand", () => {
    it("extracts legal domain from question", async () => {
      const agent = new ResearcherAgent();
      const params = await agent["understand"](
        "Was sind die Voraussetzungen für Mängelhaftung im Werkvertrag?"
      );
      expect(params.legalDomain).toContain("contract");
      expect(params.keyTerms).toContain("Mängelhaftung");
      expect(params.keyTerms).toContain("Werkvertrag");
    });

    it("identifies cantonal jurisdiction", async () => {
      const params = await agent["understand"](
        "Zürich cantonal court practice on employment termination"
      );
      expect(params.jurisdictions.cantons).toContain("ZH");
    });
  });

  describe("search", () => {
    it("executes parallel searches", async () => {
      // Mock MCP calls
      const mockMcp = jest.fn().mockResolvedValue({ results: [] });
      agent["mcpCall"] = mockMcp;

      await agent["search"](mockStrategy);

      expect(mockMcp).toHaveBeenCalledTimes(3);  // BGE + 2 cantons
    });
  });
});
```

### Integration Tests

```typescript
describe("ResearcherAgent Integration", () => {
  it("completes full research workflow", async () => {
    const agent = new ResearcherAgent({
      autonomyMode: AutonomyMode.AUTONOMOUS,
    });

    const result = await agent.execute(
      "Find BGE precedents on Art. 363 OR (Werkvertrag)"
    );

    expect(result.success).toBe(true);
    expect(result.deliverable?.citations.length).toBeGreaterThan(0);
    expect(result.auditLog.actions).toContainEqual(
      expect.objectContaining({ actionType: "search" })
    );
  });
});
```

### E2E Tests

```typescript
describe("Researcher E2E", () => {
  it("produces valid research memo", async () => {
    const result = await researcherE2E({
      question: "BGE on construction contract defects",
      depth: "standard",
    });

    // Validate memo structure
    expect(result.memo.executiveSummary).toBeTruthy();
    expect(result.memo.citations.length).toBeGreaterThan(0);

    // Validate citations are properly formatted
    result.memo.citations.forEach((citation) => {
      expect(citation.format).toMatch(/BGE \d+ [IVX]+ \d+/);
    });
  });
});
```

---

## Appendix: Sample Output

### Research Memo Example

```markdown
# Research Memo: Mängelhaftung im Werkvertrag

**Date**: 2025-11-25
**Question**: Was sind die Voraussetzungen für Mängelhaftung nach Art. 368 OR?
**Jurisdiction**: Federal (OR), Cantonal (ZH, BE)

## Executive Summary

Die Mängelhaftung nach Art. 368 OR setzt voraus: (1) ein Mangel im Sinne einer
Abweichung vom vertraglich Vereinbarten, (2) fristgerechte Rüge, (3) kein
Ausschluss der Haftung. Die bundesgerichtliche Praxis konkretisiert diese
Voraussetzungen in zahlreichen Entscheiden.

## Key Findings

### 1. Mangelbegriff (Art. 368 Abs. 1 OR)
**Conclusion**: Ein Mangel liegt vor bei jeder Abweichung von der vereinbarten
Beschaffenheit.

**Supporting Citations**:
- BGE 142 III 234 E. 3.2 (Werkvertrag; Mangelbegriff)
- BGE 138 III 123 E. 4.1 (Abgrenzung Haupt-/Nebenmangel)

### 2. Rügefrist (Art. 370 OR)
**Conclusion**: Die Rüge muss unverzüglich nach Entdeckung erfolgen...

[continued...]

## Citations

1. **BGE 142 III 234** - Werkvertrag; Mängelhaftung ✓ Verified
2. **BGE 138 III 123** - Baurecht; Abgrenzung ✓ Verified
3. **ZH OGer 2019/45** - Kantonale Praxis ✓ Verified

## Methodology

- Sources searched: 3 (BGE, ZH, BE)
- Total results: 47
- After deduplication: 32
- Citations verified: 28/28 (100%)
- Processing time: 45.2 seconds

## Limitations

- Doctrine sources not included in this search
- Time range: 2010-present

## Recommended Next Steps

1. Review Art. 369 OR for additional remedies
2. Check cantonal practice in GE for comparison
3. Consult Gauch/Schluep/Schmid for doctrinal analysis
```

---

*Specification for /agent:researcher implementation*
