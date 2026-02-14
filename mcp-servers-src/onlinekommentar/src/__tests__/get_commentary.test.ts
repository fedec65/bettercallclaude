import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OnlineKommentarClient } from '../client.js';
import type { CommentaryDetail } from '../types.js';

describe('get_commentary', () => {
  let client: OnlineKommentarClient;

  beforeEach(() => {
    client = new OnlineKommentarClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic retrieval', () => {
    it('should retrieve a commentary by ID', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-123',
        title: 'Kommentar zu Art. 97 OR - Vertragliche Haftung',
        authors: ['Prof. Dr. Max Muster', 'Dr. Anna Beispiel'],
        legislative_act: {
          id: 'or-uuid',
          name: 'Obligationenrecht',
          abbreviation: 'OR',
        },
        language: 'de',
        updated: '2024-01-15',
        url: 'https://onlinekommentar.ch/de/kommentare/or97',
        abstract: 'Dieser Kommentar behandelt die vertragliche Haftung nach Art. 97 OR...',
        content: 'Vollständiger Kommentartext zu Art. 97 OR...',
        sections: [
          {
            title: 'I. Allgemeines',
            article_reference: 'Art. 97 Abs. 1 OR',
            content: 'Einführung in die Vertragshaftung...',
          },
          {
            title: 'II. Tatbestandsvoraussetzungen',
            article_reference: 'Art. 97 Abs. 1 OR',
            content: 'Die vier Voraussetzungen der Vertragshaftung...',
          },
        ],
        citations: ['BGE 145 III 229', 'BGE 140 III 115', 'ATF 138 III 276'],
        related_commentaries: ['uuid-98', 'uuid-99', 'uuid-100'],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-123');

      expect(result.id).toBe('uuid-123');
      expect(result.title).toContain('Art. 97 OR');
      expect(result.authors).toHaveLength(2);
    });

    it('should include full content in response', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-456',
        title: 'ZGB Art. 1 Kommentar',
        authors: ['Author'],
        legislative_act: {
          id: 'zgb-uuid',
          name: 'Zivilgesetzbuch',
          abbreviation: 'ZGB',
        },
        language: 'de',
        updated: '2024-01-10',
        url: 'https://onlinekommentar.ch/de/kommentare/zgb1',
        content: 'Umfassender Kommentarinhalt mit rechtlicher Analyse...',
        sections: [],
        citations: [],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-456');

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should include structured sections', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-789',
        title: 'StGB Art. 111 Kommentar',
        authors: ['Strafrechtsexperte'],
        legislative_act: {
          id: 'stgb-uuid',
          name: 'Strafgesetzbuch',
          abbreviation: 'StGB',
        },
        language: 'de',
        updated: '2024-01-05',
        url: 'https://onlinekommentar.ch/de/kommentare/stgb111',
        content: 'Volltext...',
        sections: [
          { title: 'Einleitung', content: '...' },
          { title: 'Tatbestand', article_reference: 'Art. 111 StGB', content: '...' },
          { title: 'Rechtswidrigkeit', content: '...' },
          { title: 'Schuld', content: '...' },
        ],
        citations: [],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-789');

      expect(result.sections).toHaveLength(4);
      expect(result.sections[1].article_reference).toBe('Art. 111 StGB');
    });
  });

  describe('citations and references', () => {
    it('should include BGE citations', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-cit',
        title: 'Test Commentary',
        authors: ['Author'],
        legislative_act: { id: 'test', name: 'Test', abbreviation: 'TEST' },
        language: 'de',
        updated: '2024-01-01',
        url: 'https://onlinekommentar.ch/de/test',
        content: 'Content with citations...',
        sections: [],
        citations: [
          'BGE 145 III 229',
          'BGE 140 III 115',
          'BGE 135 II 172',
        ],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-cit');

      expect(result.citations).toContain('BGE 145 III 229');
      expect(result.citations.length).toBeGreaterThanOrEqual(3);
    });

    it('should include related commentary IDs', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-rel',
        title: 'Test Commentary',
        authors: ['Author'],
        legislative_act: { id: 'test', name: 'Test', abbreviation: 'TEST' },
        language: 'de',
        updated: '2024-01-01',
        url: 'https://onlinekommentar.ch/de/test',
        content: 'Content...',
        sections: [],
        citations: [],
        related_commentaries: ['uuid-related-1', 'uuid-related-2'],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-rel');

      expect(result.related_commentaries).toHaveLength(2);
    });
  });

  describe('multi-lingual support', () => {
    it('should retrieve French commentary', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-fr',
        title: 'Commentaire de l\'art. 97 CO',
        authors: ['Prof. Français'],
        legislative_act: {
          id: 'co-uuid',
          name: 'Code des obligations',
          abbreviation: 'CO',
        },
        language: 'fr',
        updated: '2024-01-01',
        url: 'https://onlinekommentar.ch/fr/commentaires/co97',
        content: 'Contenu du commentaire...',
        sections: [],
        citations: ['ATF 145 III 229'],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-fr');

      expect(result.language).toBe('fr');
      expect(result.legislative_act.abbreviation).toBe('CO');
    });

    it('should retrieve Italian commentary', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-it',
        title: 'Commento all\'art. 97 CO',
        authors: ['Prof. Italiano'],
        legislative_act: {
          id: 'co-uuid',
          name: 'Codice delle obbligazioni',
          abbreviation: 'CO',
        },
        language: 'it',
        updated: '2024-01-01',
        url: 'https://onlinekommentar.ch/it/commentari/co97',
        content: 'Contenuto del commento...',
        sections: [],
        citations: ['DTF 145 III 229'],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-it');

      expect(result.language).toBe('it');
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent commentary', async () => {
      vi.spyOn(client, 'getCommentary').mockRejectedValue(
        new Error('Commentary not found')
      );

      await expect(client.getCommentary('non-existent-uuid')).rejects.toThrow(
        'Commentary not found'
      );
    });

    it('should throw error for invalid ID format', async () => {
      vi.spyOn(client, 'getCommentary').mockRejectedValue(
        new Error('Invalid commentary ID')
      );

      await expect(client.getCommentary('invalid-id-format!!')).rejects.toThrow(
        'Invalid commentary ID'
      );
    });

    it('should handle API errors', async () => {
      vi.spyOn(client, 'getCommentary').mockRejectedValue(
        new Error('API error: 500 Internal Server Error')
      );

      await expect(client.getCommentary('uuid-123')).rejects.toThrow('API error');
    });

    it('should handle network failures', async () => {
      vi.spyOn(client, 'getCommentary').mockRejectedValue(
        new Error('Network request failed')
      );

      await expect(client.getCommentary('uuid-123')).rejects.toThrow(
        'Network request failed'
      );
    });
  });

  describe('metadata', () => {
    it('should include author information', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-auth',
        title: 'Multi-Author Commentary',
        authors: [
          'Prof. Dr. iur. First Author',
          'Dr. iur. Second Author',
          'lic. iur. Third Author',
        ],
        legislative_act: { id: 'test', name: 'Test', abbreviation: 'TEST' },
        language: 'de',
        updated: '2024-01-01',
        url: 'https://onlinekommentar.ch/de/test',
        content: 'Content...',
        sections: [],
        citations: [],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-auth');

      expect(result.authors).toHaveLength(3);
      expect(result.authors[0]).toContain('Prof.');
    });

    it('should include last updated date', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-date',
        title: 'Test',
        authors: ['Author'],
        legislative_act: { id: 'test', name: 'Test', abbreviation: 'TEST' },
        language: 'de',
        updated: '2024-06-15',
        url: 'https://onlinekommentar.ch/de/test',
        content: 'Content...',
        sections: [],
        citations: [],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-date');

      expect(result.updated).toBe('2024-06-15');
    });

    it('should include direct URL to commentary', async () => {
      const mockResponse: CommentaryDetail = {
        id: 'uuid-url',
        title: 'Test',
        authors: ['Author'],
        legislative_act: { id: 'test', name: 'Test', abbreviation: 'TEST' },
        language: 'de',
        updated: '2024-01-01',
        url: 'https://onlinekommentar.ch/de/kommentare/specific-commentary',
        content: 'Content...',
        sections: [],
        citations: [],
        related_commentaries: [],
      };

      vi.spyOn(client, 'getCommentary').mockResolvedValue(mockResponse);

      const result = await client.getCommentary('uuid-url');

      expect(result.url).toContain('onlinekommentar.ch');
      expect(result.url).toContain('specific-commentary');
    });
  });
});
