/**
 * CantonalClient and CantonalClientFactory Tests
 * Tests: api-clients/CantonalClient.ts
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock p-retry to avoid ESM import issues
vi.mock('p-retry', () => ({
  __esModule: true,
  default: async (fn: () => Promise<unknown>): Promise<unknown> => await fn(),
}));

import { CantonalClient, CantonalClientFactory, type Canton } from '../api-clients/CantonalClient';
import { type APIClientOptions } from '../api-clients/BaseAPIClient';
import { Logger, getLogger } from '../logging/logger';
import nock from 'nock';

describe('CantonalClient', () => {
  let client: CantonalClient;
  let logger: Logger;

  beforeEach(() => {
    const winstonLogger = getLogger({ level: 'error', format: 'json' });
    logger = new Logger(winstonLogger);

    client = new CantonalClient({
      config: {
        baseUrl: 'https://api.zh.test',
        timeout: 5000,
        rateLimit: 200,
      },
      logger,
      serviceName: 'cantonal-zh-test',
      canton: 'ZH',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('searchDecisions', () => {
    it('should search cantonal decisions successfully', async () => {
      const mockResponse = {
        data: [
          {
            decisionId: 'ZH-2023-001',
            title: 'Test Cantonal Decision',
            summary: 'Test summary',
            decisionDate: '2023-01-15',
            language: 'de',
            legalAreas: ['Civil Law'],
            fullText: 'Full decision text',
            relatedDecisions: [],
            metadata: {},
            canton: 'ZH',
            court: 'Obergericht',
            caseNumber: 'ZH-OG-2023-001',
            sourceUrl: 'https://zh.test/decision/1',
          },
        ],
        meta: {
          total: 1,
        },
      };

      nock('https://api.zh.test')
        .get('/decisions/search')
        .query({ q: 'test', limit: 10 })
        .reply(200, mockResponse);

      const result = await client.searchDecisions({ query: 'test', limit: 10 });

      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].canton).toBe('ZH');
      expect(result.total).toBe(1);
    });

    it('should include canton in all results', async () => {
      const mockResponse = {
        data: [
          {
            decisionId: 'ZH-2023-001',
            title: 'Decision 1',
            summary: 'Summary 1',
            decisionDate: '2023-01-15',
            language: 'de',
            legalAreas: [],
            fullText: '',
            relatedDecisions: [],
            metadata: {},
            canton: 'ZH',
            court: 'Obergericht',
            caseNumber: 'ZH-OG-2023-001',
            sourceUrl: 'https://zh.test/1',
          },
        ],
        meta: {
          total: 1,
        },
      };

      nock('https://api.zh.test')
        .get('/decisions/search')
        .query({ q: 'test', limit: 10 })
        .reply(200, mockResponse);

      const result = await client.searchDecisions({ query: 'test', limit: 10 });

      result.decisions.forEach(decision => {
        expect(decision.canton).toBe('ZH');
      });
    });
  });

  describe('getDecisionById', () => {
    it('should retrieve decision by ID', async () => {
      const mockResponse = {
        data: {
          decisionId: 'ZH-2023-001',
          title: 'Test Decision',
          summary: 'Summary',
          decisionDate: '2023-01-15',
          language: 'de',
          legalAreas: [],
          fullText: '',
          relatedDecisions: [],
          metadata: {},
          canton: 'ZH',
          court: 'Obergericht',
          caseNumber: 'ZH-OG-2023-001',
          sourceUrl: 'https://zh.test/1',
        },
      };

      nock('https://api.zh.test')
        .get('/decisions/ZH-2023-001')
        .reply(200, mockResponse);

      const result = await client.getDecisionById('ZH-2023-001');

      expect(result).toBeDefined();
      expect(result?.decisionId).toBe('ZH-2023-001');
      expect(result?.canton).toBe('ZH');
    });

    it('should return null for non-existent decision', async () => {
      nock('https://api.zh.test')
        .get('/decisions/INVALID-ID')
        .reply(404, { error: 'Not Found' });

      const result = await client.getDecisionById('INVALID-ID');

      expect(result).toBeNull();
    });
  });
});

describe('CantonalClientFactory', () => {
  let logger: Logger;
  let configs: Record<Canton, APIClientOptions>;

  beforeEach(() => {
    const winstonLogger = getLogger({ level: 'error', format: 'json' });
    logger = new Logger(winstonLogger);

    const cantons: Canton[] = ['ZH', 'BE', 'GE', 'BS', 'VD', 'TI'];
    configs = {} as Record<Canton, APIClientOptions>;

    cantons.forEach(canton => {
      configs[canton] = {
        config: {
          baseUrl: `https://api.${canton.toLowerCase()}.test`,
          timeout: 5000,
          rateLimit: 200,
        },
        logger,
        serviceName: `cantonal-${canton.toLowerCase()}`,
      };
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('createClients', () => {
    it('should create clients for all cantons', () => {
      const clients = CantonalClientFactory.createClients(configs, logger);

      expect(Object.keys(clients)).toHaveLength(6);
      expect(clients.ZH).toBeInstanceOf(CantonalClient);
      expect(clients.BE).toBeInstanceOf(CantonalClient);
      expect(clients.GE).toBeInstanceOf(CantonalClient);
      expect(clients.BS).toBeInstanceOf(CantonalClient);
      expect(clients.VD).toBeInstanceOf(CantonalClient);
      expect(clients.TI).toBeInstanceOf(CantonalClient);
    });

    it('should skip missing canton configurations', () => {
      const partialConfigs = {
        ZH: configs.ZH,
        BE: configs.BE,
      } as Record<Canton, APIClientOptions>;

      const clients = CantonalClientFactory.createClients(partialConfigs, logger);

      expect(clients.ZH).toBeDefined();
      expect(clients.BE).toBeDefined();
      expect(clients.GE).toBeUndefined();
    });
  });

  describe('searchAcrossCantons', () => {
    it('should search across multiple cantons in parallel', async () => {
      const mockResponses = {
        ZH: { data: [{ decisionId: 'ZH-001', canton: 'ZH' }], meta: { total: 1 } },
        BE: { data: [{ decisionId: 'BE-001', canton: 'BE' }], meta: { total: 1 } },
      };

      nock('https://api.zh.test')
        .get('/decisions/search')
        .query({ q: 'test', limit: 10 })
        .reply(200, mockResponses.ZH);

      nock('https://api.be.test')
        .get('/decisions/search')
        .query({ q: 'test', limit: 10 })
        .reply(200, mockResponses.BE);

      const clients = CantonalClientFactory.createClients(
        { ZH: configs.ZH, BE: configs.BE } as Record<Canton, APIClientOptions>,
        logger
      );

      const result = await CantonalClientFactory.searchAcrossCantons(
        clients as Record<Canton, CantonalClient>,
        { query: 'test', limit: 10 }
      );

      expect(result.decisions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.byCanton.ZH).toBe(1);
      expect(result.byCanton.BE).toBe(1);
    });

    it('should handle partial failures gracefully', async () => {
      nock('https://api.zh.test')
        .get('/decisions/search')
        .query({ q: 'test', limit: 10 })
        .reply(200, { data: [{ decisionId: 'ZH-001', canton: 'ZH' }], meta: { total: 1 } });

      nock('https://api.be.test')
        .get('/decisions/search')
        .query({ q: 'test', limit: 10 })
        .reply(500, { error: 'Internal Server Error' });

      const clients = CantonalClientFactory.createClients(
        { ZH: configs.ZH, BE: configs.BE } as Record<Canton, APIClientOptions>,
        logger
      );

      const result = await CantonalClientFactory.searchAcrossCantons(
        clients as Record<Canton, CantonalClient>,
        { query: 'test', limit: 10 }
      );

      // Should still return ZH results despite BE failure
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].canton).toBe('ZH');
      expect(result.byCanton.ZH).toBe(1);
      expect(result.byCanton.BE).toBe(0); // Failed cantons get 0, not undefined
    });

    it('should filter by specific canton', async () => {
      nock('https://api.zh.test')
        .get('/decisions/search')
        .query({ q: 'test', limit: 10 })
        .reply(200, { data: [{ decisionId: 'ZH-001', canton: 'ZH' }], meta: { total: 1 } });

      const clients = CantonalClientFactory.createClients(configs, logger);

      const result = await CantonalClientFactory.searchAcrossCantons(
        clients as Record<Canton, CantonalClient>,
        { query: 'test', canton: 'ZH', limit: 10 }
      );

      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].canton).toBe('ZH');
      expect(Object.keys(result.byCanton)).toEqual(['ZH']);
    });

    it('should aggregate results by canton', async () => {
      const mockResponses = {
        ZH: { data: [{ decisionId: 'ZH-001', canton: 'ZH' }, { decisionId: 'ZH-002', canton: 'ZH' }], meta: { total: 2 } },
        BE: { data: [{ decisionId: 'BE-001', canton: 'BE' }], meta: { total: 1 } },
        GE: { data: [{ decisionId: 'GE-001', canton: 'GE' }, { decisionId: 'GE-002', canton: 'GE' }, { decisionId: 'GE-003', canton: 'GE' }], meta: { total: 3 } },
      };

      nock('https://api.zh.test').get('/decisions/search').query({ q: 'test', limit: 50 }).reply(200, mockResponses.ZH);
      nock('https://api.be.test').get('/decisions/search').query({ q: 'test', limit: 50 }).reply(200, mockResponses.BE);
      nock('https://api.ge.test').get('/decisions/search').query({ q: 'test', limit: 50 }).reply(200, mockResponses.GE);

      const clients = CantonalClientFactory.createClients(
        { ZH: configs.ZH, BE: configs.BE, GE: configs.GE } as Record<Canton, APIClientOptions>,
        logger
      );

      const result = await CantonalClientFactory.searchAcrossCantons(
        clients as Record<Canton, CantonalClient>,
        { query: 'test', limit: 50 }
      );

      expect(result.total).toBe(6);
      expect(result.byCanton.ZH).toBe(2);
      expect(result.byCanton.BE).toBe(1);
      expect(result.byCanton.GE).toBe(3);
    });
  });
});
