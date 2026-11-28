#!/usr/bin/env bash
# package-plugin.sh - Create distributable plugin zip
#
# Packages only the end-user files needed for the BetterCallClaude plugin,
# excluding source code, build tools, and development artifacts.
#
# Output: dist/bettercallclaude-<version>.zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# The plugin root is the bettercallclaude/ subdirectory (Cowork marketplace layout)
PLUGIN_ROOT="$REPO_ROOT/bettercallclaude"

# Read version from plugin.json
VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$PLUGIN_ROOT/.claude-plugin/plugin.json','utf8')).version)")

OUTPUT_DIR="$REPO_ROOT/dist"
ZIP_NAME="bettercallclaude-${VERSION}.zip"
STAGING_DIR="$OUTPUT_DIR/staging-$$"

echo "=== BetterCallClaude Plugin Packager ==="
echo "Version: $VERSION"
echo ""

# Verify required files exist
echo "Verifying plugin structure..."

REQUIRED_FILES=(
  ".claude-plugin/plugin.json"
  ".mcp.json"
  "hooks/hooks.json"
)

REQUIRED_DIRS=(
  "agents"
  "commands"
  "skills"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$PLUGIN_ROOT/$file" ]; then
    echo "ERROR: Missing required file: bettercallclaude/$file"
    exit 1
  fi
done

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$PLUGIN_ROOT/$dir" ]; then
    echo "ERROR: Missing required directory: bettercallclaude/$dir"
    exit 1
  fi
done

node "$REPO_ROOT/scripts/check-directory-readiness.js" source "$REPO_ROOT"

echo "All required files present."
echo ""

# Create staging directory
mkdir -p "$STAGING_DIR"

echo "Packaging plugin..."

# Copy plugin files from bettercallclaude/ subdirectory
cp -r "$PLUGIN_ROOT/.claude-plugin" "$STAGING_DIR/"
cp "$PLUGIN_ROOT/.mcp.json" "$STAGING_DIR/"
cp -r "$PLUGIN_ROOT/agents" "$STAGING_DIR/"
cp -r "$PLUGIN_ROOT/commands" "$STAGING_DIR/"
cp -r "$PLUGIN_ROOT/skills" "$STAGING_DIR/"
cp -r "$PLUGIN_ROOT/hooks" "$STAGING_DIR/"

# Copy scripts needed at runtime.
# The canonical PreToolUse hook is bettercallclaude/scripts/privacy-check.js
# (the shell variant privacy-check.sh was removed in PR #12 when the hook
# switched to matching MCP tool calls / MultiEdit / WebFetch and reading the
# canonical {tool_name, tool_input:{…}} JSON payload on stdin).
mkdir -p "$STAGING_DIR/scripts"
if [ -f "$PLUGIN_ROOT/scripts/privacy-check.js" ]; then
  cp "$PLUGIN_ROOT/scripts/privacy-check.js" "$STAGING_DIR/scripts/"
else
  echo "ERROR: Missing required hook script: bettercallclaude/scripts/privacy-check.js"
  exit 1
fi
cp "$REPO_ROOT/scripts/fetch-onlinekommentar-data.js" "$STAGING_DIR/scripts/" 2>/dev/null || true

# Copy the legal-chronology renderer (deterministic validator + md/html/docx
# renderer used by /legal-timeline). Required at runtime by the command.
if [ -f "$PLUGIN_ROOT/scripts/timeline-render.mjs" ]; then
  cp "$PLUGIN_ROOT/scripts/timeline-render.mjs" "$STAGING_DIR/scripts/"
else
  echo "ERROR: Missing required renderer: bettercallclaude/scripts/timeline-render.mjs"
  exit 1
fi

# Copy plugin-facing documentation. Prefer the copies inside bettercallclaude/
# (they are written for end users of the plugin); fall back to repo-root files.
for doc in README.md CONNECTORS.md LICENSE; do
  if [ -f "$PLUGIN_ROOT/$doc" ]; then
    cp "$PLUGIN_ROOT/$doc" "$STAGING_DIR/"
  elif [ -f "$REPO_ROOT/$doc" ]; then
    cp "$REPO_ROOT/$doc" "$STAGING_DIR/"
  fi
done

# Copy playbook language templates used by /start to generate the local playbook.
# Canonical location is inside the plugin root so marketplace installs also ship them.
mkdir -p "$STAGING_DIR/templates"
cp "$PLUGIN_ROOT/templates/"bettercallclaude.local.md.example.* "$STAGING_DIR/templates/"

# Remove macOS/Windows metadata that may have been copied into staging
find "$STAGING_DIR" -type f \( -name '.DS_Store' -o -name 'Thumbs.db' \) -delete

# Create zip
mkdir -p "$OUTPUT_DIR"
(cd "$STAGING_DIR" && zip -r -q "$OUTPUT_DIR/$ZIP_NAME" .)

node "$REPO_ROOT/scripts/check-directory-readiness.js" zip "$OUTPUT_DIR/$ZIP_NAME" "$REPO_ROOT"

# Clean up staging
rm -rf "$STAGING_DIR"

# Show result
SIZE=$(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)
echo ""
echo "=== Package Complete ==="
echo "Output: $OUTPUT_DIR/$ZIP_NAME ($SIZE)"
echo ""
echo "Contents:"
unzip -l "$OUTPUT_DIR/$ZIP_NAME" | tail -1
