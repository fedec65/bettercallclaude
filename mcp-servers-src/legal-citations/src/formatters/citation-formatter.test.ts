/**
 * Unit tests for CitationFormatter
 */

import { describe, it, expect } from 'vitest';
import { CitationFormatter } from './citation-formatter.js';
import type { CitationComponents } from '../types.js';

describe('CitationFormatter', () => {
  const formatter = new CitationFormatter();

  describe('Court Citation Formatting', () => {
    const components: CitationComponents = {
      volume: '147',
      chamber: 'IV',
      page: '73'
    };

    it('should format BGE to German', () => {
      const result = formatter.formatCourtCitation('bge', components, 'de');
      expect(result.citation).toBe('BGE 147 IV 73');
      expect(result.language).toBe('de');
    });

    it('should format BGE to French (ATF)', () => {
      const result = formatter.formatCourtCitation('bge', components, 'fr');
      expect(result.citation).toBe('ATF 147 IV 73');
      expect(result.language).toBe('fr');
    });

    it('should format BGE to Italian (DTF)', () => {
      const result = formatter.formatCourtCitation('bge', components, 'it');
      expect(result.citation).toBe('DTF 147 IV 73');
      expect(result.language).toBe('it');
    });

    it('should format ATF to German (BGE)', () => {
      const result = formatter.formatCourtCitation('atf', components, 'de');
      expect(result.citation).toBe('BGE 147 IV 73');
    });
  });

  describe('Statutory Citation Formatting', () => {
    const components: CitationComponents = {
      statute: 'OR',
      article: '97',
      paragraph: '1'
    };

    it('should format statute to German', () => {
      const result = formatter.formatStatutoryCitation(components, 'de');
      expect(result.citation).toBe('Art. 97 Abs. 1 OR');
      expect(result.language).toBe('de');
    });

    it('should format statute to French', () => {
      const result = formatter.formatStatutoryCitation(components, 'fr');
      expect(result.citation).toBe('art. 97 al. 1 CO');
      expect(result.language).toBe('fr');
    });

    it('should format statute to Italian', () => {
      const result = formatter.formatStatutoryCitation(components, 'it');
      expect(result.citation).toBe('art. 97 cpv. 1 CO');
      expect(result.language).toBe('it');
    });

    it('should include full statute name when requested', () => {
      const result = formatter.formatStatutoryCitation(components, 'de', {
        language: 'de',
        fullStatuteName: true
      });
      expect(result.fullReference).toContain('Obligationenrecht');
    });
  });

  describe('Statute Code Conversion', () => {
    it('should convert OR to CO in French', () => {
      const components: CitationComponents = {
        statute: 'OR',
        article: '97'
      };
      const result = formatter.formatStatutoryCitation(components, 'fr');
      expect(result.citation).toContain('CO');
    });

    it('should convert ZGB to CC in French', () => {
      const components: CitationComponents = {
        statute: 'ZGB',
        article: '1'
      };
      const result = formatter.formatStatutoryCitation(components, 'fr');
      expect(result.citation).toContain('CC');
    });

    it('should convert StGB to CP in French', () => {
      const components: CitationComponents = {
        statute: 'StGB',
        article: '111'
      };
      const result = formatter.formatStatutoryCitation(components, 'fr');
      expect(result.citation).toContain('CP');
    });

    it('should convert BV to Cst in French', () => {
      const components: CitationComponents = {
        statute: 'BV',
        article: '9'
      };
      const result = formatter.formatStatutoryCitation(components, 'fr');
      expect(result.citation).toContain('Cst');
    });
  });

  describe('Complete Citation Components', () => {
    it('should format all components correctly', () => {
      const components: CitationComponents = {
        statute: 'OR',
        article: '97',
        paragraph: '1',
        letter: 'a',
        number: '2'
      };

      const resultDE = formatter.formatStatutoryCitation(components, 'de');
      expect(resultDE.citation).toBe('Art. 97 Abs. 1 lit. a Ziff. 2 OR');

      const resultFR = formatter.formatStatutoryCitation(components, 'fr');
      expect(resultFR.citation).toBe('art. 97 al. 1 let. a ch. 2 CO');

      const resultIT = formatter.formatStatutoryCitation(components, 'it');
      expect(resultIT.citation).toBe('art. 97 cpv. 1 lett. a n. 2 CO');
    });
  });

  describe('Get All Translations', () => {
    it('should return all language translations for court citation', () => {
      const components: CitationComponents = {
        volume: '147',
        chamber: 'IV',
        page: '73'
      };

      const translations = formatter.getAllTranslations('bge', components);
      expect(translations.de).toBe('BGE 147 IV 73');
      expect(translations.fr).toBe('ATF 147 IV 73');
      expect(translations.it).toBe('DTF 147 IV 73');
    });

    it('should return all language translations for statutory citation', () => {
      const components: CitationComponents = {
        statute: 'OR',
        article: '97',
        paragraph: '1'
      };

      const translations = formatter.getAllTranslations('statute', components);
      expect(translations.de).toBe('Art. 97 Abs. 1 OR');
      expect(translations.fr).toBe('art. 97 al. 1 CO');
      expect(translations.it).toBe('art. 97 cpv. 1 CO');
    });
  });
});
