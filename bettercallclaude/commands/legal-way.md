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
`bcc-output/YYYY-MM-DD-<slug>/wayfinder/`; write research memos and prototypes to `assets/`. Give
in chat the resolution summary and the updated frontier. See `skills/shared/SKILL.md`.

## Pre-Flight Checks

1. **Map exists.** If none found: `ERROR: No wayfinder map found. Run /bettercallclaude:legal-chart first.`
2. **Map not handed off.** If `status: handed-off`, show the map summary and stop — the matter is in execution.
3. **Privacy mode loaded** from map frontmatter; `classifier` respected without re-probing.

## Working Flow

1. **Load the map** — the low-res view: Destination, Notes, Decisions so far, fog,
   Out of scope. Do not open every ticket body; zoom into related tickets on demand.
2. **Pick the ticket.** If the attorney named one, use it. Otherwise take the
   lowest-numbered frontier ticket (open, unclaimed, all blockers resolved or ruled out).
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
