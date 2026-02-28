/**
 * Fedlex SPARQL Tool
 * Searches Swiss Federal Legislation via the Fedlex SPARQL endpoint.
 * Lightweight implementation using built-in fetch.
 */

import { type Tool } from './registry.js';
import { getWebappConfig } from '../config.js';

/** Common Swiss statute abbreviation → SR number mapping */
const ABBREVIATION_MAP: Record<string, string> = {
  BV: '101', Cst: '101', Cost: '101',
  ZGB: '210', CC: '210', CCS: '210',
  OR: '220', CO: '220',
  StGB: '311.0', CP: '311.0', CPS: '311.0',
  ZPO: '272', CPC: '272',
  StPO: '312.0', CPP: '312.0',
  SchKG: '281.1', LP: '281.1',
  BGG: '173.110', LTF: '173.110',
  VwVG: '172.021', PA: '172.021',
  AVIG: '837.0', LACI: '837.0',
  AHVG: '831.10', LAVS: '831.10',
  IVG: '831.20', LAI: '831.20',
  BVG: '831.40', LPP: '831.40',
  UVG: '832.20', LAA: '832.20',
  KVG: '832.10', LAMal: '832.10',
  DSG: '235.1', LPD: '235.1',
  IPRG: '291', LDIP: '291',
  MWStG: '641.20', LTVA: '641.20',
  DBG: '642.11', LIFD: '642.11',
};

const LEGAL_DOMAINS: Record<string, string> = {
  '1': 'State — Constitutional — Administrative',
  '2': 'Private Law — Civil Procedure — Enforcement',
  '3': 'Criminal Law — Criminal Procedure',
  '4': 'Education — Science — Culture',
  '5': 'National Defense',
  '6': 'Finance',
  '7': 'Public Works — Energy — Transport — Telecommunications',
  '8': 'Health — Labor — Social Security',
  '9': 'Economy — Technical Cooperation',
};

/** In-memory SPARQL cache */
const sparqlCache = new Map<string, { data: unknown; expires: number }>();

