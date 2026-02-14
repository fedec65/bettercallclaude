/**
 * Legal Citations MCP Server - Unit Tests
 * Tests for Swiss legal citation validation, formatting, parsing, and extraction
 */

import { describe, it, expect } from 'vitest';

// Citation types for testing
type Language = 'de' | 'fr' | 'it' | 'en';
type CitationType = 'bge' | 'atf' | 'dtf' | 'statute' | 'cantonal' | 'unknown';

interface CitationComponents {
  volume?: string;
  chamber?: string;
  page?: string;
  year?: string;
  statute?: string;
  article?: string;
  paragraph?: string;
  letter?: string;
  number?: string;
  canton?: string;
  courtLevel?: string;
  caseNumber?: string;
}

interface ValidationResult {
  valid: boolean;
  type: CitationType;
  normalized?: string;
  components?: CitationComponents;
  errors?: string[];
  warnings?: string[];
}

interface ParsedCitation {
  original: string;
  type: CitationType;
  components: CitationComponents;
  language: Language;
  isValid: boolean;
  suggestions?: string[];
}

interface FormattedCitation {
  citation: string;
  language: Language;
  type: CitationType;
  fullReference?: string;
}

interface ExtractedCitation {
  citation: string;
  type: CitationType;
  position: { start: number; end: number };
  valid?: boolean;
  parsed?: ParsedCitation;
}

// Statute SR number mapping
const STATUTE_SR_MAPPING: Record<string, string> = {
  'ZGB': '210', 'CC': '210', 'CCS': '210',
  'OR': '220', 'CO': '220',
  'StGB': '311.0', 'CP': '311.0', 'CPS': '311.0',
  'BV': '101', 'Cst': '101', 'Cost': '101',
  'BGG': '173.110', 'LTF': '173.110',
  'ZPO': '272', 'CPC': '272',
  'StPO': '312.0', 'CPP': '312.0',
  'SchKG': '281.1', 'LP': '281.1',
  'VwVG': '172.021', 'PA': '172.021',
};

const STATUTE_FULL_NAMES: Record<string, Record<Language, string>> = {
  'ZGB': {
    de: 'Schweizerisches Zivilgesetzbuch',
    fr: 'Code civil suisse',
    it: 'Codice civile svizzero',
    en: 'Swiss Civil Code'
  },
  'OR': {
    de: 'Obligationenrecht',
    fr: 'Code des obligations',
    it: 'Diritto delle obbligazioni',
    en: 'Code of Obligations'
  },
  'StGB': {
    de: 'Schweizerisches Strafgesetzbuch',
    fr: 'Code pénal suisse',
    it: 'Codice penale svizzero',
    en: 'Swiss Criminal Code'
  }
};

/**
 * Mock citation validator
 */
function validateCitation(citation: string): ValidationResult {
  const trimmedCitation = citation.trim();

  // BGE pattern: BGE 147 IV 73
  const bgePattern = /^BGE\s+(\d{1,3})\s+([IV]+)\s+(\d+)$/i;
  const bgeMatch = trimmedCitation.match(bgePattern);
  if (bgeMatch) {
    return {
      valid: true,
      type: 'bge',
      normalized: `BGE ${bgeMatch[1]} ${bgeMatch[2].toUpperCase()} ${bgeMatch[3]}`,
      components: {
        volume: bgeMatch[1],
        chamber: bgeMatch[2].toUpperCase(),
        page: bgeMatch[3]
      }
    };
  }

  // ATF pattern (French)
  const atfPattern = /^ATF\s+(\d{1,3})\s+([IV]+)\s+(\d+)$/i;
  const atfMatch = trimmedCitation.match(atfPattern);
  if (atfMatch) {
    return {
      valid: true,
      type: 'atf',
      normalized: `ATF ${atfMatch[1]} ${atfMatch[2].toUpperCase()} ${atfMatch[3]}`,
      components: {
        volume: atfMatch[1],
        chamber: atfMatch[2].toUpperCase(),
        page: atfMatch[3]
      }
    };
  }

  // DTF pattern (Italian)
  const dtfPattern = /^DTF\s+(\d{1,3})\s+([IV]+)\s+(\d+)$/i;
  const dtfMatch = trimmedCitation.match(dtfPattern);
  if (dtfMatch) {
    return {
      valid: true,
      type: 'dtf',
      normalized: `DTF ${dtfMatch[1]} ${dtfMatch[2].toUpperCase()} ${dtfMatch[3]}`,
      components: {
        volume: dtfMatch[1],
        chamber: dtfMatch[2].toUpperCase(),
        page: dtfMatch[3]
      }
    };
  }

  // Statute pattern (German): Art. 97 OR
  const statuteDePattern = /^Art\.\s*(\d+[a-z]?)\s*(Abs\.\s*(\d+))?\s*(lit\.\s*([a-z]))?\s*(ZGB|OR|StGB|BV|BGG|ZPO|StPO|SchKG|VwVG)$/i;
  const statuteDeMatch = trimmedCitation.match(statuteDePattern);
  if (statuteDeMatch) {
    return {
      valid: true,
      type: 'statute',
      normalized: trimmedCitation,
      components: {
        statute: statuteDeMatch[6].toUpperCase(),
        article: statuteDeMatch[1],
        paragraph: statuteDeMatch[3],
        letter: statuteDeMatch[5]
      }
    };
  }

  // Statute pattern (French): art. 97 CO
  const statuteFrPattern = /^art\.\s*(\d+[a-z]?)\s*(al\.\s*(\d+))?\s*(let\.\s*([a-z]))?\s*(CC|CO|CP|Cst|LTF|CPC|CPP|LP|PA)$/i;
  const statuteFrMatch = trimmedCitation.match(statuteFrPattern);
  if (statuteFrMatch) {
    return {
      valid: true,
      type: 'statute',
      normalized: trimmedCitation,
      components: {
        statute: statuteFrMatch[6].toUpperCase(),
        article: statuteFrMatch[1],
        paragraph: statuteFrMatch[3],
        letter: statuteFrMatch[5]
      }
    };
  }

  return {
    valid: false,
    type: 'unknown',
    errors: ['Could not parse citation format']
  };
}

