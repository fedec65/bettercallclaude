#!/usr/bin/env bash
# build-servers.sh - Build MCP servers from TypeScript source into single-file bundles
#
# Compiles each MCP server using esbuild to produce standalone single-file
# bundles in mcp-servers/*/dist/index.js, matching the format expected by
# the plugin's .mcp.json configuration.
#
# Prerequisites: Node.js >= 18
# Usage: npm run build:bundle

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_ROOT/mcp-servers-src"
OUT_DIR="$REPO_ROOT/mcp-servers"

# Servers that depend on @bettercallclaude/shared (CommonJS)
SHARED_SERVERS=("entscheidsuche" "bge-search" "fedlex-sparql")

# Standalone servers (ESM)
STANDALONE_SERVERS=("legal-citations" "onlinekommentar")

echo "=== BetterCallClaude MCP Server Builder ==="
echo ""

# Step 1: Install dependencies
echo "[1/4] Installing dependencies..."
(cd "$SRC_DIR" && npm ci --ignore-scripts)
echo ""

# Step 2: Build shared library first (required by dependent servers)
echo "[2/4] Building shared library..."
(cd "$SRC_DIR/shared" && npx tsc --project tsconfig.json)
echo "  -> shared library compiled"
echo ""

# Step 3: Bundle each server with esbuild
echo "[3/4] Bundling servers..."

ESBUILD="$SRC_DIR/node_modules/.bin/esbuild"

for server in "${SHARED_SERVERS[@]}"; do
  echo "  Bundling $server (CommonJS)..."
  mkdir -p "$OUT_DIR/$server/dist"
  "$ESBUILD" "$SRC_DIR/$server/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node18 \
    --format=cjs \
    --outfile="$OUT_DIR/$server/dist/index.js" \
    --external:pg-native \
    --external:better-sqlite3 \
    --sourcemap=inline \
    --minify-syntax \
    --log-level=warning
done

for server in "${STANDALONE_SERVERS[@]}"; do
  echo "  Bundling $server (ESM)..."
  mkdir -p "$OUT_DIR/$server/dist"
  "$ESBUILD" "$SRC_DIR/$server/src/index.ts" \
    --bundle \
    --platform=node \
    --target=node18 \
    --format=esm \
    --outfile="$OUT_DIR/$server/dist/index.js" \
    --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
    --sourcemap=inline \
    --minify-syntax \
    --log-level=warning
done

echo ""

# Step 4: Copy sql-wasm.wasm for servers that need SQLite
echo "[4/4] Copying runtime assets..."

WASM_SRC="$SRC_DIR/node_modules/sql.js/dist/sql-wasm.wasm"
if [ -f "$WASM_SRC" ]; then
  for server in entscheidsuche bge-search; do
    cp "$WASM_SRC" "$OUT_DIR/$server/dist/sql-wasm.wasm"
    echo "  -> $server/dist/sql-wasm.wasm"
  done
else
  echo "  WARNING: sql-wasm.wasm not found at $WASM_SRC"
  echo "  Servers using SQLite may not work correctly."
fi

echo ""
echo "=== Build Complete ==="
echo ""
echo "Compiled servers:"
for server in "${SHARED_SERVERS[@]}" "${STANDALONE_SERVERS[@]}"; do
  if [ -f "$OUT_DIR/$server/dist/index.js" ]; then
    SIZE=$(du -h "$OUT_DIR/$server/dist/index.js" | cut -f1)
    echo "  $server/dist/index.js ($SIZE)"
  else
    echo "  $server/dist/index.js  MISSING"
  fi
done
