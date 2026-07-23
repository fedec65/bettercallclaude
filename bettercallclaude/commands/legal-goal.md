---
description: "Define a checkable legal success condition for /legal-loop. Accepts a named profile (citations-clean, draft-passes-gate, adversarial-converge, nda-batch-clean, reg-watch) or free-text objective. Produces a persisted Goal Record — never starts work itself."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_swiss-caselaw__search_decisions
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
---

# /legal-goal — Define a Legal Success Condition

You are invoked via `/bettercallclaude:legal-goal`. Your sole purpose is to produce a confirmed, persisted **Goal Record** that `/legal-loop` can evaluate against. You NEVER start work or execute the loop yourself.

**Output convention**: Write Goal Records to `bcc-output/goals/<id>.md`. Give in chat the full Goal Record for user confirmation. See `skills/shared/SKILL.md`.

## Parameters

- First positional argument: a profile name OR a quoted free-text objective.
- `--target=<path>`: path to target document(s) or matter context.
- `--max-iterations=N`: override default (default: 5, hard cap: 20).
- `--evaluator=<agent>`: override the default evaluator for the profile.
- `--privacy=<mode>`: privacy mode override (`strict`, `balanced`, `cloud`). Defaults to the configured mode.

**Natural language equivalents**:
- "obiettivo: citazioni pulite" or "goal: clean citations" → `citations-clean`
- "obiettivo: bozza pronta" or "goal: draft ready" → `draft-passes-gate`
- "stress test convergenza" or "adversarial convergence" → `adversarial-converge`
- "triage NDA completo" or "NDA batch clean" → `nda-batch-clean`
- "monitoraggio regolamentare" or "regulatory watch" → `reg-watch`
- "massimo 3 iterazioni" or "max 3 iterations" → `--max-iterations=3`

## Behaviour

1. **Parse input**: determine if the user provided a named profile or free-text.
2. **Profile lookup**: if a named profile, load the corresponding template (see Profiles section below).
3. **Free-text translation**: if free-text, translate it into a structured Goal Record:
   - Identify the checkable predicates (what must be true for success)
   - Determine the appropriate evaluator agent
   - Determine the appropriate worker agent/command
   - Map to MCP checks that can verify the predicates
4. **Assemble Goal Record** with all fields populated.
5. **Persist**: write to `bcc-output/goals/<id>.md` in the working folder. If no folder is connected, hold in session and warn: *"No shared folder connected. Goal Record will not survive this session."*
6. **Confirm**: echo the full Goal Record back to the user. Ask for confirmation. Do NOT start any work.

## Goal Record Format

```yaml
---
id: goal-<timestamp>-<slug>
title: <human-readable title>
profile: <profile name or "custom">
created: <ISO 8601>
status: defined
---

## Success Condition

<checkable predicates, expressed so the evaluator returns binary pass/fail>

## Configuration

- **Worker**: <agent/command that does the work>
- **Evaluator**: <judge agent — MUST differ from worker>
- **MCP checks**: <authoritative tools the evaluator will use>
- **Max iterations**: <N>
- **Stop on**: max iterations reached | no-progress (2 consecutive iterations without score improvement) | privacy violation
- **Privacy mode**: <strict | balanced | cloud>

## Inputs

- **Target**: <document path(s) or matter context>
- **Context**: <additional context from user>

## Acceptance

When the evaluator returns `pass: true` with score 100 (or profile-specific threshold), the goal is MET.
```

## Profiles

### `citations-clean` (flagship anti-hallucination gate)

| Field | Value |
|-------|-------|
| Worker | The drafting agent / whoever produced the document |
| Evaluator | `citation-specialist` |
| Success condition | Every citation validates via `validate_citation` / `review_citations`; every citation string traces to a retrieval tool result (R1); every quotation traces verbatim to a source field (R2); zero unresolved or malformed references |
| MCP checks | `validate_citation`, `review_citations`, `extract_citations` |
| Max iterations | 5 |

### `draft-passes-gate` (drafting quality gate)

| Field | Value |
|-------|-------|
| Worker | `swiss-legal-drafter` (or via `/draft`) |
| Evaluator | `swiss-judicial-analyst` |
| Success condition | All citations valid (reuse citations-clean); required Gutachten/Erwagung structure present; all playbook-mandated clauses present; no claim unsupported per `check_claim_support` |
| MCP checks | `validate_citation`, `review_citations`, `check_claim_support` |
| Max iterations | 5 |

### `adversarial-converge` (stress-test to convergence)

| Field | Value |
|-------|-------|
| Worker | `swiss-legal-advocate` (strengthens the position) |
| Evaluator | `swiss-legal-adversary` + `swiss-judicial-analyst` |
| Success condition | No unaddressed weakness above severity threshold remains, OR judicial score stabilises across two consecutive iterations (delta < 5) |
| MCP checks | Source retrieval tools for counter-argument verification |
| Max iterations | 5 |

### `nda-batch-clean` (triage completeness gate)

| Field | Value |
|-------|-------|
| Worker | `nda-triage` over a folder |
| Evaluator | Triage-completeness check (via `swiss-judicial-analyst`) |
| Success condition | Every document classified GREEN/YELLOW/RED AND every deviation mapped to a playbook threshold; zero unclassified, zero unflagged off-threshold clause |
| MCP checks | Document verification against playbook thresholds |
| Max iterations | 3 |

### `reg-watch` (scheduled regulatory monitoring)

| Field | Value |
|-------|-------|
| Worker | Query step against Fedlex / swiss-caselaw for changes on watched topics |
| Evaluator | Relevance judge (via `swiss-judicial-analyst`) |
| Success condition | All watched topics checked and a relevance decision recorded for each; only material changes reported |
| MCP checks | `search_legislation`, `search_decisions` |
| Max iterations | 1 (one work + one verdict per scheduled run) |

## Separation Enforcement

Before finalising the Goal Record, verify that the `worker` and `evaluator` fields resolve to different agents/roles. If they would be the same:

```
ERROR: Worker and evaluator cannot be the same agent/role.
Worker: <name>
Evaluator: <name>

Please specify a different evaluator with --evaluator=<agent>, or choose
a profile where the separation is pre-configured.
```

## Interaction After Confirmation

Once the user confirms:
- Update the Goal Record status from `defined` to `confirmed`.
- Inform the user: *"Goal confirmed. Run `/legal-loop <goal-id>` to start the worker-evaluator cycle."*
- Do NOT start any work. The user must explicitly invoke `/legal-loop`.

## User Query

If the user provided additional input alongside the command invocation, use it to populate the Goal Record fields (target, context, overrides). Always show the assembled record for confirmation before persisting.
