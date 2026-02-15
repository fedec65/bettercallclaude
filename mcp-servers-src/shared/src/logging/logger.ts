/**
 * Logging Infrastructure for BetterCallClaude
 * Winston-based structured logging with multiple transports
 */

import winston from 'winston';
import { LoggingConfig } from '../config/config';

/**
 * Create a Winston logger instance based on configuration
 */
export function createLogger(config: LoggingConfig): winston.Logger {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      // CRITICAL: Write ALL levels to stderr, not stdout.
      // MCP servers use stdio transport — stdout is reserved for JSON-RPC.
      stderrLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'],
      format: config.format === 'json'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
          ),
    }),
  ];

  // Add file transport if configured
  if (config.file) {
    transports.push(
      new winston.transports.File({
        filename: config.file,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  return winston.createLogger({
    level: config.level,
    transports,
    exceptionHandlers: [
      new winston.transports.Console({ stderrLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] }),
      ...(config.file ? [new winston.transports.File({ filename: config.file })] : []),
    ],
    rejectionHandlers: [
      new winston.transports.Console({ stderrLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] }),
      ...(config.file ? [new winston.transports.File({ filename: config.file })] : []),
    ],
  });
}

/**
 * Logger singleton
 */
let loggerInstance: winston.Logger | null = null;

export function getLogger(config?: LoggingConfig): winston.Logger {
  if (!loggerInstance) {
    if (!config) {
      // Return minimal stderr-only logger for pre-config startup
      loggerInstance = winston.createLogger({
        level: 'info',
        transports: [
          new winston.transports.Console({
            stderrLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'],
          }),
        ],
      });
      return loggerInstance;
    }
    loggerInstance = createLogger(config);
  }
  return loggerInstance;
}

/**
 * Reset logger (useful for testing)
 */
export function resetLogger(): void {
  if (loggerInstance) {
    loggerInstance.close();
    loggerInstance = null;
  }
}

/**
 * Structured logging utilities
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  [key: string]: unknown;
}

export class Logger {
  constructor(private logger: winston.Logger, private context: LogContext = {}) {}

  private formatMessage(message: string, meta?: LogContext): [string, LogContext] {
    const combinedMeta = { ...this.context, ...meta };
    return [message, combinedMeta];
  }

  debug(message: string, meta?: LogContext): void {
    const [msg, context] = this.formatMessage(message, meta);
    this.logger.debug(msg, context);
  }

  info(message: string, meta?: LogContext): void {
    const [msg, context] = this.formatMessage(message, meta);
    this.logger.info(msg, context);
  }

  warn(message: string, meta?: LogContext): void {
    const [msg, context] = this.formatMessage(message, meta);
    this.logger.warn(msg, context);
  }

  error(message: string, error?: Error, meta?: LogContext): void {
    const [msg, context] = this.formatMessage(message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
    this.logger.error(msg, context);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    return new Logger(this.logger, { ...this.context, ...context });
  }
}

/**
 * Request/Response logging utilities
 */
export interface RequestLogData {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}

export interface ResponseLogData {
  statusCode: number;
  duration: number;
  body?: unknown;
  error?: Error;
}

export function logRequest(logger: Logger, data: RequestLogData): void {
  logger.info('Incoming request', {
    operation: 'http_request',
    method: data.method,
    url: data.url,
    query: data.query,
    // Avoid logging sensitive headers
    headers: data.headers ? Object.keys(data.headers) : undefined,
  });
}

export function logResponse(logger: Logger, data: ResponseLogData): void {
  const level = data.statusCode >= 500 ? 'error' : data.statusCode >= 400 ? 'warn' : 'info';

  if (level === 'error' && data.error) {
    logger.error('Request failed', data.error, {
      operation: 'http_response',
      statusCode: data.statusCode,
      duration: data.duration,
    });
  } else if (level === 'warn') {
    logger.warn('Request completed', {
      operation: 'http_response',
      statusCode: data.statusCode,
      duration: data.duration,
    });
  } else {
    logger.info('Request completed', {
      operation: 'http_response',
      statusCode: data.statusCode,
      duration: data.duration,
    });
  }
}

/**
 * API call logging utilities
 */
export interface APICallLogData {
  service: string;
  endpoint: string;
  method: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
}

export function logAPICall(logger: Logger, data: APICallLogData): void {
  const { service, endpoint, method, duration, statusCode, error } = data;

  if (error) {
    logger.error(`API call to ${service} failed`, error, {
      operation: 'api_call',
      service,
      endpoint,
      method,
      duration,
      statusCode,
    });
  } else {
    logger.info(`API call to ${service} completed`, {
      operation: 'api_call',
      service,
      endpoint,
      method,
      duration,
      statusCode,
    });
  }
}

/**
 * Database operation logging utilities
 */
export interface DBOperationLogData {
  operation: 'query' | 'insert' | 'update' | 'delete' | 'transaction';
  table?: string;
  duration?: number;
  rowCount?: number;
  error?: Error;
}

export function logDBOperation(logger: Logger, data: DBOperationLogData): void {
  const { operation, table, duration, rowCount, error } = data;

  if (error) {
    logger.error(`Database ${operation} failed`, error, {
      operation: 'db_operation',
      dbOperation: operation,
      table,
      duration,
    });
  } else {
    logger.debug(`Database ${operation} completed`, {
      operation: 'db_operation',
      dbOperation: operation,
      table,
      duration,
      rowCount,
    });
  }
}

/**
 * Search operation logging utilities
 */
export interface SearchLogData {
  query: string;
  filters?: Record<string, unknown>;
  resultCount?: number;
  duration?: number;
  cacheHit?: boolean;
}

export function logSearch(logger: Logger, data: SearchLogData): void {
  logger.info('Search executed', {
    operation: 'search',
    query: data.query,
    filters: data.filters,
    resultCount: data.resultCount,
    duration: data.duration,
    cacheHit: data.cacheHit,
  });
}

/**
 * Cache operation logging utilities
 */
export interface CacheLogData {
  operation: 'get' | 'set' | 'delete' | 'clear';
  key?: string;
  hit?: boolean;
  duration?: number;
}

export function logCache(logger: Logger, data: CacheLogData): void {
  logger.debug('Cache operation', {
    operation: 'cache',
    cacheOperation: data.operation,
    key: data.key,
    hit: data.hit,
    duration: data.duration,
  });
}
