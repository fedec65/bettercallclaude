/**
 * Citation Validation & Formatting Tool
 * Validates and formats Swiss legal citations (BGE/ATF/DTF + statutory references).
 */

import { type Tool } from './registry.js';

/** Statute abbreviation → SR number mapping */
const STATUTE_SR: Record<string, string> = {
  ZGB: '210', CC: '210', CCS: '210',
  OR: '220', CO: '220',
  StGB: '311.0', CP: '311.0', CPS: '311.0',
  BV: '101', Cst: '101', Cost: '101',
  ZPO: '272', CPC: '272',
  StPO: '312.0', CPP: '312.0',
  SchKG: '281.1', LP: '281.1',
  BGG: '173.110', LTF: '173.110',
  VwVG: '172.021', PA: '172.021',
  DSG: '235.1', LPD: '235.1',
  IPRG: '291', LDIP: '291',
  DBG: '642.11', LIFD: '642.11',
  MWStG: '641.20', LTVA: '641.20',
};

/** Full statute names by language */
const STATUTE_NAMES: Record<string, Record<string, string>> = {
  ZGB: { de: 'Schweizerisches Zivilgesetzbuch', fr: 'Code civil suisse', it: 'Codice civile svizzero', en: 'Swiss Civil Code' },
  OR: { de: 'Obligationenrecht', fr: 'Code des obligations', it: 'Diritto delle obbligazioni', en: 'Code of Obligations' },
  StGB: { de: 'Schweizerisches Strafgesetzbuch', fr: 'Code pénal suisse', it: 'Codice penale svizzero', en: 'Swiss Criminal Code' },
  BV: { de: 'Bundesverfassung', fr: 'Constitution fédérale', it: 'Costituzione federale', en: 'Federal Constitution' },
  ZPO: { de: 'Zivilprozessordnung', fr: 'Code de procédure civile', it: 'Codice di procedura civile', en: 'Civil Procedure Code' },
  StPO: { de: 'Strafprozessordnung', fr: 'Code de procédure pénale', it: 'Codice di procedura penale', en: 'Criminal Procedure Code' },
  BGG: { de: 'Bundesgerichtsgesetz', fr: 'Loi sur le Tribunal fédéral', it: 'Legge sul Tribunale federale', en: 'Federal Supreme Court Act' },
};

/** Language-specific labels */
const LABELS: Record<string, { art: string; abs: string; lit: string; bge: string; consid: string }> = {
  de: { art: 'Art.', abs: 'Abs.', lit: 'lit.', bge: 'BGE', consid: 'E.' },
  fr: { art: 'art.', abs: 'al.', lit: 'let.', bge: 'ATF', consid: 'consid.' },
  it: { art: 'art.', abs: 'cpv.', lit: 'lett.', bge: 'DTF', consid: 'consid.' },
  en: { art: 'Art.', abs: 'para.', lit: 'lit.', bge: 'BGE', consid: 'sec.' },
};

