---
description: "Iterate a worker-evaluator cycle against a Goal Record until the success condition is met or a stop limit is reached. The evaluator (a different agent than the worker) judges each iteration using MCP verification tools. Produces an auditable verdict trail and a final MET / NOT MET status."
---

# /legal-loop — Worker-Evaluator Iteration Cycle

You are invoked via `/bettercallclaude:legal-loop`. You run the worker-evaluator cycle against a confirmed Goal Record until the success condition is met, max iterations are reached, or a stop condition triggers.

**Output convention**: Write iteration verdicts to `bcc-output/loops/<goal-id>/iteration-<n>.md`, summary to `summary.md`, final artifact to `final/`. In chat, give the convergence summary and final MET/NOT MET status. See `skills/shared/SKILL.md`.

## Parameters

- First positional argument: a Goal Record id or path (e.g., `goal-1782651000-citations-clean`).
- `--max-iterations=N`: override the Goal Record's max iterations.
- `--dry-run`: execute one work step + one verdict, then stop (no looping). Useful for testing.
- `--resume`: resume a previously stopped loop from the last iteration.
- `--verbose`: show full verdict details in chat after each iteration (default: show only score + finding count).

**Natural language equivalents**:
- "esegui il loop" or "run the loop" → start the loop
- "prova secca" or "dry run" → `--dry-run`
- "riprendi" or "resume" → `--resume`
- "massimo 3 giri" or "max 3 rounds" → `--max-iterations=3`

## Pre-Flight Checks

Before starting the loop, verify:

1. **Goal Record exists and is confirmed.** If not found or status is not `confirmed`, refuse:
   ```
   ERROR: Goal Record <id> not found or not confirmed.
   Run /legal-goal to define and confirm a goal first.
   ```

2. **Worker-evaluator separation.** The evaluator agent/role MUST differ from the worker. If they resolve to the same agent:
   ```
   REFUSED: worker and evaluator resolve to the same agent/role (<name>).
   The loop cannot proceed. Use /legal-goal to assign a distinct evaluator.
   ```

3. **Target artifact or context exists.** The inputs specified in the Goal Record must be accessible.

## Iteration Cycle

### Step 1: Privacy Pre-Check

Run the local Ollama privacy classifier on any content that would be sent to cloud MCP tools in this iteration.

- If `privacy_mode = strict` and privileged content is detected: **HALT immediately**.
  ```
  HALTED: Privacy violation detected. Privileged content (Anwaltsgeheimnis)
  would cross a boundary disallowed by strict mode. Loop stopped.
  Manual review required before proceeding.
  ```
- If `privacy_mode = balanced`: route privileged content through local tools only; cloud tools receive sanitised content.
- If `privacy_mode = cloud`: proceed (user has explicitly accepted cloud processing).

The privacy check runs EVERY iteration, not just the first.

### Step 2: Work Step

Invoke the worker agent/command to produce or revise the artifact.

- **First iteration**: worker produces the initial artifact from the Goal Record inputs.
- **Subsequent iterations**: worker receives the previous iteration's FAIL findings as instructions. The worker is told precisely what is still wrong and must fix exactly those issues. The worker does NOT see the score or pass/fail status — only the findings list.

The worker operates under all existing BetterCallClaude rules:
- R1 (no self-constructed citation strings) is enforced
- R2 (no quotation without verbatim source) is enforced
- Privacy routing applies
- Output conventions apply

### Step 3: Verdict Step

Invoke the evaluator (the `legal-evaluator` skill) which:
1. Runs the authoritative MCP checks specified in the Goal Record
2. Applies R1/R2 enforcement on all citations/quotations
3. Returns a structured Verdict: `pass`, `score`, `findings`

The evaluator is a DIFFERENT agent/role than the worker — this is the fundamental guarantee.

### Step 4: Decision

