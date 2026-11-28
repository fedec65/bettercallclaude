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
const OS_METADATA = new Set(['.DS_Store', 'Thumbs.db']);
const EXPECTED_SERVERS = [
  'entscheidsuche', 'bge-search', 'legal-citations', 'fedlex-sparql',
  'onlinekommentar', 'legal-persona', 'tas-jurisprudence', 'workflows-ch',
  'swiss-caselaw',
];
const FORBIDDEN_EXTENSIONS = [
  '.wasm', '.node', '.dll', '.dylib', '.so', '.exe', '.pyc', '.pyo',
  '.class', '.jar',
];
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function readJson(readFile, name) {
  return JSON.parse(readFile(name).toString('utf8'));
}

function pngDimensions(file) {
  assert(file.length >= 33 && file.subarray(0, 8).equals(PNG_SIGNATURE), 'truncated PNG icon');
  let offset = 8;
  let width = 0;
  let height = 0;
  let sawHeader = false;
  let sawImageData = false;

  while (offset + 12 <= file.length) {
    const length = file.readUInt32BE(offset);
    const type = file.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    assert(chunkEnd <= file.length, `truncated PNG chunk: ${type}`);
    const expectedCrc = file.readUInt32BE(dataEnd);
    const actualCrc = crc32(file.subarray(offset + 4, dataEnd));
    assert.equal(actualCrc, expectedCrc, `invalid PNG CRC: ${type}`);

    if (!sawHeader) {
      assert.equal(type, 'IHDR', 'first PNG chunk must be IHDR');
      assert.equal(length, 13, 'PNG IHDR must be 13 bytes');
      width = file.readUInt32BE(dataStart);
      height = file.readUInt32BE(dataStart + 4);
      assert(width > 0 && height > 0, 'PNG dimensions must be positive');
      sawHeader = true;
    } else {
      assert.notEqual(type, 'IHDR', 'PNG must contain exactly one IHDR');
    }

    if (type === 'IDAT') {
      assert(length > 0, 'PNG IDAT must not be empty');
      sawImageData = true;
    }
    if (type === 'IEND') {
      assert.equal(length, 0, 'PNG IEND must be empty');
      assert.equal(chunkEnd, file.length, 'PNG must end at IEND');
      assert(sawImageData, 'PNG must contain image data');
      return { width, height };
    }
    offset = chunkEnd;
  }

  throw new Error('PNG is missing IEND');
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
    if (OS_METADATA.has(entry.name)) return [];
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
