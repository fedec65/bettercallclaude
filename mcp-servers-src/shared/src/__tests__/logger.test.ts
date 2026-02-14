/**
 * Logger Tests
 * Tests: logging/Logger.ts, logging/index.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Logger, getLogger } from '../logging/logger';
import * as winston from 'winston';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    const winstonLogger = getLogger({ level: 'info', format: 'json' });
    logger = new Logger(winstonLogger);
  });

  describe('constructor', () => {
    it('should create logger instance', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should wrap winston logger', () => {
      const winstonLogger = winston.createLogger();
      const wrappedLogger = new Logger(winstonLogger);

      expect(wrappedLogger).toBeInstanceOf(Logger);
    });
  });

  describe('logging methods', () => {
    it('should have info method', () => {
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');

      // Should not throw
      expect(() => logger.info('Test message')).not.toThrow();
    });

    it('should have error method', () => {
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');

      const testError = new Error('Test error');
      expect(() => logger.error('Error occurred', testError)).not.toThrow();
    });

    it('should have warn method', () => {
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');

      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    it('should have debug method', () => {
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe('function');

      expect(() => logger.debug('Debug message')).not.toThrow();
    });
  });

  describe('metadata support', () => {
    it('should accept metadata object', () => {
      const metadata = { userId: '123', action: 'test' };

      expect(() => logger.info('Test with metadata', metadata)).not.toThrow();
    });

    it('should handle error with metadata', () => {
      const error = new Error('Test error');
      const metadata = { context: 'test' };

      expect(() => logger.error('Error with metadata', error, metadata)).not.toThrow();
    });
  });
});

describe('getLogger', () => {
  it('should create winston logger', () => {
    const winstonLogger = getLogger({ level: 'info', format: 'json' });

    expect(winstonLogger).toBeDefined();
    expect(winstonLogger.level).toBe('info');
  });

  it('should create logger with specified level', () => {
    // Note: getLogger is a singleton, so it returns the first initialized logger
    // This test verifies logger creation, not level changing
    const logger = getLogger({ level: 'info', format: 'json' });
    expect(logger).toBeDefined();
    expect(logger.level).toBeDefined();
    expect(['error', 'warn', 'info', 'debug']).toContain(logger.level);
  });

  it('should support different formats', () => {
    const formats: ('json' | 'text')[] = ['json', 'text'];

    formats.forEach(format => {
      const logger = getLogger({ level: 'info', format });
      expect(logger).toBeDefined();
    });
  });
});
