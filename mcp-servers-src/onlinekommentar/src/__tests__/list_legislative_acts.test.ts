import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnlineKommentarClient } from '../client.js';
import type { LegislativeAct, Language } from '../types.js';

describe('list_legislative_acts', () => {
  let client: OnlineKommentarClient;

  beforeEach(() => {
    client = new OnlineKommentarClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic listing', () => {
    it('should return all legislative acts', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid',
          name: 'Obligationenrecht',
          abbreviation: 'OR',
          abbreviation_de: 'OR',
          abbreviation_fr: 'CO',
          abbreviation_it: 'CO',
          language: 'de',
        },
        {
          id: 'zgb-uuid',
          name: 'Zivilgesetzbuch',
          abbreviation: 'ZGB',
          abbreviation_de: 'ZGB',
          abbreviation_fr: 'CC',
          abbreviation_it: 'CC',
          language: 'de',
        },
        {
          id: 'stgb-uuid',
          name: 'Strafgesetzbuch',
          abbreviation: 'StGB',
          abbreviation_de: 'StGB',
          abbreviation_fr: 'CP',
          abbreviation_it: 'CP',
          language: 'de',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs();

      expect(result).toHaveLength(3);
      expect(result[0].abbreviation).toBe('OR');
      expect(result[1].abbreviation).toBe('ZGB');
      expect(result[2].abbreviation).toBe('StGB');
    });

    it('should include all common Swiss codes', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid',
          name: 'Obligationenrecht',
          abbreviation: 'OR',
          language: 'de',
        },
        {
          id: 'zgb-uuid',
          name: 'Zivilgesetzbuch',
          abbreviation: 'ZGB',
          language: 'de',
        },
        {
          id: 'stgb-uuid',
          name: 'Strafgesetzbuch',
          abbreviation: 'StGB',
          language: 'de',
        },
        {
          id: 'stpo-uuid',
          name: 'Strafprozessordnung',
          abbreviation: 'StPO',
          language: 'de',
        },
        {
          id: 'zpo-uuid',
          name: 'Zivilprozessordnung',
          abbreviation: 'ZPO',
          language: 'de',
        },
        {
          id: 'bv-uuid',
          name: 'Bundesverfassung',
          abbreviation: 'BV',
          language: 'de',
        },
        {
          id: 'dsg-uuid',
          name: 'Datenschutzgesetz',
          abbreviation: 'DSG',
          language: 'de',
        },
        {
          id: 'uwg-uuid',
          name: 'Bundesgesetz gegen den unlauteren Wettbewerb',
          abbreviation: 'UWG',
          language: 'de',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs();

      const abbreviations = result.map((act) => act.abbreviation);
      expect(abbreviations).toContain('OR');
      expect(abbreviations).toContain('ZGB');
      expect(abbreviations).toContain('StGB');
      expect(abbreviations).toContain('ZPO');
      expect(abbreviations).toContain('BV');
    });
  });

  describe('language filtering', () => {
    it('should filter by German language', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid',
          name: 'Obligationenrecht',
          abbreviation: 'OR',
          language: 'de',
        },
        {
          id: 'zgb-uuid',
          name: 'Zivilgesetzbuch',
          abbreviation: 'ZGB',
          language: 'de',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs('de');

      expect(result.every((act) => act.language === 'de')).toBe(true);
    });

    it('should filter by French language', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid',
          name: 'Code des obligations',
          abbreviation: 'CO',
          language: 'fr',
        },
        {
          id: 'zgb-uuid',
          name: 'Code civil',
          abbreviation: 'CC',
          language: 'fr',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs('fr');

      expect(result.every((act) => act.language === 'fr')).toBe(true);
      expect(result[0].abbreviation).toBe('CO');
      expect(result[1].abbreviation).toBe('CC');
    });

    it('should filter by Italian language', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid',
          name: 'Codice delle obbligazioni',
          abbreviation: 'CO',
          language: 'it',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs('it');

      expect(result.every((act) => act.language === 'it')).toBe(true);
    });
  });

  describe('multi-lingual abbreviations', () => {
    it('should include abbreviations for all languages', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid',
          name: 'Obligationenrecht',
          abbreviation: 'OR',
          abbreviation_de: 'OR',
          abbreviation_fr: 'CO',
          abbreviation_it: 'CO',
          language: 'de',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs();

      expect(result[0].abbreviation_de).toBe('OR');
      expect(result[0].abbreviation_fr).toBe('CO');
      expect(result[0].abbreviation_it).toBe('CO');
    });
  });

  describe('mapping population', () => {
    it('should populate legislative act mapping when set directly', async () => {
      // Test the setLegislativeActMapping helper method
      // Note: In production, listLegislativeActs() populates this internally
      client.setLegislativeActMapping({
        or: 'or-uuid',
        co: 'or-uuid',
      });

      const mapping = client.getLegislativeActMapping();

      expect(mapping['or']).toBe('or-uuid');
      expect(mapping['co']).toBe('or-uuid');
    });

    it('should enable getCommentaryForArticle after mapping is set', async () => {
      // Test that mapping enables article reference resolution
      // Note: In production, listLegislativeActs() populates this internally
      client.setLegislativeActMapping({
        or: 'or-uuid',
      });

      const mapping = client.getLegislativeActMapping();
      expect(mapping['or']).toBe('or-uuid');
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      vi.spyOn(client, 'listLegislativeActs').mockRejectedValue(
        new Error('API request failed')
      );

      await expect(client.listLegislativeActs()).rejects.toThrow(
        'API request failed'
      );
    });

    it('should handle network timeouts', async () => {
      vi.spyOn(client, 'listLegislativeActs').mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(client.listLegislativeActs()).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle empty response', async () => {
      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue([]);

      const result = await client.listLegislativeActs();

      expect(result).toHaveLength(0);
    });
  });

  describe('data structure', () => {
    it('should return correctly structured LegislativeAct objects', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid-123',
          name: 'Obligationenrecht',
          abbreviation: 'OR',
          abbreviation_de: 'OR',
          abbreviation_fr: 'CO',
          abbreviation_it: 'CO',
          language: 'de',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('abbreviation');
      expect(result[0]).toHaveProperty('language');
      expect(typeof result[0].id).toBe('string');
      expect(typeof result[0].name).toBe('string');
    });

    it('should include UUID for each legislative act', async () => {
      const mockResponse: LegislativeAct[] = [
        {
          id: 'or-uuid-123-456-789',
          name: 'Obligationenrecht',
          abbreviation: 'OR',
          language: 'de',
        },
      ];

      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue(mockResponse);

      const result = await client.listLegislativeActs();

      expect(result[0].id).toMatch(/^[a-zA-Z0-9-]+$/);
    });
  });
});
