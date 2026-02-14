/**
 * Cantonal API Client
 * Unified interface for Swiss cantonal court decisions
 */

import { BaseAPIClient, APIClientOptions } from './BaseAPIClient';
import { APIError } from '../errors/errors';
import { Logger } from '../logging/logger';

/**
 * Supported Swiss cantons
 */
export type Canton = 'ZH' | 'BE' | 'GE' | 'BS' | 'VD' | 'TI';

/**
 * Cantonal court decision
 */
export interface CantonalDecision {
  decisionId: string;
  canton: Canton;
  title: string;
  summary: string;
  decisionDate: string;
  language: 'de' | 'fr' | 'it';
  court: string; // e.g., "Obergericht", "Tribunal Cantonal"
  legalAreas: string[];
  fullText?: string;
  sourceUrl: string;
  relatedDecisions?: string[];
  metadata?: {
    caseNumber?: string;
    judges?: string[];
    keywords?: string[];
  };
}

/**
 * Search filters for cantonal APIs
 */
export interface CantonalSearchFilters {
  query?: string;
  canton?: Canton;
  language?: 'de' | 'fr' | 'it';
  court?: string;
  legalArea?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Canton-specific API response format
 */
interface CantonalAPIResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    canton?: Canton;
  };
}

/**
 * Cantonal API Client
 * Handles communication with cantonal court APIs
 */
export class CantonalClient extends BaseAPIClient {
  private canton: Canton;

  constructor(options: APIClientOptions & { canton: Canton }) {
    super(options);
    this.canton = options.canton;
  }

  /**
   * Get canton identifier
   */
  getCanton(): Canton {
    return this.canton;
  }

  /**
   * Search for decisions in this canton
   */
  async searchDecisions(
    filters: Omit<CantonalSearchFilters, 'canton'> = {}
  ): Promise<{ decisions: CantonalDecision[]; total: number }> {
    try {
      this.logger.info('Searching cantonal decisions', {
        canton: this.canton,
        filters,
      });

      // Build query parameters
      const params: Record<string, string | number> = {};

      if (filters.query) params.q = filters.query;
      if (filters.language) params.lang = filters.language;
      if (filters.court) params.court = filters.court;
      if (filters.legalArea) params.legalArea = filters.legalArea;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.limit) params.limit = filters.limit;
      if (filters.offset) params.offset = filters.offset;

      const response = await this.get<CantonalAPIResponse<CantonalDecision[]>>(
        '/decisions/search',
        { params }
      );

      // Ensure all decisions have the correct canton set
      const decisions = response.data.map(d => ({
        ...d,
        canton: this.canton,
      }));

      this.logger.info('Cantonal search completed', {
        canton: this.canton,
        resultCount: decisions.length,
        total: response.meta?.total,
      });

      return {
        decisions,
        total: response.meta?.total || decisions.length,
      };
    } catch (error) {
      this.logger.error('Cantonal search failed', error as Error, {
        canton: this.canton,
        filters,
      });

      throw new APIError(
        `Failed to search ${this.canton} decisions: ${(error as Error).message}`,
        this.serviceName,
        '/decisions/search'
      );
    }
  }

  /**
   * Get decision by ID
   */
  async getDecisionById(decisionId: string): Promise<CantonalDecision | null> {
    try {
      this.logger.info('Fetching cantonal decision by ID', {
        canton: this.canton,
        decisionId,
      });

      const response = await this.get<CantonalAPIResponse<CantonalDecision>>(
        `/decisions/${decisionId}`
      );

      const decision = {
        ...response.data,
        canton: this.canton,
      };

      this.logger.info('Decision fetched successfully', {
        canton: this.canton,
        decisionId: decision.decisionId,
      });

      return decision;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        this.logger.info('Decision not found', {
          canton: this.canton,
          decisionId,
        });
        return null;
      }

      this.logger.error('Failed to fetch decision by ID', error as Error, {
        canton: this.canton,
        decisionId,
      });

      throw new APIError(
        `Failed to get ${this.canton} decision by ID: ${(error as Error).message}`,
        this.serviceName,
        '/decisions'
      );
    }
  }

  /**
   * Get recent decisions from this canton
   */
  async getRecentDecisions(limit = 20, court?: string): Promise<CantonalDecision[]> {
    try {
      this.logger.info('Fetching recent cantonal decisions', {
        canton: this.canton,
        limit,
        court,
      });

      const params: Record<string, string | number> = { limit };
      if (court) params.court = court;

      const response = await this.get<CantonalAPIResponse<CantonalDecision[]>>(
        '/decisions/recent',
        { params }
      );

      const decisions = response.data.map(d => ({
        ...d,
        canton: this.canton,
      }));

      this.logger.info('Recent decisions fetched', {
        canton: this.canton,
        count: decisions.length,
      });

      return decisions;
    } catch (error) {
      this.logger.error('Failed to fetch recent decisions', error as Error, {
        canton: this.canton,
        limit,
        court,
      });

      throw new APIError(
        `Failed to get recent ${this.canton} decisions: ${(error as Error).message}`,
        this.serviceName,
        '/decisions/recent'
      );
    }
  }

  /**
   * Get available courts for this canton
   */
  async getAvailableCourts(): Promise<string[]> {
    try {
      this.logger.info('Fetching available courts', {
        canton: this.canton,
      });

      const response = await this.get<CantonalAPIResponse<string[]>>(
        '/metadata/courts'
      );

      this.logger.info('Courts fetched', {
        canton: this.canton,
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch courts', error as Error, {
        canton: this.canton,
      });

      throw new APIError(
        `Failed to get ${this.canton} courts: ${(error as Error).message}`,
        this.serviceName,
        '/metadata/courts'
      );
    }
  }
}

