/* eslint-disable no-console */
/**
 * Performance Benchmarks: Query Operations
 *
 * Tests query performance across different scenarios:
 * - Simple lookups (by ID, citation)
 * - Complex searches (full-text, date ranges)
 * - Aggregations (counts, analytics)
 * - Cache hit rates and lookup times
 *
 * Note: Thresholds are set for WASM-based SQLite (node-sqlite3-wasm)
 * which has ~5-10x overhead compared to native better-sqlite3.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseClient, DatabaseConfig } from '../../database/client';
import { BGERepository } from '../../database/repositories/bge-repository';
import { CantonalRepository } from '../../database/repositories/cantonal-repository';
import { CacheRepository } from '../../database/repositories/cache-repository';
import { SearchRepository } from '../../database/repositories/search-repository';
import { randomUUID } from 'crypto';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('Query Performance Benchmarks', () => {
  let testDbPath: string;
  let client: DatabaseClient;
  let bgeRepo: BGERepository;
  let cantonalRepo: CantonalRepository;
  let cacheRepo: CacheRepository;
  let searchRepo: SearchRepository;

  beforeAll(async () => {
    const tempDir = os.tmpdir();
    testDbPath = path.join(tempDir, `benchmark-query-${randomUUID()}.sqlite`);

    const config: DatabaseConfig = {
      type: 'sqlite',
      filename: testDbPath
    };

    client = new DatabaseClient(config);
    await client.connect();
    await client.migrate();

    bgeRepo = new BGERepository(client);
    cantonalRepo = new CantonalRepository(client);
    cacheRepo = new CacheRepository(client);
    searchRepo = new SearchRepository(client);

    // Seed database with test data
    console.log('\n⏳ Seeding database for query benchmarks...');
    await seedDatabase();
    console.log('✅ Database seeded');
  }, 120000); // 2 minute timeout for seeding

  afterAll(async () => {
    await client.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  async function seedDatabase(): Promise<void> {
    // Insert 1000 BGE decisions
    for (let i = 1; i <= 1000; i++) {
      await bgeRepo.create({
        id: randomUUID(),
        citation: `BGE 150 I ${i}`,
        title: `Test Decision ${i}`,
        language: i % 3 === 0 ? 'fr' : i % 3 === 1 ? 'de' : 'it',
        date: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
        chamber: ['I', 'II', 'IV'][i % 3],
        summary: `This is a test summary for benchmark testing. Decision number ${i}. Legal areas include civil law, contract law, and liability.`
      });
    }

    // Insert 500 cantonal decisions
    const cantons = ['ZH', 'BE', 'GE', 'VD', 'AG', 'LU', 'SG', 'TI'];
    for (let i = 1; i <= 500; i++) {
      await cantonalRepo.create({
        id: randomUUID(),
        citation: `${cantons[i % cantons.length]}-2024-${i}`,
        canton: cantons[i % cantons.length],
        title: `Cantonal Decision ${i}`,
        language: i % 2 === 0 ? 'de' : 'fr',
        date: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`
      });
    }

    // Insert 200 cache entries
    for (let i = 1; i <= 200; i++) {
      await cacheRepo.set(
        `cache-key-${i}`,
        { data: `value-${i}`, metadata: { index: i } },
        3600,
        'benchmark'
      );
    }

    // Insert 100 search queries
    for (let i = 1; i <= 100; i++) {
      await searchRepo.logQuery({
        id: randomUUID(),
        query_text: `search term ${i}`,
        query_type: ['full-text', 'citation', 'semantic'][i % 3],
        filters: { chamber: 'I' },
        result_count: Math.floor(Math.random() * 50),
        execution_time_ms: Math.floor(Math.random() * 1000)
      });
    }
  }

  describe('Simple Lookups', () => {
    test('Benchmark: 100 findByCitation lookups', async () => {
      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        await bgeRepo.findByCitation(`BGE 150 I ${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perLookup = duration / 100;

      console.log(`\n📊 Citation Lookups (100 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Lookup: ${perLookup.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perLookup).toFixed(0)} lookups/second`);

      expect(duration).toBeLessThan(10000); // WASM SQLite has ~5x overhead
      expect(perLookup).toBeLessThan(100); // WASM overhead per lookup
    });

    test('Benchmark: 100 cache get operations', async () => {
      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        await cacheRepo.get(`cache-key-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perGet = duration / 100;

      console.log(`\n📊 Cache Lookups (100 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Lookup: ${perGet.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perGet).toFixed(0)} lookups/second`);

      expect(duration).toBeLessThan(5000); // WASM SQLite has ~5x overhead
      expect(perGet).toBeLessThan(50); // WASM overhead per get
    });
  });

  describe('Complex Searches', () => {
    test('Benchmark: 50 full-text search queries', async () => {
      const searchTerms = ['contract', 'liability', 'civil', 'law', 'summary'];
      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const term = searchTerms[i % searchTerms.length];
        await bgeRepo.search(term);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perSearch = duration / 50;

      console.log(`\n📊 Full-Text Search (50 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Search: ${perSearch.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perSearch).toFixed(0)} searches/second`);

      expect(duration).toBeLessThan(50000); // WASM SQLite has ~5x overhead
    });

    test('Benchmark: 50 date range queries', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const month = (i % 12) + 1;
        const startDate = `2024-${String(month).padStart(2, '0')}-01`;
        const endDate = `2024-${String(month).padStart(2, '0')}-28`;
        await bgeRepo.findByDateRange(new Date(startDate), new Date(endDate));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perQuery = duration / 50;

      console.log(`\n📊 Date Range Queries (50 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Query: ${perQuery.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perQuery).toFixed(0)} queries/second`);

      expect(duration).toBeLessThan(25000); // WASM SQLite has ~5x overhead
    });

    test('Benchmark: 50 chamber filter queries', async () => {
      const chambers = ['I', 'II', 'IV'];
      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const chamber = chambers[i % chambers.length];
        await bgeRepo.findByChamber(chamber);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perQuery = duration / 50;

      console.log(`\n📊 Chamber Filter Queries (50 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Query: ${perQuery.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perQuery).toFixed(0)} queries/second`);

      expect(duration).toBeLessThan(25000); // WASM SQLite has ~5x overhead
    });
  });

  describe('Aggregation Operations', () => {
    test('Benchmark: 100 count operations', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await bgeRepo.count();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perCount = duration / 100;

      console.log(`\n📊 Count Operations (100 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Count: ${perCount.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perCount).toFixed(0)} counts/second`);

      expect(duration).toBeLessThan(10000); // WASM SQLite has ~5x overhead
    });

    test('Benchmark: 50 canton count operations', async () => {
      const cantons = ['ZH', 'BE', 'GE', 'VD', 'AG'];
      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const canton = cantons[i % cantons.length];
        await cantonalRepo.countByCanton(canton);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perCount = duration / 50;

      console.log(`\n📊 Canton Count Operations (50 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Count: ${perCount.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perCount).toFixed(0)} counts/second`);

      expect(duration).toBeLessThan(10000); // WASM SQLite has ~5x overhead
    });

    test('Benchmark: Search analytics generation', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        await searchRepo.getAnalytics(30);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perAnalytics = duration / 10;

      console.log(`\n📊 Analytics Generation (10 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Analytics: ${perAnalytics.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perAnalytics).toFixed(0)} analytics/second`);

      expect(duration).toBeLessThan(15000); // WASM SQLite has ~5x overhead
    });
  });

  describe('Cache Performance', () => {
    test('Benchmark: Cache hit rate test', async () => {
      // Measure cache hits vs misses
      let hits = 0;
      let misses = 0;
      const totalQueries = 200;

      const startTime = performance.now();

      for (let i = 1; i <= totalQueries; i++) {
        const key = `cache-key-${i}`;
        const result = await cacheRepo.get(key);

        if (result !== null) {
          hits++;
        } else {
          misses++;
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const hitRate = (hits / totalQueries) * 100;

      console.log(`\n📊 Cache Performance (${totalQueries} queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Hits: ${hits} (${hitRate.toFixed(1)}%)`);
      console.log(`   Misses: ${misses}`);
      console.log(`   Avg Query Time: ${(duration / totalQueries).toFixed(2)}ms`);

      expect(hitRate).toBeGreaterThan(90); // Expect >90% hit rate
      expect(duration).toBeLessThan(10000); // WASM SQLite has ~5x overhead
    });

    test('Benchmark: Cache statistics query', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 20; i++) {
        await cacheRepo.getStats();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perQuery = duration / 20;

      console.log(`\n📊 Cache Stats Queries (20 queries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Query: ${perQuery.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perQuery).toFixed(0)} queries/second`);

      expect(duration).toBeLessThan(5000); // WASM SQLite has ~5x overhead
    });
  });

  describe('Mixed Query Workload', () => {
    test('Benchmark: 100 mixed query operations', async () => {
      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        // Mix of different query types
        if (i % 4 === 0) {
          await bgeRepo.findByCitation(`BGE 150 I ${i}`);
        } else if (i % 4 === 1) {
          await bgeRepo.search('contract');
        } else if (i % 4 === 2) {
          await cacheRepo.get(`cache-key-${i}`);
        } else {
          await bgeRepo.count();
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perOp = duration / 100;

      console.log(`\n📊 Mixed Queries (100 operations):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Operation: ${perOp.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perOp).toFixed(0)} ops/second`);

      expect(duration).toBeLessThan(50000); // WASM SQLite has ~5x overhead
    });
  });
});
