# Legal Wayfinder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/legal-chart` + `/legal-way` commands and the `legal-wayfinder` skill so big legal matters can be decomposed into decision maps and worked ticket-by-ticket, per `docs/design/2026-08-19-legal-wayfinder-design.md`.

**Architecture:** Pure markdown discipline — no new code. A skill module holds the canonical protocol (map/ticket formats, frontier, fog, privacy, handoff); two thin command gateways invoke it. Map and tickets are files under `bcc-output/<matter>/wayfinder/`. `/briefing` gains one routing rule for foggy high-complexity matters.

**Tech Stack:** Claude Code plugin markdown (YAML frontmatter + prompt bodies), existing BCC MCP servers, existing CI structure validation.

## Global Constraints

- All new files live under `bettercallclaude/` (the plugin directory that gets packaged).
- Frontmatter style: `---` fenced YAML with `description` (commands) or `name` + `description` (skills); kebab-case filenames.
- Commands end with `## User Query` section containing `$ARGUMENTS`.
- Every user-facing file must include the Plugin Scope Constraint paragraph: "For all … use **exclusively** BetterCallClaude agents, skills, and MCP servers."
- No code, no scripts, no new dependencies (spec decision #6, Approach A).
- Version bump: 4.9.6 → 4.10.0 (feature release). Counts: 27→29 commands, 16→17 skills.
- Privacy behavior must match `skills/privacy-routing/SKILL.md` decision matrix — fail-closed, never "just send it".

---

### Task 1: Skill module — `legal-wayfinder`

**Files:**
- Create: `bettercallclaude/skills/legal-wayfinder/SKILL.md`

**Interfaces:**
- Produces: the canonical protocol both commands reference — map frontmatter fields (`matter`, `status: charting|working|ready-for-handoff|handed-off`, `privacy-mode`, `classifier: ollama|none`, `jurisdiction`, `language`), ticket frontmatter fields (`id`, `title`, `type: research|grilling|prototype|task`, `status: open|resolved|ruled-out`, `blocked-by`, `claimed-in`), storage layout `bcc-output/YYYY-MM-DD-<slug>/wayfinder/{map.md,tickets/,assets/}`.

- [ ] **Step 1: Verify the skill does not exist yet (the failing check)**

Run: `test -f bettercallclaude/skills/legal-wayfinder/SKILL.md && echo EXISTS || echo MISSING`
Expected: `MISSING`

- [ ] **Step 2: Create the skill directory and file**

```bash
mkdir -p bettercallclaude/skills/legal-wayfinder
```

Then write `bettercallclaude/skills/legal-wayfinder/SKILL.md` with exactly this content:

````markdown
---
name: legal-wayfinder
description: "Decision-map decomposition for legal matters too big or too foggy for one session. Charts a map (destination, decisions so far, fog, out-of-scope) plus decision tickets under bcc-output/<matter>/wayfinder/, then works tickets one at a time until the route to the deliverable is clear, then hands off to execution. Trigger when: charting a big legal matter (/legal-chart), working the next decision ticket (/legal-way), or a briefing is too foggy for a static execution plan. Do NOT trigger for: normal matters that fit /briefing or /legal-5step, quality-gate loops (legal-goal / legal-loop), or single-question research."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_bge-search__search_bge
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_swiss-caselaw__search_decisions
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_leading_cases
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_ollama__ollama_check_status
  - mcp__plugin_bettercallclaude_ollama__ollama_classify_privacy
---

# Legal Wayfinder — Decision Maps for Big Legal Matters

A big legal matter arrives wrapped in fog: the route from intake to deliverable is not
visible yet. Wayfinding finds that route by resolving **decisions** — not by executing
work slices. The map is the plan; execution happens only after handoff.

**Plan, don't do.** Every ticket resolves a decision. Supporting memos and prototypes are
linked as assets, but no client deliverable is drafted inside the map. A matter may
override this in the map's **Notes** (carrying execution into the map); absent that,
produce decisions, not deliverables.

**Refer by name.** In everything the attorney reads, refer to a ticket by its title,
never a bare id. Ids ride inside the linked name: `[Limitation period open?](tickets/t01-limitation-period-open.md)`.

## Storage

Everything lives inside the matter folder — never in memory keys, never synced anywhere:

```
bcc-output/YYYY-MM-DD-<slug>/wayfinder/
  map.md
  tickets/
    t01-limitation-period-open.md
    t02-forum-choice-zh-or-federal.md
  assets/          ← research memos, prototype outlines linked from tickets
```

## The Map (`map.md`)

```markdown
---
matter: <slug>
status: charting | working | ready-for-handoff | handed-off
privacy-mode: strict | balanced | cloud
classifier: ollama | none
jurisdiction: federal | <canton>
language: DE | FR | IT | EN
---

## Destination
<1–2 lines: the deliverable this matter is finding its way to. Fixes scope;
every session orients to it before choosing a ticket.>

## Notes
<skills to consult (swiss-legal-research, privacy-routing, swiss-citation-formats),
standing preferences. Per-matter execution override is expressed here if needed.>

## Decisions so far
<!-- index, one line per resolved ticket: gist + link; never restate the detail -->

## Not yet specified
<!-- fog: in-scope questions you can sense but cannot phrase sharply yet -->

## Out of scope
<!-- work consciously ruled beyond the destination + why; never graduates -->
```

The map is an **index, not a store**: a decision lives in exactly one place — its
ticket. The map gists and links.

## Tickets (`tickets/tXX-<slug>.md`)

```markdown
---
id: t01
title: Limitation period open?
type: research
status: open
blocked-by: []
claimed-in: ""
---

## Question
<the decision this ticket resolves, sized to one agent session>

## Resolution
<filled on close: the decision + evidence; assets linked, never pasted>
```

### Ticket types

| Type | Mode | Resolves | Rules |
|------|------|----------|-------|
| `research` | AFK | A fact a decision waits on (precedent, statute, deadline) | Researcher agent + MCP servers; memo in `assets/`; R1 (citations only via `swiss-caselaw:cite`) and R2 (verbatim quotations) enforced |
| `grilling` | HITL | Client facts, priorities, risk appetite | Conversation with the attorney, one question at a time. **Never answer for the human** — an agent that answers its own grilling questions has broken the ticket |
| `prototype` | HITL | "How should it look/behave" | Cheap concrete artifact to react to — outline of the Klageschrift, rough clause structure — linked from `assets/` |
| `task` | HITL or AFK | Work that unblocks a decision (gather contract file, obtain court records) | Precise checklist for attorney/client, or driven alone where possible; resolution records what was done and resulting facts later tickets depend on |

## Frontier and claiming

The **frontier** is every ticket with `status: open`, empty `claimed-in`, and all
`blocked-by` tickets `status: resolved`. `/legal-way` picks the lowest-numbered frontier
ticket unless the attorney names one. Claim by setting `claimed-in` to a session stamp
(ISO date + time) **before any work**; refuse a ticket already claimed. One ticket per
`/legal-way` invocation — research tickets are the only exception (they may be batched
or fired in parallel by `/legal-chart`).

## Fog of war

The map is deliberately incomplete. Beyond the live tickets lies fog — questions you can
sense but cannot phrase sharply yet because they hang on open decisions. The test:

- **Ticket** when the question is already sharp — even if blocked.
- **Not yet specified** when it is not yet phrasable that sharply. Never pre-slice fog
  into ticket-sized pieces; one patch may graduate into several tickets, or none.

Resolving a ticket graduates whatever it made sharp: create new tickets (create-then-wire
blocking edges in a second pass), and clear each graduated patch from **Not yet
specified** so it lives only as its ticket.

## Out of scope

Fog gathers only toward the destination; work beyond it is out of scope and never
graduates. When a live ticket turns out to sit past the destination, set it
`status: ruled-out` (not resolved) and add one line to **Out of scope**: gist + why +
link. It stays out of **Decisions so far** — a scope boundary is not a step on the route.

## Edge cases

- **Outgrown ticket**: if resolving a ticket sprawls beyond one session's worth, split
  it — create the successor tickets plus any fresh fog, and close the original
  `resolved` with a pointer to its children in the Resolution.
- **Stale research**: a research resolution in fast-moving law may note
  `revalidate: true`. Re-open it only by creating a fresh ticket referencing the old
  one — never by editing a recorded resolution.

## Privacy (Anwaltsgeheimnis)

The map's `privacy-mode` governs every ticket; the PreToolUse hook keeps guarding writes
regardless. `classifier` is probed once at chart time (`ollama_check_status`) — never
re-probed per ticket. Degradation follows the `privacy-routing` decision matrix:

| Content | classifier: ollama | classifier: none |
|---------|--------------------|------------------|
| PUBLIC | cloud preferred | cloud OK |
| CONFIDENTIAL | local preferred | anonymize → cloud + warning |
| PRIVILEGED / undeterminable (strict) | local required | no automated clear: stay local-only, or ask the attorney directly before any cloud call |

A research ticket touching privileged facts with no classifier does not hard-fail the
map: convert to conversation — ask the attorney to reformulate the question in anonymous
terms, then proceed as CONFIDENTIAL. Fail closed; never "just send it".

## Handoff

When `/legal-way` resolves the last ticket and graduates the last fog, set
`status: ready-for-handoff` and — instead of stopping — emit a **handoff pack**:
destination + Decisions so far + linked assets, shaped to feed the orchestrator's
Briefing-Sourced Execution protocol. Route to `/legal-5step` or the orchestrator. With
`--gate`, pre-build a `/legal-goal` record so execution runs under the worker–evaluator
loop from day one. Set `status: handed-off` once the pack is delivered.

## Honest termination

Never present an unresolved map as clear. If the map is dead — fog non-empty, nothing
graduatable, no open tickets — surface it to the attorney: the destination needs
redrawing or external input is missing (which is itself a `task` ticket).

## Plugin Scope Constraint

For all wayfinding tasks, use **exclusively** BetterCallClaude agents, skills, and MCP
servers. Do not delegate legal work to generic or external skills, agents, or tools
outside this plugin.
````

- [ ] **Step 3: Run the frontmatter check (CI parity)**

Run: `for skill_dir in bettercallclaude/skills/*/; do skill_file="${skill_dir}SKILL.md"; if [ ! -f "$skill_file" ]; then echo "FAIL: Missing $skill_file"; exit 1; fi; head -1 "$skill_file" | grep -q '^---$' || { echo "FAIL: $skill_file missing YAML frontmatter"; exit 1; }; done; echo ALL_OK`
Expected: `ALL_OK`

- [ ] **Step 4: Commit**

```bash
git add bettercallclaude/skills/legal-wayfinder/SKILL.md
git commit -m "feat: add legal-wayfinder skill (decision-map protocol)"
```

---

### Task 2: Command — `/legal-chart`

**Files:**
- Create: `bettercallclaude/commands/legal-chart.md`

**Interfaces:**
- Consumes: the `legal-wayfinder` skill protocol from Task 1 (map/ticket formats, storage layout).
- Produces: `bcc-output/YYYY-MM-DD-<slug>/wayfinder/map.md` + `tickets/*.md` with `classifier` probed and `status: charting`.

- [ ] **Step 1: Verify the command does not exist yet**

Run: `test -f bettercallclaude/commands/legal-chart.md && echo EXISTS || echo MISSING`
Expected: `MISSING`

- [ ] **Step 2: Write the command file**

Write `bettercallclaude/commands/legal-chart.md` with exactly this content:

````markdown
---
description: "Chart a big legal matter as a wayfinder decision map — grill the attorney breadth-first, create the map and decision tickets, fire research tickets in parallel. Planning only: charting resolves no decisions itself."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_bge-search__search_bge
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_entscheidsuche__search_canton
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_swiss-caselaw__search_decisions
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_leading_cases
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_case_brief
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__plugin_bettercallclaude_onlinekommentar__search_commentaries
  - mcp__plugin_bettercallclaude_ollama__ollama_check_status
---

# /legal-chart — Chart a Legal Decision Map

You are invoked via `/bettercallclaude:legal-chart`. You apply the `legal-wayfinder`
skill in full. Your sole purpose is to **chart** a big or foggy legal matter as a
decision map: map file plus decision tickets. You resolve nothing yourself — that is
`/legal-way`'s job.

## Parameters

- Query text: the matter description (free text).
- `--privacy=<mode>`: privacy mode for the map (`strict`, `balanced`, `cloud`). Defaults to the configured mode.
- `--lang=DE|FR|IT|EN`: map language. Defaults to auto-detect from input.
- `--canton=XX`: cantonal jurisdiction (e.g. `--canton=ZH`). Defaults to federal.

**Natural language equivalents**:
- "traccia la mappa" or "chart the matter" → start charting
- "matter privato" / "privacy strict" → `--privacy=strict`
- "in tedesco" / "auf Deutsch" → `--lang=DE`
- "giurisdizione Zurigo" / "Zurich jurisdiction" → `--canton=ZH`

**Output convention**: write the map to `bcc-output/YYYY-MM-DD-<slug>/wayfinder/map.md`
and tickets to `.../wayfinder/tickets/`. Give in chat only the map summary (destination,
ticket list by name with types, fog count). See `skills/shared/SKILL.md`.

## Charting Flow

1. **Name the destination.** Grill the attorney (one question at a time) to pin the
   deliverable — "file-ready Klageschrift", "DD report for the SPA". The destination
   fixes scope, so it is settled first.
2. **Breadth-first grill.** Fan out across the whole matter — jurisdiction, parties'
   positions, limitation, forum, evidence availability, client risk appetite — never
   deep on any one thread. Surface every open decision you can sense.

   **Early exit — no fog:** if this surfaces no open decisions (the way to the
   destination is already clear, the matter fits one execution plan), do NOT create a
   map. Stop and tell the attorney:
   ```
   This matter is clear enough for direct execution — no map needed.
   Options: /bettercallclaude:briefing (structured plan) or
   /bettercallclaude:legal-5step (end-to-end pipeline).
   ```

3. **Probe the classifier** with `ollama_check_status` and record the result.
4. **Create the map** (`status: charting`) with the fog sketched into *Not yet
   specified*.
5. **Create the tickets that are sharp now** as ticket files — then wire `blocked-by`
   edges in a **second pass** (files need ids before they can reference each other).
   Everything not yet phrasable stays in the fog.
6. **Fire research tickets in parallel**: dispatch the researcher agent as subagents,
   MCP servers in the standard priority order, R1/R2 enforced, privacy pre-check per
   the map's privacy mode. Memos land in `assets/`. Research resolutions are recorded
   on the tickets by those subagents.
7. **Stop.** Report the charted map and end the session. Charting hand-resolves nothing.

## Charting Rules

- One session of work; never resolve a non-research ticket while charting.
- Refer to tickets by name in everything the attorney reads.
- Refer the attorney to `/bettercallclaude:legal-way` to work the map: *"Map charted.
  Run `/bettercallclaude:legal-way` (or 'next ticket') to work the first ticket."*
- If multiple maps already exist in the working folder, chart into a new dated folder —
  never merge maps.

## Plugin Scope Constraint

For all charting tasks, use **exclusively** BetterCallClaude agents, skills, and MCP
servers. Do not delegate legal work to generic or external skills, agents, or tools
outside this plugin.

## User Query

$ARGUMENTS
````

- [ ] **Step 3: Run the command frontmatter check**

Run: `head -1 bettercallclaude/commands/legal-chart.md | grep -q '^---$' && echo OK || echo FAIL`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add bettercallclaude/commands/legal-chart.md
git commit -m "feat: add /legal-chart command (chart a legal decision map)"
```

---

### Task 3: Command — `/legal-way`

**Files:**
- Create: `bettercallclaude/commands/legal-way.md`

**Interfaces:**
- Consumes: `legal-wayfinder` skill protocol (Task 1); maps produced by `/legal-chart` (Task 2).
- Produces: resolved tickets, updated `map.md`, handoff pack routed to `/legal-5step` or the orchestrator; optionally a `/legal-goal` Goal Record with `--gate`.

- [ ] **Step 1: Verify the command does not exist yet**

Run: `test -f bettercallclaude/commands/legal-way.md && echo EXISTS || echo MISSING`
Expected: `MISSING`

- [ ] **Step 2: Write the command file**

Write `bettercallclaude/commands/legal-way.md` with exactly this content:

````markdown
---
description: "Work one ticket from a legal-wayfinder decision map — claim a frontier ticket, resolve it by type (research / grilling / prototype / task), record the decision, graduate newly-sharp fog, and emit the handoff pack when the map is clear."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_bge-search__search_bge
  - mcp__plugin_bettercallclaude_bge-search__get_bge_decision
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_fedlex-sparql__lookup_statute
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__extract_citations
  - mcp__plugin_bettercallclaude_legal-citations__review_citations
  - mcp__plugin_bettercallclaude_onlinekommentar__search_commentaries
  - mcp__plugin_bettercallclaude_swiss-caselaw__search_decisions
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_decision
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_case_brief
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_leading_cases
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_relevant_erwaegung
  - mcp__plugin_bettercallclaude_swiss-caselaw__check_claim_support
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__plugin_bettercallclaude_ollama__ollama_check_status
  - mcp__plugin_bettercallclaude_ollama__ollama_classify_privacy
---

# /legal-way — Work One Decision Ticket

You are invoked via `/bettercallclaude:legal-way`. You apply the `legal-wayfinder`
skill in full. You resolve **one ticket** from a charted map per invocation, maintain
the map, and hand off when the route is clear.

## Parameters

- First positional argument (optional): a ticket id or title. Without one, pick the lowest-numbered frontier ticket.
- `--map=<slug-or-path>`: which map to work. Default: if exactly one map exists under `bcc-output/*/wayfinder/`, use it; if several, list and ask.
- `--gate`: on handoff, pre-build a `/legal-goal` Goal Record so execution runs under the worker–evaluator loop.
- `--list`: show every map in the working folder with frontier count, and stop.

**Natural language equivalents**:
- "prossima tessera" or "next ticket" → work the lowest-numbered frontier ticket
- "elenco mappe" or "list maps" → `--list`
- "con gate" or "with gate" → `--gate`

**Output convention**: update the ticket file and `map.md` in place under
`bcc-output/<matter>/wayfinder/`; write research memos and prototypes to `assets/`. Give
in chat the resolution summary and the updated frontier. See `skills/shared/SKILL.md`.

## Pre-Flight Checks

1. **Map exists.** If none found: `ERROR: No wayfinder map found. Run /bettercallclaude:legal-chart first.`
2. **Map not handed off.** If `status: handed-off`, show the map summary and stop — the matter is in execution.
3. **Privacy mode loaded** from map frontmatter; `classifier` respected without re-probing.

## Working Flow

1. **Load the map** — the low-res view: Destination, Notes, Decisions so far, fog,
   Out of scope. Do not open every ticket body; zoom into related tickets on demand.
2. **Pick the ticket.** If the attorney named one, use it. Otherwise take the
   lowest-numbered frontier ticket (open, unclaimed, all blockers resolved).
   **Claim it first**: set `claimed-in` to an ISO timestamp before any work.
   If the ticket is already claimed: refuse and show the frontier.
3. **Resolve by type:**
   - **research (AFK)**: researcher agent + MCP in standard priority order; memo in
     `assets/`; every citation via `swiss-caselaw:cite` (R1), quotations verbatim (R2);
     privacy pre-check per the map's mode and `classifier`.
   - **grilling (HITL)**: conversation with the attorney, one question at a time.
     Client facts, priorities, risk appetite — **never answer for the human**.
   - **prototype (HITL)**: a cheap concrete artifact to react to — outline of the
     Klageschrift, rough clause structure — linked from `assets/`.
   - **task (HITL/AFK)**: a precise checklist handed to the attorney/client, or driven
     alone where possible. Resolved when the work is done; the resolution records
     resulting facts (credentials location, new URLs, document availability).
4. **Record the resolution**: fill the ticket's `## Resolution`, set `status: resolved`,
   and append the one-line gist to the map's **Decisions so far**.
5. **Maintain the map**:
   - Graduate newly-sharp fog into tickets (create-then-wire), clearing each graduated
     patch from **Not yet specified**.
   - If the decision reveals a ticket sits beyond the destination: `status: ruled-out`
     plus one line in **Out of scope**.
   - If the decision invalidates other tickets, update or delete them.
   - Set map `status: working` if it was still `charting`.
6. **Check for handoff.** If the frontier is empty AND **Not yet specified** is empty:
   set `status: ready-for-handoff`, then emit the **handoff pack** — destination +
   Decisions so far + linked assets — and route to `/legal-5step` or the orchestrator
   (ask the attorney which). With `--gate`, first build the Goal Record via the
   `/legal-goal` conventions and show it for confirmation. After delivery set
   `status: handed-off`.
   Otherwise stop with the resolution summary and the remaining frontier (by name).

## Working Rules

- **One ticket per invocation** — research tickets are the only exception and may be
  batched.
- **Honest termination**: never present an unresolved map as clear. Dead map (fog
  non-empty, nothing graduatable, no open tickets) → surface to the attorney: the
  destination needs redrawing or external input is missing (a `task` ticket).
- Refer to tickets by name in everything the attorney reads.
- The human-in-the-loop rule applies: the map never files, sends, signs, or transmits
  anything.

## Plugin Scope Constraint

For all ticket work, use **exclusively** BetterCallClaude agents, skills, and MCP
servers. Do not delegate legal work to generic or external skills, agents, or tools
outside this plugin.

## User Query

$ARGUMENTS
````

- [ ] **Step 3: Run the command frontmatter and tool-name checks**

Run: `head -1 bettercallclaude/commands/legal-way.md | grep -q '^---$' && grep -c "mcp__plugin_bettercallclaude" bettercallclaude/commands/legal-way.md`
Expected: `OK`-prefixed pass; count = 19.

- [ ] **Step 4: Commit**

```bash
git add bettercallclaude/commands/legal-way.md
git commit -m "feat: add /legal-way command (work one decision ticket)"
```

---

### Task 4: Briefing routing rule

**Files:**
- Modify: `bettercallclaude/commands/briefing.md` (Flags table + New Briefing flow)
- Modify: `bettercallclaude/agents/briefing.md` (fog check before plan construction, anchored at the line `Using the classification and all collected answers, construct the execution plan.`)

**Interfaces:**
- Consumes: `/legal-chart` from Task 2.
- Produces: no new artifacts — only a routing offer.

- [ ] **Step 1: Add the `--chart` flag row to `commands/briefing.md`**

In the Flags table, directly after the `| \`--skip-briefing\` | ... |` row, add:

```markdown
| `--chart` | Route to `/bettercallclaude:legal-chart` (wayfinder decision map) instead of a static execution plan — for matters too big or too foggy for one plan |
```

- [ ] **Step 2: Add the fog-routing bullet to the coordinator handoff in `commands/briefing.md`**

In the **New Briefing** section, in the numbered list describing what the coordinator will do, append after the bullet `- Build a structured execution plan`:

```markdown
   - **Fog check**: if the matter is too foggy for a static plan (complexity 8+, or open decisions that depend on other open decisions), stop plan-building and offer: *"This matter is too foggy for a static plan — chart it instead?"* → `/bettercallclaude:legal-chart`
```

- [ ] **Step 3: Add the same fog check to the coordinator agent**

In `bettercallclaude/agents/briefing.md`, replace the line:

```markdown
Using the classification and all collected answers, construct the execution plan.
```

with:

```markdown
**Fog check first.** If the matter is too foggy for a static plan — complexity 8+, or
open decisions that depend on other open decisions — stop plan-building and offer the
attorney: *"This matter is too foggy for a static plan — chart it instead?"* →
`/bettercallclaude:legal-chart`. Only construct the execution plan when the way is
clear or the attorney declines charting.

Using the classification and all collected answers, construct the execution plan.
```

- [ ] **Step 4: Verify the edits**

Run: `grep -c "legal-chart" bettercallclaude/commands/briefing.md bettercallclaude/agents/briefing.md`
Expected: `bettercallclaude/commands/briefing.md:2` and `bettercallclaude/agents/briefing.md:1` (or higher).

- [ ] **Step 5: Commit**

```bash
git add bettercallclaude/commands/briefing.md bettercallclaude/agents/briefing.md
git commit -m "feat: route foggy high-complexity briefings to /legal-chart"
```

---

### Task 5: Docs, counts, version bump

**Files:**
- Modify: `README.md:14` and `README.md:38` (27→29 commands, 16→17 skills)
- Modify: `bettercallclaude/README.md:9` (same counts; version line → 4.10.0)
- Modify: `AGENTS.md` (version header line 3 → 4.10.0; line 72 `# 27 command definitions` → 29; line 79 `# 16 skill modules` → 17)
- Modify: `CHANGELOG.md` (new `[4.10.0]` entry at top)
- Modify: `bettercallclaude/.claude-plugin/plugin.json` (`"version": "4.9.6"` → `"version": "4.10.0"`)
- Modify: `bettercallclaude/commands/help.md` (two command rows after the `/bettercallclaude:briefing` row at line 63; one skill row after the `legal-evaluator` row at line 134)

**Interfaces:**
- Consumes: Tasks 1–4 (the files being counted and referenced).

- [ ] **Step 1: Update counts and versions**

Apply these exact replacements:
- `README.md`: `21 agents, 27 commands, 16 skills` → `21 agents, 29 commands, 17 skills` (both occurrences, lines 14 and 38).
- `bettercallclaude/README.md`: `**Version**: 4.9.6 -- 21 agents, 27 commands, 16 skills, 9 MCP servers.` → `**Version**: 4.10.0 -- 21 agents, 29 commands, 17 skills, 9 MCP servers.`
- `AGENTS.md`: `> **Version**: 4.9.6` → `> **Version**: 4.10.0`; `# 27 command definitions` → `# 29 command definitions`; `# 16 skill modules` → `# 17 skill modules`.
- `bettercallclaude/.claude-plugin/plugin.json`: `"version": "4.9.6"` → `"version": "4.10.0"`.

- [ ] **Step 2: Add the CHANGELOG entry**

Insert directly after the `---` following `All notable changes...` in `CHANGELOG.md`:

```markdown
## [4.10.0] - 2026-08-19

### Added
- **Wayfinder decision maps for big legal matters** — new `/legal-chart` and `/legal-way` commands plus the `legal-wayfinder` skill: chart a matter too big or too foggy for one session as a file-based map (destination, decisions so far, fog, out-of-scope) with decision tickets under `bcc-output/<matter>/wayfinder/`, work one ticket per invocation, hand off to `/legal-5step` or the orchestrator when the route is clear. Privacy follows the existing routing matrix including a no-ollama degradation path (fail-closed). `/briefing` now offers charting for foggy high-complexity matters.
```

- [ ] **Step 3: Add help.md rows**

In `bettercallclaude/commands/help.md`, after the `| \`/bettercallclaude:briefing\` | ... |` row insert:

```markdown
| `/bettercallclaude:legal-chart` | Chart a big/foggy matter as a wayfinder decision map |
| `/bettercallclaude:legal-way` | Work one decision ticket from a wayfinder map |
```

After the `| legal-evaluator | ... |` row insert:

```markdown
| legal-wayfinder | Decision-map decomposition for matters too big or foggy for one session |
```

- [ ] **Step 4: Verify counts and JSON validity**

Run: `ls bettercallclaude/commands | wc -l && ls bettercallclaude/skills | wc -l && node -e "const p=JSON.parse(require('fs').readFileSync('bettercallclaude/.claude-plugin/plugin.json','utf8')); console.log(p.version)"`
Expected: `29`, `17`, `4.10.0`

- [ ] **Step 5: Commit**

```bash
git add README.md bettercallclaude/README.md AGENTS.md CHANGELOG.md bettercallclaude/.claude-plugin/plugin.json bettercallclaude/commands/help.md
git commit -m "docs: bump to 4.10.0 — legal-wayfinder commands, skill, counts, changelog"
```

---

### Task 6: Full validation and packaging

**Files:**
- Create: `dist/bettercallclaude-4.10.0.zip` (via packaging script)

**Interfaces:**
- Consumes: everything from Tasks 1–5.

- [ ] **Step 1: Run the CI-equivalent structure checks locally**

Run the "Validate Plugin Structure" steps from `.github/workflows/ci.yml` (marketplace.json, plugin.json, subdirectory contents, ollama bundle, .mcp.json, hook quoting, agent/command/skill frontmatter loops).
Expected: every check OK, zero FAIL lines.

- [ ] **Step 2: Package the plugin**

Run: `bash scripts/package-plugin.sh`
Expected: `dist/bettercallclaude-4.10.0.zip` created; script's final `unzip -l` shows 116 files (112 existing entries + 2 command files + 1 skill directory + SKILL.md).

- [ ] **Step 3: Spot-check the zip contents**

Run: `unzip -Z1 dist/bettercallclaude-4.10.0.zip | grep -E "legal-chart|legal-way|legal-wayfinder"`
Expected: `commands/legal-chart.md`, `commands/legal-way.md`, `skills/legal-wayfinder/SKILL.md` present.

- [ ] **Step 4: Commit the release artifact**

```bash
git add dist/bettercallclaude-4.10.0.zip
git commit -m "chore: package v4.10.0"
```