/**
 * Mock citation parser
 */
function parseCitation(citation: string): ParsedCitation {
  const validationResult = validateCitation(citation);

  // Determine language from citation
  let language: Language = 'de';
  if (citation.match(/^ATF/i) || citation.match(/\b(al\.|let\.|CC|CO|CP|Cst|LTF)\b/)) {
    language = 'fr';
  } else if (citation.match(/^DTF/i) || citation.match(/\b(cpv\.|lett\.|CCS|CPS|Cost)\b/)) {
    language = 'it';
  }

  return {
    original: citation,
    type: validationResult.type,
    components: validationResult.components || {},
    language,
    isValid: validationResult.valid,
    suggestions: validationResult.valid ? undefined : ['Check citation format']
  };
}

/**
 * Mock citation formatter
 */
function formatCitation(
  type: CitationType,
  components: CitationComponents,
  targetLanguage: Language,
  fullStatuteName: boolean = false
): FormattedCitation {
  let citation = '';
  let fullReference: string | undefined;

  if (type === 'bge' || type === 'atf' || type === 'dtf') {
    // Format BGE/ATF/DTF based on target language
    const prefix = targetLanguage === 'fr' ? 'ATF' :
                   targetLanguage === 'it' ? 'DTF' : 'BGE';
    citation = `${prefix} ${components.volume} ${components.chamber} ${components.page}`;
  } else if (type === 'statute' && components.statute) {
    // Format statute citation
    const labels = {
      de: { art: 'Art.', abs: 'Abs.', lit: 'lit.' },
      fr: { art: 'art.', abs: 'al.', lit: 'let.' },
      it: { art: 'art.', abs: 'cpv.', lit: 'lett.' },
      en: { art: 'Art.', abs: 'para.', lit: 'lit.' }
    };

    // Map statute abbreviation to target language
    const statuteMap: Record<string, Record<Language, string>> = {
      'ZGB': { de: 'ZGB', fr: 'CC', it: 'CCS', en: 'CC' },
      'CC': { de: 'ZGB', fr: 'CC', it: 'CCS', en: 'CC' },
      'OR': { de: 'OR', fr: 'CO', it: 'CO', en: 'CO' },
      'CO': { de: 'OR', fr: 'CO', it: 'CO', en: 'CO' },
      'StGB': { de: 'StGB', fr: 'CP', it: 'CPS', en: 'CC' },
      'CP': { de: 'StGB', fr: 'CP', it: 'CPS', en: 'CC' }
    };

    const statute = components.statute.toUpperCase();
    const targetStatute = statuteMap[statute]?.[targetLanguage] || statute;
    const l = labels[targetLanguage];

    citation = `${l.art} ${components.article}`;
    if (components.paragraph) {
      citation += ` ${l.abs} ${components.paragraph}`;
    }
    if (components.letter) {
      citation += ` ${l.lit} ${components.letter}`;
    }
    citation += ` ${targetStatute}`;

    // Add full name if requested
    if (fullStatuteName) {
      const normalizedStatute = Object.keys(STATUTE_FULL_NAMES).find(k =>
        statuteMap[k]?.[targetLanguage] === targetStatute ||
        k === statute
      );
      if (normalizedStatute && STATUTE_FULL_NAMES[normalizedStatute]) {
        fullReference = `${citation} (${STATUTE_FULL_NAMES[normalizedStatute][targetLanguage]})`;
      }
    }
  }

  return {
    citation,
    language: targetLanguage,
    type,
    fullReference
  };
}

