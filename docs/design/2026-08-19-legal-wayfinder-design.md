# Legal Wayfinder — Decision-Map Decomposition for Big Legal Matters

**Design Specification v1.0**
**Framework**: BetterCallClaude Legal Intelligence
**Status**: Approved design (brainstorming complete, implementation not started)
**Date**: 2026-08-19

---

## 🎯 Design Objectives

### Core Mission

Bring wayfinder-style task decomposition into BetterCallClaude: chart a legal matter too big
or too foggy for a single session as a **decision map** — a persistent file-based artifact
plus **decision tickets** — and work the tickets one at a time until the way to the
destination is clear, then hand off to the existing execution machinery.

Wayfinder's core insight, adapted to legal work: a big matter is wrapped in fog — the route
from intake to deliverable isn't visible yet. Wayfinding finds that way by resolving
**decisions** ("is the limitation period open?", "forum ZH or federal?"), not by executing
build slices. Decisions clear the fog; only when the route is clear does execution begin.

### Goals

1. **Chart/work split** — decompose a big matter into decision tickets in one session
   (`/legal-chart`), work them one at a time in later sessions (`/legal-way`).
2. **Fog-of-war replanning** — the plan is not fixed upfront; tickets graduate from fog
   only when earlier decisions make them sharp.
3. **Decision-first gate** — open legal questions are resolved as decisions *before* any
   execution stage runs; then the decision trail hands off to the existing machinery.
4. **Durable cross-session state** — the map lives as files in the matter folder, not in
   memory keys; resumable, auditable, never synced anywhere.

### Non-Goals

- ❌ Not a replacement for `/briefing` on normal matters (static plans remain the default)
- ❌ Not an execution engine — the map decides; `/legal-5step` / orchestrator execute
- ❌ No issue-tracker backend (GitHub Issues) — privacy rules this out for v1
- ❌ No helper script / DAG validator in v1 (markdown discipline suffices at 5–20 tickets)
- ❌ No automatic staleness re-validation of research resolutions

---

## 📐 Decisions Settled in Brainstorming

| # | Question | Decision |
|---|----------|----------|
| 1 | Primary job | All four goals above (full wayfinder adaptation) |
| 2 | Map storage | Local files in `bcc-output/<matter>/wayfinder/` (privacy-first) |
| 3 | User surface | Two new commands `/legal-chart` + `/legal-way`; `/briefing` gains only a routing rule |
| 4 | Decide vs do | Strict: tickets resolve decisions only; deliverables happen after handoff (per-matter override via map Notes possible) |
| 5 | Ticket types v1 | All four: `research` (AFK), `grilling` (HITL), `prototype` (HITL), `task` (HITL/AFK) |
| 6 | Implementation | Pure markdown discipline + shared skill module (Approach A); no new code |

---

## 🏗️ Components

### New Files

| File | Role |
|------|------|
| `skills/legal-wayfinder/SKILL.md` | Canonical protocol: map format, ticket types, frontier/fog rules, handoff. Single source of truth shared by both commands (the `swiss-legal-research` pattern) |
| `commands/legal-chart.md` | Chart mode: decompose a big matter into map + tickets (one session, resolves nothing) |
| `commands/legal-way.md` | Work mode: resolve one ticket per invocation, maintain the map, detect handoff |

### Touched Files

| File | Change |
|------|--------|
| `commands/briefing.md` + briefing-coordinator agent | Routing rule: high complexity or visible fog → offer `/legal-chart` instead of a static plan |
| `README.md` (repo + plugin) | Command count 27→29, skill count 16→17, feature mention |
| `CHANGELOG.md` | New entry |
| `.claude-plugin/plugin.json`, `AGENTS.md` | Version bump / counts refresh |

### Storage Layout

```
bcc-output/YYYY-MM-DD-<slug>/wayfinder/
  map.md
  tickets/
    t01-limitation-period-open.md
    t02-forum-choice-zh-or-federal.md
  assets/          ← research memos, prototype outlines linked from tickets
```

Everything lives inside the matter folder. Nothing is written to memory keys, plugin state,
or any external service.

