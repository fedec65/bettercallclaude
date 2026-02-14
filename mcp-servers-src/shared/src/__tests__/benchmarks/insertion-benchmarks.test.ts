/* eslint-disable no-console */
/**
 * Performance Benchmarks: Insertion Operations
 *
 * Tests insertion performance across different scenarios:
 * - Bulk inserts (100, 1000, 10000 records)
 * - Individual inserts with transaction overhead
 * - Cache write performance
 *
 * Note: Thresholds are set for WASM-based SQLite (node-sqlite3-wasm)
 * which has ~5-10x overhead compared to native better-sqlite3.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseClient, DatabaseConfig } from '../../database/client';
import { BGERepository } from '../../database/repositories/bge-repository';
import { CantonalRepository } from '../../database/repositories/cantonal-repository';
import { CacheRepository } from '../../database/repositories/cache-repository';
import { randomUUID } from 'crypto';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('Insertion Performance Benchmarks', () => {
  let testDbPath: string;
  let client: DatabaseClient;
  let bgeRepo: BGERepository;
  let cantonalRepo: CantonalRepository;
  let cacheRepo: CacheRepository;

  beforeAll(async () => {
    // Use file-based database for realistic benchmarking
    const tempDir = os.tmpdir();
    testDbPath = path.join(tempDir, `benchmark-db-${randomUUID()}.sqlite`);

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
  });

  afterAll(async () => {
    await client.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('BGE Decision Bulk Inserts', () => {
    test('Benchmark: Insert 100 BGE decisions', async () => {
      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        await bgeRepo.create({
          id: randomUUID(),
          citation: `BGE 150 I ${i}`,
          title: `Benchmark Decision ${i}`,
          language: 'de',
          date: '2024-01-01',
          chamber: 'I',
          summary: `Performance test summary for decision ${i}`
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perRecord = duration / 100;

      console.log(`\n📊 Bulk Insert (100 records):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Record: ${perRecord.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perRecord).toFixed(0)} records/second`);

      // Performance assertions (realistic for WASM SQLite)
      expect(duration).toBeLessThan(30000); // WASM SQLite has ~5-10x overhead vs native
      expect(perRecord).toBeLessThan(300); // WASM overhead per record
    });

    test('Benchmark: Insert 1000 BGE decisions', async () => {
      const startTime = performance.now();

      for (let i = 1; i <= 1000; i++) {
        await bgeRepo.create({
          id: randomUUID(),
          citation: `BGE 151 I ${i}`,
          title: `Large Benchmark ${i}`,
          language: 'de',
          date: '2024-01-01',
          chamber: 'I'
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perRecord = duration / 1000;

      console.log(`\n📊 Bulk Insert (1000 records):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Record: ${perRecord.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perRecord).toFixed(0)} records/second`);

      expect(duration).toBeLessThan(50000); // 50 seconds max for 1000 records
    }, 60000); // 60 second timeout
  });

  describe('Cantonal Decision Inserts', () => {
    test('Benchmark: Insert 100 cantonal decisions', async () => {
      const cantons = ['ZH', 'BE', 'GE', 'VD', 'AG'];
      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        const canton = cantons[i % cantons.length];
        await cantonalRepo.create({
          id: randomUUID(),
          citation: `${canton}-2024-${i}`,
          canton: canton,
          title: `Cantonal Decision ${i}`,
          language: 'de',
          date: '2024-01-01'
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perRecord = duration / 100;

      console.log(`\n📊 Cantonal Insert (100 records):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Record: ${perRecord.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perRecord).toFixed(0)} records/second`);

      expect(duration).toBeLessThan(30000); // WASM SQLite overhead
    });
  });

  describe('Cache Write Performance', () => {
    test('Benchmark: 100 cache writes (small data)', async () => {
      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        await cacheRepo.set(
          `benchmark-key-${i}`,
          { value: `data-${i}` },
          3600,
          'benchmark'
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perWrite = duration / 100;

      console.log(`\n📊 Cache Writes (100 small entries):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Write: ${perWrite.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perWrite).toFixed(0)} writes/second`);

      expect(duration).toBeLessThan(15000); // WASM SQLite overhead
    });

    test('Benchmark: 100 cache writes (large JSON)', async () => {
      // Create a realistic large JSON object (~50KB)
      const largeObject = {
        decisions: Array(50).fill(null).map((_, i) => ({
          id: randomUUID(),
          citation: `BGE 150 I ${i}`,
          title: `Decision ${i}`,
          summary: 'A'.repeat(1000) // 1KB summary per decision
        }))
      };

      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        await cacheRepo.set(
          `benchmark-large-${i}`,
          largeObject,
          3600,
          'benchmark'
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perWrite = duration / 100;

      console.log(`\n📊 Cache Writes (100 large JSON ~50KB):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Write: ${perWrite.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perWrite).toFixed(0)} writes/second`);

      expect(duration).toBeLessThan(60000); // WASM SQLite + large objects
    });
  });

  describe('Mixed Insert Operations', () => {
    test('Benchmark: 100 mixed repository inserts', async () => {
      const startTime = performance.now();
      const uniqueSuffix = Date.now(); // Ensure complete uniqueness

      let bgeCounter = 1;
      let cantonalCounter = 1;
      let cacheCounter = 1;

      for (let i = 1; i <= 100; i++) {
        // Mix of different repository types
        if (i % 3 === 0) {
          await bgeRepo.create({
            id: randomUUID(),
            citation: `BGE 152 I ${uniqueSuffix}-${bgeCounter++}`,
            title: `Mixed ${i}`,
            language: 'de',
            date: '2024-01-01'
          });
        } else if (i % 3 === 1) {
          await cantonalRepo.create({
            id: randomUUID(),
            citation: `MX-${uniqueSuffix}-${cantonalCounter++}`,
            canton: 'BE',
            title: `Mixed ${i}`,
            language: 'de',
            date: '2024-01-01'
          });
        } else {
          await cacheRepo.set(
            `mixed-${uniqueSuffix}-${cacheCounter++}`,
            { data: `value-${i}` },
            3600,
            'mixed'
          );
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perOp = duration / 100;

      console.log(`\n📊 Mixed Inserts (100 operations):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Operation: ${perOp.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perOp).toFixed(0)} ops/second`);

      expect(duration).toBeLessThan(30000); // WASM SQLite overhead
    });
  });

  describe('Insert with JSON Fields', () => {
    test('Benchmark: Insert 100 decisions with legal_areas', async () => {
      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        await bgeRepo.create({
          id: randomUUID(),
          citation: `BGE 153 I ${i}`,
          title: `JSON Benchmark ${i}`,
          language: 'de',
          date: '2024-01-01',
          legal_areas: [
            'Zivilrecht',
            'Vertragsrecht',
            'Schadenersatz',
            'Haftpflicht'
          ]
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perRecord = duration / 100;

      console.log(`\n📊 Insert with JSON Fields (100 records):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Record: ${perRecord.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perRecord).toFixed(0)} records/second`);

      expect(duration).toBeLessThan(30000); // WASM SQLite overhead
    });
  });
});
