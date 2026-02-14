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

# Read version from plugin.json
VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$REPO_ROOT/.claude-plugin/plugin.json','utf8')).version)")

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
  "scripts/privacy-check.sh"
  "CONNECTORS.md"
  "README.md"
  "LICENSE"
)

REQUIRED_DIRS=(
  "agents"
  "commands"
  "skills"
  "mcp-servers"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$REPO_ROOT/$file" ]; then
    echo "ERROR: Missing required file: $file"
    exit 1
  fi
done

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$REPO_ROOT/$dir" ]; then
    echo "ERROR: Missing required directory: $dir"
    exit 1
  fi
done

# Verify compiled MCP servers
SERVERS=("entscheidsuche" "bge-search" "legal-citations" "fedlex-sparql" "onlinekommentar")
for server in "${SERVERS[@]}"; do
  if [ ! -f "$REPO_ROOT/mcp-servers/$server/dist/index.js" ]; then
    echo "ERROR: Missing compiled server: mcp-servers/$server/dist/index.js"
    echo "Run 'npm run build:bundle' first."
    exit 1
  fi
done

echo "All required files present."
echo ""

# Create staging directory
mkdir -p "$STAGING_DIR"

echo "Packaging plugin..."

# Copy plugin files
cp -r "$REPO_ROOT/.claude-plugin" "$STAGING_DIR/"
cp "$REPO_ROOT/.mcp.json" "$STAGING_DIR/"
cp -r "$REPO_ROOT/agents" "$STAGING_DIR/"
cp -r "$REPO_ROOT/commands" "$STAGING_DIR/"
cp -r "$REPO_ROOT/skills" "$STAGING_DIR/"
cp -r "$REPO_ROOT/hooks" "$STAGING_DIR/"

# Copy MCP servers (only dist/ contents, not source)
mkdir -p "$STAGING_DIR/mcp-servers"
cp "$REPO_ROOT/mcp-servers/.gitignore" "$STAGING_DIR/mcp-servers/" 2>/dev/null || true
for server in "${SERVERS[@]}"; do
  mkdir -p "$STAGING_DIR/mcp-servers/$server/dist"
  cp "$REPO_ROOT/mcp-servers/$server/dist/index.js" "$STAGING_DIR/mcp-servers/$server/dist/"
  # Copy WASM files if present
  if [ -f "$REPO_ROOT/mcp-servers/$server/dist/sql-wasm.wasm" ]; then
    cp "$REPO_ROOT/mcp-servers/$server/dist/sql-wasm.wasm" "$STAGING_DIR/mcp-servers/$server/dist/"
  fi
done

# Copy scripts needed at runtime
mkdir -p "$STAGING_DIR/scripts"
cp "$REPO_ROOT/scripts/privacy-check.sh" "$STAGING_DIR/scripts/"
cp "$REPO_ROOT/scripts/fetch-onlinekommentar-data.js" "$STAGING_DIR/scripts/" 2>/dev/null || true

# Copy documentation
cp "$REPO_ROOT/CONNECTORS.md" "$STAGING_DIR/"
cp "$REPO_ROOT/README.md" "$STAGING_DIR/"
cp "$REPO_ROOT/LICENSE" "$STAGING_DIR/"

# Create zip
mkdir -p "$OUTPUT_DIR"
(cd "$STAGING_DIR" && zip -r -q "$OUTPUT_DIR/$ZIP_NAME" .)

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
