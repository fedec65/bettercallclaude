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

Automatically install the MCP servers at the Claude Desktop level. This ensures they run on the host OS with full network access, bypassing any sandbox restrictions.

**Important background**: When running inside Cowork Desktop, MCP servers execute in a sandboxed VM with restricted network access. 4 of 5 servers require external API calls (bger.ch, fedlex.data.admin.ch, onlinekommentar.ch) and will fail in the sandbox. Desktop-level installation solves this because those servers run on the host machine.

#### Step 3a: Locate the plugin's MCP server directory

Run the following via Bash to find the installed plugin path:

```bash
SERVER_DIR="$(find ~/.claude/plugins -name "entscheidsuche" -path "*/mcp-servers/*" -type d 2>/dev/null | head -1 | xargs dirname 2>/dev/null)"
```

If that returns empty, try alternative locations:

```bash
# Try common locations
for candidate in \
  "$HOME/.claude/plugins/cache/"*"/bettercallclaude/mcp-servers" \
  "$HOME/.claude/plugins/cache/"*"/mcp-servers" \
  "$HOME/Dev/BetterCallClaude_Marketplace/mcp-servers" \
  "$HOME/BetterCallClaude_Marketplace/mcp-servers"; do
  if [ -d "$candidate/entscheidsuche" ]; then
    SERVER_DIR="$candidate"
    break
  fi
done
echo "SERVER_DIR=$SERVER_DIR"
```

If SERVER_DIR is still empty, ask the user for the plugin path and construct it as `<user-provided-path>/mcp-servers`.

#### Step 3b: Verify server files exist

Before installing, confirm the compiled server bundles are present:

```bash
for server in entscheidsuche bge-search legal-citations fedlex-sparql onlinekommentar; do
  if [ -f "$SERVER_DIR/$server/dist/index.js" ]; then
    echo "$server: OK"
  else
    echo "$server: MISSING"
  fi
done
```

If any are MISSING, warn the user that the plugin installation may be incomplete and suggest re-installing.

#### Step 3c: Detect OS and config path

```bash
if [ "$(uname)" = "Darwin" ]; then
  CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [ -d "$HOME/.config/Claude" ]; then
  CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
else
  CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
fi
echo "CONFIG_PATH=$CONFIG_PATH"
```

#### Step 3d: Install servers into Claude Desktop config

Run the following Node.js script via Bash to merge the 5 server entries into the Claude Desktop config file. This preserves any existing MCP server configuration:

```bash
node -e "
const fs = require('fs');
const path = require('path');
const configPath = process.argv[1];
const serverDir = process.argv[2];
let config = {};
try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e) {}
if (!config.mcpServers) config.mcpServers = {};
const servers = ['entscheidsuche','bge-search','legal-citations','fedlex-sparql','onlinekommentar'];
let added = 0;
servers.forEach(s => {
  const key = 'bettercallclaude-' + s;
  const jsPath = path.join(serverDir, s, 'dist', 'index.js');
  if (!fs.existsSync(jsPath)) { console.error('WARN: ' + jsPath + ' not found, skipping'); return; }
  config.mcpServers[key] = { command: 'node', args: [jsPath] };
  added++;
});
fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log('OK: ' + added + '/5 servers installed to ' + configPath);
" "$CONFIG_PATH" "$SERVER_DIR"
```

#### Step 3e: Report result

If the Node.js script printed "OK":

```
Desktop MCP servers installed successfully.

Please restart Claude Desktop, then re-run /bettercallclaude:setup to verify all servers connect.
```

If the script failed or printed warnings, show the error output and fall back to manual instructions:

```
Auto-install encountered an issue. You can install manually:

1. Clone the repo:   git clone https://github.com/fedec65/BetterCallClaude_Marketplace.git
2. Run installer:    cd BetterCallClaude_Marketplace && bash scripts/install-claude-desktop.sh

Or manually add servers to your Claude Desktop config:
  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
  Linux: ~/.config/Claude/claude_desktop_config.json

See the CONNECTORS.md file in the plugin for the full JSON configuration.
```

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
