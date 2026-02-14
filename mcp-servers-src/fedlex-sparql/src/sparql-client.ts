/**
 * SPARQL Client for LINDAS/Fedlex Endpoint
 * Provides HTTP access to the Swiss Federal Linked Data Service
 *
 * Endpoint: https://ld.admin.ch/query
 * Documentation: https://lindas.admin.ch/
 */

import { SPARQLResult, SPARQLBinding, FedlexError } from './types/legislation.js';

/**
 * Configuration for the SPARQL client
 */
export interface SPARQLClientConfig {
  endpoint: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  userAgent: string;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: SPARQLClientConfig = {
  endpoint: 'https://fedlex.data.admin.ch/sparqlendpoint',  // Correct Fedlex SPARQL endpoint
  timeout: 30000,        // 30 seconds
  maxRetries: 3,
  retryDelay: 1000,      // 1 second
  userAgent: 'BetterCallClaude/2.0.1 (Swiss Legal Intelligence)',
};

/**
 * SPARQL query execution options
 */
export interface QueryOptions {
  format?: 'json' | 'xml';
  timeout?: number;
  acceptLanguage?: string;
}

/**
 * SPARQL Client for querying LINDAS/Fedlex
 */
export class SPARQLClient {
  private config: SPARQLClientConfig;

  constructor(config: Partial<SPARQLClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a SPARQL SELECT query
   */
  async query(sparql: string, options: QueryOptions = {}): Promise<SPARQLResult> {
    const { format = 'json', timeout = this.config.timeout, acceptLanguage } = options;

    const headers: Record<string, string> = {
      'Accept': format === 'json' ? 'application/sparql-results+json' : 'application/sparql-results+xml',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': this.config.userAgent,
    };

    if (acceptLanguage) {
      headers['Accept-Language'] = acceptLanguage;
    }

    const body = new URLSearchParams({
      query: sparql,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers,
          body: body.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SPARQL query failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json() as SPARQLResult;
        return result;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (lastError.message.includes('4')) {
          throw this.createFedlexError(lastError, sparql);
        }

        // Wait before retrying
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    throw this.createFedlexError(lastError!, sparql);
  }

  /**
   * Execute a SPARQL ASK query
   */
  async ask(sparql: string, options: QueryOptions = {}): Promise<boolean> {
    const result = await this.query(sparql, options);
    // ASK queries return a boolean in the result
    return (result as unknown as { boolean: boolean }).boolean ?? false;
  }

  /**
   * Execute a SPARQL DESCRIBE query
   */
  async describe(sparql: string, options: QueryOptions = {}): Promise<SPARQLResult> {
    return this.query(sparql, { ...options, format: 'json' });
  }

  /**
   * Helper to extract a single value from bindings
   */
  extractValue(binding: SPARQLBinding | undefined): string | undefined {
    return binding?.value;
  }

  /**
   * Helper to extract a localized value based on language preference
   */
  extractLocalizedValue(
    bindings: Array<Record<string, SPARQLBinding>>,
    variableName: string,
    preferredLang: string = 'de'
  ): string | undefined {
    // First try to find exact language match
    for (const binding of bindings) {
      const value = binding[variableName];
      if (value && value['xml:lang'] === preferredLang) {
        return value.value;
      }
    }

    // Fall back to any available value
    for (const binding of bindings) {
      const value = binding[variableName];
      if (value) {
        return value.value;
      }
    }

    return undefined;
  }

  /**
   * Helper to extract multilingual values
   */
  extractMultilingualValue(
    bindings: Array<Record<string, SPARQLBinding>>,
    variableName: string
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const binding of bindings) {
      const value = binding[variableName];
      if (value && value['xml:lang']) {
        result[value['xml:lang']] = value.value;
      } else if (value && !Object.keys(result).length) {
        // Use value without language tag if no localized values found
        result['de'] = value.value; // Default to German
      }
    }

    return result;
  }

  /**
   * Helper to group bindings by a key variable
   */
  groupBindings(
    bindings: Array<Record<string, SPARQLBinding>>,
    keyVariable: string
  ): Map<string, Array<Record<string, SPARQLBinding>>> {
    const groups = new Map<string, Array<Record<string, SPARQLBinding>>>();

    for (const binding of bindings) {
      const key = this.extractValue(binding[keyVariable]);
      if (key) {
        const group = groups.get(key) || [];
        group.push(binding);
        groups.set(key, group);
      }
    }

    return groups;
  }

  /**
   * Validate a SPARQL query syntax (basic check)
   */
  validateQuery(sparql: string): { valid: boolean; error?: string } {
    // Basic syntax checks
    const trimmed = sparql.trim().toUpperCase();

    if (!trimmed.startsWith('SELECT') &&
        !trimmed.startsWith('ASK') &&
        !trimmed.startsWith('DESCRIBE') &&
        !trimmed.startsWith('CONSTRUCT') &&
        !trimmed.startsWith('PREFIX')) {
      return { valid: false, error: 'Query must start with SELECT, ASK, DESCRIBE, CONSTRUCT, or PREFIX' };
    }

    // Check for balanced braces
    const openBraces = (sparql.match(/{/g) || []).length;
    const closeBraces = (sparql.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { valid: false, error: 'Unbalanced braces in query' };
    }

    return { valid: true };
  }

  /**
   * Create a FedlexError from an Error
   */
  private createFedlexError(error: Error, query?: string): FedlexError {
    return {
      code: 'SPARQL_ERROR',
      message: error.message,
      query,
      endpoint: this.config.endpoint,
    };
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the configured endpoint URL
   */
  getEndpoint(): string {
    return this.config.endpoint;
  }

  /**
   * Update client configuration
   */
  updateConfig(config: Partial<SPARQLClientConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create a pre-configured SPARQL client for Fedlex
 */
export function createFedlexClient(config?: Partial<SPARQLClientConfig>): SPARQLClient {
  return new SPARQLClient({
    ...DEFAULT_CONFIG,
    ...config,
  });
}

/**
 * Escape special characters for SPARQL string literals
 */
export function escapeForSPARQL(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Build a FILTER clause for text search
 */
export function buildTextFilter(variable: string, searchText: string, language?: string): string {
  const escaped = escapeForSPARQL(searchText);

  if (language) {
    return `FILTER(CONTAINS(LCASE(STR(?${variable})), LCASE("${escaped}")) && LANG(?${variable}) = "${language}")`;
  }

  return `FILTER(CONTAINS(LCASE(STR(?${variable})), LCASE("${escaped}")))`;
}

/**
 * Build a FILTER clause for SR number pattern matching
 */
export function buildSRNumberFilter(variable: string, srNumber: string): string {
  // SR numbers can be partial (e.g., "2" matches "210", "220", etc.)
  const escaped = escapeForSPARQL(srNumber);
  return `FILTER(STRSTARTS(STR(?${variable}), "${escaped}"))`;
}
