/**
 * Integration Tests: End-to-End Repository Workflows
 *
 * Tests complete CRUD cycles, cross-repository operations, and real-world scenarios
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseClient, DatabaseConfig } from '../../database/client';
import { BGERepository, BGEDecision } from '../../database/repositories/bge-repository';
import { CantonalRepository, CantonalDecision } from '../../database/repositories/cantonal-repository';
import { CacheRepository } from '../../database/repositories/cache-repository';
import { SearchRepository, SearchQuery } from '../../database/repositories/search-repository';
import { randomUUID } from 'crypto';

describe('Repository Integration Tests', () => {
  let client: DatabaseClient;
  let bgeRepo: BGERepository;
  let cantonalRepo: CantonalRepository;
  let cacheRepo: CacheRepository;
  let searchRepo: SearchRepository;

  beforeEach(async () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      memory: true
    };
    client = new DatabaseClient(config);
    await client.connect();
    await client.migrate();

    bgeRepo = new BGERepository(client);
    cantonalRepo = new CantonalRepository(client);
    cacheRepo = new CacheRepository(client);
    searchRepo = new SearchRepository(client);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('Complete CRUD Lifecycle', () => {
    test('BGE decision: Create → Read → Update → Delete cycle', async () => {
      const decisionId = randomUUID();

      // Create
      const decision: BGEDecision = {
        id: decisionId,
        citation: 'BGE 150 I 100',
        volume: '150',
        chamber: 'I',
        page: '100',
        title: 'Integration Test Decision',
        date: '2024-01-15',
        language: 'de',
        summary: 'Original summary',
        legal_areas: ['Verfassungsrecht', 'Grundrechte']
      };

      await bgeRepo.create(decision);

      // Read
      const found = await bgeRepo.findByCitation('BGE 150 I 100');
      expect(found).not.toBeNull();
      expect(found?.id).toBe(decisionId);
      expect(found?.title).toBe('Integration Test Decision');
      expect(found?.legal_areas).toEqual(['Verfassungsrecht', 'Grundrechte']);

      // Update
      await bgeRepo.update(decisionId, {
        title: 'Updated Integration Test',
        summary: 'Updated summary with more details',
        legal_areas: ['Verfassungsrecht', 'Grundrechte', 'Prozessrecht']
      });

      const updated = await bgeRepo.findByCitation('BGE 150 I 100');
      expect(updated?.title).toBe('Updated Integration Test');
      expect(updated?.summary).toBe('Updated summary with more details');
      expect(updated?.legal_areas).toHaveLength(3);

      // Delete
      await bgeRepo.delete(decisionId);

      const deleted = await bgeRepo.findByCitation('BGE 150 I 100');
      expect(deleted).toBeNull();

      // Verify count
      const count = await bgeRepo.count();
      expect(count).toBe(0);
    });

    test('Cantonal decision: Full lifecycle with canton validation', async () => {
      const decisionId = randomUUID();

      // Create with valid canton
      const decision: CantonalDecision = {
        id: decisionId,
        canton: 'ZH',
        citation: 'ZH-2024-INTEGRATION-001',
        court_name: 'Obergericht Zürich',
        decision_number: 'INT-001',
        title: 'Integration Test Cantonal',
        date: '2024-01-20',
        language: 'de',
        summary: 'Test summary',
        legal_areas: ['Strafrecht']
      };

      await cantonalRepo.create(decision);

      // Read
      const found = await cantonalRepo.findByCitation('ZH-2024-INTEGRATION-001');
      expect(found).not.toBeNull();
      expect(found?.canton).toBe('ZH');

      // Update
      await cantonalRepo.update(decisionId, {
        summary: 'Updated cantonal summary',
        legal_areas: ['Strafrecht', 'Verfahrensrecht']
      });

      const updated = await cantonalRepo.findByCitation('ZH-2024-INTEGRATION-001');
      expect(updated?.summary).toBe('Updated cantonal summary');

      // Delete
      await cantonalRepo.delete(decisionId);

      const deleted = await cantonalRepo.findByCitation('ZH-2024-INTEGRATION-001');
      expect(deleted).toBeNull();
    });
  });

  describe('Cross-Repository Operations', () => {
    test('Decision creation with search logging and caching', async () => {
      const decisionId = randomUUID();
      const searchQueryId = randomUUID();

      // 1. Create BGE decision
      const decision: BGEDecision = {
        id: decisionId,
        citation: 'BGE 149 II 250',
        title: 'Vertragsrecht Fall',
        language: 'de',
        summary: 'Wichtiger Vertragsrechtsfall'
      };

      await bgeRepo.create(decision);

      // 2. Search for the decision
      const searchResults = await bgeRepo.search('Vertragsrecht');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].citation).toBe('BGE 149 II 250');

      // 3. Log the search query
      const searchQuery: SearchQuery = {
        id: searchQueryId,
        query_text: 'Vertragsrecht',
        query_type: 'full-text',
        result_count: searchResults.length,
        execution_time_ms: 50
      };

      await searchRepo.logQuery(searchQuery);

      // 4. Cache the search results
      const cacheKey = 'search:Vertragsrecht';
      await cacheRepo.set(cacheKey, searchResults, 3600, 'search');

      // 5. Verify cached results
      const cachedResults = await cacheRepo.get(cacheKey);
      expect(cachedResults).toHaveLength(1);
      expect(cachedResults[0].citation).toBe('BGE 149 II 250');

      // 6. Verify search was logged
      const recentQueries = await searchRepo.getRecentQueries(5);
      expect(recentQueries.some(q => q.query_text === 'Vertragsrecht')).toBe(true);

      // 7. Check cache statistics
      const stats = await cacheRepo.getStats();
      expect(stats.total).toBe(1);
      expect(stats.byType['search']).toBe(1);
    });

    test('Multi-repository search workflow with analytics', async () => {
      // Create test data in both repositories
      const bgeDecision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 148 III 200',
        title: 'Arbeitsrecht Entscheidung',
        language: 'de',
        summary: 'Arbeitsrechtlicher Streitfall'
      };

      const cantonalDecision: CantonalDecision = {
        id: randomUUID(),
        canton: 'BE',
        citation: 'BE-2024-001',
        title: 'Arbeitsrecht Bern',
        language: 'de',
        summary: 'Kantonaler Arbeitsrechtsfall'
      };

      await bgeRepo.create(bgeDecision);
      await cantonalRepo.create(cantonalDecision);

      // Search in both repositories
      const bgeResults = await bgeRepo.search('Arbeitsrecht');
      const cantonalResults = await cantonalRepo.search('Arbeitsrecht');

      expect(bgeResults).toHaveLength(1);
      expect(cantonalResults).toHaveLength(1);

      // Log both searches
      await searchRepo.logQuery({
        id: randomUUID(),
        query_text: 'Arbeitsrecht',
        query_type: 'full-text',
        result_count: bgeResults.length,
        filters: { source: 'bge' },
        execution_time_ms: 30
      });

      await searchRepo.logQuery({
        id: randomUUID(),
        query_text: 'Arbeitsrecht',
        query_type: 'full-text',
        result_count: cantonalResults.length,
        filters: { source: 'cantonal' },
        execution_time_ms: 40
      });

      // Verify popular queries
      const popularQueries = await searchRepo.getPopularQueries(5);
      expect(popularQueries.some(q => q.query === 'Arbeitsrecht')).toBe(true);

      // Cache combined results
      const combinedResults = [...bgeResults, ...cantonalResults];
      await cacheRepo.set('search:Arbeitsrecht:combined', combinedResults, 1800, 'search');

      // Verify combined cache
      const cached = await cacheRepo.get('search:Arbeitsrecht:combined');
      expect(cached).toHaveLength(2);
    });

    test('Cache invalidation on data update', async () => {
      const decisionId = randomUUID();

      // Create decision
      const decision: BGEDecision = {
        id: decisionId,
        citation: 'BGE 147 IV 100',
        title: 'Original Title',
        language: 'de'
      };

      await bgeRepo.create(decision);

      // Cache the decision
      const cacheKey = `decision:${decision.citation}`;
      await cacheRepo.set(cacheKey, decision, 3600, 'decision');

      // Verify cached
      let cached = await cacheRepo.get(cacheKey);
      expect(cached.title).toBe('Original Title');

      // Update decision
      await bgeRepo.update(decisionId, { title: 'Updated Title' });

      // Invalidate cache
      await cacheRepo.delete(cacheKey);

      // Verify cache is empty
      cached = await cacheRepo.get(cacheKey);
      expect(cached).toBeNull();

      // Get fresh data
      const updated = await bgeRepo.findByCitation('BGE 147 IV 100');
      expect(updated?.title).toBe('Updated Title');

      // Re-cache updated data
      await cacheRepo.set(cacheKey, updated, 3600, 'decision');

      cached = await cacheRepo.get(cacheKey);
      expect(cached.title).toBe('Updated Title');
    });
  });

  describe('Concurrent Operations', () => {
    test('Multiple simultaneous inserts', async () => {
      const decisions: BGEDecision[] = [];

      for (let i = 1; i <= 10; i++) {
        decisions.push({
          id: randomUUID(),
          citation: `BGE 150 I ${i}`,
          title: `Concurrent Decision ${i}`,
          language: 'de'
        });
      }

      // Create all decisions in parallel
      await Promise.all(decisions.map(d => bgeRepo.create(d)));

      // Verify all were created
      const count = await bgeRepo.count();
      expect(count).toBe(10);

      // Verify all can be retrieved
      const all = await bgeRepo.findAll(20);
      expect(all).toHaveLength(10);
    });

    test('Concurrent reads and cache hits', async () => {
      // Pre-populate data
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 148 II 50',
        title: 'Concurrent Read Test',
        language: 'de'
      };

      await bgeRepo.create(decision);

      const cacheKey = 'decision:BGE 148 II 50';
      await cacheRepo.set(cacheKey, decision, 3600, 'decision');

      // Perform 10 concurrent reads
      const reads = Array(10).fill(null).map(() => cacheRepo.get(cacheKey));
      const results = await Promise.all(reads);

      // All reads should succeed
      expect(results).toHaveLength(10);
      results.forEach(r => {
        expect(r).not.toBeNull();
        expect(r.citation).toBe('BGE 148 II 50');
      });

      // Verify hit count increased
      const mostAccessed = await cacheRepo.getMostAccessed(1);
      expect(mostAccessed[0].hit_count).toBe(10);
    });
  });

  describe('Data Integrity', () => {
    test('JSON field serialization consistency', async () => {
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 149 I 75',
        title: 'JSON Test',
        language: 'de',
        legal_areas: [
          'Verfassungsrecht',
          'Verwaltungsrecht',
          'Prozessrecht',
          'Grundrechte'
        ]
      };

      await bgeRepo.create(decision);

      const found = await bgeRepo.findByCitation('BGE 149 I 75');
      expect(found?.legal_areas).toEqual(decision.legal_areas);
      expect(Array.isArray(found?.legal_areas)).toBe(true);

      // Update with new array
      await bgeRepo.update(decision.id, {
        legal_areas: ['Verfassungsrecht', 'Grundrechte']
      });

      const updated = await bgeRepo.findByCitation('BGE 149 I 75');
      expect(updated?.legal_areas).toHaveLength(2);
      expect(updated?.legal_areas).toEqual(['Verfassungsrecht', 'Grundrechte']);
    });

    test('Complex filter objects in search queries', async () => {
      const complexFilters = {
        chambers: ['I', 'II', 'IV'],
        date_range: {
          start: '2020-01-01',
          end: '2024-12-31'
        },
        languages: ['de', 'fr'],
        legal_areas: ['Strafrecht', 'Zivilrecht']
      };

      const query: SearchQuery = {
        id: randomUUID(),
        query_text: 'complex filter test',
        query_type: 'full-text',
        filters: complexFilters,
        result_count: 42,
        execution_time_ms: 150
      };

      await searchRepo.logQuery(query);

      const recent = await searchRepo.getRecentQueries(1);
      expect(recent[0].filters).toEqual(complexFilters);
      expect(recent[0].filters.date_range.start).toBe('2020-01-01');
    });

    test('Date range queries with boundary cases', async () => {
      // Create decisions at boundaries
      const decisions: BGEDecision[] = [
        {
          id: randomUUID(),
          citation: 'BGE 147 I 1',
          date: '2021-01-01', // Start boundary
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 I 2',
          date: '2021-06-15', // Middle
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 I 3',
          date: '2021-12-31', // End boundary
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 148 I 1',
          date: '2022-01-01', // Outside range
          language: 'de'
        }
      ];

      for (const d of decisions) {
        await bgeRepo.create(d);
      }

      const results = await bgeRepo.findByDateRange(
        new Date('2021-01-01'),
        new Date('2021-12-31')
      );

      expect(results).toHaveLength(3);
      expect(results.every(r => r.date! >= '2021-01-01' && r.date! <= '2021-12-31')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('Duplicate citation handling', async () => {
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 150 I 999',
        title: 'Duplicate Test',
        language: 'de'
      };

      await bgeRepo.create(decision);

      // Attempt to create duplicate
      const duplicate: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 150 I 999', // Same citation
        title: 'Another Decision',
        language: 'de'
      };

      // SQLite should reject due to unique constraint on citation
      await expect(bgeRepo.create(duplicate)).rejects.toThrow();
    });

    test('Invalid canton code validation', async () => {
      const invalidDecisions = [
        { canton: 'ZUR' }, // 3 letters
        { canton: 'Z' },   // 1 letter
        { canton: 'zh' },  // lowercase
        { canton: '12' },  // numbers
      ];

      for (const invalid of invalidDecisions) {
        const decision: CantonalDecision = {
          id: randomUUID(),
          canton: invalid.canton,
          citation: `${invalid.canton}-2024-001`,
          language: 'de'
        };

        await expect(cantonalRepo.create(decision)).rejects.toThrow('Invalid canton code');
      }
    });

    test('Update with no fields throws error', async () => {
      const id = randomUUID();

      await expect(bgeRepo.update(id, {})).rejects.toThrow('No fields to update');
      await expect(cantonalRepo.update(id, {})).rejects.toThrow('No fields to update');
    });

    test('Cache expiration and cleanup', async () => {
      // Create expired entries
      await cacheRepo.set('expired1', { data: 'test1' }, -1, 'test'); // Already expired
      await cacheRepo.set('expired2', { data: 'test2' }, -1, 'test');
      await cacheRepo.set('valid', { data: 'valid' }, 3600, 'test');

      // Small delay to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 10));

      // Get should return null for expired
      const exp1 = await cacheRepo.get('expired1');
      expect(exp1).toBeNull();

      // Valid should still exist
      const valid = await cacheRepo.get('valid');
      expect(valid).not.toBeNull();

      // Cleanup should remove remaining expired
      const cleaned = await cacheRepo.cleanup();
      expect(cleaned).toBeGreaterThanOrEqual(1); // At least expired2
    });
  });

  describe('Performance Characteristics', () => {
    test('Bulk insert performance', async () => {
      const decisions: BGEDecision[] = [];

      for (let i = 1; i <= 100; i++) {
        decisions.push({
          id: randomUUID(),
          citation: `BGE 150 I ${i}`,
          title: `Performance Test ${i}`,
          language: 'de',
          summary: `Test summary ${i}`
        });
      }

      const startTime = Date.now();

      // Sequential inserts
      for (const d of decisions) {
        await bgeRepo.create(d);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all created
      const count = await bgeRepo.count();
      expect(count).toBe(100);

      // Performance should be reasonable (< 5 seconds for 100 inserts in memory)
      expect(duration).toBeLessThan(5000);
    });

    test('Search performance with multiple results', async () => {
      // Create 50 decisions with common term
      for (let i = 1; i <= 50; i++) {
        await bgeRepo.create({
          id: randomUUID(),
          citation: `BGE 150 ${i % 5 + 1} ${i}`,
          title: `Strafrecht Decision ${i}`,
          language: 'de',
          summary: `Strafrecht summary ${i}`
        });
      }

      const startTime = Date.now();
      const results = await bgeRepo.search('Strafrecht');
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // < 1 second
    });
  });
});
