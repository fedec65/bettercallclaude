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

**Important background**: Cowork runs inside a VM with restricted network access. 4 of 5 MCP servers require external API calls (bger.ch, fedlex.data.admin.ch, onlinekommentar.ch) and will fail inside the Cowork sandbox. The solution is to install the servers at the **Claude Desktop level** (Settings > Developer), where they run on the host OS with full network access and are proxied to Cowork via the SDK bridge.

##### Option A: Desktop-Level Installation (Recommended)

This is the recommended approach. MCP servers configured in Claude Desktop run on your macOS/Windows/Linux host with full network access.

**One-command installer** (if you have the repo cloned):

```bash
git clone https://github.com/fedec65/BetterCallClaude_Marketplace.git
cd BetterCallClaude_Marketplace
bash scripts/install-claude-desktop.sh
```

The installer will:
1. Auto-detect the MCP server location
2. Add all 5 servers to your Claude Desktop config
3. Preserve any existing MCP server configuration
4. Tell you to restart Claude Desktop

**Manual Desktop installation** (if you prefer):

Add the following to Claude Desktop's config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
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
```

Replace `<ABSOLUTE_PATH>` with the full path to the bettercallclaude plugin's directory (e.g., `/Users/you/BetterCallClaude_Marketplace/plugins/bettercallclaude`).

After adding, restart Claude Desktop and open a Cowork session. Re-run `/bettercallclaude:setup` to verify.

**MCPB one-click install** (easiest):

Download `.mcpb` bundle files from the [GitHub Releases page](https://github.com/fedec65/BetterCallClaude_Marketplace/releases) and double-click each one to install directly into Claude Desktop.

##### Option B: Project-Level Configuration (Limited)

If Desktop-level installation is not possible, you can configure servers at the project level. Note that servers requiring external network access (entscheidsuche, bge-search, fedlex-sparql, onlinekommentar) will NOT work in the Cowork sandbox. Only `legal-citations` works without network access.

Ask the user: "What is the path where the bettercallclaude plugin is installed? You can find it in your Claude plugins cache, typically at: `~/.claude/plugins/cache/`"

Once the user provides the path, generate a project-level `.mcp.json` with absolute paths.

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
| "ECONNREFUSED" or "ENOTFOUND" from onlinekommentar | `onlinekommentar.ch` API is unreachable — likely blocked by Cowork Desktop's network sandbox | Install at the Desktop level (Settings > Developer) instead. Desktop-level MCP servers run on the host OS and bypass the sandbox. Run `bash scripts/install-claude-desktop.sh` or see Option A above. |
| Connection works but no search results | Server is healthy but the query returned no matches | Try broader search terms or different parameters. |

## Notes

- MCP servers are required for live database access (court decisions, legislation, citation verification)
- Without MCP servers, BetterCallClaude operates in **reduced mode** using built-in Swiss law knowledge
- Reduced mode cannot search live databases, verify citation existence, or access current legislation
- All 5 servers are self-contained and require no API keys or external accounts

## User Query

$ARGUMENTS
