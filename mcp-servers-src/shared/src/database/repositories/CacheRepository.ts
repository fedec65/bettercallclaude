/**
 * Cache Repository
 * Database operations for cache entries
 */

import { DataSource, Repository, LessThan } from 'typeorm';
import { CacheEntry } from '../entities/CacheEntry';
import { DatabaseQueryError } from '../../errors/errors';

export class CacheRepository {
  private repository: Repository<CacheEntry>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(CacheEntry);
  }

  /**
   * Get cache entry by key
   */
  async get(key: string): Promise<string | null> {
    try {
      const entry = await this.repository.findOne({ where: { key } });

      if (!entry) {
        return null;
      }

      // Check if expired
      if (entry.isExpired()) {
        await this.delete(key);
        return null;
      }

      // Record hit
      entry.recordHit();
      await this.repository.save(entry);

      return entry.value;
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to get cache entry: ${(error as Error).message}`,
        'cache_entries'
      );
    }
  }

  /**
   * Set cache entry with TTL
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      // Check if entry exists
      const existing = await this.repository.findOne({ where: { key } });

      if (existing) {
        // Update existing
        existing.value = value;
        existing.expiresAt = expiresAt;
        existing.updatedAt = new Date();
        await this.repository.save(existing);
      } else {
        // Create new
        const entry = this.repository.create({
          key,
          value,
          expiresAt,
          hitCount: 0,
        });
        await this.repository.save(entry);
      }
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to set cache entry: ${(error as Error).message}`,
        'cache_entries'
      );
    }
  }

  /**
   * Delete cache entry by key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.repository.delete({ key });
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to delete cache entry: ${(error as Error).message}`,
        'cache_entries'
      );
    }
  }

  /**
   * Clear all expired entries
   */
  async clearExpired(): Promise<number> {
    try {
      const result = await this.repository.delete({
        expiresAt: LessThan(new Date()),
      });
      return result.affected || 0;
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to clear expired entries: ${(error as Error).message}`,
        'cache_entries'
      );
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    try {
      await this.repository.clear();
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to clear all cache entries: ${(error as Error).message}`,
        'cache_entries'
      );
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    totalHits: number;
    avgHitsPerEntry: number;
  }> {
    try {
      const totalEntries = await this.repository.count();
      const expiredEntries = await this.repository.count({
        where: { expiresAt: LessThan(new Date()) },
      });

      const hitStats = await this.repository
        .createQueryBuilder('cache')
        .select('SUM(cache.hitCount)', 'totalHits')
        .getRawOne();

      const totalHits = parseInt(hitStats?.totalHits || '0', 10);
      const avgHitsPerEntry = totalEntries > 0 ? totalHits / totalEntries : 0;

      return {
        totalEntries,
        expiredEntries,
        totalHits,
        avgHitsPerEntry,
      };
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to get cache stats: ${(error as Error).message}`,
        'cache_entries'
      );
    }
  }

  /**
   * Get most frequently accessed entries
   */
  async getTopEntries(limit = 10): Promise<CacheEntry[]> {
    try {
      return await this.repository.find({
        order: { hitCount: 'DESC' },
        take: limit,
      });
    } catch (error) {
      throw new DatabaseQueryError(
        `Failed to get top cache entries: ${(error as Error).message}`,
        'cache_entries'
      );
    }
  }
}