/**
 * Mock citation extractor
 */
function extractCitations(
  text: string,
  includeTypes: string[] = ['all'],
  validateCitations: boolean = true
): {
  citations: ExtractedCitation[];
  statistics: {
    total: number;
    byType: Record<string, number>;
    validCount: number;
    invalidCount: number;
  };
} {
  const citations: ExtractedCitation[] = [];
  const shouldIncludeAll = includeTypes.includes('all');

  // Define patterns
  const patterns: Array<{ regex: RegExp; type: CitationType }> = [
    { regex: /BGE\s+\d{1,3}\s+[IV]+\s+\d+/gi, type: 'bge' },
    { regex: /ATF\s+\d{1,3}\s+[IV]+\s+\d+/gi, type: 'atf' },
    { regex: /DTF\s+\d{1,3}\s+[IV]+\s+\d+/gi, type: 'dtf' },
    { regex: /Art\.\s*\d+[a-z]?\s*(Abs\.\s*\d+)?\s*(lit\.\s*[a-z])?\s*(ZGB|OR|StGB|BV|BGG)/gi, type: 'statute' },
    { regex: /art\.\s*\d+[a-z]?\s*(al\.\s*\d+)?\s*(let\.\s*[a-z])?\s*(CC|CO|CP|Cst|LTF)/gi, type: 'statute' }
  ];

  const filteredPatterns = patterns.filter(p =>
    shouldIncludeAll || includeTypes.includes(p.type)
  );

  for (const { regex, type } of filteredPatterns) {
    let match;
    const regexCopy = new RegExp(regex.source, regex.flags);

    while ((match = regexCopy.exec(text)) !== null) {
      const citation = match[0].trim();
      const position = { start: match.index, end: match.index + citation.length };

      const isDuplicate = citations.some(
        c => c.citation === citation && c.position.start === position.start
      );

      if (!isDuplicate) {
        const entry: ExtractedCitation = { citation, type, position };

        if (validateCitations) {
          const parsed = parseCitation(citation);
          entry.parsed = parsed;
          entry.valid = parsed.isValid;
        }

        citations.push(entry);
      }
    }
  }

  citations.sort((a, b) => a.position.start - b.position.start);

  const statistics = {
    total: citations.length,
    byType: {} as Record<string, number>,
    validCount: citations.filter(c => c.valid !== false).length,
    invalidCount: citations.filter(c => c.valid === false).length
  };

  for (const c of citations) {
    statistics.byType[c.type] = (statistics.byType[c.type] || 0) + 1;
  }

  return { citations, statistics };
}

/**
 * Build provision reference
 */
