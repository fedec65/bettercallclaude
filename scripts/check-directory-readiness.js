#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PLUGIN_DIR = 'bettercallclaude';
const MANIFEST = '.claude-plugin/plugin.json';
const ICON = '.claude-plugin/icon.png';
const PRIVACY_URL = 'https://bettercallclaude.ch/privacy';
const EXPECTED_SERVERS = [
  'entscheidsuche', 'bge-search', 'legal-citations', 'fedlex-sparql',
  'onlinekommentar', 'legal-persona', 'tas-jurisprudence', 'workflows-ch',
  'swiss-caselaw',
];
const FORBIDDEN_EXTENSIONS = [
  '.wasm', '.node', '.dll', '.dylib', '.so', '.exe', '.pyc', '.pyo',
  '.class', '.jar',
];

function readJson(readFile, name) {
  return JSON.parse(readFile(name).toString('utf8'));
}

function pngDimensions(file) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert(file.length >= 24 && file.subarray(0, 8).equals(signature), 'icon must be a real PNG');
  assert.equal(file.toString('ascii', 12, 16), 'IHDR', 'icon PNG must contain an IHDR header');
  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) };
}

function auditPayload(paths, readFile) {
  const files = paths.filter((name) => name && !name.endsWith('/')).map((name) => name.replaceAll('\\', '/'));
  for (const name of files) {
    assert(!/(^|\/)mcp-servers(\/|$)/.test(name), `local MCP server path is forbidden: ${name}`);
    assert(!/(^|\/)dist(\/|$)/.test(name), `compiled dist payload is forbidden: ${name}`);
    assert(!FORBIDDEN_EXTENSIONS.includes(path.extname(name).toLowerCase()), `forbidden executable payload: ${name}`);
    const contents = readFile(name);
    if (name !== ICON) assert(!contents.includes(0), `file must be readable source text: ${name}`);
    if (/\.(?:cjs|js|mjs)$/.test(name)) {
      assert(contents.length <= 262144, `unreviewable bundled JavaScript exceeds 256 KiB: ${name}`);
    }
  }

  const manifest = readJson(readFile, MANIFEST);
  assert.equal(manifest.privacyPolicyUrl, PRIVACY_URL, `privacyPolicyUrl must be ${PRIVACY_URL}`);
  const iconFile = readFile(ICON);
  assert(iconFile.length < 2 * 1024 * 1024, 'icon must be under 2 MB');
  const { width, height } = pngDimensions(iconFile);
  assert.equal(width, height, 'icon must be square');
  assert(width >= 512 && width <= 2048, 'icon dimensions must be between 512 and 2048 pixels');

  const config = readJson(readFile, '.mcp.json');
  const actual = Object.keys(config.mcpServers || {}).sort();
  const expected = [...EXPECTED_SERVERS].sort();
  assert.deepEqual(actual, expected, '.mcp.json must contain exactly the nine remote servers');
  for (const name of EXPECTED_SERVERS) {
    const server = config.mcpServers[name];
    assert(server.type === 'http' || server.type === 'sse', `${name} must be remote HTTP/SSE`);
    assert(/^https:\/\//.test(server.url), `${name} must use an HTTPS URL`);
    assert(!('command' in server) && !('args' in server), `${name} must not launch a local process`);
  }
  return { version: manifest.version };
}

function walk(root, relative = '') {
  const absolute = path.join(root, relative);
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(root, name) : [name];
  });
}

function auditVersions(repoRoot, version) {
  assert(version, 'plugin version is required');
  const npmManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(npmManifest.version, version, 'npm and plugin versions must agree');
  const marketplace = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude-plugin/marketplace.json'), 'utf8'));
  const entry = marketplace.plugins.find((plugin) => plugin.name === 'bettercallclaude');
  assert(entry, 'marketplace entry bettercallclaude is required');
  assert.equal(entry.version, version, 'marketplace and plugin versions must agree');
}

function auditSource(repoRoot) {
  const pluginRoot = path.join(repoRoot, PLUGIN_DIR);
  const files = walk(pluginRoot);
  const { version } = auditPayload(files, (name) => fs.readFileSync(path.join(pluginRoot, name)));
  auditVersions(repoRoot, version);
  console.log(`Directory readiness OK: source v${version}, nine remote MCP servers`);
}

function auditZip(zipPath, repoRoot) {
  const files = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).trim().split('\n');
  const { version } = auditPayload(files, (name) => execFileSync('unzip', ['-p', zipPath, name], {
    maxBuffer: 4 * 1024 * 1024,
  }));
  auditVersions(repoRoot, version);
  console.log(`Directory readiness OK: ${zipPath}, nine remote MCP servers`);
}

if (require.main === module) {
  const [mode, target, root = process.cwd()] = process.argv.slice(2);
  if (mode === 'source') auditSource(target || root);
  else if (mode === 'zip' && target) auditZip(target, root);
  else {
    console.error('Usage: node scripts/check-directory-readiness.js source [repoRoot] | zip <plugin.zip> [repoRoot]');
    process.exit(2);
  }
}

module.exports = { auditPayload, auditSource, auditZip, pngDimensions };
