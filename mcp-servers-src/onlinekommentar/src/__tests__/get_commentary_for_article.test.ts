import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnlineKommentarClient } from '../client.js';
import type { SearchResult, Language } from '../types.js';

describe('get_commentary_for_article', () => {
  let client: OnlineKommentarClient;

  beforeEach(() => {
    client = new OnlineKommentarClient();
    // Pre-populate legislative act mapping for tests
    client.setLegislativeActMapping({
      or: 'or-uuid-123',
      co: 'or-uuid-123', // French/Italian abbreviation
      zgb: 'zgb-uuid-456',
      cc: 'zgb-uuid-456', // French abbreviation
      stgb: 'stgb-uuid-789',
      cp: 'stgb-uuid-789', // French abbreviation
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('article reference parsing', () => {
    it('should parse simple German format: Art. 97 OR', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-1',
            title: 'Kommentar zu Art. 97 OR',
            authors: ['Author'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/de/kommentare/or97',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('Art. 97 OR');

      expect(result.commentaries).toHaveLength(1);
      expect(result.commentaries[0].title).toContain('Art. 97 OR');
    });

    it('should parse German format with paragraph: Art. 97 Abs. 1 OR', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-1',
            title: 'Kommentar zu Art. 97 Abs. 1 OR',
            authors: ['Author'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/de/kommentare/or97-1',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('Art. 97 Abs. 1 OR');

      expect(result.commentaries).toHaveLength(1);
    });

    it('should parse French format: art. 97 al. 2 CO', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-fr',
            title: 'Commentaire art. 97 al. 2 CO',
            authors: ['Auteur'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Code des obligations',
              abbreviation: 'CO',
            },
            language: 'fr',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/fr/commentaires/co97-2',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('art. 97 al. 2 CO');

      expect(result.commentaries).toHaveLength(1);
    });

    it('should parse Italian format: art. 97 cpv. 1 CO', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-it',
            title: 'Commento art. 97 cpv. 1 CO',
            authors: ['Autore'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Codice delle obbligazioni',
              abbreviation: 'CO',
            },
            language: 'it',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/it/commentari/co97-1',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('art. 97 cpv. 1 CO');

      expect(result.commentaries).toHaveLength(1);
    });

    it('should handle article with letter: Art. 97 Abs. 1 lit. a OR', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle(
        'Art. 97 Abs. 1 lit. a OR'
      );

      expect(result).toBeDefined();
    });

    it('should handle article numbers with suffixes: Art. 97bis OR', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('Art. 97bis OR');

      expect(result).toBeDefined();
    });
  });

  describe('legislative act resolution', () => {
    it('should resolve OR to correct UUID', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [],
      };

      const searchSpy = vi
        .spyOn(client, 'searchCommentaries')
        .mockResolvedValue(mockResponse);

      await client.getCommentaryForArticle('Art. 97 OR');

      expect(searchSpy).toHaveBeenCalledWith(expect.any(String), {
        language: undefined,
        legislative_act: 'or-uuid-123',
      });
    });

    it('should resolve CO (French) to OR UUID', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [],
      };

      const searchSpy = vi
        .spyOn(client, 'searchCommentaries')
        .mockResolvedValue(mockResponse);

      await client.getCommentaryForArticle('art. 97 CO');

      expect(searchSpy).toHaveBeenCalledWith(expect.any(String), {
        language: undefined,
        legislative_act: 'or-uuid-123',
      });
    });

    it('should resolve ZGB correctly', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [],
      };

      const searchSpy = vi
        .spyOn(client, 'searchCommentaries')
        .mockResolvedValue(mockResponse);

      await client.getCommentaryForArticle('Art. 1 ZGB');

      expect(searchSpy).toHaveBeenCalledWith(expect.any(String), {
        language: undefined,
        legislative_act: 'zgb-uuid-456',
      });
    });

    it('should resolve CC (French for ZGB) correctly', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [],
      };

      const searchSpy = vi
        .spyOn(client, 'searchCommentaries')
        .mockResolvedValue(mockResponse);

      await client.getCommentaryForArticle('art. 1 CC');

      expect(searchSpy).toHaveBeenCalledWith(expect.any(String), {
        language: undefined,
        legislative_act: 'zgb-uuid-456',
      });
    });
  });

  describe('language filtering', () => {
    it('should pass language filter to search', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [],
      };

      const searchSpy = vi
        .spyOn(client, 'searchCommentaries')
        .mockResolvedValue(mockResponse);

      await client.getCommentaryForArticle('Art. 97 OR', 'de');

      expect(searchSpy).toHaveBeenCalledWith(expect.any(String), {
        language: 'de',
        legislative_act: 'or-uuid-123',
      });
    });

    it('should return French commentaries when language is fr', async () => {
      const mockResponse: SearchResult = {
        count: 1,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-fr',
            title: 'Commentaire art. 97 CO',
            authors: ['Auteur FR'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Code des obligations',
              abbreviation: 'CO',
            },
            language: 'fr',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/fr/commentaires/co97',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('art. 97 CO', 'fr');

      expect(result.commentaries[0].language).toBe('fr');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid article format', async () => {
      await expect(
        client.getCommentaryForArticle('invalid reference')
      ).rejects.toThrow('Invalid article reference format');
    });

    it('should throw error for empty article reference', async () => {
      await expect(client.getCommentaryForArticle('')).rejects.toThrow(
        'Invalid article reference format'
      );
    });

    it('should throw error for unknown legislative act', async () => {
      // Clear the mapping to test unknown act
      client.setLegislativeActMapping({});

      // Mock listLegislativeActs to return empty
      vi.spyOn(client, 'listLegislativeActs').mockResolvedValue([]);

      await expect(
        client.getCommentaryForArticle('Art. 1 UNKNOWN')
      ).rejects.toThrow('Unknown legislative act: UNKNOWN');
    });

    it('should handle API errors gracefully', async () => {
      vi.spyOn(client, 'searchCommentaries').mockRejectedValue(
        new Error('API request failed')
      );

      await expect(
        client.getCommentaryForArticle('Art. 97 OR')
      ).rejects.toThrow('API request failed');
    });
  });

  describe('integration behavior', () => {
    it('should return multiple commentaries for popular articles', async () => {
      const mockResponse: SearchResult = {
        count: 3,
        page: 1,
        total_pages: 1,
        commentaries: [
          {
            id: 'uuid-1',
            title: 'Kommentar 1 zu Art. 97 OR',
            authors: ['Author 1'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2024-01-01',
            url: 'https://onlinekommentar.ch/de/kommentare/or97-1',
          },
          {
            id: 'uuid-2',
            title: 'Kommentar 2 zu Art. 97 OR',
            authors: ['Author 2'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2024-01-02',
            url: 'https://onlinekommentar.ch/de/kommentare/or97-2',
          },
          {
            id: 'uuid-3',
            title: 'Kommentar 3 zu Art. 97 OR',
            authors: ['Author 3'],
            legislative_act: {
              id: 'or-uuid-123',
              name: 'Obligationenrecht',
              abbreviation: 'OR',
            },
            language: 'de',
            updated: '2024-01-03',
            url: 'https://onlinekommentar.ch/de/kommentare/or97-3',
          },
        ],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('Art. 97 OR');

      expect(result.count).toBe(3);
      expect(result.commentaries).toHaveLength(3);
    });

    it('should handle articles with no commentaries', async () => {
      const mockResponse: SearchResult = {
        count: 0,
        page: 1,
        total_pages: 0,
        commentaries: [],
      };

      vi.spyOn(client, 'searchCommentaries').mockResolvedValue(mockResponse);

      const result = await client.getCommentaryForArticle('Art. 999 OR');

      expect(result.count).toBe(0);
      expect(result.commentaries).toHaveLength(0);
    });
  });
});
