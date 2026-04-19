#!/usr/bin/env node
/**
 * Standalone tests for privacy-check.js. Runs with plain `node` — no test
 * framework dependency.
 *
 *   node bettercallclaude/scripts/privacy-check.test.js
 */

'use strict';

const assert = require('node:assert');
const { classify, extractTextFromInput, extractPathHint } = require('./privacy-check.js');

let passed = 0;
let failed = 0;

function t(name, fn) {
  try {
    fn();
    console.log('  ok  ' + name);
    passed++;
  } catch (e) {
    console.error('  FAIL ' + name);
    console.error('       ' + (e && e.message ? e.message : e));
    failed++;
  }
}

console.log('privacy-check: strong patterns');

t('triggers on "Anwaltsgeheimnis"', () => {
  assert.strictEqual(classify('Dies ist Anwaltsgeheimnis.', ''), 'anwaltsgeheimnis');
});

t('triggers on "Mandatsgeheimnis"', () => {
  assert.strictEqual(classify('Unter Mandatsgeheimnis.', ''), 'mandatsgeheimnis');
});

t('triggers on "secret professionnel"', () => {
  assert.strictEqual(classify('Relève du secret professionnel.', ''), 'secret-professionnel-fr');
});

t('triggers on "segreto professionale"', () => {
  assert.strictEqual(classify('Coperto da segreto professionale.', ''), 'segreto-professionale-it');
});

t('triggers on "streng vertraulich"', () => {
  assert.strictEqual(classify('STRENG VERTRAULICH — nicht weitergeben.', ''), 'streng-vertraulich');
});

t('triggers on Art. 321 StGB', () => {
  assert.strictEqual(classify('Siehe Art. 321 StGB.', ''), 'art-321-stgb');
});

t('triggers on Art. 13 BGFA', () => {
  assert.strictEqual(classify('Verletzt Art. 13 BGFA.', ''), 'art-13-bgfa');
});

t('triggers on Art. 47 BankG', () => {
  assert.strictEqual(classify('Siehe Art. 47 BankG.', ''), 'art-47-bankg');
});

console.log('privacy-check: weak patterns (no discriminator)');

t('does NOT trigger on bare "vertraulich" without context', () => {
  assert.strictEqual(classify('Diese Information ist vertraulich.', '/tmp/notes.md'), null);
});

t('does NOT trigger on bare "confidentiel" without context', () => {
  assert.strictEqual(classify('Message confidentiel.', '/tmp/x.md'), null);
});

t('does NOT trigger on bare "riservato" without context', () => {
  assert.strictEqual(classify('Documento riservato.', '/tmp/x.md'), null);
});

t('does NOT trigger on bare "confidential" without context', () => {
  assert.strictEqual(classify('Confidential memo.', '/tmp/notes.md'), null);
});

console.log('privacy-check: weak patterns + path discriminator');

t('triggers on "vertraulich" when path contains /klient/', () => {
  assert.strictEqual(
    classify('Notiz: vertraulich.', '/home/u/klient/acme/notes.md'),
    'vertraulich-bare+context'
  );
});

t('triggers on "confidential" when path contains /case/', () => {
  assert.strictEqual(
    classify('Confidential memo.', '/home/u/cases/2024-smith/memo.md'),
    'confidential-bare+context'
  );
});

t('triggers on "riservato" when path contains /dossier/', () => {
  assert.strictEqual(
    classify('Riservato.', '/Users/u/dossiers/rossi/nota.md'),
    'riservato-bare+context'
  );
});

t('triggers on "confidentiel" when path contains /mandant/', () => {
  assert.strictEqual(
    classify('Strictement confidentiel.', '/home/u/mandants/muller/lettre.md'),
    'strictement-confidentiel-fr'
  );
});

console.log('privacy-check: weak patterns + content discriminator');

t('triggers on "vertraulich" when content mentions "Mandant"', () => {
  assert.strictEqual(
    classify('Notiz zum Mandanten Meier: vertraulich.', '/tmp/notes.md'),
    'vertraulich-bare+context'
  );
});

t('triggers on two co-occurring weak markers', () => {
  // classify() returns the first WEAK_PATTERNS match; "vertraulich" is first.
  assert.strictEqual(
    classify('Confidential and vertraulich.', '/tmp/x.md'),
    'vertraulich-bare+context'
  );
});

console.log('privacy-check: extractors');

t('extractTextFromInput handles Write', () => {
  const text = extractTextFromInput('Write', { file_path: '/x', content: 'Anwaltsgeheimnis' });
  assert.ok(text.includes('Anwaltsgeheimnis'));
});

t('extractTextFromInput handles MultiEdit edits[]', () => {
  const text = extractTextFromInput('MultiEdit', {
    file_path: '/x',
    edits: [
      { old_string: 'a', new_string: 'Art. 321 StGB' },
      { old_string: 'b', new_string: 'plain' },
    ],
  });
  assert.ok(text.includes('Art. 321 StGB'));
});

t('extractTextFromInput walks MCP tool inputs', () => {
  const text = extractTextFromInput('mcp__entscheidsuche__search', {
    filters: { query: 'Anwaltsgeheimnis Meier' },
  });
  assert.ok(text.includes('Anwaltsgeheimnis'));
});

t('extractTextFromInput handles Bash command', () => {
  const text = extractTextFromInput('Bash', { command: 'echo Anwaltsgeheimnis' });
  assert.ok(text.includes('Anwaltsgeheimnis'));
});

t('extractPathHint returns file_path', () => {
  assert.strictEqual(extractPathHint({ file_path: '/a/b' }), '/a/b');
});

t('extractPathHint returns "" when no path', () => {
  assert.strictEqual(extractPathHint({ content: 'x' }), '');
});

console.log('privacy-check: false-positive guards');

t('routine footer is NOT flagged', () => {
  const content =
    'Dear colleague,\n\nThe attached report is confidential and intended only ' +
    'for the addressee. Please delete if received in error.';
  assert.strictEqual(classify(content, '/home/u/reports/2024-q1.md'), null);
});

t('standard README with "confidential" term is NOT flagged', () => {
  const content = 'This repository is public. Do not include confidential data.';
  assert.strictEqual(classify(content, '/home/u/repo/README.md'), null);
});

console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