/**
 * Canton-specific client factory
 */
export class CantonalClientFactory {
  /**
   * Create clients for all configured cantons
   */
  static createClients(
    configs: Record<Canton, APIClientOptions>,
    logger: Logger
  ): Record<Canton, CantonalClient> {
    const clients: Partial<Record<Canton, CantonalClient>> = {};

    const cantons: Canton[] = ['ZH', 'BE', 'GE', 'BS', 'VD', 'TI'];

    for (const canton of cantons) {
      if (configs[canton]) {
        clients[canton] = new CantonalClient({
          ...configs[canton],
          logger,
          canton,
        });
      }
    }

    return clients as Record<Canton, CantonalClient>;
  }

  /**
   * Search across multiple cantons
   */
  static async searchAcrossCantons(
    clients: Record<Canton, CantonalClient>,
    filters: CantonalSearchFilters
  ): Promise<{ decisions: CantonalDecision[]; total: number; byCanton: Record<Canton, number> }> {
    const targetCantons = filters.canton ? [filters.canton] : Object.keys(clients) as Canton[];

    const results = await Promise.allSettled(
      targetCantons.map(canton => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { canton: _canton, ...searchFilters } = filters;
        return clients[canton]?.searchDecisions(searchFilters);
      })
    );

    let allDecisions: CantonalDecision[] = [];
    const byCanton: Partial<Record<Canton, number>> = {};

    results.forEach((result, index) => {
      const canton = targetCantons[index];
      if (result.status === 'fulfilled' && result.value) {
        allDecisions = allDecisions.concat(result.value.decisions);
        byCanton[canton] = result.value.total;
      } else {
        byCanton[canton] = 0;
      }
    });

    // Sort by date (most recent first)
    allDecisions.sort((a, b) =>
      new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime()
    );

    // Apply limit if specified
    if (filters.limit) {
      allDecisions = allDecisions.slice(0, filters.limit);
    }

    return {
      decisions: allDecisions,
      total: allDecisions.length,
      byCanton: byCanton as Record<Canton, number>,
    };
  }
}
