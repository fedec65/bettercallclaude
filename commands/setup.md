---
description: "Check MCP server status and auto-install servers to Claude Desktop if needed"
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

Skip to Step 5 (Requirements Check).

### If any servers are missing:

Install the MCP servers at the Claude Desktop level so they run on the host OS with full network access.

**Important background**: When running inside Cowork Desktop, MCP servers execute in a sandboxed VM with restricted network access. 4 of 5 servers require external API calls (bger.ch, fedlex.data.admin.ch, onlinekommentar.ch) and will fail in the sandbox. Desktop-level installation solves this because those servers run on the host machine.

#### Step 3a: Download and install MCPB bundles (recommended)

Tell the user to download and double-click the `.mcpb` bundle files. Each file auto-registers one MCP server in Claude Desktop — no terminal or config editing required.

```
To install the MCP servers, download these 5 files and double-click each one:

  https://github.com/fedec65/BetterCallClaude_Marketplace/releases/latest

Download all 5 .mcpb files from the release:
  - bettercallclaude-entscheidsuche.mcpb
  - bettercallclaude-bge-search.mcpb
  - bettercallclaude-legal-citations.mcpb
  - bettercallclaude-fedlex-sparql.mcpb
  - bettercallclaude-onlinekommentar.mcpb

Double-click each .mcpb file — Claude Desktop will install the server automatically.
After installing all 5, restart Claude Desktop, then re-run /bettercallclaude:setup to verify.
```

#### Step 3b: Fallback — manual config (if MCPB doesn't work)

If the user cannot use MCPB files, provide these alternative options:

**Option 1**: Run the install script from a Mac Terminal (outside Cowork):

```
git clone https://github.com/fedec65/BetterCallClaude_Marketplace.git
cd BetterCallClaude_Marketplace
bash scripts/install-claude-desktop.sh
```

**Option 2**: Manually add servers to Claude Desktop's config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

See the CONNECTORS.md file in the plugin for the full JSON configuration.

## Step 4: CLI-Specific Guidance

If the environment appears to be Claude Code CLI (not Cowork Desktop), provide this additional guidance:

```
MCP servers should auto-register from the plugin's .mcp.json file.

Try these steps:
1. Restart Claude Code (quit and reopen)
2. Run /mcp to check registered servers
3. If servers don't appear, run: claude mcp list
4. Re-run /bettercallclaude:setup to verify
```

**How to detect CLI vs Cowork**: If the Bash tool can access the host filesystem (e.g., `ls ~/Library/Application\ Support/Claude/` succeeds on macOS), the user is likely in Cowork Desktop or has Desktop access. If not, they are in CLI-only mode.

## Step 5: Requirements Check

Also verify:
- **Node.js**: Run `node --version` via Bash. Require >= 18.0.0. If not found or too old, warn the user.

## Step 6: Interpret Backend Errors

If a server connects but returns errors during use, consult this diagnostic guide:

| Error Pattern | Likely Cause | Resolution |
|---------------|-------------|------------|
| "table cache_entries does not exist" or similar missing table errors | Database initialization failed — TypeORM `synchronize` was disabled | Update to plugin version 1.3.1+ which fixes this. Re-register the server and restart. |
| SPARQL endpoint timeout or HTTP 5xx from fedlex-sparql | Fedlex service (`fedlex.data.admin.ch`) is temporarily unavailable | Retry later. The server has built-in retry logic (3 attempts, 2s delay). This is an external service issue, not a plugin bug. |
| "ECONNREFUSED" or "ENOTFOUND" from onlinekommentar | `onlinekommentar.ch` API is unreachable — likely blocked by Cowork Desktop's network sandbox | Install at the Desktop level (see Step 3 above). Desktop-level MCP servers run on the host OS and bypass the sandbox. |
| Connection works but no search results | Server is healthy but the query returned no matches | Try broader search terms or different parameters. |

## Notes

- MCP servers are required for live database access (court decisions, legislation, citation verification)
- Without MCP servers, BetterCallClaude operates in **reduced mode** using built-in Swiss law knowledge
- Reduced mode cannot search live databases, verify citation existence, or access current legislation
- All 5 servers are self-contained and require no API keys or external accounts
- The auto-install preserves any existing MCP server configuration in Claude Desktop
- For manual installation, see `scripts/install-claude-desktop.sh` or the CONNECTORS.md documentation

## User Query

$ARGUMENTS
