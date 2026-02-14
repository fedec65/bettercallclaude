/**
 * Cache Repository
 * Manages API response caching with TTL and hit tracking
 */

import { DatabaseClient } from '../client';

export interface CacheEntry {
  id: string;
  cache_key: string;
  cache_type: string;
  data: unknown; // Stored as JSON string in database
  created_at?: string;
  expires_at: string;
  hit_count?: number;
  last_accessed_at?: string;
}

export class CacheRepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Set a cache entry with TTL (time-to-live in seconds)
   */
  async set(key: string, data: unknown, ttl: number, type: string = 'generic'): Promise<void> {
    const id = this.db.generateId();
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    const sql = `
      INSERT INTO api_cache (id, cache_key, cache_type, data, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.db.query(sql, {
      values: [id, key, type, JSON.stringify(data), expiresAt]
    });
  }

  /**
   * Get a cache entry by key
   * Returns null if not found or expired
   * Increments hit_count and updates last_accessed_at
   */
  async get(key: string): Promise<unknown | null> {
    const entry = await this.db.queryOne<CacheEntry>(
      `SELECT * FROM api_cache WHERE cache_key = ?`,
      { values: [key] }
    );

    if (!entry) return null;

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(entry.expires_at);

    if (now > expiresAt) {
      // Expired - delete and return null
      await this.delete(key);
      return null;
    }

    // Update hit count and last accessed
    await this.db.query(
      `UPDATE api_cache
       SET hit_count = hit_count + 1, last_accessed_at = datetime('now')
       WHERE cache_key = ?`,
      { values: [key] }
    );

    // Parse and return data (stored as JSON string in database)
    return typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = await this.db.queryOne<CacheEntry>(
      `SELECT expires_at FROM api_cache WHERE cache_key = ?`,
      { values: [key] }
    );

    if (!entry) return false;

    const now = new Date();
    const expiresAt = new Date(entry.expires_at);

    return now <= expiresAt;
  }

  /**
   * Delete a specific cache entry
   */
  async delete(key: string): Promise<void> {
    await this.db.query(
      `DELETE FROM api_cache WHERE cache_key = ?`,
      { values: [key] }
    );
  }

  /**
   * Delete multiple cache entries by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const sql = `DELETE FROM api_cache WHERE cache_key LIKE ?`;
    await this.db.query(sql, { values: [`%${pattern}%`] });

    // Return count of deleted entries
    // Note: SQLite doesn't return affected rows easily, so we'll return 0
    // This could be improved by selecting first then deleting
    return 0;
  }

  /**
   * Delete all expired entries
   * Returns count of deleted entries
   */
  async cleanup(): Promise<number> {
    const now = new Date().toISOString();

    // Count expired entries first
    const countResult = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM api_cache WHERE expires_at < ?`,
      { values: [now] }
    );

    const expiredCount = countResult?.count || 0;

    // Delete expired entries
    if (expiredCount > 0) {
      await this.db.query(
        `DELETE FROM api_cache WHERE expires_at < ?`,
        { values: [now] }
      );
    }

    return expiredCount;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    total: number;
    expired: number;
    byType: { [type: string]: number };
  }> {
    const now = new Date().toISOString();

    // Total count
    const totalResult = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM api_cache`
    );
    const total = totalResult?.count || 0;

    // Expired count
    const expiredResult = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM api_cache WHERE expires_at < ?`,
      { values: [now] }
    );
    const expired = expiredResult?.count || 0;

    // Count by type
    const typeResults = await this.db.query<{ cache_type: string; count: number }>(
      `SELECT cache_type, COUNT(*) as count FROM api_cache GROUP BY cache_type`
    );

    const byType: { [type: string]: number } = {};
    typeResults.forEach(row => {
      byType[row.cache_type] = row.count;
    });

    return { total, expired, byType };
  }

  /**
   * Get most accessed cache entries
   */
  async getMostAccessed(limit: number = 10): Promise<CacheEntry[]> {
    const sql = `
      SELECT * FROM api_cache
      ORDER BY hit_count DESC
      LIMIT ?
    `;

    const results = await this.db.query<CacheEntry>(sql, { values: [limit] });
    return results.map(r => this.parseEntry(r));
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.db.query(`DELETE FROM api_cache`);
  }

  /**
   * Parse cache entry from database (convert JSON strings to objects)
   * Note: data is stored as JSON string in SQLite, needs parsing
   */
  private parseEntry(row: CacheEntry): CacheEntry {
    return {
      ...row,
      data: typeof row.data === 'string'
        ? JSON.parse(row.data)
        : row.data,
    };
  }
}
