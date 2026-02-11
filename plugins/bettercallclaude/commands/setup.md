---
description: "Check MCP server status and configure servers for Claude Code CLI or Cowork Desktop"
---

# BetterCallClaude MCP Server Setup

When this command is invoked, perform the following diagnostic and configuration workflow.

## Step 1: Probe MCP Servers

Attempt to call a tool from each of the 5 MCP servers to determine connectivity. For each server, try listing its available tools or calling a no-op endpoint:

| Server | Test Method |
|--------|-------------|
| bettercallclaude-entscheidsuche | Try calling any `search_decisions` or listing tools |
| bettercallclaude-bge-search | Try calling any `search_bge` or listing tools |
| bettercallclaude-legal-citations | Try calling any `validate_citation` or listing tools |
| bettercallclaude-fedlex-sparql | Try calling any `search_legislation` or listing tools |
| bettercallclaude-onlinekommentar | Try calling any `search_commentary` or listing tools |

## Step 2: Display Status Table

Output the following formatted status report, replacing status indicators based on Step 1 results:

```
==============================================
  BetterCallClaude MCP Server Status
==============================================

  Server                    Status
  ------                    ------
  entscheidsuche            [x] Connected / [ ] Not configured
  bge-search                [x] Connected / [ ] Not configured
  legal-citations           [x] Connected / [ ] Not configured
  fedlex-sparql             [x] Connected / [ ] Not configured
  onlinekommentar           [x] Connected / [ ] Not configured

  Connected: X/5 servers
==============================================
```

## Step 3: Provide Guidance Based on Results

### If all 5 servers are connected:

```
All MCP servers are operational. No setup needed.
BetterCallClaude is running at full capability.
```

### If any servers are missing:

First, determine the user's environment:

**Ask the user**: "Are you using Claude Code CLI or Cowork Desktop?"

#### For Claude Code CLI users:

```
MCP servers should auto-register from the plugin's .mcp.json file.

Try these steps:
1. Restart Claude Code (quit and reopen)
2. Run /mcp to check registered servers
3. If servers don't appear, run: claude mcp list
4. Re-run /bettercallclaude:setup to verify

If servers still don't appear after restart, you can manually register them:

  claude mcp add bettercallclaude-entscheidsuche node -- "<plugin-path>/mcp-servers/entscheidsuche/dist/index.js"
  claude mcp add bettercallclaude-bge-search node -- "<plugin-path>/mcp-servers/bge-search/dist/index.js"
  claude mcp add bettercallclaude-legal-citations node -- "<plugin-path>/mcp-servers/legal-citations/dist/index.js"
  claude mcp add bettercallclaude-fedlex-sparql node -- "<plugin-path>/mcp-servers/fedlex-sparql/dist/index.js"
  claude mcp add bettercallclaude-onlinekommentar node -- "<plugin-path>/mcp-servers/onlinekommentar/dist/index.js"

Replace <plugin-path> with the actual path to the bettercallclaude plugin directory.
```

#### For Cowork Desktop users:

Ask the user: "What is the path where the bettercallclaude plugin is installed? You can find it in your Claude plugins cache, typically at: `~/.claude/plugins/cache/`"

Once the user provides the path (or you can attempt to locate it), generate a ready-to-paste configuration block:

```
To configure MCP servers in Cowork Desktop, add the following to your
project's .mcp.json file (or create one in your project root):

{
  "mcpServers": {
    "bettercallclaude-entscheidsuche": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/mcp-servers/entscheidsuche/dist/index.js"]
    },
    "bettercallclaude-bge-search": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/mcp-servers/bge-search/dist/index.js"]
    },
    "bettercallclaude-legal-citations": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/mcp-servers/legal-citations/dist/index.js"]
    },
    "bettercallclaude-fedlex-sparql": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/mcp-servers/fedlex-sparql/dist/index.js"]
    },
    "bettercallclaude-onlinekommentar": {
      "command": "node",
      "args": ["<ABSOLUTE_PATH>/mcp-servers/onlinekommentar/dist/index.js"]
    }
  }
}

Replace <ABSOLUTE_PATH> with the full path to the bettercallclaude plugin.

After adding, restart Cowork Desktop and re-run /bettercallclaude:setup to verify.
```

**Important**: Replace `<ABSOLUTE_PATH>` in the output with the actual absolute path the user provided. Do NOT use `${CLAUDE_PLUGIN_ROOT}` — Cowork Desktop does not expand this variable.

## Step 4: Requirements Check

Also verify:
- **Node.js**: Run `node --version` via Bash. Require >= 18.0.0. If not found or too old, warn the user.

## Step 5: Interpret Backend Errors

If a server connects but returns errors during use, consult this diagnostic guide:

| Error Pattern | Likely Cause | Resolution |
|---------------|-------------|------------|
| "table cache_entries does not exist" or similar missing table errors | Database initialization failed — TypeORM `synchronize` was disabled | Update to plugin version 1.3.1+ which fixes this. Re-register the server and restart. |
| SPARQL endpoint timeout or HTTP 5xx from fedlex-sparql | Fedlex service (`fedlex.data.admin.ch`) is temporarily unavailable | Retry later. The server has built-in retry logic (3 attempts, 2s delay). This is an external service issue, not a plugin bug. |
| "ECONNREFUSED" or "ENOTFOUND" from onlinekommentar | `onlinekommentar.ch` API is unreachable — likely blocked by Cowork Desktop's network sandbox | This server requires external network access. It will not work in sandboxed environments. Use it in Claude Code CLI instead. |
| Connection works but no search results | Server is healthy but the query returned no matches | Try broader search terms or different parameters. |

## Notes

- MCP servers are required for live database access (court decisions, legislation, citation verification)
- Without MCP servers, BetterCallClaude operates in **reduced mode** using built-in Swiss law knowledge
- Reduced mode cannot search live databases, verify citation existence, or access current legislation
- All 5 servers are self-contained and require no API keys or external accounts

## User Query

$ARGUMENTS
