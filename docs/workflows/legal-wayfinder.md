# Legal Wayfinder Workflow - Decision Maps for Foggy Matters

**Persona**: Briefing Coordinator / Attorney 🗺️
**Purpose**: Decompose a legal matter too big or too foggy for one execution plan into a decision map, resolve every open decision ticket-by-ticket, then hand off to execution with all decisions made

---

## Overview

This workflow covers the **legal-wayfinder** protocol: the `legal-wayfinder` skill plus the `/bettercallclaude:legal-chart` and `/bettercallclaude:legal-way` commands. It is for matters where the bottleneck is *decisions*, not work.

### When to use what

| Tool | Use when | Input to execution |
|------|----------|--------------------|
| `/legal` gateway | Focused query, complexity 1-3 | Direct routing to one agent |
| `/briefing` | Complex matter, but the route to the deliverable is plannable now | Structured execution plan |
| `/legal-chart` (wayfinder) | Foggy matter: open decisions (limitation, forum, evidence availability, client risk appetite) make any plan premature | Decision map with tickets |
| `/legal-5step` | End-to-end pipeline once decisions are settled | Full pipeline output |

The rule of thumb: **`/briefing` plans the work when the decisions are clear; `/legal-chart` maps the decisions when they are not.** They connect in both directions — a fog check inside `/briefing` offers charting for high-complexity foggy matters, and `/legal-chart`'s early exit returns clear matters to `/briefing` or `/legal-5step`.

### What You'll Learn

- When a matter needs a decision map instead of an execution plan
- How charting produces the map, tickets, and fog
- How ticket-by-ticket work maintains the map
- What the handoff pack guarantees (and forbids)

### Time Investment

- **Charting session**: 15-30 minutes (attorney grilling included)
- **Per ticket**: 2-15 minutes for grilling/prototype; research tickets run AFK
- **Handoff**: automatic once the map is clear

---

## Workflow Steps

### Step 1: Chart the Matter (`/legal-chart`)

1. **Name the destination first** — the deliverable, phrased concretely ("file-ready Klageschrift", "DD report for the SPA"). The destination fixes scope.
2. **Breadth-first grilling** — one question at a time across jurisdiction, parties' positions, limitation, forum, evidence, risk appetite. Never deep on one thread; surface every open decision.
3. **Early exit** — if no open decisions surface, no map is created; the command points you to `/briefing` or `/legal-5step` instead.
4. **Create the map** at `bcc-output/YYYY-MM-DD-<slug>/wayfinder/map.md` with `status: charting`, fog sketched into *Not yet specified*.
5. **Create tickets** that are sharp now (`tickets/tXX.md`), then wire `blocked-by` edges in a second pass. Everything not yet phrasable stays in the fog.
6. **Fire research tickets** as parallel subagents — the only resolutions recorded during charting.

### Step 2: Work Tickets (`/legal-way`)

- One ticket per invocation; the default pick is the lowest-numbered **frontier** ticket (open, unclaimed, all blockers resolved or ruled out). Claiming stamps `claimed-in` before any work.
- Resolve by type:
  - **research (AFK)** — MCP servers in standard priority order; memo in `assets/`; R1 (cite via `cite`) and R2 (verbatim quotations) enforced.
  - **grilling (HITL)** — questions to the attorney/client, one at a time; never answered for the human.
  - **prototype (HITL)** — cheap artifact to react to (outline, clause skeleton) linked from `assets/`.
  - **task (HITL/AFK)** — checklist work that unblocks a decision.
- After each resolution: update **Decisions so far**, graduate newly sharp fog into tickets, rule out tickets that fall outside the destination, and mark invalidated ones.

### Step 3: Hand Off

- The gate: **every ticket `resolved` or `ruled-out` AND no fog** — claimed-but-unfinished tickets count as open, so in-flight work in another session blocks handoff.
- On a clear map: `status: ready-for-handoff`, emit the **handoff pack** (destination + decisions + linked assets), route to `/legal-5step` or the orchestrator. `--gate` pre-builds a `/legal-goal` record for worker-evaluator execution.

---

## Map File Layout

```
bcc-output/YYYY-MM-DD-<slug>/wayfinder/
├── map.md          # destination, notes, decisions so far, fog, out-of-scope
├── tickets/        # t01.md, t02.md, ... (status, blocked-by, claimed-in, resolution)
└── assets/         # research memos, prototypes
```

## Privacy

No separate privacy rules: the map inherits the matter's privacy mode (`strict`/`balanced`/`cloud`), and privileged content follows the existing `privacy-routing` matrix — including the fail-closed degradation when ollama is not installed.

## Honest Termination

The map never presents an unresolved matter as clear. If the fog cannot be graduated and no ticket is workable (dead map), the protocol surfaces the block to the attorney instead of pretending completion — the destination needs redrawing, or external input is missing (itself a `task` ticket).
