/**
 * Unit tests for CitationValidator
 */

import { describe, it, expect } from 'vitest';
import { CitationValidator } from './citation-validator.js';

describe('CitationValidator', () => {
  const validator = new CitationValidator();

  describe('BGE Citations', () => {
    it('should validate correct BGE citation', () => {
      const result = validator.validateBGE('BGE 147 IV 73');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('bge');
      expect(result.normalized).toBe('BGE 147 IV 73');
      expect(result.components).toEqual({
        volume: '147',
        chamber: 'IV',
        page: '73'
      });
    });

    it('should normalize BGE citation with lowercase chamber', () => {
      const result = validator.validateBGE('BGE 147 iv 73');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('BGE 147 IV 73');
    });

    it('should reject invalid BGE format', () => {
      const result = validator.validateBGE('BGE 147-IV-73');
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject invalid chamber number', () => {
      const result = validator.validateBGE('BGE 147 XV 73');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid BGE chamber: XV. Must be Roman numeral I-X');
    });

    it('should warn about unusual volume numbers', () => {
      const result = validator.validateBGE('BGE 250 IV 73');
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
    });
  });

  describe('ATF Citations', () => {
    it('should validate correct ATF citation', () => {
      const result = validator.validateATF('ATF 147 IV 73');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('atf');
      expect(result.normalized).toBe('ATF 147 IV 73');
    });

    it('should reject invalid ATF format', () => {
      const result = validator.validateATF('ATF 147');
      expect(result.valid).toBe(false);
    });
  });

  describe('DTF Citations', () => {
    it('should validate correct DTF citation', () => {
      const result = validator.validateDTF('DTF 147 IV 73');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('dtf');
      expect(result.normalized).toBe('DTF 147 IV 73');
    });
  });

  describe('Statutory Citations (German)', () => {
    it('should validate simple article reference', () => {
      const result = validator.validateStatuteDE('Art. 97 OR');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('statute');
      expect(result.normalized).toBe('Art. 97 OR');
      expect(result.components?.article).toBe('97');
      expect(result.components?.statute).toBe('OR');
    });

    it('should validate article with paragraph', () => {
      const result = validator.validateStatuteDE('Art. 97 Abs. 1 OR');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('Art. 97 Abs. 1 OR');
      expect(result.components?.paragraph).toBe('1');
    });

    it('should validate complete citation with all components', () => {
      const result = validator.validateStatuteDE('Art. 97 Abs. 1 lit. a Ziff. 2 OR');
      expect(result.valid).toBe(true);
      expect(result.components).toEqual({
        statute: 'OR',
        article: '97',
        paragraph: '1',
        letter: 'a',
        number: '2'
      });
    });

    it('should reject unknown statute code', () => {
      const result = validator.validateStatuteDE('Art. 97 ABC');
      expect(result.valid).toBe(false);
      // ABC doesn't match valid statute pattern, so returns format error
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Statutory Citations (French)', () => {
    it('should validate French statutory citation', () => {
      const result = validator.validateStatuteFR('art. 97 al. 1 CO');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('art. 97 al. 1 CO');
      expect(result.components?.statute).toBe('CO');
    });

    it('should validate complete French citation', () => {
      const result = validator.validateStatuteFR('art. 97 al. 1 let. a ch. 2 CO');
      expect(result.valid).toBe(true);
      expect(result.components).toEqual({
        statute: 'CO',
        article: '97',
        paragraph: '1',
        letter: 'a',
        number: '2'
      });
    });
  });

  describe('Statutory Citations (Italian)', () => {
    it('should validate Italian statutory citation', () => {
      const result = validator.validateStatuteIT('art. 97 cpv. 1 CO');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('art. 97 cpv. 1 CO');
      expect(result.components?.statute).toBe('CO');
    });

    it('should validate complete Italian citation', () => {
      const result = validator.validateStatuteIT('art. 97 cpv. 1 lett. a n. 2 CO');
      expect(result.valid).toBe(true);
      expect(result.components).toEqual({
        statute: 'CO',
        article: '97',
        paragraph: '1',
        letter: 'a',
        number: '2'
      });
    });
  });

  describe('Auto-detection', () => {
    it('should auto-detect BGE citation', () => {
      const result = validator.validate('BGE 147 IV 73');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('bge');
    });

    it('should auto-detect ATF citation', () => {
      const result = validator.validate('ATF 147 IV 73');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('atf');
    });

    it('should auto-detect German statutory citation', () => {
      const result = validator.validate('Art. 97 Abs. 1 OR');
      expect(result.valid).toBe(true);
      expect(result.type).toBe('statute');
    });

    it('should handle unknown citation types', () => {
      const result = validator.validate('Invalid Citation');
      expect(result.valid).toBe(false);
      expect(result.type).toBe('unknown');
    });
  });
});
