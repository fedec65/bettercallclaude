#!/usr/bin/env bash
# install-claude-desktop.sh - Install BetterCallClaude MCP servers into Claude Desktop
#
# This script adds all 5 BetterCallClaude MCP servers to Claude Desktop's
# configuration so they run on the host OS with full network access.
# This is the recommended approach for Cowork users, since Desktop-level
# MCP servers bypass the Cowork VM's network sandbox.
#
# Supports: macOS, Linux, Windows (Git Bash / WSL)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== BetterCallClaude - Claude Desktop MCP Installer ==="
echo ""

# --- Detect Claude Desktop config path ---
detect_config_path() {
  case "$(uname -s)" in
    Darwin)
      echo "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
      ;;
    Linux)
      echo "$HOME/.config/Claude/claude_desktop_config.json"
      ;;
    MINGW*|MSYS*|CYGWIN*)
      echo "$APPDATA/Claude/claude_desktop_config.json"
      ;;
    *)
      echo ""
      ;;
  esac
}

CONFIG_PATH="$(detect_config_path)"

if [ -z "$CONFIG_PATH" ]; then
  echo "ERROR: Could not detect Claude Desktop config path for this OS."
  echo "Supported: macOS, Linux, Windows (Git Bash / WSL)"
  exit 1
fi

echo "Claude Desktop config: $CONFIG_PATH"

# --- Detect MCP server directory ---
detect_server_dir() {
  # Priority 1: Relative to this script (repo clone)
  local repo_servers="$SCRIPT_DIR/../mcp-servers"
  if [ -d "$repo_servers/entscheidsuche/dist" ]; then
    echo "$(cd "$repo_servers" && pwd)"
    return
  fi

  # Priority 2: Common plugin cache locations
  local plugin_caches=(
    "$HOME/.claude/plugins/cache"
    "$HOME/.config/claude/plugins/cache"
  )

  for cache_dir in "${plugin_caches[@]}"; do
    if [ -d "$cache_dir" ]; then
      # Search for the bettercallclaude plugin in cache
      local found
      found=$(find "$cache_dir" -maxdepth 3 -name "entscheidsuche" -type d 2>/dev/null | head -1)
      if [ -n "$found" ] && [ -d "$found/dist" ]; then
        echo "$(cd "$(dirname "$found")" && pwd)"
        return
      fi
    fi
  done

  echo ""
}

SERVER_DIR="$(detect_server_dir)"

if [ -z "$SERVER_DIR" ]; then
  echo ""
  echo "Could not auto-detect MCP server location."
  echo ""
  echo "Please provide the path to the bettercallclaude plugin's mcp-servers/ directory."
  echo "If you cloned the repo, this is typically:"
  echo "  /path/to/bettercallclaude/mcp-servers"
  echo ""
  read -r -p "MCP servers path: " SERVER_DIR

  if [ ! -d "$SERVER_DIR/entscheidsuche/dist" ]; then
    echo "ERROR: Invalid path. Expected to find entscheidsuche/dist/ inside: $SERVER_DIR"
    exit 1
  fi
fi

echo "MCP servers dir:     $SERVER_DIR"
echo ""

# --- Verify Node.js ---
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. MCP servers require Node.js >= 18."
  echo "Install from: https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js $NODE_VERSION is too old. MCP servers require >= 18.0.0"
  echo "Update from: https://nodejs.org/"
  exit 1
fi

echo "Node.js version:     v$NODE_VERSION (OK)"
echo ""

# --- Verify all 5 servers exist ---
SERVERS=(
  "entscheidsuche"
  "bge-search"
  "legal-citations"
  "fedlex-sparql"
  "onlinekommentar"
)

for server in "${SERVERS[@]}"; do
  if [ ! -f "$SERVER_DIR/$server/dist/index.js" ]; then
    echo "ERROR: Missing server: $SERVER_DIR/$server/dist/index.js"
    exit 1
  fi
done

echo "All 5 MCP servers verified."
echo ""

# --- Build the MCP server configuration ---
build_server_config() {
  cat <<JSONEOF
{
    "bettercallclaude-entscheidsuche": {
      "command": "node",
      "args": ["$SERVER_DIR/entscheidsuche/dist/index.js"]
    },
    "bettercallclaude-bge-search": {
      "command": "node",
      "args": ["$SERVER_DIR/bge-search/dist/index.js"]
    },
    "bettercallclaude-legal-citations": {
      "command": "node",
      "args": ["$SERVER_DIR/legal-citations/dist/index.js"]
    },
    "bettercallclaude-fedlex-sparql": {
      "command": "node",
      "args": ["$SERVER_DIR/fedlex-sparql/dist/index.js"]
    },
    "bettercallclaude-onlinekommentar": {
      "command": "node",
      "args": ["$SERVER_DIR/onlinekommentar/dist/index.js"]
    }
  }
JSONEOF
}

# --- Read existing config or create new one ---
if [ -f "$CONFIG_PATH" ]; then
  echo "Found existing Claude Desktop config."

  # Check if it already has BetterCallClaude servers
  if grep -q "bettercallclaude-entscheidsuche" "$CONFIG_PATH" 2>/dev/null; then
    echo ""
    read -r -p "BetterCallClaude servers already exist in config. Overwrite? [y/N] " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
      echo "Aborted. No changes made."
      exit 0
    fi
  fi

  # Back up existing config
  BACKUP="$CONFIG_PATH.backup.$(date +%Y%m%d%H%M%S)"
  cp "$CONFIG_PATH" "$BACKUP"
  echo "Backup saved: $BACKUP"
  echo ""
else
  echo "No existing config found. Creating new one."
  # Ensure parent directory exists
  mkdir -p "$(dirname "$CONFIG_PATH")"
fi

# --- Merge configuration using node (handles JSON properly) ---
# We use a small inline Node.js script to properly merge JSON
node -e "
const fs = require('fs');
const configPath = '$CONFIG_PATH';
const serverDir = '$SERVER_DIR';

// Read existing config or start fresh
let config = {};
try {
  const raw = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(raw);
} catch (e) {
  // File doesn't exist or isn't valid JSON
}

// Ensure mcpServers key exists
if (!config.mcpServers) {
  config.mcpServers = {};
}

// Add/update BetterCallClaude servers
const servers = ['entscheidsuche', 'bge-search', 'legal-citations', 'fedlex-sparql', 'onlinekommentar'];
for (const server of servers) {
  config.mcpServers['bettercallclaude-' + server] = {
    command: 'node',
    args: [serverDir + '/' + server + '/dist/index.js']
  };
}

// Write back with pretty formatting
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log('Configuration written successfully.');
"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "5 BetterCallClaude MCP servers added to Claude Desktop:"
echo "  - bettercallclaude-entscheidsuche  (Swiss court decisions)"
echo "  - bettercallclaude-bge-search      (Federal Supreme Court)"
echo "  - bettercallclaude-legal-citations  (Citation tools)"
echo "  - bettercallclaude-fedlex-sparql    (Federal legislation)"
echo "  - bettercallclaude-onlinekommentar  (Legal commentaries)"
echo ""
echo "NEXT STEPS:"
echo "  1. Restart Claude Desktop (quit and reopen)"
echo "  2. Open a Cowork session"
echo "  3. Run /bettercallclaude:setup to verify all 5 servers connect"
echo ""
echo "The servers now run on your host OS with full network access,"
echo "bypassing the Cowork VM's network sandbox."
