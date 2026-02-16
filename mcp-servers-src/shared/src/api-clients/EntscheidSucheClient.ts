/**
 * EntscheidSuche API Client
 * Real integration with entscheidsuche.ch Elasticsearch API
 *
 * API: POST https://entscheidsuche.ch/_search.php
 * Docs: https://entscheidsuche.ch/docs/
 * Format: Elasticsearch simple_query_string
 *
 * Response signature format: country_court_year_casetype_number_year
 * Spider names identify courts (e.g., CH_BGer = Swiss Federal Supreme Court)
 */

import { BaseAPIClient, APIClientOptions } from './BaseAPIClient';

/**
 * Hierarchy name to court mapping for common Swiss courts.
 * Keys match the hierarchy[1] values from the entscheidsuche.ch API response.
 */
const COURT_MAP: Record<string, { name: string; canton?: string; level: 'federal' | 'cantonal' }> = {
  // Federal courts
  'CH_BGer': { name: 'Bundesgericht / Tribunal fédéral', level: 'federal' },
  'CH_BGE': { name: 'Bundesgericht (BGE)', level: 'federal' },
  'CH_BVGer': { name: 'Bundesverwaltungsgericht', level: 'federal' },
  'CH_BPatGer': { name: 'Bundespatentgericht', level: 'federal' },
  'CH_BStGer': { name: 'Bundesstrafgericht', level: 'federal' },
  // Cantonal courts (using actual hierarchy values from the API)
  'ZH_OG': { name: 'Obergericht Zürich', canton: 'ZH', level: 'cantonal' },
  'ZH_VG': { name: 'Verwaltungsgericht Zürich', canton: 'ZH', level: 'cantonal' },
  'ZH_BK': { name: 'Bezirksgerichte Zürich', canton: 'ZH', level: 'cantonal' },
  'BE_OG': { name: 'Obergericht Bern', canton: 'BE', level: 'cantonal' },
  'BE_VG': { name: 'Verwaltungsgericht Bern', canton: 'BE', level: 'cantonal' },
  'GE_CJ': { name: 'Cour de justice de Genève', canton: 'GE', level: 'cantonal' },
  'GE_TAPI': { name: 'Tribunal administratif Genève', canton: 'GE', level: 'cantonal' },
  'BS_AG': { name: 'Appellationsgericht Basel-Stadt', canton: 'BS', level: 'cantonal' },
  'VD_TC': { name: 'Tribunal cantonal Vaud', canton: 'VD', level: 'cantonal' },
  'TI_CRP2': { name: "Tribunale d'appello Ticino", canton: 'TI', level: 'cantonal' },
  'SG_OG': { name: 'Kantonsgericht St. Gallen', canton: 'SG', level: 'cantonal' },
  'AG_OG': { name: 'Obergericht Aargau', canton: 'AG', level: 'cantonal' },
  'LU_KG': { name: 'Kantonsgericht Luzern', canton: 'LU', level: 'cantonal' },
};

/**
 * Entscheidsuche.ch search hit (actual Elasticsearch response format)
 */
export interface EntscheidSucheHit {
  _id: string;
  _index?: string;
  _score: number;
  _source: {
    date?: string;
    hierarchy?: string[];        // e.g. ["CH", "CH_BGer", "CH_BGer_004"]
    title?: Record<string, string>;    // {de: "...", fr: "...", it: "..."}
    abstract?: Record<string, string>; // {de: "...", fr: "...", it: "..."}
    reference?: string[];        // e.g. ["4A 120/2022", "4A_120/2022"]
    attachment?: {
      content_type?: string;
      language?: string;
      content_url?: string;
      content?: string;
      [key: string]: unknown;
    };
    source?: string;
    [key: string]: unknown;
  };
}

/**
 * Entscheidsuche.ch search response (Elasticsearch format)
 */
interface EntscheidSucheResponse {
  hits: {
    total: number | { value: number; relation: string };
    max_score: number;
    hits: EntscheidSucheHit[];
  };
}

/**
 * Search filters for EntscheidSuche
 */
