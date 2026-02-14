/**
 * Decision Repository
 * Database operations for court decisions
 */

import { DataSource, Repository, FindOptionsWhere } from 'typeorm';
import { Decision, CourtLevel, Language } from '../entities/Decision';
import { DatabaseQueryError } from '../../errors/errors';

export interface DecisionSearchFilters {
  query?: string;
  courtLevel?: CourtLevel;
  canton?: string;
  language?: Language;
  legalAreas?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  chamber?: string;
  limit?: number;
  offset?: number;
}

export class DecisionRepository {
  private repository: Repository<Decision>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Decision);
  }

  /**
   * Find decision by ID
   */
  async findById(id: string): Promise<Decision | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to find decision by ID: ${(error as Error).message}`,
        'decisions'
      );
    }
  }

  /**
   * Find decision by decision ID (e.g., BGE reference, cantonal ID)
   */
  async findByDecisionId(decisionId: string): Promise<Decision | null> {
    try {
      return await this.repository.findOne({ where: { decisionId } });
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to find decision by decision ID: ${(error as Error).message}`,
        'decisions'
      );
    }
  }

  /**
   * Search decisions with filters
   */
  async search(filters: DecisionSearchFilters): Promise<Decision[]> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('decision');

      // Text search in title and summary
      if (filters.query) {
        queryBuilder.andWhere(
          '(decision.title LIKE :query OR decision.summary LIKE :query OR decision.decisionId LIKE :query)',
          { query: `%${filters.query}%` }
        );
      }

      // Court level filter
      if (filters.courtLevel) {
        queryBuilder.andWhere('decision.courtLevel = :courtLevel', {
          courtLevel: filters.courtLevel,
        });
      }

      // Canton filter
      if (filters.canton) {
        queryBuilder.andWhere('decision.canton = :canton', {
          canton: filters.canton,
        });
      }

      // Language filter
      if (filters.language) {
        queryBuilder.andWhere('decision.language = :language', {
          language: filters.language,
        });
      }

      // Legal areas filter (match any)
      if (filters.legalAreas && filters.legalAreas.length > 0) {
        const legalAreaConditions = filters.legalAreas.map(
          (area, index) => `decision.legalAreas LIKE :area${index}`
        );
        queryBuilder.andWhere(`(${legalAreaConditions.join(' OR ')})`,
          filters.legalAreas.reduce((acc, area, index) => ({
            ...acc,
            [`area${index}`]: `%${area}%`,
          }), {})
        );
      }

      // Date range filter
      if (filters.dateFrom) {
        queryBuilder.andWhere('decision.decisionDate >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }
      if (filters.dateTo) {
        queryBuilder.andWhere('decision.decisionDate <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      // Chamber filter (federal only)
      if (filters.chamber) {
        queryBuilder.andWhere('decision.chamber = :chamber', {
          chamber: filters.chamber,
        });
      }

      // Order by relevance (search score if available, otherwise by date)
      queryBuilder.orderBy('decision.searchScore', 'DESC', 'NULLS LAST');
      queryBuilder.addOrderBy('decision.decisionDate', 'DESC');

      // Pagination
      if (filters.limit) {
        queryBuilder.limit(filters.limit);
      }
      if (filters.offset) {
        queryBuilder.offset(filters.offset);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to search decisions: ${(error as Error).message}`,
        'decisions'
      );
    }
  }

  /**
   * Create or update decision
   */
  async upsert(decision: Partial<Decision>): Promise<Decision> {
    try {
      // Check if decision exists
      let existing: Decision | null = null;
      if (decision.decisionId) {
        existing = await this.findByDecisionId(decision.decisionId);
      }

      if (existing) {
        // Update existing
        Object.assign(existing, decision);
        existing.lastFetchedAt = new Date();
        return await this.repository.save(existing);
      } else {
        // Create new
        const newDecision = this.repository.create({
          ...decision,
          lastFetchedAt: new Date(),
        });
        return await this.repository.save(newDecision);
      }
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to upsert decision: ${(error as Error).message}`,
        'decisions'
      );
    }
  }

  /**
   * Bulk upsert decisions
   */
  async bulkUpsert(decisions: Partial<Decision>[]): Promise<Decision[]> {
    const results: Decision[] = [];

    for (const decision of decisions) {
      try {
        const result = await this.upsert(decision);
        results.push(result);
      } catch (error) {
        // Continue with other decisions even if one fails
        console.error(`Failed to upsert decision ${decision.decisionId}:`, error);
      }
    }

    return results;
  }

  /**
   * Delete decision by ID
   */
  async delete(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to delete decision: ${(error as Error).message}`,
        'decisions'
      );
    }
  }

  /**
   * Count decisions matching filters
   */
  async count(filters: DecisionSearchFilters = {}): Promise<number> {
    try {
      const where: FindOptionsWhere<Decision> = {};

      if (filters.courtLevel) {
        where.courtLevel = filters.courtLevel;
      }
      if (filters.canton) {
        where.canton = filters.canton;
      }
      if (filters.language) {
        where.language = filters.language;
      }

      return await this.repository.count({ where });
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to count decisions: ${(error as Error).message}`,
        'decisions'
      );
    }
  }

  /**
   * Find related decisions by legal areas
   */
  async findRelated(decisionId: string, limit = 10): Promise<Decision[]> {
    try {
      const decision = await this.findByDecisionId(decisionId);
      if (!decision) {
        return [];
      }

      const queryBuilder = this.repository.createQueryBuilder('decision');

      // Exclude the decision itself
      queryBuilder.where('decision.decisionId != :decisionId', { decisionId });

      // Match legal areas
      if (decision.legalAreas && decision.legalAreas.length > 0) {
        const legalAreaConditions = decision.legalAreas.map(
          (area, index) => `decision.legalAreas LIKE :area${index}`
        );
        queryBuilder.andWhere(`(${legalAreaConditions.join(' OR ')})`,
          decision.legalAreas.reduce((acc, area, index) => ({
            ...acc,
            [`area${index}`]: `%${area}%`,
          }), {})
        );
      }

      // Prefer same canton if available
      if (decision.canton) {
        queryBuilder.addOrderBy(
          `CASE WHEN decision.canton = :canton THEN 0 ELSE 1 END`,
          'ASC'
        );
        queryBuilder.setParameter('canton', decision.canton);
      }

      // Order by date (recent first)
      queryBuilder.addOrderBy('decision.decisionDate', 'DESC');

      queryBuilder.limit(limit);

      return await queryBuilder.getMany();
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to find related decisions: ${(error as Error).message}`,
        'decisions'
      );
    }
  }

  /**
   * Update search scores for decisions
   */
  async updateSearchScores(scores: Map<string, number>): Promise<void> {
    try {
      for (const [decisionId, score] of scores.entries()) {
        await this.repository.update(
          { decisionId },
          { searchScore: score }
        );
      }
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to update search scores: ${(error as Error).message}`,
        'decisions'
      );
    }
  }
}
