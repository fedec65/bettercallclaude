/**
 * Unit tests for CitationParser
 */

import { describe, it, expect } from 'vitest';
import { CitationParser } from './citation-parser.js';

describe('CitationParser', () => {
  const parser = new CitationParser();

  describe('Language Detection', () => {
    it('should detect German from Abs. marker', () => {
      const lang = parser.detectLanguage('Art. 97 Abs. 1 OR');
      expect(lang).toBe('de');
    });

    it('should detect French from al. marker', () => {
      const lang = parser.detectLanguage('art. 97 al. 1 CO');
      expect(lang).toBe('fr');
    });

    it('should detect Italian from cpv. marker', () => {
      const lang = parser.detectLanguage('art. 97 cpv. 1 CO');
      expect(lang).toBe('it');
    });

    it('should detect German from BGE prefix', () => {
      const lang = parser.detectLanguage('BGE 147 IV 73');
      expect(lang).toBe('de');
    });

    it('should detect French from ATF prefix', () => {
      const lang = parser.detectLanguage('ATF 147 IV 73');
      expect(lang).toBe('fr');
    });

    it('should detect Italian from DTF prefix', () => {
      const lang = parser.detectLanguage('DTF 147 IV 73');
      expect(lang).toBe('it');
    });
  });

  describe('Type Detection', () => {
    it('should detect BGE type', () => {
      const type = parser.detectType('BGE 147 IV 73');
      expect(type).toBe('bge');
    });

    it('should detect ATF type', () => {
      const type = parser.detectType('ATF 147 IV 73');
      expect(type).toBe('atf');
    });

    it('should detect DTF type', () => {
      const type = parser.detectType('DTF 147 IV 73');
      expect(type).toBe('dtf');
    });

    it('should detect statute type', () => {
      const type = parser.detectType('Art. 97 OR');
      expect(type).toBe('statute');
    });

    it('should return unknown for invalid citations', () => {
      const type = parser.detectType('Invalid Citation');
      expect(type).toBe('unknown');
    });
  });

  describe('Citation Parsing', () => {
    it('should parse valid BGE citation', () => {
      const parsed = parser.parse('BGE 147 IV 73');
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('bge');
      expect(parsed.language).toBe('de');
      expect(parsed.components.volume).toBe('147');
      expect(parsed.components.chamber).toBe('IV');
      expect(parsed.components.page).toBe('73');
    });

    it('should parse valid statutory citation', () => {
      const parsed = parser.parse('Art. 97 Abs. 1 OR');
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('statute');
      expect(parsed.language).toBe('de');
      expect(parsed.components.article).toBe('97');
      expect(parsed.components.paragraph).toBe('1');
      expect(parsed.components.statute).toBe('OR');
    });

    it('should provide suggestions for invalid citations', () => {
      const parsed = parser.parse('BGE 147');
      expect(parsed.isValid).toBe(false);
      expect(parsed.suggestions).toBeDefined();
      expect(parsed.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Citation Parsing', () => {
    it('should extract multiple citations from text', () => {
      const text = 'According to BGE 147 IV 73 and Art. 97 OR, the liability is clear.';
      const citations = parser.parseMultiple(text);
      expect(citations).toHaveLength(2);
      expect(citations[0].type).toBe('bge');
      expect(citations[1].type).toBe('statute');
    });

    it('should not duplicate citations', () => {
      const text = 'BGE 147 IV 73 states... and BGE 147 IV 73 confirms...';
      const citations = parser.parseMultiple(text);
      expect(citations).toHaveLength(1);
    });

    it('should extract complex citations', () => {
      const text = 'See Art. 97 Abs. 1 OR, ATF 147 IV 73, and art. 41 al. 1 CO.';
      const citations = parser.parseMultiple(text);
      expect(citations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Component Extraction', () => {
    it('should extract article number', () => {
      const article = parser.extractArticleNumber('Art. 97 OR');
      expect(article).toBe('97');
    });

    it('should extract article number with letter', () => {
      const article = parser.extractArticleNumber('Art. 97a OR');
      expect(article).toBe('97a');
    });

    it('should extract statute code', () => {
      const statute = parser.extractStatuteCode('Art. 97 OR');
      expect(statute).toBe('OR');
    });

    it('should return null for missing components', () => {
      const article = parser.extractArticleNumber('BGE 147 IV 73');
      expect(article).toBeNull();
    });
  });

  describe('Citation Detection', () => {
    it('should detect citations in text', () => {
      const text = 'According to BGE 147 IV 73...';
      expect(parser.containsCitations(text)).toBe(true);
    });

    it('should not detect citations in plain text', () => {
      const text = 'This is plain text without citations.';
      expect(parser.containsCitations(text)).toBe(false);
    });

    it('should count citations correctly', () => {
      const text = 'See BGE 147 IV 73, Art. 97 OR, and ATF 146 II 111.';
      const count = parser.countCitations(text);
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});