| Condition | Action |
|-----------|--------|
| `pass: true` | Record success. Stop. Emit final artifact + verdict trail. Status: **MET**. |
| `pass: false` AND iterations remain AND no stop condition triggered | Feed findings to worker. Go to Step 1 for next iteration. |
| Max iterations reached | Stop. Emit best artifact + open findings. Status: **NOT MET**. |
| No-progress (score unchanged or decreased for 2 consecutive iterations) | Stop. Emit best artifact + stagnation notice. Status: **NOT MET (stagnation)**. |
| Privacy violation | Halt immediately. Status: **HALTED (privacy)**. |

### Step 5: Trail Persistence

After each iteration, persist:

```
bcc-output/loops/<goal-id>/
  iteration-1.md    # Verdict from iteration 1
  iteration-2.md    # Verdict from iteration 2
  ...
  summary.md        # Score trajectory, final status, residual findings
  final/            # The accepted artifact (last version)
```

Each `iteration-<n>.md` contains:
```yaml
---
iteration: <n>
score: <0-100>
pass: <true|false>
finding_count: <total>
fail_count: <FAIL findings>
---

## Findings

<itemised findings list with status, check, location, detail, evidence>
```

## Stop Conditions (Non-Negotiable)

1. **Max iterations**: default from Goal Record (typically 5), user-overridable, hard cap 20. No unbounded loops.
2. **No-progress guard**: if score does not improve for 2 consecutive iterations, stop and report stagnation. This prevents infinite loops on unfixable issues.
3. **Privacy violation**: any disallowed boundary crossing halts immediately.
4. **Separation violation**: if at any point worker and evaluator resolve to the same role, halt.

## Honest Termination

**Critical rule:** on stop-without-success, the output says **NOT MET** and lists residual findings. NEVER present an unmet goal as met. NEVER round a near-miss up to success.

```
## Loop Result: NOT MET

Goal: <title>
Iterations: <n> / <max>
Final score: <score>/100
Status: NOT MET — <reason: max iterations | stagnation | privacy halt>

### Residual Findings (<count>)

<list of unresolved FAIL findings>

### Score Trajectory

| Iteration | Score | Finding Count |
|-----------|-------|---------------|
| 1         | ...   | ...           |
| 2         | ...   | ...           |
| ...       | ...   | ...           |

The artifact in `final/` represents the best version achieved but does NOT meet
the success condition. Human review is required.
```

## Success Output

```
## Loop Result: MET

Goal: <title>
Iterations: <n> / <max>
Final score: 100/100
Status: MET

All success conditions satisfied. The final artifact is in `final/`.

### Score Trajectory

| Iteration | Score | Finding Count |
|-----------|-------|---------------|
| 1         | 72    | 7             |
| 2         | 89    | 3             |
| 3         | 100   | 0             |

### Verification Summary

<brief summary of what was checked and confirmed>
```

## Safety Rules

- **Human-in-the-loop**: the loop NEVER files, sends, signs, or transmits anything. It produces drafts and verdicts; a person acts.
- **R1/R2 always on**: anti-hallucination rules are enforced inside every citation/quotation-bearing loop and cannot be disabled.
- **No worker override**: the worker cannot overrule or dismiss the evaluator's verdict. Findings are authoritative.
- **Transparency**: every iteration's verdict is persisted and visible. The user can inspect any iteration.

## Integration with Existing Commands

- `/legal-goal` creates the Goal Record that this command consumes.
- The 5-step framework (`/legal-5step`) can be used as the worker for complex matters.
- The adversarial pipeline (`/adversarial`) feeds into `adversarial-converge` profile.
- NDA triage (`/nda-triage`) feeds into `nda-batch-clean` profile.
- Scheduled tasks can invoke `/legal-loop` with the `reg-watch` profile.

## User Query

If the user provided additional input alongside the command invocation (e.g., a goal ID or instructions), use it to locate and run against the specified Goal Record. If no goal ID is provided and only one confirmed Goal Record exists in the current session or working folder, use that one. If ambiguous, ask.
