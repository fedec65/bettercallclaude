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

**YOU MUST EXECUTE Steps 3a, 3b, and 3c below using the Bash tool. DO NOT skip ahead to the fallback section. DO NOT just show the user text instructions. You must RUN the commands yourself to generate the installer file.**

Background: MCP servers in Cowork Desktop run in a sandboxed VM without network access. The solution is to generate a `.command` installer script that the user runs on their host Mac (outside Cowork). The `~/.claude/` directory is shared between the VM and the host, so you can write the file here and the user can execute it there.

#### Step 3a: Locate the MCP server directory (EXECUTE NOW)

Run these Bash commands NOW to find the `mcp-servers` directory. Do not skip this step.

```bash
# Try plugin cache first, then current dir, then common locations
SERVER_DIR=""
for candidate in \
  "${CLAUDE_PLUGIN_ROOT:-}/mcp-servers" \
  "$(find ~/.claude/plugins -type d -name 'mcp-servers' 2>/dev/null | head -1)" \
  "./mcp-servers" \
  "$HOME/Dev/BetterCallClaude_Marketplace/mcp-servers"; do
  if [ -n "$candidate" ] && [ -f "$candidate/entscheidsuche/dist/index.js" ]; then
    SERVER_DIR="$candidate"
    break
  fi
done

# Detect Cowork VM (paths contain /sessions/ or .local-plugins)
IS_COWORK=false
if echo "$SERVER_DIR" | grep -qE '(/sessions/|\.local-plugins)'; then
  IS_COWORK=true
fi

# If Cowork: copy servers to ~/.claude/ (shared between VM and host)
if [ "$IS_COWORK" = "true" ] && [ -n "$SERVER_DIR" ]; then
  HOST_DIR="$HOME/.claude/bettercallclaude-servers"
  mkdir -p "$HOST_DIR"
  for s in entscheidsuche bge-search legal-citations fedlex-sparql onlinekommentar; do
    mkdir -p "$HOST_DIR/$s/dist"
    for f in "$SERVER_DIR/$s/dist/"*; do
      [ -f "$f" ] && cp "$f" "$HOST_DIR/$s/dist/"
    done
  done
  SERVER_DIR="$HOST_DIR"
fi

echo "SERVER_DIR=$SERVER_DIR"
echo "IS_COWORK=$IS_COWORK"
```

If `SERVER_DIR` is empty, tell the user the plugin may not be fully installed and skip to Step 3d (fallback). Otherwise, verify all 5 servers exist:

```bash
for s in entscheidsuche bge-search legal-citations fedlex-sparql onlinekommentar; do
  [ -f "$SERVER_DIR/$s/dist/index.js" ] && echo "OK: $s" || echo "MISSING: $s"
done
```

If any are missing, skip to Step 3d. Otherwise proceed to Step 3b.

#### Step 3b: Generate the installer script (EXECUTE NOW)

You MUST run this Bash command to write the `.command` file. Replace `<ACTUAL_SERVER_DIR>` with the absolute path found in Step 3a.

```bash
cat > ~/.claude/install-bcc-servers.command << 'ENDOFSCRIPT'
#!/bin/bash
# BetterCallClaude — Desktop MCP Server Installer
# Run this on your Mac: open ~/.claude/install-bcc-servers.command

SERVER_DIR="__SERVER_DIR__"

if [ "$(uname)" = "Darwin" ]; then
  CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
else
  CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
fi

echo "=============================================="
echo "  BetterCallClaude — MCP Server Installer"
echo "=============================================="
echo ""
echo "Server directory: $SERVER_DIR"
echo "Config file:      $CONFIG_PATH"
echo ""

MISSING=0
for s in entscheidsuche bge-search legal-citations fedlex-sparql onlinekommentar; do
  if [ ! -f "$SERVER_DIR/$s/dist/index.js" ]; then
    echo "  MISSING: $s"; MISSING=1
  else
    echo "  Found:   $s"
  fi
done

if [ "$MISSING" = "1" ]; then
  echo ""; echo "ERROR: Some servers are missing. Re-install the plugin first."
  read -p "Press Enter to close..."; exit 1
fi

echo ""; echo "Installing servers into Claude Desktop config..."

node -e "
const fs = require('fs');
const path = require('path');
const configPath = process.argv[1];
const serverDir = process.argv[2];
let config = {};
try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch(e) {}
if (!config.mcpServers) config.mcpServers = {};
['entscheidsuche','bge-search','legal-citations','fedlex-sparql','onlinekommentar'].forEach(s => {
  config.mcpServers['bettercallclaude-' + s] = {
    command: 'node',
    args: [path.join(serverDir, s, 'dist', 'index.js')]
  };
});
fs.mkdirSync(path.dirname(configPath), { recursive: true });
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log('Done! ' + Object.keys(config.mcpServers).filter(k => k.startsWith('bettercallclaude')).length + ' BetterCallClaude servers installed.');
" "$CONFIG_PATH" "$SERVER_DIR"

echo ""; echo "Restart Claude Desktop to activate the servers."
echo "Then run /bettercallclaude:setup to verify."; echo ""
read -p "Press Enter to close..."
ENDOFSCRIPT
```

Then replace the placeholder and make it executable. **Important**: If running in Cowork, use `$HOME/.claude/bettercallclaude-servers` as a literal string (single-quoted) so it expands on the host Mac, not inside the VM:

```bash
if [ "$IS_COWORK" = "true" ]; then
  # Single-quoted: $HOME stays literal, expands when user runs installer on host
  sed -i '' 's|__SERVER_DIR__|$HOME/.claude/bettercallclaude-servers|' ~/.claude/install-bcc-servers.command
else
  # Double-quoted: expand SERVER_DIR now (host path is already correct)
  sed -i '' "s|__SERVER_DIR__|<ACTUAL_SERVER_DIR>|" ~/.claude/install-bcc-servers.command
fi
chmod +x ~/.claude/install-bcc-servers.command
```

Verify the file was written correctly:

```bash
head -5 ~/.claude/install-bcc-servers.command
```

#### Step 3c: Show the user ONE simple instruction

After successfully generating the file, tell the user ONLY this:

```
I've created a one-click installer for your MCP servers.

Open Terminal on your Mac and paste this single command:

  open ~/.claude/install-bcc-servers.command

After it finishes, restart Claude Desktop and re-run /bettercallclaude:setup to verify.
```

DO NOT show any other installation options at this point. Stop here. Only proceed to Step 3d if the user reports a problem.

#### Step 3d: Fallback (ONLY if Steps 3a-3c failed)

Only show these alternatives if Step 3a could not find the server directory, or if the user explicitly reports that the `.command` approach did not work:

**Option A — MCPB bundles**: Download and double-click `.mcpb` files from the latest release:

```
  https://github.com/fedec65/BetterCallClaude_Marketplace/releases/latest

Download all 5 .mcpb files and double-click each one:
  - bettercallclaude-entscheidsuche.mcpb
  - bettercallclaude-bge-search.mcpb
  - bettercallclaude-legal-citations.mcpb
  - bettercallclaude-fedlex-sparql.mcpb
  - bettercallclaude-onlinekommentar.mcpb
```

**Option B — Install script**: Run from a Mac Terminal (outside Cowork):

```
git clone https://github.com/fedec65/BetterCallClaude_Marketplace.git
cd BetterCallClaude_Marketplace
bash scripts/install-claude-desktop.sh
```

**Option C — Manual config**: Edit Claude Desktop's config file directly:
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
