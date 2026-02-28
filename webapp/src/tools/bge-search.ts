/**
 * BGE Search Tool
 * Searches Swiss Federal Supreme Court (BGE) decisions via entscheidsuche.ch API.
 * Lightweight implementation using built-in fetch — no external dependencies.
 */

import { type Tool } from './registry.js';
import { getWebappConfig } from '../config.js';

/** Simple in-memory cache with TTL */
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown, ttlSeconds: number): void {
  cache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
  // Evict old entries if cache gets too large
  if (cache.size > 5000) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expires) cache.delete(k);
    }
  }
}

interface EntscheidSucheHit {
  _id: string;
  _score: number;
  _source: {
    date?: string;
    hierarchy?: string[];
    title?: Record<string, string>;
    abstract?: Record<string, string>;
    reference?: string[];
    attachment?: {
      language?: string;
      content_url?: string;
      content?: string;
    };
  };
}

interface EntscheidSucheResponse {
  hits: {
    total: number | { value: number };
    hits: EntscheidSucheHit[];
  };
}

const COURT_MAP: Record<string, { name: string; level: string }> = {
  CH_BGer: { name: 'Bundesgericht / Tribunal fédéral', level: 'federal' },
  CH_BGE: { name: 'Bundesgericht (BGE)', level: 'federal' },
  CH_BVGer: { name: 'Bundesverwaltungsgericht', level: 'federal' },
  CH_BPatGer: { name: 'Bundespatentgericht', level: 'federal' },
  CH_BStGer: { name: 'Bundesstrafgericht', level: 'federal' },
};

function normalizeHit(hit: EntscheidSucheHit) {
  const src = hit._source;
  const hierarchy = src.hierarchy || [];
  const spider = hierarchy[1] || '';
  const lang = (src.attachment?.language as string) || 'de';
  const titleObj = src.title || {};
  const abstractObj = src.abstract || {};
  const courtInfo = COURT_MAP[spider];

  const title = titleObj[lang] || titleObj.de || titleObj.fr || titleObj.it || hit._id || '';
  const summary = abstractObj[lang] || abstractObj.de || abstractObj.fr || abstractObj.it || '';

  let bgeReference: string | undefined;
  const bgeMatch = (title + ' ' + hit._id).match(/(\d{2,3})\s+(I{1,3}|IV|V)\s+(\d+)/);
  if (bgeMatch && (spider === 'CH_BGer' || spider === 'CH_BGE')) {
    bgeReference = `BGE ${bgeMatch[1]} ${bgeMatch[2]} ${bgeMatch[3]}`;
  }

  return {
    decisionId: hit._id,
    title: String(title),
    summary: String(summary),
    date: src.date || '',
    language: lang,
    court: courtInfo?.name || spider || 'Unknown',
    courtLevel: courtInfo?.level || 'unknown',
    bgeReference,
    sourceUrl: src.attachment?.content_url || `https://entscheidsuche.ch/docs/${spider}/${hit._id}`,
    score: hit._score,
  };
}