export interface EntscheidSucheSearchFilters {
  query: string;
  courts?: string[];          // Spider names (e.g., ['CH_BGer', 'ZH_OGer'])
  cantons?: string[];         // Canton codes (e.g., ['ZH', 'BE'])
  language?: 'de' | 'fr' | 'it';
  dateFrom?: string;          // ISO date
  dateTo?: string;
  size?: number;
  from?: number;
}

/**
 * Normalized decision from entscheidsuche.ch
 */
export interface EntscheidSucheDecision {
  decisionId: string;
  signature: string;
  title: string;
  summary: string;
  decisionDate: string;
  language: 'de' | 'fr' | 'it';
  court: string;
  courtLevel: 'federal' | 'cantonal';
  canton?: string;
  chamber?: string;
  legalAreas: string[];
  sourceUrl: string;
  fullText?: string;
  score: number;
  bgeReference?: string;
  relatedDecisions?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * EntscheidSuche API Client
 * Queries the real entscheidsuche.ch Elasticsearch API
 */
export class EntscheidSucheClient extends BaseAPIClient {
  constructor(options: APIClientOptions) {
    super(options);
  }

  /**
   * Search court decisions using Elasticsearch simple_query_string
   */
  async searchDecisions(filters: EntscheidSucheSearchFilters): Promise<{
    decisions: EntscheidSucheDecision[];
    total: number;
  }> {
    const size = Math.min(filters.size || 10, 50);
    const from = filters.from || 0;

    // Build Elasticsearch query
    const query = this.buildSearchQuery(filters);

    try {
      const response = await this.post<EntscheidSucheResponse>(
        '/_search.php',
        query,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const total = typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0;

      const decisions = (response.hits.hits || []).map(hit =>
        this.normalizeHit(hit)
      );

      return { decisions, total };
    } catch (error) {
      this.logger.error('EntscheidSuche search failed', error as Error, { query: filters.query });
      throw error;
    }
  }

  /**
   * Get a single decision by its signature/ID
   */
  async getDecision(signature: string): Promise<EntscheidSucheDecision | null> {
    try {
      // Extract spider from signature (first two parts: country_court)
      const parts = signature.split('_');
      const spider = parts.length >= 2 ? `${parts[0]}_${parts[1]}` : '';

      if (!spider) {
        this.logger.warn('Cannot extract spider from signature', { signature });
        return null;
      }

      // Fetch the document JSON directly
      const docUrl = `/docs/${spider}/${signature}.json`;
      const response = await this.get<Record<string, unknown>>(docUrl);

      if (!response) {
        return null;
      }

      // Create a synthetic hit for normalization
      const hit: EntscheidSucheHit = {
        _id: signature,
        _score: 1.0,
        _source: response as EntscheidSucheHit['_source'],
      };

      return this.normalizeHit(hit);
    } catch (error) {
      this.logger.warn('EntscheidSuche getDecision failed', { signature, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Search specifically for BGE decisions by citation
   */
  async searchBGE(citation: string): Promise<{
    decisions: EntscheidSucheDecision[];
    total: number;
  }> {
    // Parse BGE citation: "BGE 145 III 229" → search with structured query
    const bgeMatch = citation.match(/(?:BGE|ATF|DTF)\s*(\d+)\s+(I{1,3}|IV|V)\s+(\d+)/i);

    let query: string;
    if (bgeMatch) {
      // Structured citation search
      query = `"${bgeMatch[1]} ${bgeMatch[2]} ${bgeMatch[3]}"`;
    } else {
      // Fallback: use the citation as-is
      query = `"${citation}"`;
    }

    return this.searchDecisions({
      query,
      courts: ['CH_BGer', 'CH_BGE'],
      size: 10,
    });
  }

  /**
   * Build Elasticsearch query body
   */
  private buildSearchQuery(filters: EntscheidSucheSearchFilters): Record<string, unknown> {
    const must: Record<string, unknown>[] = [];

    // Main text query using simple_query_string
    if (filters.query) {
      must.push({
        simple_query_string: {
          query: filters.query,
          default_operator: 'and',
        },
      });
    }

    // Court filter — uses hierarchy field (e.g., CH_BGer, ZH_OG)
    if (filters.courts && filters.courts.length > 0) {
      must.push({
        terms: { hierarchy: filters.courts },
      });
    }

    // Canton filter — canton codes appear in hierarchy[0] (e.g., "ZH", "BE")
    if (filters.cantons && filters.cantons.length > 0) {
      must.push({
        terms: { hierarchy: filters.cantons },
      });
    }

    // Language filter — language is inside attachment object
    if (filters.language) {
      must.push({
        term: { 'attachment.language': filters.language },
      });
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const range: Record<string, string> = {};
      if (filters.dateFrom) range.gte = filters.dateFrom;
      if (filters.dateTo) range.lte = filters.dateTo;
      must.push({
        range: { date: range },
      });
    }

    const body: Record<string, unknown> = {
      size: Math.min(filters.size || 10, 50),
      from: filters.from || 0,
      sort: [{ date: 'desc' }],
    };

    if (must.length === 1) {
      body.query = must[0];
    } else if (must.length > 1) {
      body.query = { bool: { must } };
    }

    return body;
  }

  /**
   * Normalize an Elasticsearch hit to our decision format.
   * Handles the actual entscheidsuche.ch response where:
   *   - hierarchy: ["CH", "CH_BGer", "CH_BGer_004"] (court identification)
   *   - title/abstract: {de: "...", fr: "...", it: "..."} (multilingual objects)
   *   - attachment.language / attachment.content_url (language and URL)
   */
  private normalizeHit(hit: EntscheidSucheHit): EntscheidSucheDecision {
    const src = hit._source;

    // Extract court identifier from hierarchy or _id
    const hierarchy = src.hierarchy || [];
    const spider = hierarchy[1] || this.extractSpiderFromId(hit._id);
    const canton = hierarchy[0] || '';
    const courtInfo = COURT_MAP[spider];

    // Determine language from attachment or default
    const language = (src.attachment?.language as 'de' | 'fr' | 'it') || 'de';

    // Title and abstract are multilingual objects {de: "...", fr: "...", it: "..."}
    const titleObj = src.title || {};
    const abstractObj = src.abstract || {};

    const title = titleObj[language]
      || titleObj.de || titleObj.fr || titleObj.it
      || (Array.isArray(src.reference) ? src.reference[0] : '')
      || hit._id
      || '';

    const summary = abstractObj[language]
      || abstractObj.de || abstractObj.fr || abstractObj.it
      || '';

    // Detect BGE reference from title or ID
    let bgeReference: string | undefined;
    const bgeMatch = (title + ' ' + hit._id).match(/(\d{2,3})\s+(I{1,3}|IV|V)\s+(\d+)/);
    if (bgeMatch && (spider === 'CH_BGer' || spider === 'CH_BGE')) {
      bgeReference = `BGE ${bgeMatch[1]} ${bgeMatch[2]} ${bgeMatch[3]}`;
    }

    // URL from attachment or construct from spider + ID
    const sourceUrl = src.attachment?.content_url
      || (spider && hit._id ? `https://entscheidsuche.ch/docs/${spider}/${hit._id}` : '');

    // Full text from attachment content
    const fullText = src.attachment?.content ? String(src.attachment.content) : undefined;

    return {
      decisionId: hit._id || '',
      signature: hit._id || '',
      title: String(title),
      summary: String(summary),
      decisionDate: src.date || '',
      language,
      court: courtInfo?.name || spider || 'Unknown',
      courtLevel: courtInfo?.level || (canton === 'CH' ? 'federal' : 'cantonal'),
      canton: courtInfo?.canton || (canton !== 'CH' ? canton : undefined),
      chamber: undefined,
      legalAreas: [],
      sourceUrl: String(sourceUrl),
      fullText,
      score: hit._score,
      bgeReference,
      relatedDecisions: [],
      metadata: {
        spider,
        hierarchy,
        reference: src.reference,
      },
    };
  }

  /**
   * Extract spider (court identifier) from document ID.
   * ID format: "CH_BGer_004_4A-120-2022_2022-11-23" → "CH_BGer"
   */
  private extractSpiderFromId(id: string): string {
    if (!id) return '';
    const parts = id.split('_');
    return parts.length >= 2 ? `${parts[0]}_${parts[1]}` : '';
  }
}