export const validateCitationTool: Tool = {
  name: 'validate_citation',
  description:
    'Validate a Swiss legal citation (BGE/ATF/DTF or statutory reference like "Art. 97 OR"). Returns validation, normalization, and multi-language formatting.',
  parameters: {
    type: 'object',
    properties: {
      citation: {
        type: 'string',
        description: 'The legal citation to validate (e.g., "BGE 147 IV 73", "Art. 97 OR", "art. 41 CO")',
      },
    },
    required: ['citation'],
  },
  async execute(args) {
    const { citation } = args as { citation: string };

    // Try BGE/ATF/DTF citation
    const bgeMatch = citation.match(/(?:BGE|ATF|DTF)?\s*(\d{2,3})\s+(I{1,3}|IV|V)\s+(\d+)/i);
    if (bgeMatch) {
      const volume = bgeMatch[1];
      const chamber = bgeMatch[2].toUpperCase();
      const page = bgeMatch[3];
      const normalized = `BGE ${volume} ${chamber} ${page}`;

      return {
        valid: true,
        type: 'bge',
        normalized,
        components: { volume, chamber, page },
        translations: {
          de: `BGE ${volume} ${chamber} ${page}`,
          fr: `ATF ${volume} ${chamber} ${page}`,
          it: `DTF ${volume} ${chamber} ${page}`,
        },
        sourceUrl: `https://www.bger.ch/ext/eurospider/live/de/php/clir/http/index.php?lang=de&type=highlight_simple_query&query=BGE+${volume}+${chamber}+${page}`,
      };
    }

    // Try statutory citation (Art. X Statute)
    const statMatch = citation.match(
      /(?:Art\.?|art\.?)\s*(\d+[a-z]?)\s*(?:(Abs\.|al\.|cpv\.|para\.)\s*(\d+))?\s*(?:(lit\.|let\.|lett\.)\s*([a-z]))?\s+(\w+)/i
    );
    if (statMatch) {
      const article = statMatch[1];
      const paragraph = statMatch[3];
      const letter = statMatch[5];
      const statute = statMatch[6];

      const sr = STATUTE_SR[statute] || STATUTE_SR[statute.toUpperCase()];
      const names = STATUTE_NAMES[statute] || STATUTE_NAMES[statute.toUpperCase()];
      const valid = !!sr;

      const buildRef = (lang: string) => {
        const l = LABELS[lang];
        let ref = `${l.art} ${article}`;
        if (paragraph) ref += ` ${l.abs} ${paragraph}`;
        if (letter) ref += ` ${l.lit} ${letter}`;
        ref += ` ${statute}`;
        return ref;
      };

      return {
        valid,
        type: 'statute',
        normalized: buildRef('de'),
        components: { article, paragraph, letter, statute, srNumber: sr },
        fullName: names,
        translations: {
          de: buildRef('de'),
          fr: buildRef('fr'),
          it: buildRef('it'),
          en: buildRef('en'),
        },
        fedlexUrl: sr ? `https://www.fedlex.admin.ch/eli/cc/${sr}/de#art_${article}` : undefined,
        ...(valid ? {} : { error: `Unknown statute abbreviation: ${statute}` }),
      };
    }

    return {
      valid: false,
      type: 'unknown',
      error: `Could not parse citation: "${citation}". Expected formats: "BGE 145 III 229", "Art. 97 OR", "art. 41 CO"`,
    };
  },
};

export const extractCitationsTool: Tool = {
  name: 'extract_citations',
  description:
    'Extract all legal citations from a text. Finds BGE/ATF/DTF citations and statutory references.',
  parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text to extract citations from',
      },
    },
    required: ['text'],
  },
  async execute(args) {
    const { text } = args as { text: string };
    const citations: Array<{ citation: string; type: string; position: number }> = [];

    // BGE/ATF/DTF patterns
    const bgeRegex = /(?:BGE|ATF|DTF)\s+\d{1,3}\s+[IV]+\s+\d+/gi;
    let match;
    while ((match = bgeRegex.exec(text)) !== null) {
      citations.push({ citation: match[0], type: 'bge', position: match.index });
    }

    // Statute patterns
    const statRegex = /Art\.?\s*\d+[a-z]?\s*(?:(?:Abs\.|al\.|cpv\.)\s*\d+)?\s*(?:(?:lit\.|let\.|lett\.)\s*[a-z])?\s+(?:ZGB|OR|StGB|BV|BGG|ZPO|StPO|SchKG|VwVG|CC|CO|CP|Cst|LTF|CPC|CPP|LP|PA|DSG|LPD|IPRG|LDIP|DBG|LIFD|MWStG|LTVA)/gi;
    while ((match = statRegex.exec(text)) !== null) {
      citations.push({ citation: match[0].trim(), type: 'statute', position: match.index });
    }

    citations.sort((a, b) => a.position - b.position);

    return {
      citations,
      count: citations.length,
      byType: {
        bge: citations.filter((c) => c.type === 'bge').length,
        statute: citations.filter((c) => c.type === 'statute').length,
      },
    };
  },
};
