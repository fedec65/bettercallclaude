/**
 * Swiss Legal Privacy Classifier
 *
 * Implements privacy detection patterns from the BetterCallClaude
 * privacy-routing skill for Art. 321 StGB compliance.
 *
 * Works entirely offline — no Ollama or network required.
 * PRIVILEGED patterns are checked before CONFIDENTIAL to prevent
 * "vertraulich" overriding "streng vertraulich".
 */

import type { PrivacyLevel, PatternMatch, ClassificationResult } from './types.js';

interface PatternDef {
  regex: RegExp;
  meaning: string;
  language: 'de' | 'fr' | 'it' | 'legal';
  level: PrivacyLevel;
}

// ---------------------------------------------------------------------------
// PRIVILEGED patterns (checked first)
// ---------------------------------------------------------------------------

const PRIVILEGED_PATTERNS: PatternDef[] = [
  // German
  { regex: /anwalt.*geheimnis/i, meaning: 'Attorney-client privilege', language: 'de', level: 'PRIVILEGED' },
  { regex: /mandatsgeheimnis/i, meaning: 'Client confidentiality', language: 'de', level: 'PRIVILEGED' },
  { regex: /berufsgeheimnis/i, meaning: 'Professional secrecy', language: 'de', level: 'PRIVILEGED' },
  { regex: /streng\s+vertraulich/i, meaning: 'Strictly confidential', language: 'de', level: 'PRIVILEGED' },
  // French
  { regex: /secret\s+professionnel/i, meaning: 'Professional secrecy', language: 'fr', level: 'PRIVILEGED' },
  { regex: /strictement\s+confidentiel/i, meaning: 'Strictly confidential', language: 'fr', level: 'PRIVILEGED' },
  // Italian
  { regex: /segreto\s+professionale/i, meaning: 'Professional secrecy', language: 'it', level: 'PRIVILEGED' },
  { regex: /strettamente\s+riservato/i, meaning: 'Strictly confidential', language: 'it', level: 'PRIVILEGED' },
  // Legal references
  { regex: /art\.?\s*321\s+st(?:gb|GB)/i, meaning: 'Criminal secrecy provision (DE)', language: 'legal', level: 'PRIVILEGED' },
  { regex: /art\.?\s*321\s+cp/i, meaning: 'Criminal secrecy provision (FR/IT)', language: 'legal', level: 'PRIVILEGED' },
  { regex: /art\.?\s*13\s+bgfa/i, meaning: "Lawyer's professional duty", language: 'legal', level: 'PRIVILEGED' },
];

// ---------------------------------------------------------------------------
// CONFIDENTIAL patterns
// ---------------------------------------------------------------------------

const CONFIDENTIAL_PATTERNS: PatternDef[] = [
  // German
  { regex: /geschaeftsgeheimnis/i, meaning: 'Trade secret', language: 'de', level: 'CONFIDENTIAL' },
  { regex: /vertraulich/i, meaning: 'Confidential', language: 'de', level: 'CONFIDENTIAL' },
  { regex: /\bintern\b/i, meaning: 'Internal use', language: 'de', level: 'CONFIDENTIAL' },
  { regex: /privat/i, meaning: 'Private', language: 'de', level: 'CONFIDENTIAL' },
  { regex: /persoenlich/i, meaning: 'Personal', language: 'de', level: 'CONFIDENTIAL' },
  { regex: /nicht\s+zur\s+weitergabe/i, meaning: 'Not for distribution', language: 'de', level: 'CONFIDENTIAL' },
  // French
  { regex: /confidentiel/i, meaning: 'Confidential', language: 'fr', level: 'CONFIDENTIAL' },
  { regex: /a\s+usage\s+interne/i, meaning: 'Internal use', language: 'fr', level: 'CONFIDENTIAL' },
  // Italian
  { regex: /riservato/i, meaning: 'Confidential', language: 'it', level: 'CONFIDENTIAL' },
  { regex: /uso\s+interno/i, meaning: 'Internal use', language: 'it', level: 'CONFIDENTIAL' },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify text by Swiss legal privacy level.
 *
 * Checks PRIVILEGED patterns first so that "streng vertraulich" is not
 * downgraded to CONFIDENTIAL by a "vertraulich" match. Duplicate matches
 * on the same text region are deduplicated.
 */
export function classifyPrivacy(text: string): ClassificationResult {
  const matches: PatternMatch[] = [];

  // PRIVILEGED first
  for (const def of PRIVILEGED_PATTERNS) {
    const m = def.regex.exec(text);
    if (m) {
      matches.push({
        pattern: def.regex.source,
        meaning: def.meaning,
        language: def.language,
        level: def.level,
        matchedText: m[0],
      });
    }
  }

  // CONFIDENTIAL second
  for (const def of CONFIDENTIAL_PATTERNS) {
    const m = def.regex.exec(text);
    if (m) {
      // Skip if the matched text is already covered by a PRIVILEGED match
      // e.g. "vertraulich" inside "streng vertraulich"
      const alreadyCovered = matches.some(
        (pm) =>
          pm.level === 'PRIVILEGED' &&
          pm.matchedText.toLowerCase().includes(m[0].toLowerCase()),
      );
      if (!alreadyCovered) {
        matches.push({
          pattern: def.regex.source,
          meaning: def.meaning,
          language: def.language,
          level: def.level,
          matchedText: m[0],
        });
      }
    }
  }

  // Determine overall level (highest wins)
  let level: PrivacyLevel = 'PUBLIC';
  if (matches.some((m) => m.level === 'PRIVILEGED')) {
    level = 'PRIVILEGED';
  } else if (matches.some((m) => m.level === 'CONFIDENTIAL')) {
    level = 'CONFIDENTIAL';
  }

  const summary = buildSummary(level, matches);

  return { level, matches, summary };
}

function buildSummary(level: PrivacyLevel, matches: PatternMatch[]): string {
  if (level === 'PUBLIC') {
    return 'No privacy-sensitive patterns detected. Content may be processed via cloud API.';
  }

  const langs = [...new Set(matches.map((m) => m.language))].join(', ');
  const patterns = matches.map((m) => m.meaning).join('; ');

  if (level === 'PRIVILEGED') {
    return (
      `PRIVILEGED content detected (${langs}): ${patterns}. ` +
      'This content is protected by Art. 321 StGB (attorney-client privilege). ' +
      'Local processing ONLY — do not send to cloud APIs.'
    );
  }

  return (
    `CONFIDENTIAL content detected (${langs}): ${patterns}. ` +
    'Anonymize client-identifying information before any external processing. ' +
    'Prefer local processing when available.'
  );
}
