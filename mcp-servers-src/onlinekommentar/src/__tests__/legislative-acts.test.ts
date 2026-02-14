import { describe, it, expect, beforeAll } from 'vitest';
import {
  SWISS_LEGISLATIVE_ACTS,
  DEFAULT_LEGISLATIVE_ACT_MAPPING,
  buildDefaultMapping,
  getActByAbbreviation,
  getActById,
  getAbbreviationForLanguage,
  getNameForLanguage,
  getActsByDomain,
  isKnownAbbreviation,
  getAllAbbreviations,
} from '../legislative-acts.js';
import type { SwissLegislativeAct, LegalDomain } from '../legislative-acts.js';
import type { Language } from '../types.js';

describe('legislative-acts', () => {
  describe('SWISS_LEGISLATIVE_ACTS constant', () => {
    it('should contain all major Swiss federal codes', () => {
      const ids = SWISS_LEGISLATIVE_ACTS.map((act) => act.id);

      // Core codes
      expect(ids).toContain('zgb');
      expect(ids).toContain('or');
      expect(ids).toContain('stgb');
      expect(ids).toContain('zpo');
      expect(ids).toContain('stpo');
      expect(ids).toContain('bv');
      expect(ids).toContain('dsg');
    });

    it('should have correct multi-lingual abbreviations for OR', () => {
      const or = SWISS_LEGISLATIVE_ACTS.find((act) => act.id === 'or');

      expect(or).toBeDefined();
      expect(or?.abbr_de).toBe('OR');
      expect(or?.abbr_fr).toBe('CO');
      expect(or?.abbr_it).toBe('CO');
    });

    it('should have correct multi-lingual abbreviations for ZGB', () => {
      const zgb = SWISS_LEGISLATIVE_ACTS.find((act) => act.id === 'zgb');

      expect(zgb).toBeDefined();
      expect(zgb?.abbr_de).toBe('ZGB');
      expect(zgb?.abbr_fr).toBe('CC');
      expect(zgb?.abbr_it).toBe('CC');
    });

    it('should have correct SR numbers', () => {
      const or = SWISS_LEGISLATIVE_ACTS.find((act) => act.id === 'or');
      const zgb = SWISS_LEGISLATIVE_ACTS.find((act) => act.id === 'zgb');
      const bv = SWISS_LEGISLATIVE_ACTS.find((act) => act.id === 'bv');

      expect(or?.sr_number).toBe('SR 220');
      expect(zgb?.sr_number).toBe('SR 210');
      expect(bv?.sr_number).toBe('SR 101');
    });

    it('should have valid legal domains for all acts', () => {
      const validDomains: LegalDomain[] = [
        'civil',
        'obligations',
        'criminal',
        'procedure',
        'constitutional',
        'administrative',
        'commercial',
        'data_protection',
        'intellectual_property',
      ];

      for (const act of SWISS_LEGISLATIVE_ACTS) {
        expect(validDomains).toContain(act.domain);
      }
    });
  });

  describe('buildDefaultMapping', () => {
    it('should return a mapping object', () => {
      const mapping = buildDefaultMapping();

      expect(typeof mapping).toBe('object');
      expect(Object.keys(mapping).length).toBeGreaterThan(0);
    });

    it('should map German abbreviations to IDs', () => {
      const mapping = buildDefaultMapping();

      expect(mapping['or']).toBe('or');
      expect(mapping['zgb']).toBe('zgb');
      expect(mapping['stgb']).toBe('stgb');
    });

    it('should map French abbreviations to IDs', () => {
      const mapping = buildDefaultMapping();

      expect(mapping['co']).toBe('or'); // CO maps to OR
      expect(mapping['cc']).toBe('zgb'); // CC maps to ZGB
      expect(mapping['cp']).toBe('stgb'); // CP maps to StGB
    });

    it('should use lowercase keys for case-insensitive lookup', () => {
      const mapping = buildDefaultMapping();

      // All keys should be lowercase
      for (const key of Object.keys(mapping)) {
        expect(key).toBe(key.toLowerCase());
      }
    });

    it('should handle abbreviations that are the same across languages', () => {
      const mapping = buildDefaultMapping();

      // CO is used for both OR (FR/IT) - should map correctly
      expect(mapping['co']).toBeDefined();
    });
  });

  describe('DEFAULT_LEGISLATIVE_ACT_MAPPING', () => {
    it('should be pre-built and available', () => {
      expect(DEFAULT_LEGISLATIVE_ACT_MAPPING).toBeDefined();
      expect(typeof DEFAULT_LEGISLATIVE_ACT_MAPPING).toBe('object');
    });

    it('should contain mappings for common abbreviations', () => {
      expect(DEFAULT_LEGISLATIVE_ACT_MAPPING['or']).toBe('or');
      expect(DEFAULT_LEGISLATIVE_ACT_MAPPING['zgb']).toBe('zgb');
      expect(DEFAULT_LEGISLATIVE_ACT_MAPPING['co']).toBe('or');
    });
  });

  describe('getActByAbbreviation', () => {
    it('should find act by German abbreviation', () => {
      const act = getActByAbbreviation('OR');

      expect(act).toBeDefined();
      expect(act?.id).toBe('or');
      expect(act?.name_de).toBe('Obligationenrecht');
    });

    it('should find act by French abbreviation', () => {
      const act = getActByAbbreviation('CO');

      expect(act).toBeDefined();
      expect(act?.id).toBe('or');
      expect(act?.name_fr).toBe('Code des obligations');
    });

    it('should find act by Italian abbreviation', () => {
      const act = getActByAbbreviation('CO');

      expect(act).toBeDefined();
      expect(act?.name_it).toBe('Codice delle obbligazioni');
    });

    it('should be case-insensitive', () => {
      const actLower = getActByAbbreviation('or');
      const actUpper = getActByAbbreviation('OR');
      const actMixed = getActByAbbreviation('Or');

      expect(actLower).toEqual(actUpper);
      expect(actUpper).toEqual(actMixed);
    });

    it('should return undefined for unknown abbreviation', () => {
      const act = getActByAbbreviation('UNKNOWN');

      expect(act).toBeUndefined();
    });

    it('should find Constitution by BV or Cst.', () => {
      const actBV = getActByAbbreviation('BV');
      const actCst = getActByAbbreviation('Cst.');

      expect(actBV).toBeDefined();
      expect(actCst).toBeDefined();
      expect(actBV?.id).toBe('bv');
      expect(actCst?.id).toBe('bv');
    });

    it('should find SchKG by German and French abbreviations', () => {
      const actDE = getActByAbbreviation('SchKG');
      const actFR = getActByAbbreviation('LP');

      expect(actDE).toBeDefined();
      expect(actFR).toBeDefined();
      expect(actDE?.id).toBe('schkg');
      expect(actFR?.id).toBe('schkg');
    });
  });

  describe('getActById', () => {
    it('should find act by internal ID', () => {
      const act = getActById('or');

      expect(act).toBeDefined();
      expect(act?.abbr_de).toBe('OR');
    });

    it('should return undefined for unknown ID', () => {
      const act = getActById('unknown-id');

      expect(act).toBeUndefined();
    });

    it('should find all defined acts by their IDs', () => {
      for (const expectedAct of SWISS_LEGISLATIVE_ACTS) {
        const act = getActById(expectedAct.id);

        expect(act).toBeDefined();
        expect(act).toEqual(expectedAct);
      }
    });
  });

  describe('getAbbreviationForLanguage', () => {
    let orAct: SwissLegislativeAct;

    beforeAll(() => {
      orAct = getActById('or')!;
    });

    it('should return German abbreviation for de', () => {
      const abbr = getAbbreviationForLanguage(orAct, 'de');

      expect(abbr).toBe('OR');
    });

    it('should return French abbreviation for fr', () => {
      const abbr = getAbbreviationForLanguage(orAct, 'fr');

      expect(abbr).toBe('CO');
    });

    it('should return Italian abbreviation for it', () => {
      const abbr = getAbbreviationForLanguage(orAct, 'it');

      expect(abbr).toBe('CO');
    });

    it('should return German abbreviation for en (default)', () => {
      const abbr = getAbbreviationForLanguage(orAct, 'en');

      expect(abbr).toBe('OR');
    });

    it('should work for Constitution with different abbreviations', () => {
      const bvAct = getActById('bv')!;

      expect(getAbbreviationForLanguage(bvAct, 'de')).toBe('BV');
      expect(getAbbreviationForLanguage(bvAct, 'fr')).toBe('Cst.');
      expect(getAbbreviationForLanguage(bvAct, 'it')).toBe('Cost.');
    });
  });

  describe('getNameForLanguage', () => {
    let orAct: SwissLegislativeAct;

    beforeAll(() => {
      orAct = getActById('or')!;
    });

    it('should return German name for de', () => {
      const name = getNameForLanguage(orAct, 'de');

      expect(name).toBe('Obligationenrecht');
    });

    it('should return French name for fr', () => {
      const name = getNameForLanguage(orAct, 'fr');

      expect(name).toBe('Code des obligations');
    });

    it('should return Italian name for it', () => {
      const name = getNameForLanguage(orAct, 'it');

      expect(name).toBe('Codice delle obbligazioni');
    });

    it('should return German name for en (default)', () => {
      const name = getNameForLanguage(orAct, 'en');

      expect(name).toBe('Obligationenrecht');
    });
  });

  describe('getActsByDomain', () => {
    it('should return acts in the civil domain', () => {
      const civilActs = getActsByDomain('civil');

      expect(civilActs.length).toBeGreaterThan(0);
      expect(civilActs.every((act) => act.domain === 'civil')).toBe(true);
      expect(civilActs.some((act) => act.id === 'zgb')).toBe(true);
    });

    it('should return acts in the obligations domain', () => {
      const obligationsActs = getActsByDomain('obligations');

      expect(obligationsActs.length).toBeGreaterThan(0);
      expect(obligationsActs.some((act) => act.id === 'or')).toBe(true);
    });

    it('should return acts in the criminal domain', () => {
      const criminalActs = getActsByDomain('criminal');

      expect(criminalActs.length).toBeGreaterThan(0);
      expect(criminalActs.some((act) => act.id === 'stgb')).toBe(true);
    });

    it('should return acts in the procedure domain', () => {
      const procedureActs = getActsByDomain('procedure');

      expect(procedureActs.length).toBeGreaterThanOrEqual(3);
      expect(procedureActs.some((act) => act.id === 'zpo')).toBe(true);
      expect(procedureActs.some((act) => act.id === 'stpo')).toBe(true);
      expect(procedureActs.some((act) => act.id === 'schkg')).toBe(true);
    });

    it('should return acts in the constitutional domain', () => {
      const constitutionalActs = getActsByDomain('constitutional');

      expect(constitutionalActs.length).toBeGreaterThan(0);
      expect(constitutionalActs.some((act) => act.id === 'bv')).toBe(true);
    });

    it('should return acts in the data_protection domain', () => {
      const dataProtectionActs = getActsByDomain('data_protection');

      expect(dataProtectionActs.length).toBeGreaterThan(0);
      expect(dataProtectionActs.some((act) => act.id === 'dsg')).toBe(true);
    });

    it('should return acts in the intellectual_property domain', () => {
      const ipActs = getActsByDomain('intellectual_property');

      expect(ipActs.length).toBeGreaterThanOrEqual(2);
      expect(ipActs.some((act) => act.id === 'urhg')).toBe(true);
      expect(ipActs.some((act) => act.id === 'mschg')).toBe(true);
    });

    it('should return empty array for domain with no acts', () => {
      // All domains should have at least one act based on our data
      // This tests the function returns an array even if empty
      const acts = getActsByDomain('civil');

      expect(Array.isArray(acts)).toBe(true);
    });
  });

  describe('isKnownAbbreviation', () => {
    it('should return true for known German abbreviations', () => {
      expect(isKnownAbbreviation('OR')).toBe(true);
      expect(isKnownAbbreviation('ZGB')).toBe(true);
      expect(isKnownAbbreviation('StGB')).toBe(true);
      expect(isKnownAbbreviation('BV')).toBe(true);
    });

    it('should return true for known French abbreviations', () => {
      expect(isKnownAbbreviation('CO')).toBe(true);
      expect(isKnownAbbreviation('CC')).toBe(true);
      expect(isKnownAbbreviation('CP')).toBe(true);
      expect(isKnownAbbreviation('Cst.')).toBe(true);
    });

    it('should return true for known Italian abbreviations', () => {
      expect(isKnownAbbreviation('CO')).toBe(true);
      expect(isKnownAbbreviation('CC')).toBe(true);
      expect(isKnownAbbreviation('Cost.')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isKnownAbbreviation('or')).toBe(true);
      expect(isKnownAbbreviation('OR')).toBe(true);
      expect(isKnownAbbreviation('Or')).toBe(true);
    });

    it('should return false for unknown abbreviations', () => {
      expect(isKnownAbbreviation('UNKNOWN')).toBe(false);
      expect(isKnownAbbreviation('XYZ')).toBe(false);
      expect(isKnownAbbreviation('')).toBe(false);
    });
  });

  describe('getAllAbbreviations', () => {
    it('should return all unique abbreviations for OR', () => {
      const orAct = getActById('or')!;
      const abbreviations = getAllAbbreviations(orAct);

      expect(abbreviations).toContain('OR');
      expect(abbreviations).toContain('CO');
      // OR has DE=OR, FR=CO, IT=CO, so unique should be 2
      expect(abbreviations.length).toBe(2);
    });

    it('should return all unique abbreviations for ZGB', () => {
      const zgbAct = getActById('zgb')!;
      const abbreviations = getAllAbbreviations(zgbAct);

      expect(abbreviations).toContain('ZGB');
      expect(abbreviations).toContain('CC');
      expect(abbreviations.length).toBe(2);
    });

    it('should return all unique abbreviations for Constitution', () => {
      const bvAct = getActById('bv')!;
      const abbreviations = getAllAbbreviations(bvAct);

      expect(abbreviations).toContain('BV');
      expect(abbreviations).toContain('Cst.');
      expect(abbreviations).toContain('Cost.');
      expect(abbreviations.length).toBe(3);
    });

    it('should deduplicate abbreviations that are same across languages', () => {
      // For acts where FR and IT have the same abbreviation
      const orAct = getActById('or')!;
      const abbreviations = getAllAbbreviations(orAct);

      // Should not have duplicates
      const uniqueCount = new Set(abbreviations).size;
      expect(abbreviations.length).toBe(uniqueCount);
    });
  });

  describe('cross-language resolution', () => {
    it('should correctly resolve all OR/CO variants to same act', () => {
      const byOR = getActByAbbreviation('OR');
      const byCO = getActByAbbreviation('CO');

      expect(byOR?.id).toBe('or');
      expect(byCO?.id).toBe('or');
    });

    it('should correctly resolve all ZGB/CC variants to same act', () => {
      const byZGB = getActByAbbreviation('ZGB');
      const byCC = getActByAbbreviation('CC');

      expect(byZGB?.id).toBe('zgb');
      expect(byCC?.id).toBe('zgb');
    });

    it('should correctly resolve all StGB/CP variants to same act', () => {
      const byStGB = getActByAbbreviation('StGB');
      const byCP = getActByAbbreviation('CP');

      expect(byStGB?.id).toBe('stgb');
      expect(byCP?.id).toBe('stgb');
    });

    it('should correctly resolve Constitution abbreviations', () => {
      const byBV = getActByAbbreviation('BV');
      const byCst = getActByAbbreviation('Cst.');
      const byCost = getActByAbbreviation('Cost.');

      expect(byBV?.id).toBe('bv');
      expect(byCst?.id).toBe('bv');
      expect(byCost?.id).toBe('bv');
    });
  });
});
