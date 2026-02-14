/**
 * Error Handling Framework for BetterCallClaude
 * Custom error types and error handling utilities
 */

/**
 * Base error class for all BetterCallClaude errors
 */
export abstract class BetterCallClaudeError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * API-related errors
 */
export class APIError extends BetterCallClaudeError {
  constructor(
    message: string,
    public readonly service: string,
    public readonly endpoint?: string,
    statusCode = 500
  ) {
    super(message, 'API_ERROR', statusCode);
  }
}

export class APIRateLimitError extends APIError {
  constructor(service: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${service}${retryAfter ? `, retry after ${retryAfter}s` : ''}`,
      service,
      undefined,
      429
    );
  }
}

export class APITimeoutError extends APIError {
  constructor(service: string, endpoint: string) {
    super(
      `Request to ${service} timed out`,
      service,
      endpoint,
      504
    );
  }
}

export class APIAuthenticationError extends APIError {
  constructor(service: string) {
    super(
      `Authentication failed for ${service}`,
      service,
      undefined,
      401
    );
  }
}

export class APINotFoundError extends APIError {
  constructor(service: string, endpoint: string) {
    super(
      `Resource not found at ${service}${endpoint}`,
      service,
      endpoint,
      404
    );
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends BetterCallClaudeError {
  constructor(
    message: string,
    public readonly operation?: string,
    public readonly table?: string
  ) {
    super(message, 'DATABASE_ERROR', 500);
  }
}

export class DatabaseConnectionError extends DatabaseError {
  public readonly code = 'DATABASE_CONNECTION_ERROR';

  constructor(message: string) {
    super(message, 'connection');
    Object.defineProperty(this, 'code', { value: 'DATABASE_CONNECTION_ERROR' });
  }
}

export class DatabaseQueryError extends DatabaseError {
  public readonly code = 'DATABASE_QUERY_ERROR';

  constructor(message: string, table?: string) {
    super(message, 'query', table);
    Object.defineProperty(this, 'code', { value: 'DATABASE_QUERY_ERROR' });
  }
}

export class DatabaseConstraintError extends DatabaseError {
  public readonly code = 'DATABASE_CONSTRAINT_ERROR';

  constructor(message: string, table?: string) {
    super(message, 'constraint', table);
    Object.defineProperty(this, 'code', { value: 'DATABASE_CONSTRAINT_ERROR' });
    Object.defineProperty(this, 'statusCode', { value: 409 });
  }
}

/**
 * Validation errors
 */
export class ValidationError extends BetterCallClaudeError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class ConfigurationError extends BetterCallClaudeError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR', 500, false);
  }
}

/**
 * Search-related errors
 */
export class SearchError extends BetterCallClaudeError {
  constructor(message: string) {
    super(message, 'SEARCH_ERROR', 500);
  }
}

export class InvalidQueryError extends SearchError {
  public readonly code = 'INVALID_QUERY_ERROR';

  constructor(query: string, reason: string) {
    super(`Invalid search query: ${reason}`);
    Object.defineProperty(this, 'code', { value: 'INVALID_QUERY_ERROR' });
    Object.defineProperty(this, 'statusCode', { value: 400 });
  }
}

/**
 * Cache-related errors
 */
export class CacheError extends BetterCallClaudeError {
  constructor(message: string) {
    super(message, 'CACHE_ERROR', 500);
  }
}

/**
 * Citation-related errors
 */
export class CitationError extends BetterCallClaudeError {
  constructor(message: string, public readonly citation?: string) {
    super(message, 'CITATION_ERROR', 400);
  }
}

export class InvalidCitationFormatError extends CitationError {
  public readonly code = 'INVALID_CITATION_FORMAT';

  constructor(citation: string, reason: string) {
    super(`Invalid citation format: ${reason}`, citation);
    Object.defineProperty(this, 'code', { value: 'INVALID_CITATION_FORMAT' });
  }
}

/**
 * Error handler utilities
 */
export interface ErrorHandlerOptions {
  logErrors?: boolean;
  logger?: {
    error: (message: string, error: Error, meta?: Record<string, unknown>) => void;
  };
  rethrow?: boolean;
}

export function handleError(
  error: Error,
  options: ErrorHandlerOptions = {}
): void {
  const { logErrors = true, logger, rethrow = true } = options;

  // Log operational errors
  if (error instanceof BetterCallClaudeError && error.isOperational && logErrors && logger) {
    logger.error(
      `Operational error: ${error.message}`,
      error,
      {
        code: error.code,
        statusCode: error.statusCode,
      }
    );
  }

  // Log non-operational errors as critical
  if (!(error instanceof BetterCallClaudeError) || !error.isOperational) {
    if (logErrors && logger) {
      logger.error(
        `Critical error: ${error.message}`,
        error,
        {
          critical: true,
        }
      );
    }
  }

  if (rethrow) {
    throw error;
  }
}

/**
 * Async error wrapper
 */
export function asyncErrorHandler<T>(
  fn: (...args: unknown[]) => Promise<T>,
  options?: ErrorHandlerOptions
): (...args: unknown[]) => Promise<T> {
  return async (...args: unknown[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error as Error, options);
      throw error; // Re-throw after handling
    }
  };
}

/**
 * Error response formatting for MCP protocol
 */
export interface MCPErrorResponse {
  error: {
    code: string;
    message: string;
    data?: Record<string, unknown>;
  };
}

export function formatMCPError(error: Error): MCPErrorResponse {
  if (error instanceof BetterCallClaudeError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        data: {
          statusCode: error.statusCode,
          isOperational: error.isOperational,
        },
      },
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      data: {
        statusCode: 500,
      },
    },
  };
}

/**
 * Retry utilities for transient errors
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof APIRateLimitError) return true;
  if (error instanceof APITimeoutError) return true;
  if (error instanceof DatabaseConnectionError) return true;

  // Network errors
  if (error.message.includes('ECONNREFUSED')) return true;
  if (error.message.includes('ETIMEDOUT')) return true;
  if (error.message.includes('ENOTFOUND')) return true;

  return false;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if not retryable or last attempt
      if (!isRetryableError(lastError) || attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