---

## 📄 File Formats

### Map (`map.md`)

```markdown
---
matter: <slug>
status: charting | working | ready-for-handoff | handed-off
privacy-mode: strict | balanced | cloud
classifier: ollama | none          # probed at chart time, never re-probed per ticket
jurisdiction: federal | <canton>
language: DE | FR | IT | EN
---

## Destination
<1–2 lines: the deliverable this matter is finding its way to — e.g. "file-ready
Klageschrift, forum chosen, limitation cleared". Fixes scope; every session orients
to it before choosing a ticket.>

## Notes
<skills to consult (swiss-legal-research, privacy-routing, swiss-citation-formats),
standing preferences. Per-matter "plan, don't do" override is expressed here if needed.>

## Decisions so far
<!-- index, one line per resolved ticket: enough to judge relevance, link holds detail -->
- [Limitation period open?](tickets/t01-limitation-period-open.md) — yes; Art. 77 CO absolute deadline runs to 2027-03

## Not yet specified
<!-- fog: in-scope questions you can sense but cannot phrase sharply yet; graduates
     as the frontier advances. Never pre-sliced into ticket-sized pieces. -->

## Out of scope
<!-- work consciously ruled beyond the destination + why; never graduates -->
```

The map is an **index, not a store**: a decision lives in exactly one place — its ticket —
so the map gists and links, never restates.

### Ticket (`tickets/tXX-<slug>.md`)

```markdown
---
id: t01
title: Limitation period open?
type: research          # research | grilling | prototype | task
status: open            # open | resolved | ruled-out
blocked-by: []          # ticket ids that must be resolved first
claimed-in: ""          # session stamp set by /legal-way when claiming
---

## Question
<the decision this ticket resolves, sized to one agent session>

## Resolution            <!-- filled on close -->
<the decision + evidence; assets linked, never pasted>
```

**Naming**: refer to tickets by title in everything the attorney reads, never bare ids.
Ids ride inside the linked name.

### Frontier

The **frontier** is every ticket with `status: open`, an empty `claimed-in`, and all
`blocked-by` tickets `status: resolved`. The model computes it by reading the files —
sufficient at legal-matter scale (5–20 tickets).

---

## 🔄 Command Flows

### `/legal-chart <matter>` — one session, charts only

1. **Name the destination.** Grill the attorney (one question at a time) to pin the
   deliverable. The destination fixes scope, so it is settled first.
2. **Breadth-first grill.** Fan out across the whole matter — jurisdiction, parties'
   positions, limitation, forum, evidence availability, client risk appetite — never deep
   on any one thread.
   **Early exit:** if no fog surfaces, the matter fits a normal briefing — stop and
   suggest `/briefing` or `/legal-5step` instead of creating a map.
3. **Probe classifier capability** (`ollama_check_status`) and create the map
   (`status: charting`, fog sketched into *Not yet specified*).
4. **Create the tickets that are sharp now**, then wire `blocked-by` edges in a second
   pass (files need ids before they can reference each other).
5. **Fire research tickets in parallel** — researcher agent via subagents, MCP servers in
   standard priority order, R1/R2 enforced, privacy pre-check per the map's privacy mode.
   Memos land in `assets/`.
6. **Stop.** Charting resolves nothing itself.

### `/legal-way [ticket]` — one ticket per invocation

1. **Load the map** (the low-res view, not every ticket body). If several maps exist in
   the working folder, list them and ask which.
2. **Pick the ticket** — the named one, else the lowest-numbered frontier ticket. **Claim it**
   (`claimed-in` stamp) before any work; refuse tickets already claimed.
3. **Resolve by type:**
   - **research** (AFK): researcher agent + MCP; memo in `assets/`; every citation via
     `swiss-caselaw:cite`, never constructed by hand (R1); quotations verbatim (R2).
   - **grilling** (HITL): conversation with the attorney, one question at a time —
     client facts, priorities, risk appetite. The agent never answers for the human.
   - **prototype** (HITL): a cheap concrete artifact to react to — outline of the
     Klageschrift, rough clause structure — linked from `assets/`.
   - **task** (HITL/AFK): a precise checklist handed to attorney/client (gather contract
     file, obtain court records) or driven alone where possible; resolved when done,
     recording resulting facts later tickets depend on.
