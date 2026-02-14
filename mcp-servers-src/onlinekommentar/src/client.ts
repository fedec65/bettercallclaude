/**
 * OnlineKommentar API Client
 * Swiss Legal Doctrine (Commentary) Integration
 *
 * Base URL: https://onlinekommentar.ch/api
 * No authentication required
 */

import type {
  Language,
  SortOption,
  SearchCommentariesOptions,
  Commentary,
  CommentaryDetail,
  LegislativeAct,
  SearchResult,
  ApiResponse,
  LegislativeActMapping,
} from './types.js';

const DEFAULT_BASE_URL = 'https://onlinekommentar.ch/api';
const DEFAULT_RATE_LIMIT_MS = 1000; // 1 request per second
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

export interface ClientOptions {
  baseUrl?: string;
  rateLimitMs?: number;
  timeoutMs?: number;
}

export class OnlineKommentarClient {
  private baseUrl: string;
  private rateLimitMs: number;
  private timeoutMs: number;
  private lastRequestTime: number = 0;
  private legislativeActMapping: LegislativeActMapping = {};

  constructor(options: ClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.rateLimitMs = options.rateLimitMs ?? DEFAULT_RATE_LIMIT_MS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Rate-limited fetch wrapper
   */
  private async rateLimitedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // Apply rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitMs) {
      const waitTime = this.rateLimitMs - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          throw new Error('Network request failed');
        }
      }
      throw error;
    }
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(
    endpoint: string,
    params: Record<string, string | number | undefined> = {}
  ): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }

  /**
   * Search commentaries with filtering and pagination
   *
   * @param query - Search query string
   * @param options - Search options (language, legislative_act, sort, page)
   * @returns SearchResult with matching commentaries
   */
  async searchCommentaries(
    query: string,
    options: SearchCommentariesOptions = {}
  ): Promise<SearchResult> {
    const { language, legislative_act, sort, page } = options;

    const url = this.buildUrl('/commentaries', {
      search: query || undefined,
      language,
      legislative_act,
      sort,
      page,
    });

    const response = await this.rateLimitedFetch(url);
    const data = (await response.json()) as ApiResponse<SearchResult>;

    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    // Handle both wrapped and unwrapped API responses
    if (data.data) {
      return data.data;
    }

    // API returns unwrapped result directly
    return data as unknown as SearchResult;
  }

  /**
   * Get detailed commentary by ID
   *
   * @param id - Commentary UUID
   * @returns CommentaryDetail with full content
   */
  async getCommentary(id: string): Promise<CommentaryDetail> {
    // Validate ID format (basic UUID check)
    if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
      throw new Error('Invalid commentary ID');
    }

    const url = this.buildUrl(`/commentaries/${encodeURIComponent(id)}`);

    const response = await this.rateLimitedFetch(url);
    const data = (await response.json()) as ApiResponse<CommentaryDetail>;

    if (!data.success && data.error) {
      if (data.error.includes('not found') || data.error.includes('404')) {
        throw new Error('Commentary not found');
      }
      throw new Error(data.error);
    }

    // Handle both wrapped and unwrapped API responses
    if (data.data) {
      return data.data;
    }

    return data as unknown as CommentaryDetail;
  }

  /**
   * List all available legislative acts
   *
   * @param language - Optional language filter
   * @returns Array of LegislativeAct
   */
  async listLegislativeActs(language?: Language): Promise<LegislativeAct[]> {
    const url = this.buildUrl('/legislative-acts', { language });

    const response = await this.rateLimitedFetch(url);
    const data = (await response.json()) as ApiResponse<LegislativeAct[]>;

    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    const acts = data.data ?? (data as unknown as LegislativeAct[]);

    // Update the mapping cache
    for (const act of acts) {
      if (act.abbreviation) {
        this.legislativeActMapping[act.abbreviation.toLowerCase()] = act.id;
      }
      if (act.abbreviation_de) {
        this.legislativeActMapping[act.abbreviation_de.toLowerCase()] = act.id;
      }
      if (act.abbreviation_fr) {
        this.legislativeActMapping[act.abbreviation_fr.toLowerCase()] = act.id;
      }
      if (act.abbreviation_it) {
        this.legislativeActMapping[act.abbreviation_it.toLowerCase()] = act.id;
      }
    }

    return acts;
  }

  /**
   * Get commentary for a specific article reference
   *
   * KEY FEATURE: Maps "Art. 97 OR" to commentary search
   *
   * @param articleReference - Article reference (e.g., "Art. 97 OR", "art. 97 CO")
   * @param language - Optional language preference
   * @returns SearchResult with matching commentaries
   */
  async getCommentaryForArticle(
    articleReference: string,
    language?: Language
  ): Promise<SearchResult> {
    // Parse the article reference
    const parsed = this.parseArticleReference(articleReference);

    if (!parsed) {
      throw new Error(
        `Invalid article reference format: ${articleReference}. Expected format like "Art. 97 OR" or "art. 97 al. 2 CO"`
      );
    }

    // Get legislative act UUID
    let legislativeActId = this.legislativeActMapping[parsed.act.toLowerCase()];

    // If not in cache, fetch legislative acts
    if (!legislativeActId) {
      await this.listLegislativeActs();
      legislativeActId = this.legislativeActMapping[parsed.act.toLowerCase()];
    }

    if (!legislativeActId) {
      throw new Error(`Unknown legislative act: ${parsed.act}`);
    }

    // Search for commentaries matching the article
    const searchQuery = `${parsed.article}${parsed.paragraph ? ` ${parsed.paragraph}` : ''}`;

    return this.searchCommentaries(searchQuery, {
      language,
      legislative_act: legislativeActId,
    });
  }

  /**
   * Parse article reference into components
   *
   * Handles multiple formats:
   * - German: "Art. 97 Abs. 1 lit. a OR"
   * - French: "art. 97 al. 2 let. a CO"
   * - Italian: "art. 97 cpv. 1 lett. a CO"
   */
  private parseArticleReference(
    reference: string
  ): { article: string; paragraph?: string; act: string } | null {
    // Normalize: lowercase for parsing, preserve original article numbers
    const normalized = reference.trim();

    // Match patterns like "Art. 97 [Abs./al./cpv. X] [lit./let./lett. a] OR/CO/ZGB"
    const patterns = [
      // Full pattern with paragraph and letter
      /^art\.?\s*(\d+(?:bis|ter|quater)?)\s*(?:abs\.?|al\.?|cpv\.?)\s*(\d+)\s*(?:lit\.?|let\.?|lett\.?)\s*([a-z])\s+(\w+)$/i,
      // Pattern with paragraph only
      /^art\.?\s*(\d+(?:bis|ter|quater)?)\s*(?:abs\.?|al\.?|cpv\.?)\s*(\d+)\s+(\w+)$/i,
      // Simple pattern: Art. X STATUTE
      /^art\.?\s*(\d+(?:bis|ter|quater)?)\s+(\w+)$/i,
    ];

    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        if (match.length === 5) {
          // Full pattern with paragraph and letter
          return {
            article: `Art. ${match[1]}`,
            paragraph: `Abs. ${match[2]} lit. ${match[3]}`,
            act: match[4],
          };
        } else if (match.length === 4) {
          // Pattern with paragraph only
          return {
            article: `Art. ${match[1]}`,
            paragraph: `Abs. ${match[2]}`,
            act: match[3],
          };
        } else if (match.length === 3) {
          // Simple pattern
          return {
            article: `Art. ${match[1]}`,
            act: match[2],
          };
        }
      }
    }

    return null;
  }

  /**
   * Get the legislative act mapping (abbreviation -> UUID)
   */
  getLegislativeActMapping(): LegislativeActMapping {
    return { ...this.legislativeActMapping };
  }

  /**
   * Manually set legislative act mapping (useful for testing)
   */
  setLegislativeActMapping(mapping: LegislativeActMapping): void {
    this.legislativeActMapping = { ...mapping };
  }
}
