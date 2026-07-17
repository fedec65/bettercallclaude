# BetterCallClaude Agent Architecture

> **Version**: v3.1.0
> **Status**: Approved for Implementation
> **Last Updated**: 2025-11-25

## Executive Summary

BetterCallClaude implements a **dual-interface architecture** combining granular commands for precise control with autonomous agents for task delegation. This design serves Swiss lawyers who need both fine-grained control over legal operations and the ability to delegate complex multi-step workflows.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Agent Catalog](#agent-catalog)
3. [Autonomy Control System](#autonomy-control-system)
4. [Case Context System](#case-context-system)
5. [Agent Orchestration](#agent-orchestration)
6. [Audit Trail System](#audit-trail-system)
7. [Error Handling & Checkpoints](#error-handling--checkpoints)
8. [Custom Agent Framework](#custom-agent-framework)
9. [Implementation Priorities](#implementation-priorities)

---

## Architecture Overview

### Dual Interface Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     LAWYER INTERFACE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GRANULAR COMMANDS              DELEGATION AGENTS               │
│  ─────────────────              ─────────────────               │
│  /legal-search-bge              /agent-researcher               │
│  /legal-cite-check              /agent-strategist               │
│  /legal-translate               /agent-drafter                  │
│  /legal-format                  /agent-litigator                │
│                                                                 │
│  → Single action                → Multi-step workflow           │
│  → Immediate result             → Progress updates              │
│  → Full user control            → Checkpoint confirmations      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     SHARED INFRASTRUCTURE                       │
├─────────────────────────────────────────────────────────────────┤
│  MCP Servers: bge-search, entscheidsuche, fedlex-sparql,        │
│               legal-citations, onlinekommentar,                 │
│               legal-persona, tas-jurisprudence, swiss-caselaw,  │
│               ollama                                            │
│  Case Context: Serena memory persistence                        │
│  Verification: Citation validation layer                        │
│  Audit: Anwaltsgeheimnis-compliant logging                      │
└─────────────────────────────────────────────────────────────────┘
```

### Core Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Lawyer Control** | Configurable autonomy levels for every agent |
| **Context Continuity** | Shared case context across all agents |
| **Audit Compliance** | Full traceability for Anwaltsgeheimnis |
| **Graceful Degradation** | Checkpoint-based error recovery |
| **Extensibility** | Firms can create custom agents |

---

## Agent Catalog

### Category A: Core Legal Intelligence

| Agent | Purpose | Complexity | MCP Dependencies |
|-------|---------|------------|------------------|
| `/agent-researcher` | Deep legal research with multi-source synthesis | High | entscheidsuche, bge-search, fedlex-sparql, swiss-caselaw, onlinekommentar |
| `/agent-strategist` | Case strategy and risk assessment | High | All research MCPs + legal-citations |
| `/agent-drafter` | Swiss-compliant document generation | Medium-High | legal-citations, swiss-caselaw, templates |

### Category B: Swiss Registry Agents

| Agent | Purpose | Registry | Unique Value |
|-------|---------|----------|--------------|
| `/agent-handelsregister` | Commercial registry operations | Zefix/cantonal HR | Company searches, filing prep, change tracking |
| `/agent-grundbuch` | Land registry transactions | Cantonal Grundbuch | Title searches, encumbrance checks, transfer prep |
| `/agent-betreibung` | Debt collection (SchKG) | Betreibungsamt | Procedure tracking, form generation, deadline calc |

### Category C: Quality & Compliance

| Agent | Purpose | Scope | Output |
|-------|---------|-------|--------|
| `/agent-citation-checker` | Citation verification & currency | All documents | Verification report, outdated alerts |
| `/agent-compliance` | Regulatory compliance scanning | Multi-regulation | Compliance matrix, risk flags |
| `/agent-conflict-checker` | Conflict of interest detection | Client database | Clearance memo, conflict map |

### Category D: Productivity

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| `/agent-summarizer` | Document/case summarization | Any document | Executive summary, action items |
| `/agent-translator` | Legal translation (DE/FR/IT/EN) | Any text | Translated text with terminology precision |
| `/agent-deadline-tracker` | Procedural deadline management | Case file | Calendar, alerts, deadline report |

---

## Autonomy Control System

### Three Autonomy Modes

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTONOMY LEVELS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 CAUTIOUS (--mode cautious)                                  │
│  ────────────────────────────                                   │
│  • Confirms before EACH significant action                      │
│  • Shows reasoning at every step                                │
│  • User approves: search queries, source selection, conclusions │
│  • Best for: High-stakes matters, learning the system           │
│                                                                 │
│  ⚖️ BALANCED (--mode balanced) [DEFAULT]                        │
│  ────────────────────────────────────────                       │
│  • Confirms at KEY CHECKPOINTS only                             │
│  • Shows progress updates                                       │
│  • User approves: strategy direction, final deliverable         │
│  • Best for: Standard workflow, trusted process                 │
│                                                                 │
│  🚀 AUTONOMOUS (--mode autonomous)                              │
│  ─────────────────────────────────                              │
│  • Runs to COMPLETION with minimal interruption                 │
│  • Delivers final result with audit trail                       │
│  • User reviews: final output only                              │
│  • Best for: Routine tasks, time pressure, trusted agents       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Usage Examples

```bash
# High-stakes litigation - maximum control
/agent-strategist --mode cautious "Müller vs. ABC AG"

# Standard research - checkpoint confirmations
/agent-researcher --mode balanced "BGE precedents on Werkvertrag"

# Routine deadline calculation - full delegation
/agent-deadline-tracker --mode autonomous
```

### Autonomy Inheritance Rules

| Scenario | Behavior |
|----------|----------|
| Sub-agent invocation | Inherits parent's autonomy mode |
| Error during execution | Auto-escalates to cautious mode |
| Explicit override | `--mode` flag on sub-agent takes precedence |

---

## Case Context System

### Case Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    CASE CONTEXT FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /case-create "Müller vs. ABC AG" --type litigation             │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────┐                        │
│  │         CASE CONTEXT                │                        │
│  │  ─────────────────────────          │                        │
│  │  • Case ID: MUL-2025-001            │                        │
│  │  • Type: Litigation                 │                        │
│  │  • Jurisdiction: ZH                 │                        │
│  │  • Languages: DE, EN                │                        │
│  │  • Key dates, parties, facts        │                        │
│  │  • Agent history & findings         │                        │
│  └─────────────────────────────────────┘                        │
│       │                                                         │
│       ▼                                                         │
│  ALL AGENTS automatically inherit case context                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Case Commands

| Command | Purpose |
|---------|---------|
| `/case-create` | Initialize new case with metadata |
| `/case-open` | Load existing case context |
| `/case-close` | Archive case, preserve history |
| `/case-list` | Show all active cases |
| `/case-summary` | Generate case status overview |
| `/case-export` | Export case data for external use |

### Context Data Structure

```typescript
interface CaseContext {
  // Identity
  caseId: string;
  title: string;
  type: 'litigation' | 'corporate' | 'contract' | 'regulatory' | 'other';

  // Jurisdiction
  jurisdiction: {
    federal: boolean;
    cantons: Canton[];
    languages: ('DE' | 'FR' | 'IT' | 'EN')[];
  };

  // Parties
  parties: {
    client: Party;
    opposing: Party[];
    related: Party[];
  };

  // Timeline
  keyDates: {
    opened: ISO8601;
    deadlines: Deadline[];
    milestones: Milestone[];
  };

  // Facts & Issues
  facts: Fact[];
  legalIssues: LegalIssue[];

  // Agent History
  agentHistory: AgentExecution[];
  findings: Finding[];
  documents: DocumentRef[];
}
```

---

## Agent Orchestration

### Multi-Agent Invocation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  AGENT ORCHESTRATION ENGINE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Request                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                        │
│  │  PRIMARY AGENT      │                                        │
│  │  ─────────────────  │                                        │
│  │  Analyzes task      │                                        │
│  │  Identifies needs   │──────┐                                 │
│  └─────────────────────┘      │                                 │
│                               ▼                                 │
│                    ┌──────────────────────┐                     │
│                    │  DEPENDENCY CHECK    │                     │
│                    │  ──────────────────  │                     │
│                    │  "Need research?"    │                     │
│                    │  "Need citations?"   │                     │
│                    └──────────────────────┘                     │
│                         │           │                           │
│              ┌──────────┘           └──────────┐                │
│              ▼                                 ▼                │
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │  SUB-AGENT          │         │  SUB-AGENT          │        │
│  │  /agent-researcher  │         │  /agent-citation-   │        │
│  │                     │         │  checker            │        │
│  └─────────────────────┘         └─────────────────────┘        │
│              │                             │                    │
│              └──────────┬──────────────────┘                    │
│                         ▼                                       │
│              ┌──────────────────────┐                           │
│              │  RESULT AGGREGATION  │                           │
│              └──────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Orchestration Rules

| Rule | Description |
|------|-------------|
| **Depth Limit** | Max 3 levels of agent nesting |
| **Cycle Prevention** | Agent cannot invoke itself or create circular dependencies |
| **Context Inheritance** | Sub-agents inherit case context + parent agent context |
| **Autonomy Inheritance** | Sub-agents inherit parent's autonomy mode (unless overridden) |
| **Result Propagation** | Sub-agent results flow back to parent for integration |

### Example: Complex Workflow

```bash
/agent-strategist --mode balanced "Prepare case strategy for Müller vs. ABC AG"

# Execution flow:
# 1. strategist analyzes case facts
# 2. strategist invokes → /agent-researcher (find relevant BGE)
# 3. researcher returns findings
# 4. strategist invokes → /agent-citation-checker (verify sources)
# 5. citation-checker returns verification
# 6. strategist synthesizes strategy memo
# 7. strategist invokes → /agent-deadline-tracker (procedural timeline)
# 8. Final deliverable: Complete strategy package
```

---

## Audit Trail System

### Anwaltsgeheimnis Compliance

The audit system ensures full traceability while protecting client confidentiality.

### Audit Log Schema

```typescript
interface AgentAuditLog {
  // Identity
  logId: string;
  timestamp: ISO8601;

  // Context
  caseId: string;
  userId: string;           // Anonymizable
  firmId: string;

  // Agent Execution
  agentId: string;
  agentVersion: string;
  autonomyMode: 'cautious' | 'balanced' | 'autonomous';

  // Actions
  actions: AgentAction[];

  // Data Access
  sourcesAccessed: Source[];
  documentsRead: DocRef[];
  documentsWritten: DocRef[];

  // Results
  outcome: 'success' | 'partial' | 'failed' | 'cancelled';
  deliverables: Deliverable[];

  // Error Handling
  errors: ErrorRecord[];
  checkpoints: Checkpoint[];
  rollbacks: RollbackRecord[];
}

interface AgentAction {
  actionId: string;
  timestamp: ISO8601;
  type: 'search' | 'analyze' | 'generate' | 'invoke_agent' | 'checkpoint' | 'user_confirm';
  description: string;
  inputs: Record<string, any>;  // Sanitized
  outputs: Record<string, any>; // Summarized
  duration_ms: number;
  subAgentId?: string;
}
```

### Audit Levels by Mode

| Mode | Logging Detail |
|------|----------------|
| **Cautious** | Every action with full I/O, user confirmations recorded |
| **Balanced** | Checkpoints, major decisions, search summaries |
| **Autonomous** | Start/end, deliverables, error states |

### Data Protection

| Feature | Implementation |
|---------|----------------|
| **Anonymization** | Client names → Client-A, Client-B in logs |
| **Encryption** | Full content encrypted at rest |
| **Retention** | 10-year retention (Swiss legal requirement) |
| **Access Control** | Lawyer: own cases, Admin: aggregated/anonymized |
| **Immutability** | Append-only audit logs |

---

## Error Handling & Checkpoints

### Checkpoint Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   CHECKPOINT SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agent Execution Timeline                                       │
│  ═══════════════════════                                        │
│                                                                 │
│  START ──●──────●──────●──────●──────●────── END               │
│          │      │      │      │      │                          │
│         CP1    CP2    CP3   ERROR   RECOVERY                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Checkpoint Types

| Type | Trigger | Contains |
|------|---------|----------|
| **Auto** | Every 5 minutes or after major action | Full state snapshot |
| **User** | User confirmation in cautious/balanced | State + user decision |
| **Pre-External** | Before external API call | State before risky operation |
| **Pre-SubAgent** | Before invoking sub-agent | Parent state preserved |

### Error Recovery Protocol

Three-phase error handling with graceful degradation:

1. **ROLLBACK**: Restore last known good state from checkpoint
2. **PRESERVE**: Save partial results completed before failure
3. **ESCALATE**: Switch to cautious mode for remaining work

### Recovery Options

When an agent fails, the user receives:
- Checkpoint restoration status
- Partial results summary
- Options: Retry, Continue with partial, Manual mode, Export and stop

---

## Custom Agent Framework

### Agent Extension Architecture

Firms can create custom agents using YAML definitions without coding.

### Custom Agent Definition Format

```yaml
# .bettercallclaude/agents/ip-specialist.yaml
agent:
  name: "ip-specialist"
  namespace: "firm"  # Results in /agent-firm:ip-specialist
  version: "1.0.0"

  description: "Specialized agent for intellectual property matters"

  extends: "researcher"  # Inherit from built-in agent

  config:
    default_autonomy: "balanced"
    max_sub_agents: 2
    checkpoint_frequency: "3min"

  workflow:
    - step: "classify_ip_type"
      description: "Determine patent/trademark/copyright/trade-secret"

    - step: "search_ip_registers"
      invoke_mcp: "swissreg"

    - step: "prior_art_search"
      invoke_agent: "researcher"
      parameters:
        focus: "patent_prior_art"

    - step: "infringement_analysis"
      custom_logic: true
      template: "ip_infringement_memo"

  templates:
    - "ip_infringement_memo"
    - "patent_application_draft"

  mcp_dependencies:
    - "swissreg"
    - "espacenet"

  permissions:
    required_role: "ip_practice_group"
```

### Customization Levels

| Level | Description | Example |
|-------|-------------|---------|
| **Configure** | Adjust built-in agent parameters | Change default autonomy, templates |
| **Extend** | Add steps to existing workflow | Add IP-specific search to researcher |
| **Compose** | Chain multiple agents | Intake → Research → Draft → Review |
| **Create** | Build entirely new agent | Custom compliance workflow |

---

## Implementation Priorities

### MVP Agent Roster

| Priority | Agent | Rationale | Effort |
|----------|-------|-----------|--------|
| **P0** | `/agent-researcher` | Core value prop, enables others | 3 weeks |
| **P0** | `/agent-citation-checker` | Quality assurance, builds trust | 1 week |
| **P1** | `/agent-summarizer` | Quick wins, broad use | 1 week |
| **P1** | `/agent-strategist` | High value for litigation | 2 weeks |
| **P1** | `/agent-drafter` | Productivity multiplier | 2 weeks |
| **P2** | `/agent-handelsregister` | Swiss differentiation | 2 weeks |
| **P2** | `/agent-betreibung` | Unique workflow | 2 weeks |
| **P2** | `/agent-deadline-tracker` | Risk mitigation | 1 week |
| **P3** | `/agent-grundbuch` | Specialized practice | 2 weeks |
| **P3** | `/agent-translator` | Multilingual support | 1 week |
| **P3** | `/agent-compliance` | Enterprise feature | 2 weeks |
| **P3** | `/agent-conflict-checker` | Ethics requirement | 1 week |

**Total: 12 agents | ~20 weeks development**

### Implementation Phases

**Phase 1 (Weeks 1-4)**: Foundation
- Agent base class implementation
- Checkpoint system
- Audit logging
- `/agent-researcher` (P0)
- `/agent-citation-checker` (P0)

**Phase 2 (Weeks 5-8)**: Core Agents
- `/agent-summarizer` (P1)
- `/agent-strategist` (P1)
- `/agent-drafter` (P1)
- Case context system

**Phase 3 (Weeks 9-14)**: Swiss Specialists
- `/agent-handelsregister` (P2)
- `/agent-betreibung` (P2)
- `/agent-deadline-tracker` (P2)
- Custom agent framework

**Phase 4 (Weeks 15-20)**: Extended Catalog
- Remaining P3 agents
- Enterprise features
- Performance optimization

---

## Appendix: Technical Specifications

### Agent Base Class Interface

See `src/agents/base.py` and `src/agents/base.ts` for implementation.

### MCP Server Requirements

| MCP Server | Purpose | Status |
|------------|---------|--------|
| bge-search | Federal Supreme Court search | Implemented |
| entscheidsuche | Swiss court decision search (incl. cantonal) | Implemented |
| fedlex-sparql | Federal law SPARQL queries | Implemented |
| legal-citations | Citation extraction/verification | Implemented |
| onlinekommentar | Legal commentary search | Implemented |
| legal-persona | Judicial persona analysis, deadlines, intake forms | Implemented |
| tas-jurisprudence | CAS/TAS sports arbitration awards | Implemented |
| swiss-caselaw | Case-law search, citation graphs, doctrine | Implemented |
| ollama | Local privacy classification | Implemented |

### Performance Requirements

| Metric | Target |
|--------|--------|
| Agent startup | < 500ms |
| Checkpoint creation | < 200ms |
| Sub-agent invocation | < 1s |
| Audit log write | < 100ms |
| Context load | < 300ms |

---

*Document generated by BetterCallClaude architecture planning session*
