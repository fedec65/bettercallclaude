#!/usr/bin/env bash
# build-mcpb.sh - Build .mcpb bundles for Claude Desktop installation
#
# Each .mcpb is a ZIP archive containing:
#   manifest.json   - MCPB v0.3 manifest
#   server/index.js - Pre-compiled MCP server
#
# Output: dist/mcpb/*.mcpb

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_SERVERS_DIR="$REPO_ROOT/plugins/bettercallclaude/mcp-servers"
MANIFESTS_DIR="$REPO_ROOT/mcpb/manifests"
OUTPUT_DIR="$REPO_ROOT/dist/mcpb"
STAGING_DIR="$REPO_ROOT/dist/mcpb-staging"

# Server names (must match manifest filenames and mcp-servers/ subdirectories)
SERVERS=(
  "entscheidsuche"
  "bge-search"
  "legal-citations"
  "fedlex-sparql"
  "onlinekommentar"
)

echo "=== BetterCallClaude MCPB Bundle Builder ==="
echo ""

# Verify prerequisites
for server in "${SERVERS[@]}"; do
  if [ ! -f "$MCP_SERVERS_DIR/$server/dist/index.js" ]; then
    echo "ERROR: Missing compiled server: $MCP_SERVERS_DIR/$server/dist/index.js"
    exit 1
  fi
  if [ ! -f "$MANIFESTS_DIR/$server-manifest.json" ]; then
    echo "ERROR: Missing manifest: $MANIFESTS_DIR/$server-manifest.json"
    exit 1
  fi
done

echo "All server files and manifests found."
echo ""

# Clean previous builds
rm -rf "$OUTPUT_DIR" "$STAGING_DIR"
mkdir -p "$OUTPUT_DIR" "$STAGING_DIR"

# Build each bundle
for server in "${SERVERS[@]}"; do
  BUNDLE_NAME="bettercallclaude-$server"
  STAGE="$STAGING_DIR/$BUNDLE_NAME"

  echo "Building $BUNDLE_NAME.mcpb ..."

  # Create staging directory
  mkdir -p "$STAGE/server"

  # Copy manifest (rename to manifest.json)
  cp "$MANIFESTS_DIR/$server-manifest.json" "$STAGE/manifest.json"

  # Copy compiled server
  cp "$MCP_SERVERS_DIR/$server/dist/index.js" "$STAGE/server/index.js"

  # Copy data directory if it exists (some servers need it)
  if [ -d "$MCP_SERVERS_DIR/$server/dist/data" ]; then
    cp -r "$MCP_SERVERS_DIR/$server/dist/data" "$STAGE/server/data"
  fi

  # Also check for shared data directory used by some servers
  if [ -d "$MCP_SERVERS_DIR/data" ] && [ "$server" = "entscheidsuche" -o "$server" = "bge-search" ]; then
    mkdir -p "$STAGE/server/data"
    # Only copy if the data dir has content relevant to this server
    if [ -d "$MCP_SERVERS_DIR/data" ]; then
      cp -r "$MCP_SERVERS_DIR/data"/* "$STAGE/server/data/" 2>/dev/null || true
    fi
  fi

  # Create .mcpb (ZIP archive)
  (cd "$STAGE" && zip -r -q "$OUTPUT_DIR/$BUNDLE_NAME.mcpb" .)

  # Show bundle size
  SIZE=$(du -h "$OUTPUT_DIR/$BUNDLE_NAME.mcpb" | cut -f1)
  echo "  -> $OUTPUT_DIR/$BUNDLE_NAME.mcpb ($SIZE)"
done

# Clean up staging
rm -rf "$STAGING_DIR"

echo ""
echo "=== Build Complete ==="
echo ""
echo "Created $(ls "$OUTPUT_DIR"/*.mcpb 2>/dev/null | wc -l | tr -d ' ') .mcpb bundles in $OUTPUT_DIR/"
echo ""
echo "To install in Claude Desktop:"
echo "  Double-click any .mcpb file, or drag it into Claude Desktop."
echo ""
echo "To attach to a GitHub Release:"
echo "  gh release create v2.2.4 $OUTPUT_DIR/*.mcpb --title 'v2.2.4' --notes 'Release notes'"
