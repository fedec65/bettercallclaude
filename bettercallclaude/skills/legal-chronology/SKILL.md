---
name: legal-chronology
description: "Legal chronology builder — turns case documents (contracts, correspondence, court filings, expert reports) into a sourced legal timeline. Every event carries mandatory provenance (document + locus), an undisputed/alleged/contested status with attribution, explicit date conflicts (never silently resolved), evidentiary gaps, and optional deadline markers via legal-persona compute_deadlines. Trigger when: building a case chronology, Sachverhalt timeline, contested facts table, or Verjährung overview from documents. Do NOT trigger for: single-document analysis (swiss-document-analysis), citation formatting (swiss-citation-formats), or research without case documents (swiss-legal-research)."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_legal-persona__compute_deadlines
---

# Legal Chronology

You are the legal chronology method for BetterCallClaude. You turn the documents of a case into a **legal timeline the way a lawyer actually reads a case**: every event carries provenance, a contested/undisputed status, and feeds deadline computation.

## The One Non-Negotiable Rule

**No event without a source.** Every event MUST cite its document and locus (page/paragraph/section). An event without provenance must never appear in any output — this is R1/R2 discipline applied to facts. The render script (`scripts/timeline-render.mjs validate`) rejects source-less events; do not try to work around that.

## Event Model

Every event conforms to `references/event-schema.md`:

| Field | Rule |
|---|---|
| `date` | Normalised ISO `YYYY-MM-DD`. Partial dates ("March 2024") keep `precision: month` (or `year`); never invent a day. |
| `event` | One sentence, neutral factual wording — no argumentation, no evaluation. |
| `source` | **Mandatory**: `{doc, locus}` — document id + page/paragraph. Multiple sources allowed (multilingual duplicates). |
| `status` | `undisputed` \| `alleged` (one party asserts, other silent) \| `contested` (asserted and denied) — always with `attribution` ("Party A alleges delivery on 3.3.; Party B disputes"). |
| `parties` | Normalised names from the party register (`references/party-register.md`). |
| `conflicts` | If two documents date the same event differently, record BOTH dates with their sources and flag the discrepancy — **never silently pick one**. |

## Procedure

### Step 1: PARTY REGISTER
Build or load the party register (`references/party-register.md`): normalised name, aliases seen in documents, role (Kläger/Beklagte, venditore/acquirente, ...). All party references in events use the normalised name.

### Step 2: EXTRACTION (delegated)
Per document, the `chronology-builder` agent extracts event candidates: structural read (document type, date of document, parties) → dated facts → event candidates conforming to the schema. Dates are normalised per `references/date-normalization.md` (DE/FR/IT/EN → ISO).

### Step 3: RECONCILIATION
Merge candidates:
- **Same event, multiple documents/languages** → one event, multiple sources (e.g. DE contract + FR letter describing the same delivery).
- **Same event, different dates** → one event with `conflicts` listing every dated variant + its source, flagged.
- **Status assignment**: `undisputed` when all sources agree and no party denies; `alleged` when asserted by one party, unaddressed by the other; `contested` when asserted and denied — with attribution.

### Step 4: GAPS AND DEADLINES
- **Evidentiary gaps**: any documented period of ≥ 30 days with no events is flagged as a gap (render script injects gap rows) — helps spot missing evidence.
- **Deadlines** (only when `--deadlines`): map events to time limits per `references/deadline-mapping.md`:
  - **Procedural** (notification-type events: service of judgment, order, decision) → `legal-persona` `compute_deadlines(procedureType, notificationDate, canton, language)`. Produces a computed marker with holidays/judicial recess handling. Note the tool's scope: ZPO Art. 142-149, BGG Art. 46/100-101 only.
  - **Substantive limitation (Verjährung/prescription)** → the mapping table in `references/deadline-mapping.md` (event date + statutory period). Mark every such marker as **indicative — verify**; `compute_deadlines` does NOT cover Verjährung, and output must never imply it does.

### Step 5: RENDER
Events go to `bcc-output/timeline/events.json`, then render deterministically:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/timeline-render.mjs validate bcc-output/timeline/events.json
node ${CLAUDE_PLUGIN_ROOT}/scripts/timeline-render.mjs render bcc-output/timeline/events.json --outdir bcc-output/timeline --formats all
```

Outputs (per `--format`, default `all`):
1. `timeline.md` — chronological table: date | event | source | status | parties, plus conflict/gap/deadline sections.
2. `timeline.html` — self-contained interactive view: colour-coded status, gap bands, deadline markers, click-through to source list.
3. `timeline.docx` — case-file export: same table + conflict/gap/deadline summary.

## Iterative Updates (`--merge`)

A chronology is a living case artifact. On re-run with `--merge`, load the existing `events.json`, reconcile new candidates against existing events (new → added; same key, different date → conflict added; same → source appended), re-render. Never silently drop existing events.

## Reduced Mode

- `compute_deadlines` unavailable → skip procedural markers, note *(termine procedurale non calcolato — tool non disponibile)*; Verjährung markers from the mapping table remain (indicative).
- Illegible document (scan/OCR failure) → reported as unreadable in the inventory; **never** fabricate events to compensate.

## Quality Rules

- Neutral wording: the timeline records facts, not arguments ("La lettera del 3.3.2024 segnala un difetto" — not "il convenuto ha fraudolentemente...").
- Dates always rendered in one normalised display format per output language; ISO in data.
- A deadline marker must anchor to a sourced event — no floating deadlines.
- Include the professional disclaimer: the chronology is a working aid; dates, statuses and deadlines must be verified against the case file. Deadline computations (including `compute_deadlines` output) are auxiliary, not legal advice.

## Integration

- Invoked by `/legal-timeline` (orchestration) and used as worker method in the `timeline-sourced` goal-loop profile (evaluator: `citation-specialist`).
- Receives: document inventory (+ optional party seed, date window, canton for deadlines).
- Returns: `events.json` + rendered outputs under `bcc-output/timeline/`.
