/**
 * Vitest test setup file
 * Configures test environment and global mocks
 */

import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'development'; // Config validation only accepts development/staging/production
process.env.DATABASE_TYPE = 'sqlite';
process.env.DATABASE_PATH = ':memory:';

// Global test timeout - configured in vitest.config.ts instead
// vi.setConfig({ testTimeout: 10000 });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
