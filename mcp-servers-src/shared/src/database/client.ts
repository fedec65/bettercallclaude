/**
 * Database Client for BetterCallClaude v2.0
 * Supports PostgreSQL (production) and SQLite via WASM (development)
 *
 * Uses node-sqlite3-wasm for cross-platform compatibility without native compilation.
 * This enables support for Node.js 18-24+ without requiring C++ build tools.
 */

import { Pool, PoolConfig, QueryResult } from 'pg';
import { Database } from 'node-sqlite3-wasm';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

export type DatabaseType = 'postgres' | 'sqlite';

export interface DatabaseConfig {
  type: DatabaseType;

  // PostgreSQL config
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;

  // SQLite config
  filename?: string;

  // Connection pooling
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;

  // Development mode
  memory?: boolean;
}

export interface QueryOptions {
  values?: unknown[];
  timeout?: number;
}

/**
 * Unified database client supporting PostgreSQL and SQLite (WASM)
 */
export class DatabaseClient {
  private config: DatabaseConfig;
  private pgPool?: Pool;
  private sqliteDb?: Database;
  private type: DatabaseType;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.type = config.type;
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    if (this.type === 'postgres') {
      await this.connectPostgres();
    } else {
      await this.connectSQLite();
    }
  }

  /**
   * Connect to PostgreSQL with connection pooling
   */
  private async connectPostgres(): Promise<void> {
    const poolConfig: PoolConfig = {
      host: this.config.host || 'localhost',
      port: this.config.port || 5432,
      database: this.config.database || 'bettercallclaude',
      user: this.config.user || 'postgres',
      password: this.config.password,
      max: this.config.max || 20,
      min: this.config.min || 2,
      idleTimeoutMillis: this.config.idleTimeoutMillis || 30000
    };

    this.pgPool = new Pool(poolConfig);

    // Test connection
    try {
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error}`);
    }
  }

  /**
   * Connect to SQLite via WASM (file-based or in-memory)
   * Uses node-sqlite3-wasm for cross-platform compatibility without native compilation
   */
  private async connectSQLite(): Promise<void> {
    try {
      if (this.config.memory) {
        // In-memory database for testing
        this.sqliteDb = new Database(':memory:');
      } else {
        const filename = this.config.filename || join(process.cwd(), 'data', 'bettercallclaude.db');

        // Ensure directory exists
        const dir = dirname(filename);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        this.sqliteDb = new Database(filename);
      }

      // Enable WAL mode for better concurrency (node-sqlite3-wasm uses exec for pragma)
      this.sqliteDb.exec('PRAGMA journal_mode = WAL');
      // Foreign keys are enabled by default in node-sqlite3-wasm

    } catch (error) {
      throw new Error(`Failed to connect to SQLite: ${error}`);
    }
  }

  /**
   * Execute a query
   */
  async query<T = unknown>(sql: string, options?: QueryOptions): Promise<T[]> {
    if (this.type === 'postgres') {
      return this.queryPostgres<T>(sql, options);
    } else {
      return this.querySQLite<T>(sql, options);
    }
  }

  /**
   * Execute PostgreSQL query
   */
  private async queryPostgres<T>(sql: string, options?: QueryOptions): Promise<T[]> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not connected');
    }

    try {
      const result: QueryResult = await this.pgPool.query(sql, options?.values);
      return result.rows as T[];
    } catch (error) {
      throw new Error(`PostgreSQL query failed: ${error}`);
    }
  }

  /**
   * Execute SQLite query using node-sqlite3-wasm
   *
   * Note: node-sqlite3-wasm API differs from better-sqlite3:
   * - Uses db.all() for SELECT queries (returns array)
   * - Uses db.run() for INSERT/UPDATE/DELETE (returns { changes, lastInsertRowid })
   */
  private querySQLite<T>(sql: string, options?: QueryOptions): T[] {
    if (!this.sqliteDb) {
      throw new Error('SQLite not connected');
    }

    try {
      // Cast to JSValue[] for node-sqlite3-wasm compatibility
      // JSValue = boolean | number | bigint | string | Uint8Array | null
      const params = (options?.values || []) as (boolean | number | bigint | string | Uint8Array | null)[];

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        // For SELECT queries, use all() which returns array of rows
        return this.sqliteDb.all(sql, params) as T[];
      } else {
        // For INSERT/UPDATE/DELETE, use run()
        this.sqliteDb.run(sql, params);
        return [];
      }
    } catch (error) {
      throw new Error(`SQLite query failed: ${error}`);
    }
  }

  /**
   * Execute a single query and return first result
   */
  async queryOne<T = unknown>(sql: string, options?: QueryOptions): Promise<T | null> {
    const results = await this.query<T>(sql, options);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (this.type === 'postgres') {
      return this.transactionPostgres(callback);
    } else {
      return this.transactionSQLite(callback);
    }
  }

  /**
   * PostgreSQL transaction
   */
  private async transactionPostgres<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not connected');
    }

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(this);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * SQLite transaction using node-sqlite3-wasm
   */
  private async transactionSQLite<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (!this.sqliteDb) {
      throw new Error('SQLite not connected');
    }

    try {
      this.sqliteDb.exec('BEGIN TRANSACTION');
      const result = await callback(this);
      this.sqliteDb.exec('COMMIT');
      return result;
    } catch (error) {
      // Check if we're in a transaction before rolling back
      if (this.sqliteDb.inTransaction) {
        this.sqliteDb.exec('ROLLBACK');
      }
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    // Always resolve from project root for reliability
    const databaseDir = join(process.cwd(), 'database');

    const schemaFile = this.type === 'postgres'
      ? join(databaseDir, 'schema.sql')
      : join(databaseDir, 'schema.sqlite.sql');

    let schema: string;
    try {
      schema = readFileSync(schemaFile, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read schema file at ${schemaFile}: ${error}`);
    }

    // Remove standalone comment lines before splitting
    const cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--') || line.includes('--') && line.trim().indexOf('--') > 0)
      .join('\n');

    // Split into individual statements
    const statements = cleanedSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await this.query(statement + ';');
    }

    // Record migration
    const version = '001_initial_schema';
    const description = 'Initial database schema with BGE decisions, cantonal decisions, and cache';

    // Use database-specific syntax for conflict handling
    if (this.type === 'postgres') {
      await this.query(
        `INSERT INTO schema_migrations (version, description) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        { values: [version, description] }
      );
    } else {
      await this.query(
        `INSERT OR IGNORE INTO schema_migrations (version, description) VALUES (?, ?)`,
        { values: [version, description] }
      );
    }
  }

  /**
   * Generate UUID (database-agnostic)
   */
  generateId(): string {
    return randomUUID();
  }

  /**
   * Close database connection
   * Important: Must be called to prevent memory leaks with WASM
   */
  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = undefined;
    }

    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = undefined;
    }
  }

  /**
   * Get connection pool stats (PostgreSQL only)
   */
  getPoolStats(): { total: number; idle: number; waiting: number } | null {
    if (this.type === 'postgres' && this.pgPool) {
      return {
        total: this.pgPool.totalCount,
        idle: this.pgPool.idleCount,
        waiting: this.pgPool.waitingCount
      };
    }
    return null;
  }
}

/**
 * Create database client from environment
 */
export function createDatabaseClient(config?: Partial<DatabaseConfig>): DatabaseClient {
  const dbType = (process.env.DATABASE_TYPE || config?.type || 'sqlite') as DatabaseType;

  const defaultConfig: DatabaseConfig = {
    type: dbType,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'bettercallclaude',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    filename: process.env.DATABASE_FILE || join(process.cwd(), 'data', 'bettercallclaude.db'),
    max: parseInt(process.env.DATABASE_POOL_MAX || '20'),
    min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
    memory: process.env.NODE_ENV === 'test'
  };

  return new DatabaseClient({ ...defaultConfig, ...config });
}
