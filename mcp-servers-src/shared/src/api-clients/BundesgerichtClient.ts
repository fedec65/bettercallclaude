/**
 * Bundesgericht API Client
 * Swiss Federal Supreme Court decision retrieval
 */

import { BaseAPIClient, APIClientOptions } from './BaseAPIClient';
import { APIError, InvalidCitationFormatError } from '../errors/errors';

/**
 * BGE Citation format: "BGE [volume] [chamber] [page]"
 * Examples: "BGE 148 II 465", "BGE 147 I 73"
 */
export interface BGECitation {
  volume: number;
  chamber: 'I' | 'II' | 'III' | 'IV' | 'V';
  page: number;
  formatted: string;
}

/**
 * Federal court decision from Bundesgericht API
 */
export interface BundesgerichtDecision {
  decisionId: string;
  bgeReference?: string;
  title: string;
  summary: string;
  decisionDate: string;
  language: 'de' | 'fr' | 'it';
  chamber: 'I' | 'II' | 'III' | 'IV' | 'V';
  legalAreas: string[];
  fullText?: string;
  sourceUrl: string;
  relatedDecisions?: string[];
  metadata?: {
    fileNumber?: string;
    judges?: string[];
    keywords?: string[];
  };
}

/**
 * Search filters for Bundesgericht API
 */
export interface BundesgerichtSearchFilters {
  query?: string;
  language?: 'de' | 'fr' | 'it';
  chamber?: 'I' | 'II' | 'III' | 'IV' | 'V';
  legalArea?: string;
  dateFrom?: string; // ISO date format
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Bundesgericht API response format
 */
interface BundesgerichtAPIResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

/**
 * Bundesgericht API Client
 * Handles communication with Swiss Federal Supreme Court API
 */
export class BundesgerichtClient extends BaseAPIClient {
  constructor(options: APIClientOptions) {
    super(options);
  }

  /**
   * Parse BGE citation string
   */
  parseCitation(citation: string): BGECitation {
    // Normalize citation
    const normalized = citation.trim().toUpperCase();

    // Expected format: "BGE 148 II 465" or "148 II 465"
    const match = normalized.match(/^(?:BGE\s+)?(\d+)\s+([IV]+)\s+(\d+)$/);

    if (!match) {
      throw new InvalidCitationFormatError(
        citation,
        'Expected format: "BGE [volume] [chamber] [page]" (e.g., "BGE 148 II 465")'
      );
    }

    const [, volumeStr, chamber, pageStr] = match;
    const volume = parseInt(volumeStr, 10);
    const page = parseInt(pageStr, 10);

    // Validate chamber (I-V only)
    if (!['I', 'II', 'III', 'IV', 'V'].includes(chamber)) {
      throw new InvalidCitationFormatError(
        citation,
        `Invalid chamber "${chamber}". Must be I, II, III, IV, or V`
      );
    }

    return {
      volume,
      chamber: chamber as 'I' | 'II' | 'III' | 'IV' | 'V',
      page,
      formatted: `BGE ${volume} ${chamber} ${page}`,
    };
  }

  /**
   * Search for decisions
   */
  async searchDecisions(
    filters: BundesgerichtSearchFilters = {}
  ): Promise<{ decisions: BundesgerichtDecision[]; total: number }> {
    try {
      this.logger.info('Searching Bundesgericht decisions', { filters });

      // Build query parameters
      const params: Record<string, string | number> = {};

      if (filters.query) params.q = filters.query;
      if (filters.language) params.lang = filters.language;
      if (filters.chamber) params.chamber = filters.chamber;
      if (filters.legalArea) params.legalArea = filters.legalArea;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.limit) params.limit = filters.limit;
      if (filters.offset) params.offset = filters.offset;

      const response = await this.get<BundesgerichtAPIResponse<BundesgerichtDecision[]>>(
        '/decisions/search',
        { params }
      );

      this.logger.info('Bundesgericht search completed', {
        resultCount: response.data.length,
        total: response.meta?.total,
      });

      return {
        decisions: response.data,
        total: response.meta?.total || response.data.length,
      };
    } catch (error) {
      this.logger.error('Bundesgericht search failed', error as Error, { filters });
      throw new APIError(
        `Failed to search Bundesgericht: ${(error as Error).message}`,
        this.serviceName,
        '/decisions/search'
      );
    }
  }

  /**
   * Get decision by BGE citation
   */
  async getDecisionByCitation(citation: string): Promise<BundesgerichtDecision | null> {
    try {
      const parsed = this.parseCitation(citation);

      this.logger.info('Fetching decision by citation', {
        citation: parsed.formatted,
      });

      const response = await this.get<BundesgerichtAPIResponse<BundesgerichtDecision>>(
        `/decisions/bge/${parsed.volume}/${parsed.chamber}/${parsed.page}`
      );

      this.logger.info('Decision fetched successfully', {
        decisionId: response.data.decisionId,
      });

      return response.data;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        this.logger.info('Decision not found', { citation });
        return null;
      }

      this.logger.error('Failed to fetch decision by citation', error as Error, {
        citation,
      });

      throw new APIError(
        `Failed to get decision by citation: ${(error as Error).message}`,
        this.serviceName,
        '/decisions/bge'
      );
    }
  }

  /**
   * Get decision by decision ID
   */
  async getDecisionById(decisionId: string): Promise<BundesgerichtDecision | null> {
    try {
      this.logger.info('Fetching decision by ID', { decisionId });

      const response = await this.get<BundesgerichtAPIResponse<BundesgerichtDecision>>(
        `/decisions/${decisionId}`
      );

      this.logger.info('Decision fetched successfully', {
        decisionId: response.data.decisionId,
      });

      return response.data;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        this.logger.info('Decision not found', { decisionId });
        return null;
      }

      this.logger.error('Failed to fetch decision by ID', error as Error, {
        decisionId,
      });

      throw new APIError(
        `Failed to get decision by ID: ${(error as Error).message}`,
        this.serviceName,
        '/decisions'
      );
    }
  }

  /**
   * Get recent decisions
   */
  async getRecentDecisions(
    limit = 20,
    chamber?: 'I' | 'II' | 'III' | 'IV' | 'V'
  ): Promise<BundesgerichtDecision[]> {
    try {
      this.logger.info('Fetching recent decisions', { limit, chamber });

      const params: Record<string, string | number> = { limit };
      if (chamber) params.chamber = chamber;

      const response = await this.get<BundesgerichtAPIResponse<BundesgerichtDecision[]>>(
        '/decisions/recent',
        { params }
      );

      this.logger.info('Recent decisions fetched', {
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch recent decisions', error as Error, {
        limit,
        chamber,
      });

      throw new APIError(
        `Failed to get recent decisions: ${(error as Error).message}`,
        this.serviceName,
        '/decisions/recent'
      );
    }
  }

  /**
   * Validate if citation format is correct
   */
  validateCitation(citation: string): { valid: boolean; error?: string } {
    try {
      this.parseCitation(citation);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error).message,
      };
    }
  }
}
