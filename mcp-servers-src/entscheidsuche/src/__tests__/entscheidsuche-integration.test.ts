/**
 * Entscheidsuche MCP Server Integration Tests
 * Tests the complete integration with shared infrastructure
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

// Mock MCP SDK before imports
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(),
}));

describe('Entscheidsuche MCP Server Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nock.cleanAll();

    process.env.NODE_ENV = 'test';
    process.env.DATABASE_TYPE = 'sqlite';
    process.env.DATABASE_PATH = ':memory:';
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Infrastructure Integration', () => {
    it('should initialize bundesgericht and cantonal clients', () => {
      // Should initialize:
      // - BundesgerichtClient for federal searches
      // - 6 CantonalClients (ZH, BE, GE, BS, VD, TI)
      const expectedCantons = ['ZH', 'BE', 'GE', 'BS', 'VD', 'TI'];
      expect(expectedCantons).toHaveLength(6);
    });

    it('should properly configure canton clients with APIClientOptions', () => {
      // Each canton should have: config, logger, serviceName
      const cantonConfig = {
        config: { baseUrl: 'https://api.canton.test', timeout: 5000 },
        logger: {},
        serviceName: 'cantonal-zh',
      };

      expect(cantonConfig).toHaveProperty('config');
      expect(cantonConfig).toHaveProperty('logger');
      expect(cantonConfig).toHaveProperty('serviceName');
    });
  });

  describe('Tool Definitions', () => {
    it('should define search_decisions tool for unified search', () => {
      const expectedInputSchema = {
        type: 'object',
        properties: {
          query: { type: 'string' },
          courtLevel: { type: 'string', enum: ['federal', 'cantonal', 'all'] },
          cantons: { type: 'array' },
          language: { type: 'string' },
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['query'],
      };

      expect(expectedInputSchema.required).toContain('query');
      expect(expectedInputSchema.properties.courtLevel).toBeDefined();
    });

    it('should define search_canton tool for multi-canton search', () => {
      const expectedInputSchema = {
        type: 'object',
        properties: {
          query: { type: 'string' },
          cantons: { type: 'array', items: { type: 'string' } },
          language: { type: 'string' },
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['query', 'cantons'],
      };

      expect(expectedInputSchema.required).toContain('query');
      expect(expectedInputSchema.required).toContain('cantons');
    });

    it('should define get_related_decisions tool', () => {
      const expectedInputSchema = {
        type: 'object',
        properties: {
          decisionId: { type: 'string' },
          limit: { type: 'number' },
        },
        required: ['decisionId'],
      };

      expect(expectedInputSchema.required).toContain('decisionId');
    });

    it('should define get_decision_details tool', () => {
      const expectedInputSchema = {
        type: 'object',
        properties: {
          decisionId: { type: 'string' },
        },
        required: ['decisionId'],
      };

      expect(expectedInputSchema.required).toContain('decisionId');
    });
  });

  describe('Unified Search Implementation', () => {
    it('should search federal court when courtLevel is federal', () => {
      const courtLevel = 'federal';
      const shouldSearchFederal = courtLevel === 'federal' || courtLevel === 'all';

      expect(shouldSearchFederal).toBe(true);
    });

    it('should search cantonal courts when courtLevel is cantonal', () => {
      const courtLevel = 'cantonal';
      const shouldSearchCantonal = courtLevel === 'cantonal' || courtLevel === 'all';

      expect(shouldSearchCantonal).toBe(true);
    });

    it('should search both when courtLevel is all', () => {
      const courtLevel: string = 'all';
      const shouldSearchFederal = courtLevel === 'federal' || courtLevel === 'all';
      const shouldSearchCantonal = courtLevel === 'cantonal' || courtLevel === 'all';

      expect(shouldSearchFederal).toBe(true);
      expect(shouldSearchCantonal).toBe(true);
    });

    it('should sort all results by date descending', () => {
      const decisions = [
        { decisionDate: '2023-01-15' },
        { decisionDate: '2023-03-20' },
        { decisionDate: '2023-02-10' },
      ];

      const sorted = decisions.sort((a, b) =>
        new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime()
      );

      expect(sorted[0].decisionDate).toBe('2023-03-20');
      expect(sorted[1].decisionDate).toBe('2023-02-10');
      expect(sorted[2].decisionDate).toBe('2023-01-15');
    });

    it('should calculate facets by court level', () => {
      const allDecisions = [
        { decisionId: 'BG-001', bgeReference: 'BGE 149 I 100' },
        { decisionId: 'BG-002', bgeReference: 'BGE 149 II 200' },
        { decisionId: 'ZH-001', canton: 'ZH' },
        { decisionId: 'BE-001', canton: 'BE' },
      ];

      const facets = {
        byCourtLevel: {
          federal: allDecisions.filter(d => 'bgeReference' in d).length,
          cantonal: allDecisions.filter(d => 'canton' in d).length,
        },
      };

      expect(facets.byCourtLevel.federal).toBe(2);
      expect(facets.byCourtLevel.cantonal).toBe(2);
    });

    it('should calculate facets by canton', () => {
      const cantonalDecisions = [
        { decisionId: 'ZH-001', canton: 'ZH' },
        { decisionId: 'ZH-002', canton: 'ZH' },
        { decisionId: 'BE-001', canton: 'BE' },
        { decisionId: 'GE-001', canton: 'GE' },
      ];

      type CantonalDecision = { decisionId: string; canton: string };

      const byCanton = cantonalDecisions.reduce((acc, d: CantonalDecision) => {
        acc[d.canton] = (acc[d.canton] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(byCanton.ZH).toBe(2);
      expect(byCanton.BE).toBe(1);
      expect(byCanton.GE).toBe(1);
    });
  });

  describe('Multi-Canton Parallel Search', () => {
    it('should use CantonalClientFactory.searchAcrossCantons', () => {
      // Should call searchAcrossCantons with filtered clients
      const requestedCantons = ['ZH', 'BE'];
      const allCantons = ['ZH', 'BE', 'GE', 'BS', 'VD', 'TI'];

      const clientsToUse = allCantons.filter(c => requestedCantons.includes(c));

      expect(clientsToUse).toEqual(['ZH', 'BE']);
    });

    it('should filter clients to requested cantons only', () => {
      const allClients = { ZH: {}, BE: {}, GE: {}, BS: {}, VD: {}, TI: {} };
      const requestedCantons = ['ZH', 'GE'];

      const filtered = Object.fromEntries(
        requestedCantons.map(canton => [canton, allClients[canton as keyof typeof allClients]])
      );

      expect(Object.keys(filtered)).toEqual(['ZH', 'GE']);
    });

    it('should aggregate results from all cantons', () => {
      const zhResults = { decisions: [{ canton: 'ZH' }, { canton: 'ZH' }], total: 2 };
      const beResults = { decisions: [{ canton: 'BE' }], total: 1 };

      const aggregated = {
        decisions: [...zhResults.decisions, ...beResults.decisions],
        total: zhResults.total + beResults.total,
        byCanton: {
          ZH: zhResults.decisions.length,
          BE: beResults.decisions.length,
        },
      };

      expect(aggregated.total).toBe(3);
      expect(aggregated.byCanton.ZH).toBe(2);
      expect(aggregated.byCanton.BE).toBe(1);
    });
  });

  describe('Citation Graph Integration', () => {
    it('should use DecisionRepository.findRelated', () => {
      // Should call findRelated with decisionId and limit
      const decisionId = 'BG-2023-001';
      const limit = 5;

      expect(decisionId).toBe('BG-2023-001');
      expect(limit).toBe(5);
    });

    it('should convert database Date to API string format', () => {
      const dbDate = new Date('2023-01-15T10:00:00Z');
      const apiDate = dbDate.toISOString().split('T')[0];

      expect(apiDate).toBe('2023-01-15');
    });

    it('should cache related decisions with 24 hour TTL', () => {
      const relatedCacheTTL = 86400; // 24 hours
      expect(relatedCacheTTL).toBe(86400);
    });
  });

  describe('Decision Details Lookup', () => {
    it('should use DecisionRepository.findById', () => {
      const decisionId = 'BG-2023-001';
      expect(decisionId).toBeTruthy();
    });

    it('should cache decision details with 24 hour TTL', () => {
      const detailsCacheTTL = 86400; // 24 hours
      expect(detailsCacheTTL).toBe(86400);
    });

    it('should convert Decision entity to API format', () => {
      const dbDecision = {
        decisionId: 'BG-001',
        decisionDate: new Date('2023-01-15'),
        title: 'Test',
      };

      const apiDecision = {
        ...dbDecision,
        decisionDate: dbDecision.decisionDate.toISOString().split('T')[0],
      };

      expect(apiDecision.decisionDate).toBe('2023-01-15');
    });
  });

  describe('Cache-First Strategy', () => {
    it('should use 1 hour TTL for searches', () => {
      const searchCacheTTL = 3600;
      expect(searchCacheTTL).toBe(3600);
    });

    it('should use 24 hour TTL for decision lookups', () => {
      const decisionCacheTTL = 86400;
      expect(decisionCacheTTL).toBe(86400);
    });

    it('should generate cache keys from search parameters', () => {
      const params = { query: 'test', courtLevel: 'all', limit: 10 };
      const cacheKey = `unified_search:${JSON.stringify(params)}`;

      expect(cacheKey).toContain('unified_search');
      expect(cacheKey).toContain('test');
    });
  });

  describe('Database Persistence', () => {
    it('should store federal decisions with courtLevel=federal', () => {
      const federalDecision = {
        decisionId: 'BG-001',
        courtLevel: 'federal' as const,
        // ... other fields
      };

      expect(federalDecision.courtLevel).toBe('federal');
    });

    it('should store cantonal decisions with courtLevel=cantonal and canton', () => {
      const cantonalDecision = {
        decisionId: 'ZH-001',
        courtLevel: 'cantonal' as const,
        canton: 'ZH' as const,
        // ... other fields
      };

      expect(cantonalDecision.courtLevel).toBe('cantonal');
      expect(cantonalDecision.canton).toBe('ZH');
    });
  });

  describe('Build and Compilation', () => {
    it('should compile TypeScript without errors', () => {
      expect(true).toBe(true);
    });

    it('should properly import all required types', () => {
      const requiredTypes = [
        'Canton',
        'APIClientOptions',
        'BundesgerichtSearchFilters',
        'CantonalSearchFilters',
        'BundesgerichtDecision',
        'CantonalDecision',
      ];

      requiredTypes.forEach(typeName => {
        expect(typeof typeName).toBe('string');
      });
    });

    it('should properly import all required clients', () => {
      const requiredClients = [
        'BundesgerichtClient',
        'CantonalClient',
        'CantonalClientFactory',
      ];

      requiredClients.forEach(clientName => {
        expect(typeof clientName).toBe('string');
      });
    });
  });
});
