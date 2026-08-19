---
name: legal-wayfinder
description: "Decision-map decomposition for legal matters too big or too foggy for one session. Charts a map (destination, decisions so far, fog, out-of-scope) plus decision tickets under bcc-output/YYYY-MM-DD-<slug>/wayfinder/, then works tickets one at a time until the route to the deliverable is clear, then hands off to execution. Trigger when: charting a big legal matter (/legal-chart), working the next decision ticket (/legal-way), or a briefing is too foggy for a static execution plan. Do NOT trigger for: normal matters that fit /briefing or /legal-5step, quality-gate loops (legal-goal / legal-loop), or single-question research."
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
`blocked-by` tickets `status: resolved` or `ruled-out`. `/legal-way` picks the lowest-numbered frontier
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