function getCached(key: string): unknown | null {
  const entry = sparqlCache.get(key);
  if (!entry || Date.now() > entry.expires) {
    if (entry) sparqlCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown, ttlSeconds: number): void {
  sparqlCache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
}

async function executeSparql(query: string): Promise<{ results: { bindings: Record<string, { value: string; 'xml:lang'?: string }>[] } }> {
  const config = getWebappConfig();

  const response = await fetch(config.fedlex.sparqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/sparql-results+json',
    },
    body: `query=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(config.fedlex.timeout),
  });

  if (!response.ok) {
    throw new Error(`Fedlex SPARQL error: ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<{ results: { bindings: Record<string, { value: string; 'xml:lang'?: string }>[] } }>;
}

function resolveIdentifier(identifier: string): { srNumber: string; type: 'sr' | 'abbreviation' } {
  if (/^\d/.test(identifier)) {
    return { srNumber: identifier, type: 'sr' };
  }
  const sr = ABBREVIATION_MAP[identifier] || ABBREVIATION_MAP[identifier.toUpperCase()];
  if (sr) return { srNumber: sr, type: 'abbreviation' };
  throw new Error(`Unknown statute abbreviation: ${identifier}. Known: ${Object.keys(ABBREVIATION_MAP).join(', ')}`);
}

export const lookupStatuteTool: Tool = {
  name: 'lookup_statute',
  description:
    "Look up a Swiss federal statute by SR number (e.g., '220') or abbreviation (e.g., 'OR', 'ZGB'). Returns title, type, and status.",
  parameters: {
    type: 'object',
    properties: {
      identifier: {
        type: 'string',
        description: "SR number (e.g., '220', '210') or abbreviation (e.g., 'OR', 'ZGB', 'StGB')",
      },
      language: {
        type: 'string',
        description: 'Preferred language: de, fr, it',
        enum: ['de', 'fr', 'it'],
      },
    },
    required: ['identifier'],
  },
  async execute(args) {
    const { identifier, language } = args as { identifier: string; language?: string };
    const cacheKey = `statute:${identifier}:${language || ''}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const { srNumber } = resolveIdentifier(identifier);
    const lang = language || 'de';

    const query = `
      PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?act ?srNumber ?title ?abbreviation ?actType ?dateDocument ?dateInForce
      WHERE {
        ?act a jolux:Act ;
             jolux:classifiedByTaxonomyEntry ?taxonomy .
        ?taxonomy skos:notation "${srNumber}"^^xsd:string .
        ?taxonomy skos:prefLabel ?title .
        FILTER(lang(?title) = "${lang}" || lang(?title) = "de")
        OPTIONAL { ?act jolux:titleShort ?abbreviation . FILTER(lang(?abbreviation) = "${lang}" || lang(?abbreviation) = "de") }
        OPTIONAL { ?act jolux:actType ?actType }
        OPTIONAL { ?act jolux:dateDocument ?dateDocument }
        OPTIONAL { ?act jolux:dateEntryInForce ?dateInForce }
        BIND("${srNumber}" AS ?srNumber)
      }
      LIMIT 10
    `;

    const result = await executeSparql(query);
    const acts = result.results.bindings.map((b) => ({
      srNumber: b.srNumber?.value || srNumber,
      title: b.title?.value || '',
      titleLanguage: b.title?.['xml:lang'] || lang,
      abbreviation: b.abbreviation?.value,
      actType: b.actType?.value,
      dateDocument: b.dateDocument?.value,
      dateInForce: b.dateInForce?.value,
      domain: LEGAL_DOMAINS[srNumber.split('.')[0]] || undefined,
    }));

    const data = { found: acts.length > 0, acts };
    setCache(cacheKey, data, 86400);
    return data;
  },
};

export const getArticleTool: Tool = {
  name: 'get_article',
  description:
    'Retrieve a specific article of a Swiss federal statute (e.g., Art. 97 OR). Returns article text and paragraphs.',
  parameters: {
    type: 'object',
    properties: {
      srNumber: {
        type: 'string',
        description: "SR number of the legal act (e.g., '220' for OR) or abbreviation (e.g., 'OR')",
      },
      articleNumber: {
        type: 'string',
        description: "Article number (e.g., '97', '41')",
      },
      language: {
        type: 'string',
        description: 'Language for article text: de, fr, it',
        enum: ['de', 'fr', 'it'],
      },
    },
    required: ['srNumber', 'articleNumber'],
  },
  async execute(args) {
    const { srNumber: rawSr, articleNumber, language } = args as {
      srNumber: string;
      articleNumber: string;
      language?: string;
    };

    const { srNumber } = resolveIdentifier(rawSr);
    const lang = language || 'de';
    const artNum = articleNumber.replace(/^Art\.?\s*/i, '');

    const cacheKey = `article:${srNumber}:${artNum}:${lang}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const query = `
      PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?act ?srNumber ?actTitle ?article ?articleNumber ?articleTitle ?articleText
      WHERE {
        ?act a jolux:Act ;
             jolux:classifiedByTaxonomyEntry ?taxonomy .
        ?taxonomy skos:notation "${srNumber}"^^xsd:string .
        OPTIONAL { ?taxonomy skos:prefLabel ?actTitle . FILTER(lang(?actTitle) = "${lang}") }
        ?act jolux:isRealizedBy ?expression .
        ?expression jolux:language <http://publications.europa.eu/resource/authority/language/${lang.toUpperCase()}> .
        ?expression jolux:isEmbodiedBy ?manifestation .
        ?article a jolux:Article ;
                 jolux:isPartOf+ ?expression ;
                 jolux:articleNumber "${artNum}" .
        OPTIONAL { ?article jolux:titleArticle ?articleTitle . FILTER(lang(?articleTitle) = "${lang}") }
        OPTIONAL { ?article jolux:text ?articleText . FILTER(lang(?articleText) = "${lang}") }
        BIND("${srNumber}" AS ?srNumber)
        BIND("${artNum}" AS ?articleNumber)
      }
      LIMIT 20
    `;

    try {
      const result = await executeSparql(query);
      const bindings = result.results.bindings;

      if (bindings.length === 0) {
        // Provide informative fallback
        const data = {
          found: false,
          message: `Article ${artNum} of SR ${srNumber} not found via SPARQL. The article may exist but is not indexed in the FRBR model. Try https://www.fedlex.admin.ch/eli/cc/${srNumber}/${lang}`,
          fedlexUrl: `https://www.fedlex.admin.ch/eli/cc/${srNumber}/${lang}`,
        };
        return data;
      }

      const articles = bindings.map((b) => ({
        articleNumber: b.articleNumber?.value || artNum,
        title: b.articleTitle?.value,
        text: b.articleText?.value,
        actTitle: b.actTitle?.value,
      }));

      const data = {
        found: true,
        srNumber,
        articles,
        fedlexUrl: `https://www.fedlex.admin.ch/eli/cc/${srNumber}/${lang}#art_${artNum}`,
      };
      setCache(cacheKey, data, 86400);
      return data;
    } catch (error) {
      // Fedlex SPARQL can be flaky for article-level queries
      return {
        found: false,
        message: `SPARQL query failed: ${(error as Error).message}. Try browsing directly: https://www.fedlex.admin.ch/eli/cc/${srNumber}/${lang}`,
        fedlexUrl: `https://www.fedlex.admin.ch/eli/cc/${srNumber}/${lang}`,
      };
    }
  },
};

export const searchLegislationTool: Tool = {
  name: 'search_legislation',
  description:
    'Search across Swiss federal legislation by keyword. Returns matching statutes with SR numbers and titles.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search keywords for legislation' },
      domain: {
        type: 'string',
        description:
          'Legal domain by SR prefix: 1=State, 2=Private/Civil, 3=Criminal, 4=Education, 5=Defense, 6=Finance, 7=Transport, 8=Health/Social, 9=Economy',
        enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      },
      language: { type: 'string', description: 'Language: de, fr, it', enum: ['de', 'fr', 'it'] },
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
    required: ['query'],
  },
  async execute(args) {
    const { query, domain, language, limit } = args as {
      query: string;
      domain?: string;
      language?: string;
      limit?: number;
    };

    const lang = language || 'de';
    const maxResults = Math.min(limit || 20, 100);

    const cacheKey = `legislation:${JSON.stringify(args)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let domainFilter = '';
    if (domain) {
      domainFilter = `FILTER(STRSTARTS(STR(?srNum), "${domain}"))`;
    }

    const sparqlQuery = `
      PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?actType ?dateInForce
      WHERE {
        ?act a jolux:Act ;
             jolux:classifiedByTaxonomyEntry ?taxonomy .
        ?taxonomy skos:notation ?srNum .
        ?taxonomy skos:prefLabel ?title .
        FILTER(lang(?title) = "${lang}" || lang(?title) = "de")
        FILTER(CONTAINS(LCASE(STR(?title)), LCASE("${query.replace(/"/g, '\\"')}")))
        ${domainFilter}
        OPTIONAL { ?act jolux:titleShort ?abbreviation . FILTER(lang(?abbreviation) = "${lang}" || lang(?abbreviation) = "de") }
        OPTIONAL { ?act jolux:actType ?actType }
        OPTIONAL { ?act jolux:dateEntryInForce ?dateInForce }
        BIND(STR(?srNum) AS ?srNumber)
      }
      ORDER BY ?srNumber
      LIMIT ${maxResults}
    `;

    const result = await executeSparql(sparqlQuery);
    const acts = result.results.bindings.map((b) => ({
      srNumber: b.srNumber?.value || '',
      title: b.title?.value || '',
      abbreviation: b.abbreviation?.value,
      actType: b.actType?.value,
      dateInForce: b.dateInForce?.value,
      domain: LEGAL_DOMAINS[(b.srNumber?.value || '').split('.')[0]] || undefined,
    }));

    const data = { acts, total: acts.length };
    setCache(cacheKey, data, 3600);
    return data;
  },
};
