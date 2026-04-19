/**
 * Search Repository
 * Query logging and analytics for search operations
 */

import { DatabaseClient } from '../client';

export interface SearchQuery {
  id: string;
  query_text: string;
  query_type?: string;
  filters?: Record<string, unknown>; // Stored as JSON in database
  result_count?: number;
  execution_time_ms?: number;
  user_id?: string;
  timestamp?: string;
}

export class SearchRepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Log a search query
   */
  async logQuery(query: SearchQuery): Promise<void> {
    const sql = `
      INSERT INTO search_queries (
        id, query_text, query_type, filters, result_count,
        execution_time_ms, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.query(sql, {
      values: [
        query.id,
        query.query_text,
        query.query_type || null,
        query.filters ? JSON.stringify(query.filters) : null,
        query.result_count || 0,
        query.execution_time_ms || null,
        query.user_id || null
      ]
    });
  }

  /**
   * Get popular queries (most frequent)
   */
  async getPopularQueries(limit: number = 10): Promise<Array<{ query: string; count: number }>> {
    const sql = `
      SELECT query_text as query, COUNT(*) as count
      FROM search_queries
      WHERE timestamp >= datetime('now', '-30 days')
      GROUP BY query_text
      ORDER BY count DESC
      LIMIT ?
    `;

    const results = await this.db.query<{ query: string; count: number }>(sql, {
      values: [limit]
    });

    return results;
  }

  /**
   * Get recent queries
   */
  async getRecentQueries(limit: number = 20): Promise<SearchQuery[]> {
    const sql = `
      SELECT * FROM search_queries
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const results = await this.db.query<SearchQuery>(sql, { values: [limit] });
    return results.map(r => this.parseQuery(r));
  }

  /**
   * Get queries by user
   */
  async getQueriesByUser(userId: string, limit: number = 50): Promise<SearchQuery[]> {
    const sql = `
      SELECT * FROM search_queries
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const results = await this.db.query<SearchQuery>(sql, {
      values: [userId, limit]
    });

    return results.map(r => this.parseQuery(r));
  }

  /**
   * Get queries by type
   */
  async getQueriesByType(type: string, limit: number = 50): Promise<SearchQuery[]> {
    const sql = `
      SELECT * FROM search_queries
      WHERE query_type = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const results = await this.db.query<SearchQuery>(sql, {
      values: [type, limit]
    });

    return results.map(r => this.parseQuery(r));
  }

  /**
   * Get queries in date range
   */
  async getQueriesByDateRange(startDate: Date, endDate: Date): Promise<SearchQuery[]> {
    const sql = `
      SELECT * FROM search_queries
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp DESC
    `;

    const results = await this.db.query<SearchQuery>(sql, {
      values: [
        startDate.toISOString(),
        endDate.toISOString()
      ]
    });

    return results.map(r => this.parseQuery(r));
  }

  /**
   * Get search analytics
   */
  async getAnalytics(days: number = 30): Promise<{
    total_queries: number;
    avg_results: number;
    avg_execution_time: number;
    queries_by_type: { [type: string]: number };
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total queries
    const totalResult = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM search_queries WHERE timestamp >= ?`,
      { values: [startDate.toISOString()] }
    );
    const total_queries = totalResult?.count || 0;

    // Average results
    const avgResultsResult = await this.db.queryOne<{ avg: number }>(
      `SELECT AVG(result_count) as avg FROM search_queries
       WHERE timestamp >= ? AND result_count IS NOT NULL`,
      { values: [startDate.toISOString()] }
    );
    const avg_results = Math.round(avgResultsResult?.avg || 0);

    // Average execution time
    const avgTimeResult = await this.db.queryOne<{ avg: number }>(
      `SELECT AVG(execution_time_ms) as avg FROM search_queries
       WHERE timestamp >= ? AND execution_time_ms IS NOT NULL`,
      { values: [startDate.toISOString()] }
    );
    const avg_execution_time = Math.round(avgTimeResult?.avg || 0);

    // Queries by type
    const typeResults = await this.db.query<{ query_type: string; count: number }>(
      `SELECT query_type, COUNT(*) as count FROM search_queries
       WHERE timestamp >= ?
       GROUP BY query_type`,
      { values: [startDate.toISOString()] }
    );

    const queries_by_type: { [type: string]: number } = {};
    typeResults.forEach(row => {
      queries_by_type[row.query_type || 'unknown'] = row.count;
    });

    return {
      total_queries,
      avg_results,
      avg_execution_time,
      queries_by_type
    };
  }

  /**
   * Delete old queries (cleanup)
   */
  async deleteOldQueries(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Count queries to delete
    const countResult = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM search_queries WHERE timestamp < ?`,
      { values: [cutoffDate.toISOString()] }
    );

    const deleteCount = countResult?.count || 0;

    // Delete old queries
    if (deleteCount > 0) {
      await this.db.query(
        `DELETE FROM search_queries WHERE timestamp < ?`,
        { values: [cutoffDate.toISOString()] }
      );
    }

    return deleteCount;
  }

  /**
   * Parse query from database (convert JSON strings to objects)
   * Note: filters is stored as JSON string in SQLite, needs parsing
   */
  private parseQuery(row: SearchQuery): SearchQuery {
    return {
      ...row,
      filters: typeof row.filters === 'string'
        ? JSON.parse(row.filters) as Record<string, unknown>
        : row.filters,
    };
  }
}