async function searchEntscheidsuche(
  query: string,
  courts: string[],
  options: {
    language?: string;
    dateFrom?: string;
    dateTo?: string;
    size?: number;
  } = {}
) {
  const config = getWebappConfig();
  const must: Record<string, unknown>[] = [];

  if (query) {
    must.push({ simple_query_string: { query, default_operator: 'and' } });
  }
  if (courts.length > 0) {
    must.push({ terms: { hierarchy: courts } });
  }
  if (options.language) {
    must.push({ term: { 'attachment.language': options.language } });
  }
  if (options.dateFrom || options.dateTo) {
    const range: Record<string, string> = {};
    if (options.dateFrom) range.gte = options.dateFrom;
    if (options.dateTo) range.lte = options.dateTo;
    must.push({ range: { date: range } });
  }

  const size = Math.min(options.size || 10, 50);
  const body: Record<string, unknown> = {
    size,
    sort: [{ date: 'desc' }],
  };

  if (must.length === 1) body.query = must[0];
  else if (must.length > 1) body.query = { bool: { must } };

  const response = await fetch(`${config.entscheidsuche.baseUrl}/_search.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.entscheidsuche.timeout),
  });

  if (!response.ok) {
    throw new Error(`EntscheidSuche API error: ${response.status}`);
  }

  const data = (await response.json()) as EntscheidSucheResponse;
  const total = typeof data.hits.total === 'number' ? data.hits.total : data.hits.total?.value || 0;
  const decisions = (data.hits.hits || []).map(normalizeHit);

  return { decisions, total };
}

export const searchBgeTool: Tool = {
  name: 'search_bge',
  description:
    'Search Swiss Federal Supreme Court (BGE/ATF/DTF) decisions by query. Returns case citations, summaries, and court details.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for BGE decisions (searches title, summary, full text)',
      },
      language: {
        type: 'string',
        description: 'Language filter: de (German), fr (French), it (Italian)',
        enum: ['de', 'fr', 'it'],
      },
      dateFrom: {
        type: 'string',
        description: 'Start date filter (YYYY-MM-DD)',
      },
      dateTo: {
        type: 'string',
        description: 'End date filter (YYYY-MM-DD)',
      },
      limit: {
        type: 'number',
        description: 'Max results (1-50, default 10)',
      },
    },
    required: ['query'],
  },
  async execute(args) {
    const { query, language, dateFrom, dateTo, limit } = args as {
      query: string;
      language?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    };

    const cacheKey = `bge:${JSON.stringify(args)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const result = await searchEntscheidsuche(query, ['CH_BGer', 'CH_BGE'], {
      language,
      dateFrom,
      dateTo,
      size: limit,
    });

    setCache(cacheKey, result, 3600);
    return result;
  },
};

export const searchDecisionsTool: Tool = {
  name: 'search_decisions',
  description:
    'Search across all Swiss courts (federal and cantonal) for court decisions. Broader than search_bge — includes cantonal courts.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for court decisions',
      },
      courts: {
        type: 'string',
        description: 'Court filter: "federal" (BGE only), "cantonal", or "all" (default: all)',
        enum: ['federal', 'cantonal', 'all'],
      },
      language: {
        type: 'string',
        description: 'Language filter: de, fr, it',
        enum: ['de', 'fr', 'it'],
      },
      dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
      dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      limit: { type: 'number', description: 'Max results (1-50, default 10)' },
    },
    required: ['query'],
  },
  async execute(args) {
    const { query, courts, language, dateFrom, dateTo, limit } = args as {
      query: string;
      courts?: string;
      language?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    };

    let courtFilter: string[] = [];
    if (courts === 'federal') {
      courtFilter = ['CH_BGer', 'CH_BGE', 'CH_BVGer', 'CH_BPatGer', 'CH_BStGer'];
    }
    // If 'cantonal' or 'all', don't filter — entscheidsuche returns all

    const cacheKey = `decisions:${JSON.stringify(args)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const result = await searchEntscheidsuche(query, courtFilter, {
      language,
      dateFrom,
      dateTo,
      size: limit,
    });

    setCache(cacheKey, result, 3600);
    return result;
  },
};

export const validateCitationTool: Tool = {
  name: 'validate_bge_citation',
  description: 'Validate a BGE citation format (e.g., "BGE 145 III 229") and normalize it.',
  parameters: {
    type: 'object',
    properties: {
      citation: { type: 'string', description: 'BGE citation to validate' },
    },
    required: ['citation'],
  },
  async execute(args) {
    const { citation } = args as { citation: string };
    const match = citation.match(/(?:BGE|ATF|DTF)?\s*(\d{2,3})\s+(I{1,3}|IV|V)\s+(\d+)/i);

    if (!match) {
      return {
        valid: false,
        error: "Invalid BGE citation format. Expected: 'BGE {volume} {chamber} {page}' (e.g., 'BGE 145 III 229')",
      };
    }

    return {
      valid: true,
      volume: match[1],
      chamber: match[2].toUpperCase(),
      page: match[3],
      normalized: `BGE ${match[1]} ${match[2].toUpperCase()} ${match[3]}`,
    };
  },
};
