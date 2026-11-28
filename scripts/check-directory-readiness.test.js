#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { auditPayload, auditSource, pngDimensions } = require('./check-directory-readiness.js');

let passed = 0;
let failed = 0;
const servers = [
  'entscheidsuche', 'bge-search', 'legal-citations', 'fedlex-sparql',
  'onlinekommentar', 'legal-persona', 'tas-jurisprudence', 'workflows-ch',
  'swiss-caselaw',
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

function pngChunk(type, data) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  header.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 0);
  return Buffer.concat([header, data, crc]);
}

function icon(width = 512, height = 512, idatData) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB
  const rowLength = 1 + width * 3;
  const raw = Buffer.alloc(rowLength * height);
  const idat = idatData || zlib.deflateSync(raw);
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function t(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
    passed++;
  } catch (error) {
    console.error(`  FAIL ${name}: ${error.message}`);
    failed++;
  }
}

function validFiles() {
  return {
    '.claude-plugin/plugin.json': Buffer.from(JSON.stringify({
      version: '5.0.0',
      privacyPolicyUrl: 'https://bettercallclaude.ch/privacy',
    })),
    '.claude-plugin/icon.png': icon(),
    '.mcp.json': Buffer.from(JSON.stringify({
      mcpServers: Object.fromEntries(servers.map((name) => [name, {
        type: name === 'swiss-caselaw' ? 'sse' : 'http',
        url: `https://example.test/${name}`,
      }])),
    })),
    'hooks/hooks.json': Buffer.from('{}'),
    'scripts/privacy-check.js': Buffer.from("'use strict';\n"),
  };
}

function readFrom(files) {
  return (name) => {
    if (!files[name]) throw new Error(`missing fixture ${name}`);
    return files[name];
  };
}

function writeFixture(root, files) {
  for (const [name, contents] of Object.entries(files)) {
    const target = path.join(root, 'bettercallclaude', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
  }
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '5.0.0' }));
  fs.mkdirSync(path.join(root, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(root, '.claude-plugin/marketplace.json'), JSON.stringify({
    plugins: [{ name: 'bettercallclaude', version: '5.0.0' }],
  }));
}

function withoutLogs(fn) {
  const original = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = original;
  }
}

t('accepts nine remote connectors, metadata, icon, and readable JavaScript', () => {
  const files = validFiles();
  const result = auditPayload(Object.keys(files), readFrom(files));
  assert.equal(result.version, '5.0.0');
});

t('rejects an Ollama MCP declaration', () => {
  const files = validFiles();
  const config = JSON.parse(files['.mcp.json'].toString('utf8'));
  config.mcpServers.ollama = { command: 'node', args: ['dist/index.js'] };
  files['.mcp.json'] = Buffer.from(JSON.stringify(config));
  assert.throws(() => auditPayload(Object.keys(files), readFrom(files)), /exactly the nine remote servers/);
});

t('rejects local server paths and executable payloads', () => {
  const files = validFiles();
  files['mcp-servers/ollama/dist/index.js'] = Buffer.from('bundle');
  assert.throws(() => auditPayload(Object.keys(files), readFrom(files)), /local MCP server path/);
  delete files['mcp-servers/ollama/dist/index.js'];
  files['scripts/payload.wasm'] = Buffer.from([0, 97, 115, 109]);
  assert.throws(() => auditPayload(Object.keys(files), readFrom(files)), /forbidden executable payload/);
});

t('rejects unreadable or oversized JavaScript', () => {
  const files = validFiles();
  files['scripts/privacy-check.js'] = Buffer.from([0, 1, 2]);
  assert.throws(() => auditPayload(Object.keys(files), readFrom(files)), /readable source text/);
  files['scripts/privacy-check.js'] = Buffer.alloc(262145, 65);
  assert.throws(() => auditPayload(Object.keys(files), readFrom(files)), /bundled JavaScript/);
});

t('rejects truncated PNG icons', () => {
  assert.throws(() => pngDimensions(icon().subarray(0, 24)), /truncated PNG|missing IEND/);
});

t('rejects PNG icons whose image data cannot be decoded', () => {
  assert.throws(() => pngDimensions(icon(512, 512, Buffer.from('not deflate'))), /not decodable/);
});

t('validates PNG dimensions and the privacy URL', () => {
  assert.deepEqual(pngDimensions(icon()), { width: 512, height: 512 });
  const files = validFiles();
  files['.claude-plugin/icon.png'] = icon(256, 256);
  assert.throws(() => auditPayload(Object.keys(files), readFrom(files)), /512 and 2048/);
  files['.claude-plugin/icon.png'] = icon();
  files['.claude-plugin/plugin.json'] = Buffer.from(JSON.stringify({
    version: '5.0.0', privacyPolicyUrl: 'https://example.test/privacy',
  }));
  assert.throws(() => auditPayload(Object.keys(files), readFrom(files)), /privacyPolicyUrl/);
});

t('source audit ignores OS metadata while artifact audit rejects it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcc-readiness-'));
  try {
    writeFixture(root, validFiles());
    fs.writeFileSync(path.join(root, 'bettercallclaude/.DS_Store'), Buffer.from([0, 1, 2]));
    withoutLogs(() => auditSource(root));
    const artifactFiles = { ...validFiles(), '.DS_Store': Buffer.from([0, 1, 2]) };
    assert.throws(
      () => auditPayload(Object.keys(artifactFiles), readFrom(artifactFiles)),
      /readable source text/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

if (failed) process.exitCode = 1;
else console.log(`\n${passed} directory-readiness tests passed.`);
