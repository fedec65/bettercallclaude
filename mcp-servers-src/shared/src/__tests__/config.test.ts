/**
 * Configuration System Tests
 * Tests: config/index.ts (getConfig, validateConfig)
 */

import { describe, it, expect } from 'vitest';
import { getConfig } from '../config/config';

describe('Configuration System', () => {
  describe('getConfig', () => {
    it('should return valid configuration object', () => {
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.environment).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.apis).toBeDefined();
      expect(config.logging).toBeDefined();
    });

    it('should have database configuration', () => {
      const config = getConfig();

      expect(config.database.type).toBe('sqlite');
      expect(config.database).toHaveProperty('database');
      expect(config.database.poolSize).toBeGreaterThan(0);
    });

    it('should have API configurations', () => {
      const config = getConfig();

      expect(config.apis.bundesgericht).toBeDefined();
      expect(config.apis.bundesgericht.baseUrl).toBeDefined();
      expect(config.apis.bundesgericht.timeout).toBeGreaterThan(0);

      expect(config.apis.cantons).toBeDefined();
      expect(Object.keys(config.apis.cantons)).toContain('ZH');
      expect(Object.keys(config.apis.cantons)).toContain('BE');
    });

    it('should have logging configuration', () => {
      const config = getConfig();

      expect(config.logging.level).toBeDefined();
      expect(['error', 'warn', 'info', 'debug']).toContain(config.logging.level);
    });

    it('should have environment configuration', () => {
      const config = getConfig();

      expect(config.environment).toBeDefined();
      expect(['development', 'staging', 'production', 'test']).toContain(config.environment);
    });
  });
});
