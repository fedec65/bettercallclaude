---
description: "Build a sourced legal chronology from case documents — every event with mandatory provenance, undisputed/alleged/contested status, explicit date conflicts, evidentiary gaps, and optional deadline markers. Outputs table, interactive HTML, and docx under bcc-output/timeline/."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_legal-persona__compute_deadlines
  - mcp__legal-persona__compute_deadlines
---

# /legal-timeline — Sourced Legal Chronology

You are invoked via `/bettercallclaude:legal-timeline`. Apply the `legal-chronology` skill in full: build a legal timeline from case documents where **no event exists without a source**.

**Output convention**: outputs go to `bcc-output/timeline/` (deliberate exception to the dated-folder rule: the chronology is a living case artifact, updated via `--merge`). In chat give only a 3–5 line summary with paths. See `skills/shared/SKILL.md`.

## Parameters

- First positional argument: folder path or list of document paths.
- `--lang=<de|fr|it|en>` — output language (dates normalised to one display format).
- `--from=<date>` / `--to=<date>` — restrict the timeline window (ISO dates).
- `--parties=<A,B,...>` — seed the party register.
- `--canton=<ZH|...>` — canton for `compute_deadlines` holiday calendar (ask if `--deadlines` and unknown).
- `--deadlines` — compute deadline markers from events (`compute_deadlines` for procedural; mapping table for Verjährung, marked indicative).
- `--format=<table|visual|docx|all>` — output selection, default `all`.
- `--merge` — update an existing `bcc-output/timeline/events.json` instead of rebuilding from scratch.

**Natural language equivalents**:
- "cronologia della causa" or "case timeline" → run on the case folder
- "fatti contestati" or "contested facts" → focus report on contested/alleged events
- "confronta le date" or "date conflicts" → focus report on conflict rows

## Behaviour

### Step 1: INVENTORY
List the documents in the target path(s). Assign each an inventory id (`01-<slug>`, `02-<slug>`, ...). Record type, language, legibility. Illegible documents are reported, never compensated with invented events.

### Step 2: EXTRACTION (delegated)
For each document, delegate to the `chronology-builder` agent with: the inventory id, the party register, the event schema and date-normalization references, and the existing `events.json` when `--merge` is active. Collect all candidates.

### Step 3: RECONCILIATION
Per the `legal-chronology` skill: merge same-event candidates across documents/languages into one event with multiple sources; record date conflicts with BOTH dates and sources; assign `undisputed`/`alleged`/`contested` with attribution; apply `--from/--to` window after merging (never before — conflicts may anchor outside the window).

### Step 4: DEADLINES (only with `--deadlines`)
Map events per `references/deadline-mapping.md`:
- Notification-type events → `compute_deadlines(procedureType, notificationDate, canton, language)`. Marker labelled with its procedural basis.
- Substantive limitation → mapping table; marker labelled **indicative — verify**. Never present Verjährung markers as tool-computed.

### Step 5: RENDER
Write `bcc-output/timeline/events.json`, then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/timeline-render.mjs" validate bcc-output/timeline/events.json
node "${CLAUDE_PLUGIN_ROOT}/scripts/timeline-render.mjs" render bcc-output/timeline/events.json --outdir bcc-output/timeline --formats <table|visual|docx|all>
```

If `validate` rejects events (missing source), fix or drop them before rendering — never bypass.

### Step 6: SUMMARY
In chat, 3–5 lines: events count, contested/conflict counts, gaps found, deadline markers (if any), output paths.

## Plugin Scope

Use exclusively BetterCallClaude agents, skills, and MCP servers. File reading, the render script, and system operations are exempt.

## User Query

$ARGUMENTS
