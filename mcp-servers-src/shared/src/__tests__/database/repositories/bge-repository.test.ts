/**
 * BGE Repository Tests
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseClient, DatabaseConfig } from '../../../database/client';
import { BGERepository, BGEDecision } from '../../../database/repositories/bge-repository';
import { randomUUID } from 'crypto';

describe('BGERepository', () => {
  let client: DatabaseClient;
  let repository: BGERepository;

  beforeEach(async () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      memory: true
    };
    client = new DatabaseClient(config);
    await client.connect();
    await client.migrate();
    repository = new BGERepository(client);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('create', () => {
    test('should create a new BGE decision', async () => {
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 147 IV 73',
        volume: '147',
        chamber: 'IV',
        page: '73',
        title: 'Strafrecht Test',
        date: '2021-01-15',
        language: 'de',
        summary: 'Test summary',
        legal_areas: ['Strafrecht', 'Verfahrensrecht']
      };

      await repository.create(decision);

      const found = await repository.findByCitation('BGE 147 IV 73');
      expect(found).not.toBeNull();
      expect(found?.citation).toBe('BGE 147 IV 73');
      expect(found?.title).toBe('Strafrecht Test');
      expect(found?.legal_areas).toEqual(['Strafrecht', 'Verfahrensrecht']);
    });

    test('should handle minimal required fields', async () => {
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 148 I 1',
        language: 'de'
      };

      await repository.create(decision);

      const found = await repository.findByCitation('BGE 148 I 1');
      expect(found).not.toBeNull();
      expect(found?.citation).toBe('BGE 148 I 1');
    });
  });

  describe('findByCitation', () => {
    test('should find decision by citation', async () => {
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 149 II 123',
        language: 'fr'
      };

      await repository.create(decision);

      const found = await repository.findByCitation('BGE 149 II 123');
      expect(found).not.toBeNull();
      expect(found?.citation).toBe('BGE 149 II 123');
    });

    test('should return null for non-existent citation', async () => {
      const found = await repository.findByCitation('BGE 999 IX 999');
      expect(found).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    beforeEach(async () => {
      const decisions: BGEDecision[] = [
        {
          id: randomUUID(),
          citation: 'BGE 147 I 1',
          date: '2021-01-15',
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 I 2',
          date: '2021-06-20',
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 148 I 1',
          date: '2022-03-10',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should find decisions in date range', async () => {
      const startDate = new Date('2021-01-01');
      const endDate = new Date('2021-12-31');

      const results = await repository.findByDateRange(startDate, endDate);
      expect(results).toHaveLength(2);
      expect(results[0].citation).toBe('BGE 147 I 2'); // Most recent first
      expect(results[1].citation).toBe('BGE 147 I 1');
    });

    test('should return empty array for no matches', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      const results = await repository.findByDateRange(startDate, endDate);
      expect(results).toHaveLength(0);
    });
  });

  describe('findByChamber', () => {
    beforeEach(async () => {
      const decisions: BGEDecision[] = [
        {
          id: randomUUID(),
          citation: 'BGE 147 I 1',
          chamber: 'I',
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 IV 1',
          chamber: 'IV',
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 IV 2',
          chamber: 'IV',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should find decisions by chamber', async () => {
      const results = await repository.findByChamber('IV');
      expect(results).toHaveLength(2);
      expect(results.every(d => d.chamber === 'IV')).toBe(true);
    });
  });

  describe('findByLanguage', () => {
    beforeEach(async () => {
      const decisions: BGEDecision[] = [
        {
          id: randomUUID(),
          citation: 'BGE 147 I 1',
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 I 2',
          language: 'fr'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 I 3',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should find decisions by language', async () => {
      const results = await repository.findByLanguage('de');
      expect(results).toHaveLength(2);
      expect(results.every(d => d.language === 'de')).toBe(true);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const decisions: BGEDecision[] = [
        {
          id: randomUUID(),
          citation: 'BGE 147 I 1',
          title: 'Strafrecht und Verfahren',
          summary: 'Ein wichtiger Fall',
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 I 2',
          title: 'Zivilrecht Vertrag',
          summary: 'Vertragsrecht',
          language: 'de'
        },
        {
          id: randomUUID(),
          citation: 'BGE 147 I 3',
          title: 'Verwaltungsrecht',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should search by title', async () => {
      const results = await repository.search('Strafrecht');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Strafrecht');
    });

    test('should search by summary', async () => {
      const results = await repository.search('wichtiger');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].summary).toContain('wichtiger');
    });

    test('should return empty array for no matches', async () => {
      const results = await repository.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('update', () => {
    test('should update decision fields', async () => {
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 147 I 1',
        title: 'Original Title',
        language: 'de'
      };

      await repository.create(decision);

      await repository.update(decision.id, {
        title: 'Updated Title',
        summary: 'New summary'
      });

      const updated = await repository.findByCitation('BGE 147 I 1');
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.summary).toBe('New summary');
    });

    test('should throw error when no fields to update', async () => {
      const id = randomUUID();
      await expect(repository.update(id, {})).rejects.toThrow('No fields to update');
    });
  });

  describe('delete', () => {
    test('should delete decision', async () => {
      const decision: BGEDecision = {
        id: randomUUID(),
        citation: 'BGE 147 I 1',
        language: 'de'
      };

      await repository.create(decision);

      let found = await repository.findByCitation('BGE 147 I 1');
      expect(found).not.toBeNull();

      await repository.delete(decision.id);

      found = await repository.findByCitation('BGE 147 I 1');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    test('should find all decisions with limit', async () => {
      const decisions: BGEDecision[] = [];
      for (let i = 1; i <= 5; i++) {
        decisions.push({
          id: randomUUID(),
          citation: `BGE 147 I ${i}`,
          language: 'de'
        });
      }

      for (const decision of decisions) {
        await repository.create(decision);
      }

      const results = await repository.findAll(3);
      expect(results).toHaveLength(3);
    });
  });

  describe('count', () => {
    test('should count total decisions', async () => {
      const decisions: BGEDecision[] = [];
      for (let i = 1; i <= 5; i++) {
        decisions.push({
          id: randomUUID(),
          citation: `BGE 147 I ${i}`,
          language: 'de'
        });
      }

      for (const decision of decisions) {
        await repository.create(decision);
      }

      const count = await repository.count();
      expect(count).toBe(5);
    });

    test('should return 0 for empty table', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });
});
