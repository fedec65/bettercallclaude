/**
 * Cantonal Repository Tests
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseClient, DatabaseConfig } from '../../../database/client';
import { CantonalRepository, CantonalDecision } from '../../../database/repositories/cantonal-repository';
import { randomUUID } from 'crypto';

describe('CantonalRepository', () => {
  let client: DatabaseClient;
  let repository: CantonalRepository;

  beforeEach(async () => {
    const config: DatabaseConfig = {
      type: 'sqlite',
      memory: true
    };
    client = new DatabaseClient(config);
    await client.connect();
    await client.migrate();
    repository = new CantonalRepository(client);
  });

  afterEach(async () => {
    await client.close();
  });

  describe('create', () => {
    test('should create a new cantonal decision', async () => {
      const decision: CantonalDecision = {
        id: randomUUID(),
        canton: 'ZH',
        citation: 'ZH-2024-001',
        court_name: 'Obergericht Zürich',
        decision_number: '2024-001',
        title: 'Arbeitsrecht Fall',
        date: '2024-01-15',
        language: 'de',
        summary: 'Test summary',
        legal_areas: ['Arbeitsrecht', 'Verfahrensrecht']
      };

      await repository.create(decision);

      const found = await repository.findByCitation('ZH-2024-001');
      expect(found).not.toBeNull();
      expect(found?.canton).toBe('ZH');
      expect(found?.citation).toBe('ZH-2024-001');
      expect(found?.legal_areas).toEqual(['Arbeitsrecht', 'Verfahrensrecht']);
    });

    test('should reject invalid canton code format', async () => {
      const decision: CantonalDecision = {
        id: randomUUID(),
        canton: 'ZUR', // Invalid - must be 2 letters
        citation: 'ZUR-2024-001',
        language: 'de'
      };

      await expect(repository.create(decision)).rejects.toThrow('Invalid canton code');
    });

    test('should handle minimal required fields', async () => {
      const decision: CantonalDecision = {
        id: randomUUID(),
        canton: 'BE',
        citation: 'BE-2024-001',
        language: 'de'
      };

      await repository.create(decision);

      const found = await repository.findByCitation('BE-2024-001');
      expect(found).not.toBeNull();
      expect(found?.canton).toBe('BE');
    });
  });

  describe('findByCitation', () => {
    test('should find decision by citation', async () => {
      const decision: CantonalDecision = {
        id: randomUUID(),
        canton: 'GE',
        citation: 'GE-2024-123',
        language: 'fr'
      };

      await repository.create(decision);

      const found = await repository.findByCitation('GE-2024-123');
      expect(found).not.toBeNull();
      expect(found?.citation).toBe('GE-2024-123');
    });

    test('should return null for non-existent citation', async () => {
      const found = await repository.findByCitation('XX-9999-999');
      expect(found).toBeNull();
    });
  });

  describe('findByCanton', () => {
    beforeEach(async () => {
      const decisions: CantonalDecision[] = [
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2024-001',
          language: 'de'
        },
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2024-002',
          language: 'de'
        },
        {
          id: randomUUID(),
          canton: 'BE',
          citation: 'BE-2024-001',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should find all decisions from a canton', async () => {
      const zhDecisions = await repository.findByCanton('ZH');
      expect(zhDecisions).toHaveLength(2);
      expect(zhDecisions.every(d => d.canton === 'ZH')).toBe(true);
    });

    test('should return empty array for canton with no decisions', async () => {
      const decisions = await repository.findByCanton('TI');
      expect(decisions).toHaveLength(0);
    });
  });

  describe('findByDateRange', () => {
    beforeEach(async () => {
      const decisions: CantonalDecision[] = [
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2023-001',
          date: '2023-06-15',
          language: 'de'
        },
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2024-001',
          date: '2024-01-20',
          language: 'de'
        },
        {
          id: randomUUID(),
          canton: 'BE',
          citation: 'BE-2024-001',
          date: '2024-03-10',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should find decisions in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const results = await repository.findByDateRange(startDate, endDate);
      expect(results).toHaveLength(2);
    });
  });

  describe('findByLanguage', () => {
    beforeEach(async () => {
      const decisions: CantonalDecision[] = [
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2024-001',
          language: 'de'
        },
        {
          id: randomUUID(),
          canton: 'GE',
          citation: 'GE-2024-001',
          language: 'fr'
        },
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2024-002',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should find decisions by language', async () => {
      const deDecisions = await repository.findByLanguage('de');
      expect(deDecisions).toHaveLength(2);
      expect(deDecisions.every(d => d.language === 'de')).toBe(true);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const decisions: CantonalDecision[] = [
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2024-001',
          title: 'Arbeitsrecht und Kündigung',
          summary: 'Wichtiger Fall',
          language: 'de'
        },
        {
          id: randomUUID(),
          canton: 'BE',
          citation: 'BE-2024-001',
          title: 'Mietrecht Vertrag',
          summary: 'Vertragsverletzung',
          language: 'de'
        },
        {
          id: randomUUID(),
          canton: 'ZH',
          citation: 'ZH-2024-002',
          title: 'Verwaltungsrecht',
          language: 'de'
        }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should search by title', async () => {
      const results = await repository.search('Arbeitsrecht');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Arbeitsrecht');
    });

    test('should search by summary', async () => {
      const results = await repository.search('Wichtiger');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].summary).toContain('Wichtiger');
    });

    test('should search with canton filter', async () => {
      const results = await repository.search('Vertrag', 'BE');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(d => d.canton === 'BE')).toBe(true);
    });

    test('should return empty array for no matches', async () => {
      const results = await repository.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('update', () => {
    test('should update decision fields', async () => {
      const decision: CantonalDecision = {
        id: randomUUID(),
        canton: 'ZH',
        citation: 'ZH-2024-001',
        title: 'Original Title',
        language: 'de'
      };

      await repository.create(decision);

      await repository.update(decision.id, {
        title: 'Updated Title',
        summary: 'New summary'
      });

      const updated = await repository.findByCitation('ZH-2024-001');
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
      const decision: CantonalDecision = {
        id: randomUUID(),
        canton: 'ZH',
        citation: 'ZH-2024-001',
        language: 'de'
      };

      await repository.create(decision);

      let found = await repository.findByCitation('ZH-2024-001');
      expect(found).not.toBeNull();

      await repository.delete(decision.id);

      found = await repository.findByCitation('ZH-2024-001');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    test('should find all decisions with limit', async () => {
      const decisions: CantonalDecision[] = [];
      for (let i = 1; i <= 5; i++) {
        decisions.push({
          id: randomUUID(),
          canton: 'ZH',
          citation: `ZH-2024-${i.toString().padStart(3, '0')}`,
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

  describe('countByCanton', () => {
    beforeEach(async () => {
      const decisions: CantonalDecision[] = [
        { id: randomUUID(), canton: 'ZH', citation: 'ZH-1', language: 'de' },
        { id: randomUUID(), canton: 'ZH', citation: 'ZH-2', language: 'de' },
        { id: randomUUID(), canton: 'BE', citation: 'BE-1', language: 'de' },
        { id: randomUUID(), canton: 'ZH', citation: 'ZH-3', language: 'de' }
      ];

      for (const decision of decisions) {
        await repository.create(decision);
      }
    });

    test('should count decisions by canton', async () => {
      const zhCount = await repository.countByCanton('ZH');
      expect(zhCount).toBe(3);

      const beCount = await repository.countByCanton('BE');
      expect(beCount).toBe(1);
    });

    test('should return 0 for canton with no decisions', async () => {
      const count = await repository.countByCanton('GE');
      expect(count).toBe(0);
    });
  });

  describe('count', () => {
    test('should count total decisions', async () => {
      const decisions: CantonalDecision[] = [];
      for (let i = 1; i <= 5; i++) {
        decisions.push({
          id: randomUUID(),
          canton: 'ZH',
          citation: `ZH-2024-${i}`,
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
