/**
 * Database Client Tests
 * Tests for unified PostgreSQL and SQLite database client
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseClient, createDatabaseClient, DatabaseConfig } from '../../database/client';
import { randomUUID } from 'crypto';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('DatabaseClient', () => {
  describe('SQLite Connection', () => {
    let client: DatabaseClient;
    const testDbPath = join(__dirname, 'test.db');

    beforeEach(async () => {
      // Clean up test database if exists
      if (existsSync(testDbPath)) {
        unlinkSync(testDbPath);
      }

      const config: DatabaseConfig = {
        type: 'sqlite',
        filename: testDbPath,
        memory: false
      };
      client = new DatabaseClient(config);
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
      if (existsSync(testDbPath)) {
        unlinkSync(testDbPath);
      }
    });

    test('should connect to SQLite database', async () => {
      expect(client).toBeDefined();
    });

    test('should create table and insert data', async () => {
      await client.query(`
        CREATE TABLE test_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL
        )
      `);

      const id = randomUUID();
      await client.query(
        `INSERT INTO test_users (id, name, email) VALUES (?, ?, ?)`,
        { values: [id, 'John Doe', 'john@example.com'] }
      );

      const users = await client.query<{ id: string; name: string; email: string }>(
        `SELECT * FROM test_users WHERE id = ?`,
        { values: [id] }
      );

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('John Doe');
      expect(users[0].email).toBe('john@example.com');
    });

    test('should return single result with queryOne', async () => {
      await client.query(`
        CREATE TABLE test_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      const id = randomUUID();
      await client.query(
        `INSERT INTO test_users (id, name) VALUES (?, ?)`,
        { values: [id, 'Jane Doe'] }
      );

      const user = await client.queryOne<{ id: string; name: string }>(
        `SELECT * FROM test_users WHERE id = ?`,
        { values: [id] }
      );

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Jane Doe');
    });

    test('should return null when no results with queryOne', async () => {
      await client.query(`
        CREATE TABLE test_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      const user = await client.queryOne(
        `SELECT * FROM test_users WHERE id = ?`,
        { values: ['non-existent-id'] }
      );

      expect(user).toBeNull();
    });

    test('should handle transactions with commit', async () => {
      await client.query(`
        CREATE TABLE test_accounts (
          id TEXT PRIMARY KEY,
          balance INTEGER NOT NULL
        )
      `);

      await client.transaction(async (txClient) => {
        const id1 = randomUUID();
        const id2 = randomUUID();

        await txClient.query(
          `INSERT INTO test_accounts (id, balance) VALUES (?, ?)`,
          { values: [id1, 100] }
        );
        await txClient.query(
          `INSERT INTO test_accounts (id, balance) VALUES (?, ?)`,
          { values: [id2, 50] }
        );
      });

      const accounts = await client.query(`SELECT * FROM test_accounts`);
      expect(accounts).toHaveLength(2);
    });

    test('should handle transactions with rollback on error', async () => {
      await client.query(`
        CREATE TABLE test_accounts (
          id TEXT PRIMARY KEY,
          balance INTEGER NOT NULL
        )
      `);

      try {
        await client.transaction(async (txClient) => {
          const id = randomUUID();
          await txClient.query(
            `INSERT INTO test_accounts (id, balance) VALUES (?, ?)`,
            { values: [id, 100] }
          );
          throw new Error('Intentional error');
        });
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Intentional error');
      }

      const accounts = await client.query(`SELECT * FROM test_accounts`);
      expect(accounts).toHaveLength(0);
    });

    test('should run migrations', async () => {
      await client.migrate();

      // Check that migrations table exists
      const tables = await client.query(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='schema_migrations'
      `);
      expect(tables).toHaveLength(1);

      // Check that migration was recorded
      const migrations = await client.query(`SELECT * FROM schema_migrations`);
      expect(migrations.length).toBeGreaterThan(0);
    });

    test('should generate UUID', () => {
      const id = client.generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('SQLite In-Memory Connection', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should connect to in-memory SQLite database', async () => {
      expect(client).toBeDefined();
    });

    test('should create and query in-memory table', async () => {
      await client.query(`
        CREATE TABLE test_data (
          id TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      const id = randomUUID();
      await client.query(
        `INSERT INTO test_data (id, value) VALUES (?, ?)`,
        { values: [id, 'test value'] }
      );

      const rows = await client.query(
        `SELECT * FROM test_data WHERE id = ?`,
        { values: [id] }
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].value).toBe('test value');
    });
  });

  describe('Connection Lifecycle', () => {
    test('should handle multiple connections and closures', async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };

      const client1 = new DatabaseClient(config);
      await client1.connect();
      await client1.close();

      const client2 = new DatabaseClient(config);
      await client2.connect();
      await client2.close();

      expect(true).toBe(true); // Should not throw errors
    });
  });

  describe('createDatabaseClient Factory', () => {
    let client: DatabaseClient;

    afterEach(async () => {
      if (client) {
        await client.close();
      }
    });

    test('should create SQLite client from environment', () => {
      const originalEnv = process.env.DATABASE_TYPE;
      process.env.DATABASE_TYPE = 'sqlite';

      client = createDatabaseClient();

      expect(client).toBeDefined();

      process.env.DATABASE_TYPE = originalEnv;
    });

    test('should create client with custom config', () => {
      client = createDatabaseClient({
        type: 'sqlite',
        memory: true
      });

      expect(client).toBeDefined();
    });

    test('should default to SQLite in test environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      client = createDatabaseClient();

      expect(client).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handling', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should throw error on invalid SQL', async () => {
      await expect(
        client.query('INVALID SQL STATEMENT')
      ).rejects.toThrow();
    });

    test('should throw error on constraint violation', async () => {
      await client.query(`
        CREATE TABLE test_unique (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL
        )
      `);

      const id1 = randomUUID();
      const id2 = randomUUID();
      const email = 'duplicate@example.com';

      await client.query(
        `INSERT INTO test_unique (id, email) VALUES (?, ?)`,
        { values: [id1, email] }
      );

      await expect(
        client.query(
          `INSERT INTO test_unique (id, email) VALUES (?, ?)`,
          { values: [id2, email] }
        )
      ).rejects.toThrow();
    });
  });

  describe('BGE Decisions Schema', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
      await client.migrate();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should insert and query BGE decision', async () => {
      const id = randomUUID();
      const citation = 'BGE 147 IV 73';

      await client.query(
        `INSERT INTO bge_decisions (id, citation, volume, chamber, page, title, date, language)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          values: [
            id,
            citation,
            '147',
            'IV',
            '73',
            'Strafrecht Test',
            '2021-01-15',
            'de'
          ]
        }
      );

      const decision = await client.queryOne(
        `SELECT * FROM bge_decisions WHERE citation = ?`,
        { values: [citation] }
      );

      expect(decision).not.toBeNull();
      expect(decision?.citation).toBe(citation);
      expect(decision?.volume).toBe('147');
      expect(decision?.chamber).toBe('IV');
      expect(decision?.language).toBe('de');
    });

    test('should enforce unique citation constraint', async () => {
      const citation = 'BGE 148 II 123';

      await client.query(
        `INSERT INTO bge_decisions (id, citation, volume, chamber, page, language)
         VALUES (?, ?, ?, ?, ?, ?)`,
        { values: [randomUUID(), citation, '148', 'II', '123', 'de'] }
      );

      await expect(
        client.query(
          `INSERT INTO bge_decisions (id, citation, volume, chamber, page, language)
           VALUES (?, ?, ?, ?, ?, ?)`,
          { values: [randomUUID(), citation, '148', 'II', '123', 'de'] }
        )
      ).rejects.toThrow();
    });

    test('should validate language constraint', async () => {
      await expect(
        client.query(
          `INSERT INTO bge_decisions (id, citation, volume, chamber, page, language)
           VALUES (?, ?, ?, ?, ?, ?)`,
          { values: [randomUUID(), 'BGE 149 I 1', '149', 'I', '1', 'invalid'] }
        )
      ).rejects.toThrow();
    });
  });

  describe('Cantonal Decisions Schema', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
      await client.migrate();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should insert and query cantonal decision', async () => {
      const id = randomUUID();
      const citation = 'ZH-2024-001';

      await client.query(
        `INSERT INTO cantonal_decisions (id, canton, citation, court_name, decision_number, language)
         VALUES (?, ?, ?, ?, ?, ?)`,
        {
          values: [
            id,
            'ZH',
            citation,
            'Obergericht Zürich',
            '2024-001',
            'de'
          ]
        }
      );

      const decision = await client.queryOne(
        `SELECT * FROM cantonal_decisions WHERE citation = ?`,
        { values: [citation] }
      );

      expect(decision).not.toBeNull();
      expect(decision?.canton).toBe('ZH');
      expect(decision?.citation).toBe(citation);
    });

    test('should enforce canton format constraint', async () => {
      // This test verifies canton code validation (2-letter uppercase)
      // SQLite CHECK constraints throw on invalid data
      await expect(
        client.query(
          `INSERT INTO cantonal_decisions (id, canton, citation, language)
           VALUES (?, ?, ?, ?)`,
          { values: [randomUUID(), 'ZUR', 'ZH-2024-001', 'de'] }
        )
      ).rejects.toThrow();
    });
  });

  describe('Search Queries Schema', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
      await client.migrate();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should log search query', async () => {
      const id = randomUUID();

      await client.query(
        `INSERT INTO search_queries (id, query_text, query_type, result_count, execution_time_ms)
         VALUES (?, ?, ?, ?, ?)`,
        { values: [id, 'Strafrecht', 'full-text', 15, 250] }
      );

      const query = await client.queryOne(
        `SELECT * FROM search_queries WHERE id = ?`,
        { values: [id] }
      );

      expect(query).not.toBeNull();
      expect(query?.query_text).toBe('Strafrecht');
      expect(query?.result_count).toBe(15);
    });
  });

  describe('API Cache Schema', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
      await client.migrate();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should store and retrieve cached data', async () => {
      const id = randomUUID();
      const cacheKey = 'api:bge:147-IV-73';
      const data = JSON.stringify({ title: 'Test Decision', summary: 'Test Summary' });
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      await client.query(
        `INSERT INTO api_cache (id, cache_key, cache_type, data, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        { values: [id, cacheKey, 'bge_decision', data, expiresAt] }
      );

      const cached = await client.queryOne(
        `SELECT * FROM api_cache WHERE cache_key = ?`,
        { values: [cacheKey] }
      );

      expect(cached).not.toBeNull();
      expect(cached?.cache_key).toBe(cacheKey);
      expect(JSON.parse(cached?.data)).toEqual({ title: 'Test Decision', summary: 'Test Summary' });
    });

    test('should enforce unique cache key constraint', async () => {
      const cacheKey = 'api:test:unique';
      const data = JSON.stringify({ test: 'data' });
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      await client.query(
        `INSERT INTO api_cache (id, cache_key, cache_type, data, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        { values: [randomUUID(), cacheKey, 'test', data, expiresAt] }
      );

      await expect(
        client.query(
          `INSERT INTO api_cache (id, cache_key, cache_type, data, expires_at)
           VALUES (?, ?, ?, ?, ?)`,
          { values: [randomUUID(), cacheKey, 'test', data, expiresAt] }
        )
      ).rejects.toThrow();
    });
  });

  describe('Pool Stats', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should return null for SQLite', () => {
      const stats = client.getPoolStats();
      expect(stats).toBeNull();
    });
  });

  describe('Additional Edge Cases', () => {
    let client: DatabaseClient;

    beforeEach(async () => {
      const config: DatabaseConfig = {
        type: 'sqlite',
        memory: true
      };
      client = new DatabaseClient(config);
      await client.connect();
    });

    afterEach(async () => {
      await client.close();
    });

    test('should handle empty query results', async () => {
      await client.query(`CREATE TABLE empty_test (id TEXT PRIMARY KEY)`);
      const results = await client.query(`SELECT * FROM empty_test`);
      expect(results).toHaveLength(0);
    });

    test('should handle UPDATE queries', async () => {
      await client.query(`CREATE TABLE update_test (id TEXT PRIMARY KEY, value TEXT)`);
      const id = randomUUID();

      await client.query(
        `INSERT INTO update_test (id, value) VALUES (?, ?)`,
        { values: [id, 'original'] }
      );

      await client.query(
        `UPDATE update_test SET value = ? WHERE id = ?`,
        { values: ['updated', id] }
      );

      const result = await client.queryOne(
        `SELECT * FROM update_test WHERE id = ?`,
        { values: [id] }
      );

      expect(result?.value).toBe('updated');
    });

    test('should handle DELETE queries', async () => {
      await client.query(`CREATE TABLE delete_test (id TEXT PRIMARY KEY)`);
      const id = randomUUID();

      await client.query(
        `INSERT INTO delete_test (id) VALUES (?)`,
        { values: [id] }
      );

      await client.query(
        `DELETE FROM delete_test WHERE id = ?`,
        { values: [id] }
      );

      const result = await client.queryOne(
        `SELECT * FROM delete_test WHERE id = ?`,
        { values: [id] }
      );

      expect(result).toBeNull();
    });

    test('should handle nested transactions', async () => {
      await client.query(`CREATE TABLE nested_test (id TEXT PRIMARY KEY, value INTEGER)`);

      await client.transaction(async (tx) => {
        const id1 = randomUUID();
        await tx.query(
          `INSERT INTO nested_test (id, value) VALUES (?, ?)`,
          { values: [id1, 100] }
        );

        // SQLite doesn't support true nested transactions, but we can test the flow
        const result = await tx.queryOne(
          `SELECT * FROM nested_test WHERE id = ?`,
          { values: [id1] }
        );

        expect(result?.value).toBe(100);
      });

      const allResults = await client.query(`SELECT * FROM nested_test`);
      expect(allResults).toHaveLength(1);
    });

    test('should generate multiple unique UUIDs', () => {
      const id1 = client.generateId();
      const id2 = client.generateId();
      const id3 = client.generateId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });
});