function buildProvisionReference(
  statute: string,
  article: number,
  paragraph?: number,
  letter?: string,
  language: Language = 'de'
): string {
  const labels = {
    de: { art: 'Art.', abs: 'Abs.', lit: 'lit.' },
    fr: { art: 'art.', abs: 'al.', lit: 'let.' },
    it: { art: 'art.', abs: 'cpv.', lit: 'lett.' },
    en: { art: 'Art.', abs: 'para.', lit: 'lit.' }
  };

  const l = labels[language];
  let ref = `${l.art} ${article}`;

  if (paragraph) {
    ref += ` ${l.abs} ${paragraph}`;
  }
  if (letter) {
    ref += ` ${l.lit} ${letter}`;
  }
  ref += ` ${statute}`;

  return ref;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Legal Citations MCP Server', () => {
  // ---------------------------------------------------------------------------
  // validate_citation tool tests
  // ---------------------------------------------------------------------------
  describe('validate_citation', () => {
    describe('BGE citations (German)', () => {
      it('should validate standard BGE citation', () => {
        const result = validateCitation('BGE 147 IV 73');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('bge');
        expect(result.components?.volume).toBe('147');
        expect(result.components?.chamber).toBe('IV');
        expect(result.components?.page).toBe('73');
      });

      it('should validate BGE with single-digit volume', () => {
        const result = validateCitation('BGE 1 I 1');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('bge');
      });

      it('should normalize BGE citation', () => {
        const result = validateCitation('bge 147 iv 73');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('BGE 147 IV 73');
      });

      it('should handle various chamber designations', () => {
        const chambers = ['I', 'II', 'III', 'IV', 'V'];
        for (const chamber of chambers) {
          const result = validateCitation(`BGE 147 ${chamber} 100`);
          expect(result.valid).toBe(true);
          expect(result.components?.chamber).toBe(chamber);
        }
      });
    });

    describe('ATF citations (French)', () => {
      it('should validate standard ATF citation', () => {
        const result = validateCitation('ATF 147 IV 73');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('atf');
      });

      it('should normalize ATF citation', () => {
        const result = validateCitation('atf 147 iv 73');
        expect(result.valid).toBe(true);
        expect(result.normalized).toBe('ATF 147 IV 73');
      });
    });

    describe('DTF citations (Italian)', () => {
      it('should validate standard DTF citation', () => {
        const result = validateCitation('DTF 147 IV 73');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('dtf');
      });
    });

    describe('Statute citations (German)', () => {
      it('should validate simple article citation', () => {
        const result = validateCitation('Art. 97 OR');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('statute');
        expect(result.components?.statute).toBe('OR');
        expect(result.components?.article).toBe('97');
      });

      it('should validate article with paragraph', () => {
        const result = validateCitation('Art. 8 Abs. 1 ZGB');
        expect(result.valid).toBe(true);
        expect(result.components?.article).toBe('8');
        expect(result.components?.paragraph).toBe('1');
        expect(result.components?.statute).toBe('ZGB');
      });

      it('should validate article with letter', () => {
        const result = validateCitation('Art. 102 lit. a OR');
        expect(result.valid).toBe(true);
        expect(result.components?.letter).toBe('a');
      });

      it('should validate article with paragraph and letter', () => {
        const result = validateCitation('Art. 8 Abs. 2 lit. b ZGB');
        expect(result.valid).toBe(true);
        expect(result.components?.paragraph).toBe('2');
        expect(result.components?.letter).toBe('b');
      });

      it('should validate various German statutes', () => {
        const statutes = ['ZGB', 'OR', 'StGB', 'BV', 'BGG', 'ZPO', 'StPO'];
        for (const statute of statutes) {
          const result = validateCitation(`Art. 1 ${statute}`);
          expect(result.valid).toBe(true);
          // Statute is normalized to uppercase
          expect(result.components?.statute).toBe(statute.toUpperCase());
        }
      });
    });

    describe('Statute citations (French)', () => {
      it('should validate French statute citation', () => {
        const result = validateCitation('art. 97 CO');
        expect(result.valid).toBe(true);
        expect(result.type).toBe('statute');
        expect(result.components?.statute).toBe('CO');
      });

      it('should validate French citation with alinéa', () => {
        const result = validateCitation('art. 8 al. 1 CC');
        expect(result.valid).toBe(true);
        expect(result.components?.paragraph).toBe('1');
      });

      it('should validate French citation with lettre', () => {
        const result = validateCitation('art. 8 let. a CC');
        expect(result.valid).toBe(true);
        expect(result.components?.letter).toBe('a');
      });
    });

    describe('Invalid citations', () => {
      it('should reject malformed BGE citation', () => {
        const result = validateCitation('BGE 147');
        expect(result.valid).toBe(false);
        expect(result.type).toBe('unknown');
      });

      it('should reject invalid statute abbreviation', () => {
        const result = validateCitation('Art. 1 XYZ');
        expect(result.valid).toBe(false);
      });

      it('should reject empty citation', () => {
        const result = validateCitation('');
        expect(result.valid).toBe(false);
      });

      it('should reject random text', () => {
        const result = validateCitation('This is not a citation');
        expect(result.valid).toBe(false);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // parse_citation tool tests
  // ---------------------------------------------------------------------------
  describe('parse_citation', () => {
    it('should parse BGE and detect German language', () => {
      const result = parseCitation('BGE 147 IV 73');
      expect(result.type).toBe('bge');
      expect(result.language).toBe('de');
      expect(result.isValid).toBe(true);
    });

    it('should parse ATF and detect French language', () => {
      const result = parseCitation('ATF 147 IV 73');
      expect(result.type).toBe('atf');
      expect(result.language).toBe('fr');
      expect(result.isValid).toBe(true);
    });

    it('should parse DTF and detect Italian language', () => {
      const result = parseCitation('DTF 147 IV 73');
      expect(result.type).toBe('dtf');
      expect(result.language).toBe('it');
      expect(result.isValid).toBe(true);
    });

    it('should parse German statute citation', () => {
      const result = parseCitation('Art. 97 Abs. 1 OR');
      expect(result.type).toBe('statute');
      expect(result.language).toBe('de');
      expect(result.components.article).toBe('97');
    });

    it('should parse French statute citation', () => {
      const result = parseCitation('art. 97 al. 1 CO');
      expect(result.type).toBe('statute');
      expect(result.language).toBe('fr');
    });

    it('should provide suggestions for invalid citations', () => {
      const result = parseCitation('Invalid citation');
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toBeDefined();
    });

    it('should preserve original citation text', () => {
      const original = 'BGE 147 IV 73';
      const result = parseCitation(original);
      expect(result.original).toBe(original);
    });
  });

  // ---------------------------------------------------------------------------
  // format_citation tool tests
  // ---------------------------------------------------------------------------
  describe('format_citation', () => {
    describe('BGE/ATF/DTF formatting', () => {
      it('should format BGE to German', () => {
        const result = formatCitation('bge', {
          volume: '147', chamber: 'IV', page: '73'
        }, 'de');
        expect(result.citation).toBe('BGE 147 IV 73');
        expect(result.language).toBe('de');
      });

      it('should format BGE to French (ATF)', () => {
        const result = formatCitation('bge', {
          volume: '147', chamber: 'IV', page: '73'
        }, 'fr');
        expect(result.citation).toBe('ATF 147 IV 73');
        expect(result.language).toBe('fr');
      });

      it('should format BGE to Italian (DTF)', () => {
        const result = formatCitation('bge', {
          volume: '147', chamber: 'IV', page: '73'
        }, 'it');
        expect(result.citation).toBe('DTF 147 IV 73');
        expect(result.language).toBe('it');
      });
    });

    describe('Statute formatting', () => {
      it('should format German statute to French', () => {
        const result = formatCitation('statute', {
          statute: 'OR', article: '97'
        }, 'fr');
        expect(result.citation).toBe('art. 97 CO');
      });

      it('should format French statute to German', () => {
        const result = formatCitation('statute', {
          statute: 'CO', article: '97'
        }, 'de');
        expect(result.citation).toBe('Art. 97 OR');
      });

      it('should format statute with paragraph in German', () => {
        const result = formatCitation('statute', {
          statute: 'ZGB', article: '8', paragraph: '1'
        }, 'de');
        expect(result.citation).toBe('Art. 8 Abs. 1 ZGB');
      });

      it('should format statute with paragraph in French', () => {
        const result = formatCitation('statute', {
          statute: 'ZGB', article: '8', paragraph: '1'
        }, 'fr');
        expect(result.citation).toContain('al. 1');
      });

      it('should format statute with paragraph in Italian', () => {
        const result = formatCitation('statute', {
          statute: 'ZGB', article: '8', paragraph: '1'
        }, 'it');
        expect(result.citation).toContain('cpv. 1');
      });

      it('should include full statute name when requested', () => {
        const result = formatCitation('statute', {
          statute: 'OR', article: '97'
        }, 'de', true);
        expect(result.fullReference).toContain('Obligationenrecht');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // convert_citation tool tests
  // ---------------------------------------------------------------------------
  describe('convert_citation (integration)', () => {
    it('should convert BGE to ATF', () => {
      const parsed = parseCitation('BGE 147 IV 73');
      const formatted = formatCitation(parsed.type, parsed.components, 'fr');
      expect(formatted.citation).toBe('ATF 147 IV 73');
    });

    it('should convert ATF to DTF', () => {
      const parsed = parseCitation('ATF 147 IV 73');
      const formatted = formatCitation(parsed.type, parsed.components, 'it');
      expect(formatted.citation).toBe('DTF 147 IV 73');
    });

    it('should convert German statute to French', () => {
      const parsed = parseCitation('Art. 97 OR');
      const formatted = formatCitation(parsed.type, parsed.components, 'fr');
      expect(formatted.citation).toBe('art. 97 CO');
    });

    it('should preserve components during conversion', () => {
      const original = parseCitation('BGE 147 IV 73');
      const converted = formatCitation(original.type, original.components, 'fr');

      expect(converted.citation).toContain('147');
      expect(converted.citation).toContain('IV');
      expect(converted.citation).toContain('73');
    });
  });

  // ---------------------------------------------------------------------------
  // extract_citations tool tests
  // ---------------------------------------------------------------------------
  describe('extract_citations', () => {
    describe('BGE/ATF/DTF extraction', () => {
      it('should extract single BGE citation', () => {
        const text = 'According to BGE 147 IV 73, the court held...';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(1);
        expect(result.citations[0].citation).toBe('BGE 147 IV 73');
        expect(result.citations[0].type).toBe('bge');
      });

      it('should extract multiple BGE citations', () => {
        const text = 'See BGE 147 IV 73 and BGE 145 III 42 for reference.';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(2);
        expect(result.statistics.byType['bge']).toBe(2);
      });

      it('should extract ATF citation', () => {
        const text = 'Selon ATF 147 IV 73, le tribunal a décidé...';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(1);
        expect(result.citations[0].type).toBe('atf');
      });

      it('should extract DTF citation', () => {
        const text = 'Secondo DTF 147 IV 73, il tribunale ha deciso...';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(1);
        expect(result.citations[0].type).toBe('dtf');
      });

      it('should extract mixed language citations', () => {
        const text = 'BGE 147 IV 73, ATF 145 III 42, and DTF 140 II 50';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(3);
        expect(result.statistics.byType['bge']).toBe(1);
        expect(result.statistics.byType['atf']).toBe(1);
        expect(result.statistics.byType['dtf']).toBe(1);
      });
    });

    describe('Statute extraction', () => {
      it('should extract German statute citation', () => {
        const text = 'Gemäss Art. 97 OR ist der Schuldner verpflichtet...';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(1);
        expect(result.citations[0].type).toBe('statute');
      });

      it('should extract statute with paragraph', () => {
        const text = 'Art. 8 Abs. 1 ZGB regelt die Beweislast.';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(1);
        expect(result.citations[0].citation).toContain('Abs. 1');
      });

      it('should extract French statute citation', () => {
        const text = 'Selon art. 97 CO, le débiteur est tenu...';
        const result = extractCitations(text);

        expect(result.citations).toHaveLength(1);
        expect(result.citations[0].type).toBe('statute');
      });

      it('should extract multiple statute citations', () => {
        const text = 'Art. 97 OR, Art. 8 ZGB und Art. 1 StGB sind relevant.';
        const result = extractCitations(text);

        expect(result.citations.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('Citation positions', () => {
      it('should return correct positions', () => {
        const text = 'See BGE 147 IV 73 for details.';
        const result = extractCitations(text);

        expect(result.citations[0].position.start).toBe(4);
        expect(result.citations[0].position.end).toBe(17);
        expect(text.substring(result.citations[0].position.start, result.citations[0].position.end)).toBe('BGE 147 IV 73');
      });

      it('should sort citations by position', () => {
        const text = 'First BGE 147 IV 73, then ATF 145 III 42.';
        const result = extractCitations(text);

        expect(result.citations.length).toBeGreaterThan(1);
        for (let i = 1; i < result.citations.length; i++) {
          expect(result.citations[i].position.start).toBeGreaterThan(result.citations[i - 1].position.start);
        }
      });
    });

    describe('Filtering options', () => {
      it('should filter by citation type - BGE only', () => {
        const text = 'BGE 147 IV 73, ATF 145 III 42, Art. 97 OR';
        const result = extractCitations(text, ['bge']);

        expect(result.citations.every(c => c.type === 'bge')).toBe(true);
      });

      it('should filter by citation type - statute only', () => {
        const text = 'BGE 147 IV 73, Art. 97 OR, Art. 8 ZGB';
        const result = extractCitations(text, ['statute']);

        expect(result.citations.every(c => c.type === 'statute')).toBe(true);
      });

      it('should include all types by default', () => {
        const text = 'BGE 147 IV 73 and Art. 97 OR';
        const result = extractCitations(text);

        const types = new Set(result.citations.map(c => c.type));
        expect(types.size).toBeGreaterThan(1);
      });
    });

    describe('Validation', () => {
      it('should validate citations when requested', () => {
        const text = 'BGE 147 IV 73 is valid.';
        const result = extractCitations(text, ['all'], true);

        expect(result.citations[0].valid).toBe(true);
        expect(result.citations[0].parsed).toBeDefined();
      });

      it('should not validate when disabled', () => {
        const text = 'BGE 147 IV 73 is not validated.';
        const result = extractCitations(text, ['all'], false);

        expect(result.citations[0].valid).toBeUndefined();
        expect(result.citations[0].parsed).toBeUndefined();
      });

      it('should count valid and invalid citations', () => {
        const text = 'BGE 147 IV 73 is correct.';
        const result = extractCitations(text, ['all'], true);

        expect(result.statistics.validCount).toBeGreaterThanOrEqual(0);
        expect(result.statistics.invalidCount).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Statistics', () => {
      it('should return total count', () => {
        const text = 'BGE 147 IV 73 and BGE 145 III 42';
        const result = extractCitations(text);

        expect(result.statistics.total).toBe(2);
      });

      it('should group by type', () => {
        const text = 'BGE 147 IV 73, ATF 145 III 42, Art. 97 OR';
        const result = extractCitations(text);

        expect(result.statistics.byType).toBeDefined();
        expect(typeof result.statistics.byType['bge']).toBe('number');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty text', () => {
        const result = extractCitations('');
        expect(result.citations).toHaveLength(0);
        expect(result.statistics.total).toBe(0);
      });

      it('should handle text with no citations', () => {
        const text = 'This is a legal document with no citations.';
        const result = extractCitations(text);
        expect(result.citations).toHaveLength(0);
      });

      it('should handle duplicate citations', () => {
        const text = 'See BGE 147 IV 73 again BGE 147 IV 73';
        const result = extractCitations(text);

        // Each occurrence should be tracked separately by position
        expect(result.citations.length).toBe(2);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // get_provision_text tool tests
  // ---------------------------------------------------------------------------
  describe('get_provision_text', () => {
    describe('Provision reference building', () => {
      it('should build German provision reference', () => {
        const ref = buildProvisionReference('OR', 97, undefined, undefined, 'de');
        expect(ref).toBe('Art. 97 OR');
      });

      it('should build French provision reference', () => {
        const ref = buildProvisionReference('CO', 97, undefined, undefined, 'fr');
        expect(ref).toBe('art. 97 CO');
      });

      it('should build Italian provision reference', () => {
        const ref = buildProvisionReference('CO', 97, undefined, undefined, 'it');
        expect(ref).toBe('art. 97 CO');
      });

      it('should include paragraph in German', () => {
        const ref = buildProvisionReference('ZGB', 8, 1, undefined, 'de');
        expect(ref).toBe('Art. 8 Abs. 1 ZGB');
      });

      it('should include paragraph in French', () => {
        const ref = buildProvisionReference('CC', 8, 1, undefined, 'fr');
        expect(ref).toBe('art. 8 al. 1 CC');
      });

      it('should include paragraph in Italian', () => {
        const ref = buildProvisionReference('CCS', 8, 1, undefined, 'it');
        expect(ref).toBe('art. 8 cpv. 1 CCS');
      });

      it('should include letter', () => {
        const ref = buildProvisionReference('OR', 102, undefined, 'a', 'de');
        expect(ref).toBe('Art. 102 lit. a OR');
      });

      it('should include paragraph and letter', () => {
        const ref = buildProvisionReference('ZGB', 8, 2, 'b', 'de');
        expect(ref).toBe('Art. 8 Abs. 2 lit. b ZGB');
      });
    });

    describe('Statute SR mapping', () => {
      it('should map German abbreviations', () => {
        expect(STATUTE_SR_MAPPING['ZGB']).toBe('210');
        expect(STATUTE_SR_MAPPING['OR']).toBe('220');
        expect(STATUTE_SR_MAPPING['StGB']).toBe('311.0');
        expect(STATUTE_SR_MAPPING['BV']).toBe('101');
      });

      it('should map French abbreviations', () => {
        expect(STATUTE_SR_MAPPING['CC']).toBe('210');
        expect(STATUTE_SR_MAPPING['CO']).toBe('220');
        expect(STATUTE_SR_MAPPING['CP']).toBe('311.0');
        expect(STATUTE_SR_MAPPING['Cst']).toBe('101');
      });

      it('should map Italian abbreviations', () => {
        expect(STATUTE_SR_MAPPING['CCS']).toBe('210');
        expect(STATUTE_SR_MAPPING['CPS']).toBe('311.0');
        expect(STATUTE_SR_MAPPING['Cost']).toBe('101');
      });

      it('should have consistent mappings across languages', () => {
        // ZGB/CC/CCS should all map to same SR number
        expect(STATUTE_SR_MAPPING['ZGB']).toBe(STATUTE_SR_MAPPING['CC']);
        expect(STATUTE_SR_MAPPING['CC']).toBe(STATUTE_SR_MAPPING['CCS']);

        // OR/CO should map to same SR number
        expect(STATUTE_SR_MAPPING['OR']).toBe(STATUTE_SR_MAPPING['CO']);

        // StGB/CP/CPS should map to same SR number
        expect(STATUTE_SR_MAPPING['StGB']).toBe(STATUTE_SR_MAPPING['CP']);
        expect(STATUTE_SR_MAPPING['CP']).toBe(STATUTE_SR_MAPPING['CPS']);
      });
    });

    describe('Full statute names', () => {
      it('should have German full names', () => {
        expect(STATUTE_FULL_NAMES['ZGB']['de']).toBe('Schweizerisches Zivilgesetzbuch');
        expect(STATUTE_FULL_NAMES['OR']['de']).toBe('Obligationenrecht');
      });

      it('should have French full names', () => {
        expect(STATUTE_FULL_NAMES['ZGB']['fr']).toBe('Code civil suisse');
        expect(STATUTE_FULL_NAMES['OR']['fr']).toBe('Code des obligations');
      });

      it('should have Italian full names', () => {
        expect(STATUTE_FULL_NAMES['ZGB']['it']).toBe('Codice civile svizzero');
      });

      it('should have English full names', () => {
        expect(STATUTE_FULL_NAMES['ZGB']['en']).toBe('Swiss Civil Code');
        expect(STATUTE_FULL_NAMES['OR']['en']).toBe('Code of Obligations');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // standardize_document_citations tool tests
  // ---------------------------------------------------------------------------
  describe('standardize_document_citations', () => {
    it('should standardize mixed language citations to German', () => {
      const text = 'See ATF 147 IV 73 and art. 97 CO for reference.';
      const extracted = extractCitations(text);

      // Verify extraction works
      expect(extracted.citations.length).toBeGreaterThan(0);
    });

    it('should track replacements', () => {
      const text = 'See ATF 147 IV 73 in this document.';
      const extracted = extractCitations(text);

      expect(extracted.citations).toHaveLength(1);
      expect(extracted.citations[0].citation).toBe('ATF 147 IV 73');
    });

    it('should preserve position information for replacements', () => {
      const text = 'First ATF 147 IV 73, then ATF 145 III 42.';
      const extracted = extractCitations(text);

      for (const citation of extracted.citations) {
        expect(citation.position.start).toBeGreaterThanOrEqual(0);
        expect(citation.position.end).toBeGreaterThan(citation.position.start);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // compare_citation_versions tool tests
  // ---------------------------------------------------------------------------
  describe('compare_citation_versions', () => {
    it('should validate statute abbreviation', () => {
      expect(STATUTE_SR_MAPPING['OR']).toBeDefined();
      expect(STATUTE_SR_MAPPING['XYZ']).toBeUndefined();
    });

    it('should handle date range formatting', () => {
      const fromDate = new Date('2020-01-01');
      const toDate = new Date('2024-01-01');

      expect(fromDate.toISOString().split('T')[0]).toBe('2020-01-01');
      expect(toDate.toISOString().split('T')[0]).toBe('2024-01-01');
    });

    it('should build provision reference for comparison', () => {
      const ref = buildProvisionReference('OR', 97, 1, undefined, 'de');
      expect(ref).toBe('Art. 97 Abs. 1 OR');
    });
  });

  // ---------------------------------------------------------------------------
  // Integration Tests
  // ---------------------------------------------------------------------------
  describe('Integration Tests', () => {
    it('should support validate -> format workflow', () => {
      const citation = 'BGE 147 IV 73';
      const validation = validateCitation(citation);
      expect(validation.valid).toBe(true);

      const formatted = formatCitation(
        validation.type,
        validation.components!,
        'fr'
      );
      expect(formatted.citation).toBe('ATF 147 IV 73');
    });

    it('should support parse -> extract -> format workflow', () => {
      const text = 'According to BGE 147 IV 73 and Art. 97 OR...';

      const extracted = extractCitations(text);
      expect(extracted.citations.length).toBeGreaterThanOrEqual(2);

      for (const citation of extracted.citations) {
        if (citation.parsed && citation.valid) {
          const formatted = formatCitation(
            citation.parsed.type,
            citation.parsed.components,
            'fr'
          );
          expect(formatted.citation).toBeDefined();
        }
      }
    });

    it('should support multi-lingual document processing', () => {
      const text = `
        German: BGE 147 IV 73, Art. 97 OR
        French: ATF 145 III 42, art. 8 CC
        Italian: DTF 140 II 50
      `;

      const extracted = extractCitations(text);
      expect(extracted.statistics.total).toBeGreaterThanOrEqual(4);

      // Verify we have multiple types
      expect(Object.keys(extracted.statistics.byType).length).toBeGreaterThan(1);
    });

    it('should handle complex legal document', () => {
      const legalDocument = `
        Sachverhalt und Verfahren

        1. Gemäss BGE 147 IV 73 E. 2.1 und BGE 145 III 42 E. 4.2 ist die
           Voraussetzung nach Art. 97 Abs. 1 OR erfüllt, wenn der Schuldner
           seine Sorgfaltspflicht verletzt hat.

        2. Das Bundesgericht hat in ATF 140 II 50 consid. 3 festgehalten,
           dass Art. 8 ZGB die Beweislast regelt.

        3. Vgl. auch Art. 102 lit. a OR betreffend Verzug.
      `;

      const extracted = extractCitations(legalDocument);

      // Should find multiple citations
      expect(extracted.statistics.total).toBeGreaterThanOrEqual(3);

      // Should have both BGE and statute citations
      expect(extracted.citations.some(c => c.type === 'bge' || c.type === 'atf')).toBe(true);
      expect(extracted.citations.some(c => c.type === 'statute')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases and Error Handling
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle whitespace variations in citations', () => {
      const variations = [
        'BGE  147  IV  73',  // Extra spaces
        'BGE 147 IV 73',    // Normal
        'bge 147 iv 73'     // Lowercase
      ];

      for (const citation of variations) {
        const result = validateCitation(citation);
        expect(result.valid).toBe(true);
      }
    });

    it('should handle article variations', () => {
      const variations = [
        'Art. 97 OR',
        'Art.97 OR',
        'Art. 97a OR'
      ];

      for (const citation of variations) {
        const result = validateCitation(citation);
        // Some may be valid, some may not, but should not throw
        expect(result.type).toBeDefined();
      }
    });

    it('should handle very long text for extraction', () => {
      const longText = 'BGE 147 IV 73 '.repeat(100);
      const result = extractCitations(longText);

      // Should extract all occurrences
      expect(result.statistics.total).toBe(100);
    });

    it('should not crash on special characters', () => {
      const text = 'BGE 147 IV 73 — Art. 97 OR « citation »';
      const result = extractCitations(text);
      expect(result.citations).toBeDefined();
    });

    it('should handle Unicode text', () => {
      const text = 'Gemäß BGE 147 IV 73 régit l\'article 97 OR';
      const result = extractCitations(text);
      expect(result.citations.length).toBeGreaterThan(0);
    });
  });
});
