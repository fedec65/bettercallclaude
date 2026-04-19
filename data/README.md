# `data/`

This directory holds seed data used by the MCP shared database layer.

## `bettercallclaude.db`

A SQLite database used by
[`mcp-servers-src/shared/src/database/client.ts`](../mcp-servers-src/shared/src/database/client.ts)
as the default backing store when neither `DB_DATABASE` nor `DATABASE_FILE`
environment variables are set. It is resolved relative to the process's
working directory:

```ts
// mcp-servers-src/shared/src/database/client.ts
filename: process.env.DATABASE_FILE || join(process.cwd(), 'data', 'bettercallclaude.db'),
```

### What is in it

- Reference indexes for legal citation validation (BGE / ATF / DTF series,
  SR numbering, common statute articles).
- Public-domain seed data only. **No personally identifying information,
  no conversation state, no API keys.**

### What is **not** in it

- No user prompts.
- No tool call history.
- No cached Anthropic API responses.

Runtime conversation state is managed entirely by Cowork Desktop inside its
own profile directory; nothing in this repository is written to between
plugin sessions.

### Overriding the default location

Either of:

```bash
export DB_DATABASE=/absolute/path/to/your/custom.db
# or
export DATABASE_FILE=/absolute/path/to/your/custom.db
```

before launching the MCP servers will cause the shared client to use a
different file and leave this committed seed untouched.

See also [`../docs/PRIVACY.md`](../docs/PRIVACY.md) §3.
