# Scheduling `reg-watch` — Regulatory Monitoring

The `reg-watch` profile is designed for scheduled (automated) invocation. It runs one work pass + one verdict pass per execution, checking all watched legal topics for changes.

## How to Schedule

### Option A: Claude Scheduled Tasks (Cowork Desktop)

Use Claude's built-in scheduling capability to run the loop at a defined interval:

```
Schedule: Every weekday at 07:00 CET
Task: Run /legal-goal reg-watch --target="bcc-output/config/watched-topics.md"
      then /legal-loop <resulting-goal-id>
```

### Option B: External Cron / Task Scheduler

For environments with cron access (e.g., Claude Code CLI):

```bash
# Example crontab entry — run Monday-Friday at 07:00 CET
0 7 * * 1-5 claude --plugin bettercallclaude \
  --command "legal-goal reg-watch --target=watched-topics.md" \
  --then "legal-loop"
```

The exact invocation syntax depends on the Claude runtime. The principle is:
1. Define the goal (idempotent — can be re-run safely)
2. Execute the loop against that goal

### Option C: Devin Scheduled Sessions

If using Devin for automation:
1. Create a scheduled session with the prompt including the `/legal-goal reg-watch` + `/legal-loop` sequence.
2. Point it at the Swiss BetterCallClaude plugin repo/workspace.
3. Results persist in `bcc-output/loops/` for the user's review.

## Watched Topics File

Create a file listing the legal areas and provisions to monitor:

```markdown
# Watched Topics — Regulatory Monitoring

## Topics

1. **nDSG / Data Protection**
   - SR 235.1 (nDSG) — any amendment or Verordnung change
   - EDÖB enforcement decisions
   - Cantonal data protection law changes (ZH IDG, GE LIPAD)

2. **GwG / Anti-Money Laundering**
   - SR 955.0 (GwG) — threshold or scope changes
   - FINMA circulars on AML
   - New FATF recommendations adopted into Swiss law

3. **Employment Law**
   - OR Art. 319-362 amendments
   - New BGE on remote work / Homeoffice obligations
   - GAV (collective agreements) changes in watched sectors

4. **Corporate Governance**
   - Aktienrechtsrevision follow-up provisions
   - FINMA governance circulars
   - ESG reporting requirements (Gegenvorschlag)
```

Place this file at `bcc-output/config/watched-topics.md` or any path you specify via `--target`.

## Per-Run Behaviour

Each scheduled execution:
1. **Worker** queries Fedlex (fedlex-sparql) and swiss-caselaw for each topic
2. **Evaluator** verifies all topics were checked and assigns relevance (material / not material)
3. **Output** persists to `bcc-output/loops/<goal-id>/` with a timestamped report
4. Only **material changes** appear in the summary; non-material checks are logged but not surfaced

## Results Review

After each run, the user finds:
- `summary.md` — topics checked, material changes surfaced, overall MET/NOT MET
- `final/reg-watch-report.md` — the regulatory change report (only material items)
- `iteration-1.md` — the evaluator's completeness verdict

If NOT MET (e.g., a data source was unreachable), the summary clearly states which topics could not be checked and why.
