---
description: "Research login-protected legal websites (doctrine, paid services) through the Claude Desktop browser with manual login hand-off"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Task
---

You are invoked via `/bettercallclaude:web-research <site> <question>`. Browser navigation, manual login hand-off, and read-only collection always run in this main session. Apply the `legal-web-research` skill methodology to the user's request.

**Execution modes**:
- **Direct delivery (default)**: apply the skill in full, including final delivery by this main session. Do not hand off the same research for synthesis afterwards.
- **Collection for delegated synthesis**: use this only when the caller explicitly requests synthesis by `web-research-specialist`. Apply the skill through source collection, but skip its Delivery section. From this main session, dispatch `bettercallclaude:web-research-specialist` via `Task`, passing the original site and research question along with the collected material and its provenance. The specialist alone writes the final memo and source list; return both paths supplied by the specialist.

**Arguments**:
- `<site>`: target website or domain (e.g. `legalis.ch`, `italgiure.it`).
- `<question>`: what to search for or read.

**Output convention**: In direct delivery, write the full research memo to `bcc-output/YYYY-MM-DD-<slug>/02-research-memo.md` and the source list to `bcc-output/YYYY-MM-DD-<slug>/sources.md`. Give in chat only a 3–5 line summary with the file paths. In delegated synthesis, the specialist writes these files once; the main session does not write them. See `skills/shared/SKILL.md`.

**Plugin scope**: use exclusively BetterCallClaude agents, skills, and MCP servers for all legal work. Do not delegate to external skills or agents. File generation and system operations are exempt.

$ARGUMENTS
