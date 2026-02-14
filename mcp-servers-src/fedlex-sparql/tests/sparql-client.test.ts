/**
 * Unit Tests for SPARQL Client
 * Tests for the Fedlex SPARQL client functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SPARQLClient,
  DEFAULT_CONFIG,
  escapeForSPARQL,
  buildTextFilter,
  buildSRNumberFilter,
  createFedlexClient,
} from '../src/sparql-client.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SPARQL Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have the correct Fedlex SPARQL endpoint', () => {
      expect(DEFAULT_CONFIG.endpoint).toBe('https://fedlex.data.admin.ch/sparqlendpoint');
    });

    it('should have reasonable default timeout', () => {
      expect(DEFAULT_CONFIG.timeout).toBe(30000);
    });

    it('should have retry configuration', () => {
      expect(DEFAULT_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_CONFIG.retryDelay).toBe(1000);
    });
  });

  describe('escapeForSPARQL', () => {
    it('should escape double quotes', () => {
      expect(escapeForSPARQL('test "value"')).toBe('test \\"value\\"');
    });

    it('should escape backslashes', () => {
      expect(escapeForSPARQL('test\\value')).toBe('test\\\\value');
    });

    it('should escape newlines', () => {
      expect(escapeForSPARQL('line1\nline2')).toBe('line1\\nline2');
    });

    it('should escape carriage returns', () => {
      expect(escapeForSPARQL('line1\rline2')).toBe('line1\\rline2');
    });

    it('should escape tabs', () => {
      expect(escapeForSPARQL('col1\tcol2')).toBe('col1\\tcol2');
    });

    it('should handle multiple special characters', () => {
      expect(escapeForSPARQL('test "quoted"\nwith\\slash')).toBe(
        'test \\"quoted\\"\\nwith\\\\slash'
      );
    });

    it('should handle empty strings', () => {
      expect(escapeForSPARQL('')).toBe('');
    });

    it('should handle strings without special characters', () => {
      expect(escapeForSPARQL('simple text')).toBe('simple text');
    });

    it('should handle SR numbers correctly', () => {
      expect(escapeForSPARQL('220')).toBe('220');
      expect(escapeForSPARQL('210.1')).toBe('210.1');
    });
  });

  describe('buildTextFilter', () => {
    it('should build filter without language', () => {
      const filter = buildTextFilter('title', 'Vertrag');
      expect(filter).toContain('CONTAINS');
      expect(filter).toContain('LCASE');
      expect(filter).toContain('Vertrag');
    });

    it('should build filter with language', () => {
      const filter = buildTextFilter('title', 'Vertrag', 'de');
      expect(filter).toContain('LANG');
      expect(filter).toContain('"de"');
    });

    it('should escape special characters in search text', () => {
      const filter = buildTextFilter('title', 'test "value"');
      expect(filter).toContain('\\"');
    });
  });

  describe('buildSRNumberFilter', () => {
    it('should build STRSTARTS filter', () => {
      const filter = buildSRNumberFilter('srNumber', '220');
      expect(filter).toContain('STRSTARTS');
      expect(filter).toContain('220');
    });

    it('should escape special characters', () => {
      const filter = buildSRNumberFilter('srNumber', '2"20');
      expect(filter).toContain('\\"');
    });
  });

  describe('SPARQLClient', () => {
    let client: SPARQLClient;

    beforeEach(() => {
      client = new SPARQLClient();
    });

    describe('constructor', () => {
      it('should use default config', () => {
        expect(client.getEndpoint()).toBe('https://fedlex.data.admin.ch/sparqlendpoint');
      });

      it('should accept custom config', () => {
        const customClient = new SPARQLClient({ timeout: 60000 });
        expect(customClient.getEndpoint()).toBe('https://fedlex.data.admin.ch/sparqlendpoint');
      });
    });

    describe('query', () => {
      it('should execute query and return results', async () => {
        const mockResponse = {
          results: {
            bindings: [
              {
                srNumber: { value: '220' },
                title: { value: 'Obligationenrecht', 'xml:lang': 'de' },
              },
            ],
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

        const query = 'SELECT ?srNumber ?title WHERE { ?s ?p ?o }';
        const result = await client.query(query);

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://fedlex.data.admin.ch/sparqlendpoint',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Accept': 'application/sparql-results+json',
            }),
          })
        );
      });

      it('should throw error on non-OK response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Server error'),
        });

        const query = 'SELECT ?s WHERE { ?s ?p ?o }';

        await expect(client.query(query)).rejects.toMatchObject({
          code: 'SPARQL_ERROR',
        });
      });

      it('should include proper headers', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: { bindings: [] } }),
        });

        await client.query('SELECT * WHERE { ?s ?p ?o }');

        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[1].headers['Accept']).toBe('application/sparql-results+json');
        expect(callArgs[1].headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      });
    });

    describe('extractValue', () => {
      it('should extract value from binding', () => {
        const binding = { value: 'test', type: 'literal' };
        expect(client.extractValue(binding)).toBe('test');
      });

      it('should return undefined for undefined binding', () => {
        expect(client.extractValue(undefined)).toBeUndefined();
      });
    });

    describe('extractLocalizedValue', () => {
      it('should extract value with preferred language', () => {
        const bindings = [
          { title: { value: 'German Title', 'xml:lang': 'de' } },
          { title: { value: 'French Title', 'xml:lang': 'fr' } },
          { title: { value: 'Italian Title', 'xml:lang': 'it' } },
        ];
        expect(client.extractLocalizedValue(bindings, 'title', 'de')).toBe('German Title');
      });

      it('should fall back to any available value if preferred not found', () => {
        const bindings = [
          { title: { value: 'German Title', 'xml:lang': 'de' } },
          { title: { value: 'French Title', 'xml:lang': 'fr' } },
        ];
        expect(client.extractLocalizedValue(bindings, 'title', 'it')).toBe('German Title');
      });

      it('should return undefined for empty bindings', () => {
        expect(client.extractLocalizedValue([], 'title', 'de')).toBeUndefined();
      });

      it('should return undefined if variable not in binding', () => {
        const bindings = [{ other: { value: 'Other Value' } }];
        expect(client.extractLocalizedValue(bindings, 'title', 'de')).toBeUndefined();
      });

      it('should handle bindings without language tags', () => {
        const bindings = [{ title: { value: 'Plain Title' } }];
        expect(client.extractLocalizedValue(bindings, 'title', 'de')).toBe('Plain Title');
      });
    });

    describe('extractMultilingualValue', () => {
      it('should extract all language variants', () => {
        const bindings = [
          { title: { value: 'German', 'xml:lang': 'de' } },
          { title: { value: 'French', 'xml:lang': 'fr' } },
          { title: { value: 'Italian', 'xml:lang': 'it' } },
        ];
        const result = client.extractMultilingualValue(bindings, 'title');
        expect(result).toEqual({
          de: 'German',
          fr: 'French',
          it: 'Italian',
        });
      });

      it('should handle values without language tags', () => {
        const bindings = [{ title: { value: 'Plain Value' } }];
        const result = client.extractMultilingualValue(bindings, 'title');
        expect(result).toEqual({ de: 'Plain Value' });
      });
    });

    describe('validateQuery', () => {
      it('should accept valid SELECT query', () => {
        const result = client.validateQuery('SELECT ?s WHERE { ?s ?p ?o }');
        expect(result.valid).toBe(true);
      });

      it('should accept query starting with PREFIX', () => {
        const result = client.validateQuery('PREFIX ex: <http://example.org/> SELECT ?s WHERE { ?s ?p ?o }');
        expect(result.valid).toBe(true);
      });

      it('should reject invalid query', () => {
        const result = client.validateQuery('INVALID QUERY');
        expect(result.valid).toBe(false);
      });

      it('should detect unbalanced braces', () => {
        const result = client.validateQuery('SELECT ?s WHERE { ?s ?p ?o');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('braces');
      });
    });
  });

  describe('createFedlexClient', () => {
    it('should create a client with default config', () => {
      const client = createFedlexClient();
      expect(client.getEndpoint()).toBe('https://fedlex.data.admin.ch/sparqlendpoint');
    });

    it('should create a client with custom config', () => {
      const client = createFedlexClient({ endpoint: 'http://custom.endpoint' });
      expect(client.getEndpoint()).toBe('http://custom.endpoint');
    });
  });
});
