/* eslint-disable no-console */
/**
 * Performance Benchmarks: Concurrent Operations
 *
 * Tests concurrent access patterns:
 * - Multiple connections reading simultaneously
 * - Write contention and locking behavior
 * - Connection pool efficiency
 *
 * Note: Thresholds are set for WASM-based SQLite (node-sqlite3-wasm)
 * which has ~5-10x overhead compared to native better-sqlite3.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseClient, DatabaseConfig } from '../../database/client';
import { BGERepository } from '../../database/repositories/bge-repository';
import { CacheRepository } from '../../database/repositories/cache-repository';
import { randomUUID } from 'crypto';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

describe('Concurrency Performance Benchmarks', () => {
  let testDbPath: string;

  beforeEach(() => {
    const tempDir = os.tmpdir();
    testDbPath = path.join(tempDir, `benchmark-concurrent-${randomUUID()}.sqlite`);
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Concurrent Read Operations', () => {
    test('Benchmark: 5 connections reading 100 records each', async () => {
      // Setup: Create database with data
      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath
      };

      // Seed data
      {
        const client = new DatabaseClient(config);
        await client.connect();
        await client.migrate();

        const repo = new BGERepository(client);
        for (let i = 1; i <= 100; i++) {
          await repo.create({
            id: randomUUID(),
            citation: `BGE 150 I ${i}`,
            title: `Concurrent Test ${i}`,
            language: 'de',
            date: '2024-01-01'
          });
        }

        await client.close();
      }

      // Test: 5 concurrent connections
      const connections = 5;
      const readsPerConnection = 100;

      const startTime = performance.now();

      const tasks = Array.from({ length: connections }, async () => {
        const client = new DatabaseClient(config);
        await client.connect();
        const repo = new BGERepository(client);

        for (let i = 1; i <= readsPerConnection; i++) {
          await repo.findByCitation(`BGE 150 I ${i}`);
        }

        await client.close();
      });

      await Promise.all(tasks);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalReads = connections * readsPerConnection;
      const perRead = duration / totalReads;

      // eslint-disable-next-line no-console
      console.log(`\n📊 Concurrent Reads (${connections} connections, ${readsPerConnection} reads each):`);
      // eslint-disable-next-line no-console
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      // eslint-disable-next-line no-console
      console.log(`   Total Reads: ${totalReads}`);
      // eslint-disable-next-line no-console
      console.log(`   Per Read: ${perRead.toFixed(2)}ms`);
      // eslint-disable-next-line no-console
      console.log(`   Throughput: ${(1000 / perRead).toFixed(0)} reads/second`);

      expect(duration).toBeLessThan(10000); // 10 seconds for concurrent reads
    }, 30000); // 30 second timeout

    test('Benchmark: 3 connections with mixed read operations', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath
      };

      // Seed data
      {
        const client = new DatabaseClient(config);
        await client.connect();
        await client.migrate();

        const repo = new BGERepository(client);
        for (let i = 1; i <= 200; i++) {
          await repo.create({
            id: randomUUID(),
            citation: `BGE 151 I ${i}`,
            title: `Mixed Read Test ${i}`,
            language: 'de',
            date: `2024-${String((i % 12) + 1).padStart(2, '0')}-01`,
            chamber: ['I', 'II', 'IV'][i % 3]
          });
        }

        await client.close();
      }

      const startTime = performance.now();

      const tasks = [
        // Connection 1: Citation lookups
        (async (): Promise<void> => {
          const client = new DatabaseClient(config);
          await client.connect();
          const repo = new BGERepository(client);

          for (let i = 1; i <= 50; i++) {
            await repo.findByCitation(`BGE 151 I ${i}`);
          }

          await client.close();
        })(),

        // Connection 2: Search queries
        (async (): Promise<void> => {
          const client = new DatabaseClient(config);
          await client.connect();
          const repo = new BGERepository(client);

          for (let i = 0; i < 20; i++) {
            await repo.search('test');
          }

          await client.close();
        })(),

        // Connection 3: Aggregations
        (async (): Promise<void> => {
          const client = new DatabaseClient(config);
          await client.connect();
          const repo = new BGERepository(client);

          for (let i = 0; i < 30; i++) {
            await repo.count();
            await repo.findByChamber('I');
          }

          await client.close();
        })()
      ];

      await Promise.all(tasks);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // eslint-disable-next-line no-console
      console.log(`\n📊 Mixed Concurrent Operations (3 connections):`);
      // eslint-disable-next-line no-console
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      // eslint-disable-next-line no-console
      console.log(`   Conn 1: 50 citation lookups`);
      // eslint-disable-next-line no-console
      console.log(`   Conn 2: 20 search queries`);
      // eslint-disable-next-line no-console
      console.log(`   Conn 3: 30 counts + 30 chamber queries`);

      expect(duration).toBeLessThan(15000);
    }, 30000);
  });

  describe('Sequential vs Parallel Write Performance', () => {
    test('Benchmark: Sequential writes (100 records)', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath
      };

      const client = new DatabaseClient(config);
      await client.connect();
      await client.migrate();
      const repo = new BGERepository(client);

      const startTime = performance.now();

      for (let i = 1; i <= 100; i++) {
        await repo.create({
          id: randomUUID(),
          citation: `BGE 152 I ${i}`,
          title: `Sequential ${i}`,
          language: 'de',
          date: '2024-01-01'
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perWrite = duration / 100;

      console.log(`\n📊 Sequential Writes (100 records):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Write: ${perWrite.toFixed(2)}ms`);
      console.log(`   Throughput: ${(1000 / perWrite).toFixed(0)} writes/second`);

      await client.close();

      expect(duration).toBeLessThan(5000);
    });

    test('Benchmark: Parallel write attempts (measure contention)', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath
      };

      // Initialize database
      {
        const client = new DatabaseClient(config);
        await client.connect();
        await client.migrate();
        await client.close();
      }

      const startTime = performance.now();

      // Attempt concurrent writes (SQLite will serialize these)
      const tasks = Array.from({ length: 3 }, async (_, connIndex) => {
        const client = new DatabaseClient(config);
        await client.connect();
        const repo = new BGERepository(client);

        for (let i = 1; i <= 30; i++) {
          await repo.create({
            id: randomUUID(),
            citation: `BGE-C${connIndex}-${i}`,
            title: `Parallel Write ${connIndex}-${i}`,
            language: 'de',
            date: '2024-01-01'
          });
        }

        await client.close();
      });

      await Promise.all(tasks);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalWrites = 90;
      const perWrite = duration / totalWrites;

      console.log(`\n📊 Parallel Write Attempts (3 connections, 30 writes each):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Total Writes: ${totalWrites}`);
      console.log(`   Per Write: ${perWrite.toFixed(2)}ms`);
      console.log(`   Note: SQLite serializes writes, expect similar to sequential`);

      // Parallel writes may be slower due to lock contention
      expect(duration).toBeLessThan(15000);
    }, 30000);
  });

  describe('Cache Concurrency', () => {
    test('Benchmark: Concurrent cache reads', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath
      };

      // Seed cache
      {
        const client = new DatabaseClient(config);
        await client.connect();
        await client.migrate();

        const cacheRepo = new CacheRepository(client);
        for (let i = 1; i <= 100; i++) {
          await cacheRepo.set(
            `concurrent-key-${i}`,
            { value: `data-${i}` },
            3600,
            'benchmark'
          );
        }

        await client.close();
      }

      const startTime = performance.now();

      // 5 connections reading cache concurrently
      const tasks = Array.from({ length: 5 }, async () => {
        const client = new DatabaseClient(config);
        await client.connect();
        const cacheRepo = new CacheRepository(client);

        for (let i = 1; i <= 100; i++) {
          await cacheRepo.get(`concurrent-key-${i}`);
        }

        await client.close();
      });

      await Promise.all(tasks);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalReads = 500;
      const perRead = duration / totalReads;

      console.log(`\n📊 Concurrent Cache Reads (5 connections, 100 reads each):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Total Reads: ${totalReads}`);
      console.log(`   Per Read: ${perRead.toFixed(2)}ms`);
      console.log(`   Throughput: ${(1000 / perRead).toFixed(0)} reads/second`);

      expect(duration).toBeLessThan(30000); // WASM SQLite has ~5-10x overhead vs native
    }, 30000);
  });

  describe('Connection Lifecycle Performance', () => {
    test('Benchmark: Create and close 50 connections', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath
      };

      // Initialize database
      {
        const client = new DatabaseClient(config);
        await client.connect();
        await client.migrate();
        await client.close();
      }

      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const client = new DatabaseClient(config);
        await client.connect();
        await client.close();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perConnection = duration / 50;

      console.log(`\n📊 Connection Lifecycle (50 connections):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Connection: ${perConnection.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perConnection).toFixed(0)} connections/second`);

      expect(duration).toBeLessThan(5000);
      expect(perConnection).toBeLessThan(100);
    });

    test('Benchmark: Connection with simple operation (50 iterations)', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath
      };

      // Seed one record
      {
        const client = new DatabaseClient(config);
        await client.connect();
        await client.migrate();

        const repo = new BGERepository(client);
        await repo.create({
          id: randomUUID(),
          citation: 'BGE 999 I 1',
          title: 'Connection Test',
          language: 'de',
          date: '2024-01-01'
        });

        await client.close();
      }

      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const client = new DatabaseClient(config);
        await client.connect();
        const repo = new BGERepository(client);
        await repo.findByCitation('BGE 999 I 1');
        await client.close();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const perOperation = duration / 50;

      console.log(`\n📊 Connect -> Query -> Close (50 iterations):`);
      console.log(`   Total Time: ${duration.toFixed(2)}ms`);
      console.log(`   Per Operation: ${perOperation.toFixed(2)}ms`);
      console.log(`   Rate: ${(1000 / perOperation).toFixed(0)} ops/second`);

      expect(duration).toBeLessThan(5000);
    });
  });
});
