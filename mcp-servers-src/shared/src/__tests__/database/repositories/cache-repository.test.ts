/**
 * Cache Repository Tests
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseClient, DatabaseConfig } from '../../../database/client';
import { CacheRepository } from '../../../database/repositories/cache-repository';

describe('CacheRepository', () => {
  let client: DatabaseClient;
  let repository: CacheRepository;

  beforeEach(async () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      memory: true
    };
    client = new DatabaseClient(config);
    await client.connect();
    await client.migrate();
    repository = new CacheRepository(client);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('set and get', () => {
    test('should set and get cache entry', async () => {
      const data = { title: 'Test Decision', summary: 'Test Summary' };
      await repository.set('test-key', data, 3600, 'test');

      const retrieved = await repository.get('test-key');
      expect(retrieved).toEqual(data);
    });

    test('should return null for non-existent key', async () => {
      const retrieved = await repository.get('non-existent-key');
      expect(retrieved).toBeNull();
    });

    test('should return null for expired entry', async () => {
      const data = { test: 'data' };
      await repository.set('expired-key', data, -1, 'test'); // Expired immediately

      // Small delay to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      const retrieved = await repository.get('expired-key');
      expect(retrieved).toBeNull();
    });

    test('should increment hit count on access', async () => {
      const data = { test: 'data' };
      await repository.set('hit-test', data, 3600, 'test');

      await repository.get('hit-test');
      await repository.get('hit-test');
      await repository.get('hit-test');

      // Hit count is tracked but not returned in get(), so we verify through stats
      const entries = await repository.getMostAccessed(1);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].hit_count).toBe(3);
    });
  });

  describe('has', () => {
    test('should return true for existing non-expired key', async () => {
      await repository.set('test-key', { data: 'test' }, 3600, 'test');
      const exists = await repository.has('test-key');
      expect(exists).toBe(true);
    });

    test('should return false for non-existent key', async () => {
      const exists = await repository.has('non-existent');
      expect(exists).toBe(false);
    });

    test('should return false for expired key', async () => {
      await repository.set('expired', { data: 'test' }, -1, 'test');
      await new Promise(resolve => setTimeout(resolve, 10));

      const exists = await repository.has('expired');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    test('should delete cache entry', async () => {
      await repository.set('delete-test', { data: 'test' }, 3600, 'test');

      let exists = await repository.has('delete-test');
      expect(exists).toBe(true);

      await repository.delete('delete-test');

      exists = await repository.has('delete-test');
      expect(exists).toBe(false);
    });
  });

  describe('cleanup', () => {
    test('should delete expired entries', async () => {
      // Create expired entries
      await repository.set('expired1', { data: '1' }, -1, 'test');
      await repository.set('expired2', { data: '2' }, -1, 'test');

      // Create valid entry
      await repository.set('valid', { data: 'valid' }, 3600, 'test');

      await new Promise(resolve => setTimeout(resolve, 10));

      const deletedCount = await repository.cleanup();
      expect(deletedCount).toBe(2);

      // Valid entry should still exist
      const stillExists = await repository.has('valid');
      expect(stillExists).toBe(true);
    });

    test('should return 0 when no expired entries', async () => {
      await repository.set('valid', { data: 'valid' }, 3600, 'test');

      const deletedCount = await repository.cleanup();
      expect(deletedCount).toBe(0);
    });
  });

  describe('getStats', () => {
    test('should return cache statistics', async () => {
      await repository.set('key1', { data: '1' }, 3600, 'type1');
      await repository.set('key2', { data: '2' }, 3600, 'type1');
      await repository.set('key3', { data: '3' }, 3600, 'type2');
      await repository.set('expired', { data: 'exp' }, -1, 'type1');

      await new Promise(resolve => setTimeout(resolve, 10));

      const stats = await repository.getStats();

      expect(stats.total).toBe(4);
      expect(stats.expired).toBe(1);
      expect(stats.byType['type1']).toBe(3);
      expect(stats.byType['type2']).toBe(1);
    });
  });

  describe('getMostAccessed', () => {
    test('should return most accessed entries', async () => {
      await repository.set('key1', { data: '1' }, 3600, 'test');
      await repository.set('key2', { data: '2' }, 3600, 'test');
      await repository.set('key3', { data: '3' }, 3600, 'test');

      // Access key2 multiple times
      await repository.get('key2');
      await repository.get('key2');
      await repository.get('key2');

      // Access key1 once
      await repository.get('key1');

      const mostAccessed = await repository.getMostAccessed(2);
      expect(mostAccessed).toHaveLength(2);
      expect(mostAccessed[0].cache_key).toBe('key2');
      expect(mostAccessed[0].hit_count).toBe(3);
    });
  });

  describe('clear', () => {
    test('should clear all cache entries', async () => {
      await repository.set('key1', { data: '1' }, 3600, 'test');
      await repository.set('key2', { data: '2' }, 3600, 'test');

      await repository.clear();

      const stats = await repository.getStats();
      expect(stats.total).toBe(0);
    });
  });

  describe('complex data types', () => {
    test('should handle complex nested objects', async () => {
      const complexData = {
        decision: {
          citation: 'BGE 147 IV 73',
          metadata: {
            chambers: ['IV', 'V'],
            dates: ['2021-01-15', '2021-02-20']
          }
        },
        analysis: ['point1', 'point2', 'point3']
      };

      await repository.set('complex', complexData, 3600, 'test');
      const retrieved = await repository.get('complex');

      expect(retrieved).toEqual(complexData);
    });

    test('should handle arrays', async () => {
      const arrayData = [1, 2, 3, 4, 5];
      await repository.set('array', arrayData, 3600, 'test');

      const retrieved = await repository.get('array');
      expect(retrieved).toEqual(arrayData);
    });
  });
});
