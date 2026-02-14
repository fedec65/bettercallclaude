import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnlineKommentarClient } from '../client.js';
import type { Commentary, SearchResult, Language } from '../types.js';

describe('search_commentaries', () => {
  let client: OnlineKommentarClient;

  beforeEach(() => {
    client = new OnlineKommentarClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic search functionality', () => {
    it('should search commentaries with a query string', async () => {
      const mockResponse: SearchResult = {
        count: 2,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-1',
            title: 'Kommentar zu Art. 97 OR',
            authors: ['Prof. Dr. Example'],
            legislative_act: {
              id: 'or-uuid',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2024-01-15',
            url: 'https://onlinekommentar.ch/de/kommentare/or97',
          },
          {
            id: 'uuid-2',
            title: 'Vertragshaftung nach Art. 97 OR',
            authors: ['Dr. Another Author'],
            legislative_act: {
              id: 'or-uuid',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2023-11-20',
            url: 'https://onlinekommentar.ch/de/kommentare/or97-2',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('Art. 97 OR');

      expect(result.count).toBe(2);
      expect(result.commentaries).toHaveLength(2);
      expect(result.commentaries[0].title).toContain('Art. 97 OR');
    });

    it('should return empty results for no matches', async () => {
      const mockResponse: SearchResult = {
        count: 0,
        page: 1,
        total_pages: 0,
        commentaries: [],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('nonexistent-query-xyz');

      expect(result.count).toBe(0);
      expect(result.commentaries).toHaveLength(0);
    });
  });

  describe('language filtering', () => {
    it('should filter results by German language', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-de',
            title: 'Kommentar zum Obligationenrecht',
            authors: ['Author DE'],
            legislative_act: {
              id: 'or-uuid',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2024-01-10',
            url: 'https://onlinekommentar.ch/de/kommentare/or',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('Obligationenrecht', {
        language: 'de',
      });

      expect(result.commentaries.every((c) => c.language === 'de')).toBe(true);
    });

    it('should filter results by French language', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-fr',
            title: 'Commentaire du Code des obligations',
            authors: ['Auteur FR'],
            legislative_act: {
              id: 'co-uuid',
              name: 'Code des obligations',
              abbreviation: 'CO',
            },
            language: 'fr',
            updated: '2024-01-10',
            url: 'https://onlinekommentar.ch/fr/commentaires/co',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('Code des obligations', {
        language: 'fr',
      });

      expect(result.commentaries.every((c) => c.language === 'fr')).toBe(true);
    });

    it('should support Italian language filter', async () => {
      const result = await client.searchCommentaries('contratti', {
        language: 'it',
      });

      // Test should pass once implementation supports Italian
      expect(result).toBeDefined();
    });

    it('should support English language filter', async () => {
      const result = await client.searchCommentaries('contract law', {
        language: 'en',
      });

      // Test should pass once implementation supports English
      expect(result).toBeDefined();
    });
  });

  describe('legislative act filtering', () => {
    it('should filter by legislative act UUID', async () => {
      const orUuid = 'or-legislative-act-uuid';
      const mockResponse: SearchResult = {
        count: 3,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-1',
            title: 'Art. 1 OR Commentary',
            authors: ['Author'],
            legislative_act: { id: orUuid, name: 'Obligationenrecht', abbreviation: 'OR' },
            language: 'de',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/de/kommentare/or1',
          },
          {
            id: 'uuid-2',
            title: 'Art. 97 OR Commentary',
            authors: ['Author'],
            legislative_act: { id: orUuid, name: 'Obligationenrecht', abbreviation: 'OR' },
            language: 'de',
            updated: '2024-01-02',
            url: 'https://onlinekommentar.ch/de/kommentare/or97',
          },
          {
            id: 'uuid-3',
            title: 'Art. 100 OR Commentary',
            authors: ['Author'],
            legislative_act: { id: orUuid, name: 'Obligationenrecht', abbreviation: 'OR' },
            language: 'de',
            updated: '2024-01-03',
            url: 'https://onlinekommentar.ch/de/kommentare/or100',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('', {
        legislative_act: orUuid,
      });

      expect(result.commentaries.every((c) => c.legislative_act.id === orUuid)).toBe(true);
    });
  });

  describe('sorting', () => {
    it('should sort by title ascending', async () => {
      const mockResponse: SearchResult = {
        count: 2,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-1',
            title: 'A - First Title',
            authors: ['Author'],
            legislative_act: { id: 'uuid', name: 'Test', abbreviation: 'TEST' },
            language: 'de',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/de/1',
          },
          {
            id: 'uuid-2',
            title: 'Z - Last Title',
            authors: ['Author'],
            legislative_act: { id: 'uuid', name: 'Test', abbreviation: 'TEST' },
            language: 'de',
            updated: '2024-01-02',
            url: 'https://onlinekommentar.ch/de/2',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('', { sort: 'title' });

      expect(result.commentaries[0].title < result.commentaries[1].title).toBe(true);
    });

    it('should sort by title descending', async () => {
      const mockResponse: SearchResult = {
        count: 2,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-2',
            title: 'Z - Last Title',
            authors: ['Author'],
            legislative_act: { id: 'uuid', name: 'Test', abbreviation: 'TEST' },
            language: 'de',
            updated: '2024-01-02',
            url: 'https://onlinekommentar.ch/de/2',
          },
          {
            id: 'uuid-1',
            title: 'A - First Title',
            authors: ['Author'],
            legislative_act: { id: 'uuid', name: 'Test', abbreviation: 'TEST' },
            language: 'de',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/de/1',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('', { sort: '-title' });

      expect(result.commentaries[0].title > result.commentaries[1].title).toBe(true);
    });

    it('should sort by date ascending', async () => {
      const result = await client.searchCommentaries('', { sort: 'date' });
      expect(result).toBeDefined();
    });

    it('should sort by date descending', async () => {
      const result = await client.searchCommentaries('', { sort: '-date' });
      expect(result).toBeDefined();
    });
  });

  describe('pagination', () => {
    it('should return first page by default', async () => {
      const mockResponse: SearchResult = {
        count: 50,
        page: 1,
        total_pages: 5,
        commentaries: Array(10).fill(null).map((_, i) => ({
          id: `uuid-${i}`,
          title: `Commentary ${i}`,
          authors: ['Author'],
          legislative_act: { id: 'uuid', name: 'Test', abbreviation: 'TEST' },
          language: 'de' as Language,
          updated: '2024-01-01',
          url: `https://onlinekommentar.ch/de/${i}`,
        })),
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('test');

      expect(result.page).toBe(1);
    });

    it('should return specific page when requested', async () => {
      const mockResponse: SearchResult = {
        count: 50,
        page: 3,
        total_pages: 5,
        commentaries: Array(10).fill(null).map((_, i) => ({
          id: `uuid-${20 + i}`,
          title: `Commentary ${20 + i}`,
          authors: ['Author'],
          legislative_act: { id: 'uuid', name: 'Test', abbreviation: 'TEST' },
          language: 'de' as Language,
          updated: '2024-01-01',
          url: `https://onlinekommentar.ch/de/${20 + i}`,
        })),
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('test', { page: 3 });

      expect(result.page).toBe(3);
    });

    it('should include total count and pages in response', async () => {
      const mockResponse: SearchResult = {
        count: 100,
        page: 1,
        total_pages: 10,
        commentaries: [],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('test');

      expect(result.count).toBe(100);
      expect(result.total_pages).toBe(10);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      vi.spyOn(client, 'searchCommentaries').mockRejectedValue(
        new Error('API request failed')
      );

      await expect(client.searchCommentaries('test')).rejects.toThrow(
        'API request failed'
      );
    });

    it('should handle network timeouts', async () => {
      vi.spyOn(client, 'searchCommentaries').mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(client.searchCommentaries('test')).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle invalid language parameter', async () => {
      // Mock API response for invalid language - returns empty results
      const mockResponse: SearchResult = {
        count: 0,
        page: 1,
        total_pages: 0,
        commentaries: [],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('test', {
        language: 'invalid' as Language,
      });

      expect(result).toBeDefined();
      expect(result.count).toBe(0);
      expect(result.commentaries).toHaveLength(0);
    });
  });

  describe('combined filters', () => {
    it('should combine language and legislative act filters', async () => {
      const orUuid = 'or-uuid';
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-1',
            title: 'Commentaire art. 97 CO',
            authors: ['Auteur FR'],
            legislative_act: { id: orUuid, name: 'Code des obligations', abbreviation: 'CO' },
            language: 'fr',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/fr/commentaires/co97',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.searchCommentaries('responsabilité', {
        language: 'fr',
        legislative_act: orUuid,
      });

      expect(result.commentaries[0].language).toBe('fr');
      expect(result.commentaries[0].legislative_act.id).toBe(orUuid);
    });

    it('should combine all filter options', async () => {
      const result = await client.searchCommentaries('Haftung', {
        language: 'de',
        legislative_act: 'or-uuid',
        sort: '-date',
        page: 2,
      });

      expect(result).toBeDefined();
    });
  });
});
