#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { auditPayload, pngDimensions } = require('./check-directory-readiness.js');

let passed = 0;
let failed = 0;
const servers = [
  'entscheidsuche', 'bge-search', 'legal-citations', 'fedlex-sparql',
  'onlinekommentar', 'legal-persona', 'tas-jurisprudence', 'workflows-ch',
  'swiss-caselaw',
];

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

function icon(width = 512, height = 512) {
  const file = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(file);
  file.write('IHDR', 12, 'ascii');
  file.writeUInt32BE(width, 16);
  file.writeUInt32BE(height, 20);
  return file;
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
  return (path) => {
    if (!files[path]) throw new Error(`missing fixture ${path}`);
    return files[path];
  };
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

if (failed) process.exitCode = 1;
else console.log(`\n${passed} directory-readiness tests passed.`);