4. **Record**: fill `## Resolution`, set `status: resolved`, append the one-line gist to
   the map's *Decisions so far*.
5. **Maintain the map**: graduate newly-sharp fog into tickets (create-then-wire); rule
   mis-scoped tickets `ruled-out` with a line in *Out of scope*; update or delete tickets
   the decision invalidates.
6. **Stop.** Research tickets are exempt from the one-per-invocation rule.

### Handoff

The `/legal-way` invocation that resolves the last ticket and graduates the last fog sets
`status: ready-for-handoff` and — instead of stopping — emits a **handoff pack**
(destination + Decisions so far + linked assets) and routes to `/legal-5step` or the
orchestrator. The pack is shaped to feed the
orchestrator's existing *Briefing-Sourced Execution* protocol — no orchestrator changes
required. Optional `--gate` pre-builds a `/legal-goal` record so execution runs under the
worker–evaluator loop from day one.

---

## 🔌 Integration

- **Briefing routing**: when the coordinator's complexity score is high, or the would-be
  plan contains decisions depending on other open decisions, it offers:
  *"This matter is too foggy for a static plan — chart it instead?"* → `/legal-chart`.
  Nothing else in `/briefing` changes.
- **Natural-language equivalents** (Italian/English, like sibling commands):
  "traccia la mappa" / "chart the matter" → `/legal-chart`;
  "prossima tessera" / "next ticket" → `/legal-way`.
- **Plugin scope constraint** applies: tickets resolve via BetterCallClaude agents,
  skills, and MCP servers exclusively.

---

## 🔒 Privacy (Anwaltsgeheimnis)

- Map, tickets, and assets live **only** in the local matter folder — never in memory
  keys, never synced anywhere. Same privilege posture as 5-step outputs.
- `privacy-mode` in map frontmatter governs every ticket: `strict` → automated
  pre-check before any cloud MCP call; `balanced` → privileged content routed local-only,
  cloud receives sanitised content. The PreToolUse hook keeps guarding writes regardless.
- **No-ollama degradation** (map `classifier: none`), following the existing
  `privacy-routing` decision matrix — fail-closed, never "just send it":

  | Content | Ollama available | Ollama missing (`classifier: none`) |
  |---------|------------------|-------------------------------------|
  | PUBLIC | cloud preferred | cloud OK |
  | CONFIDENTIAL | local preferred | anonymize → cloud + warning |
  | PRIVILEGED / undeterminable (strict) | local required | no automated clear: stay local-only, or ask the attorney directly (HITL confirm) before any cloud call |

- A research ticket touching privileged facts does not hard-fail the map when no
  classifier exists: it converts to conversation — ask the attorney to reformulate the
  question in anonymous terms (standard anonymization guidance), then proceed as
  CONFIDENTIAL.

---

## 🧭 Edge Cases

- **Concurrent sessions**: `claimed-in` stamp; `/legal-way` refuses an already-claimed ticket.
- **Multiple maps** in one working folder: list and ask.
- **Dead map** (fog non-empty, nothing graduatable, no open tickets): surface to the
  attorney — the destination needs redrawing or external input is missing (→ `task` ticket).
- **Outgrown ticket**: split into new tickets + fog; close the original with a pointer.
- **Stale research**: ticket Notes may carry a re-validate flag; no automatic machinery in v1.
- **Per-matter execution override**: map Notes may explicitly carry execution into
  tickets (wayfinder's override rule); absent that, strict decide-then-hand-off applies.

---

## ✅ Validation & Rollout

- Pure markdown — CI frontmatter validation covers the new command and skill files
  automatically; no unit tests (consistent with sibling commands).
- README counts: 27→29 commands, 16→17 skills; CHANGELOG entry; version bump;
  AGENTS.md counts refreshed.
- Rollout: one release, no feature flag (new commands are additive and discoverable
  via `/help`).
