/**
 * Unit Tests for SPARQL Query Builders
 * Tests for the Fedlex SPARQL query generation using JOLUX ontology
 */

import { describe, it, expect } from 'vitest';
import {
  buildLookupStatuteQuery,
  buildLookupByAbbreviationQuery,
  buildExistsQuery,
  buildListSRNumbersQuery,
  buildGetArticleQuery,
  buildListArticlesQuery,
  buildSearchQuery,
  buildSearchByDomainQuery,
  buildRecentlyModifiedQuery,
  buildFindAmendingActsQuery,
  buildFindRelatedByDomainQuery,
  buildFindAllRelatedQuery,
  buildGetMetadataQuery,
  buildGetLanguagesQuery,
  buildGetLegalStatusQuery,
  LEGAL_DOMAINS,
  withPrefixes,
  RDF_PREFIXES,
  FEDLEX_PREFIXES,
  ALL_PREFIXES,
} from '../src/queries/index.js';

describe('SPARQL Prefixes', () => {
  describe('withPrefixes', () => {
    it('should add all prefixes to query', () => {
      const query = 'SELECT ?s WHERE { ?s ?p ?o }';
      const result = withPrefixes(query);

      expect(result).toContain('PREFIX rdf:');
      expect(result).toContain('PREFIX jolux:');
      expect(result).toContain('PREFIX skos:');
      expect(result).toContain(query);
    });

    it('should include RDF prefixes', () => {
      const result = withPrefixes('');
      expect(result).toContain(RDF_PREFIXES);
    });

    it('should include Fedlex prefixes', () => {
      const result = withPrefixes('');
      expect(result).toContain(FEDLEX_PREFIXES);
    });
  });

  describe('ALL_PREFIXES', () => {
    it('should contain essential prefixes', () => {
      expect(ALL_PREFIXES).toContain('PREFIX rdf:');
      expect(ALL_PREFIXES).toContain('PREFIX rdfs:');
      expect(ALL_PREFIXES).toContain('PREFIX xsd:');
      expect(ALL_PREFIXES).toContain('PREFIX jolux:');
      expect(ALL_PREFIXES).toContain('PREFIX dcterms:');
    });
  });
});

describe('Lookup Queries', () => {
  describe('buildLookupStatuteQuery', () => {
    it('should build query for SR number lookup using JOLUX ontology', () => {
      const query = buildLookupStatuteQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('jolux:Act');
      expect(query).toContain('jolux:classifiedByTaxonomyEntry');
      expect(query).toContain('skos:notation');
      expect(query).toContain('skos:prefLabel');
    });

    it('should include language filter when specified', () => {
      const query = buildLookupStatuteQuery('220', 'de');

      expect(query).toContain('"de"');
    });

    it('should escape special characters in SR number', () => {
      const query = buildLookupStatuteQuery('210"injection');

      expect(query).toContain('\\"');
    });
  });

  describe('buildLookupByAbbreviationQuery', () => {
    it('should build query for abbreviation lookup', () => {
      const query = buildLookupByAbbreviationQuery('OR');

      expect(query).toContain('OR');
      expect(query).toContain('jolux:titleShort');
    });

    it('should include language filter when specified', () => {
      const query = buildLookupByAbbreviationQuery('CO', 'fr');

      expect(query).toContain('"fr"');
    });
  });

  describe('buildExistsQuery', () => {
    it('should build ASK query for existence check', () => {
      const query = buildExistsQuery('220');

      expect(query).toContain('ASK');
      expect(query).toContain('220');
    });
  });

  describe('buildListSRNumbersQuery', () => {
    it('should build query with default limit', () => {
      const query = buildListSRNumbersQuery();

      expect(query).toContain('LIMIT 100');
    });

    it('should build query with custom prefix and limit', () => {
      const query = buildListSRNumbersQuery('22', 50);

      expect(query).toContain('LIMIT 50');
      expect(query).toContain('STRSTARTS');
      expect(query).toContain('"22"');
    });
  });
});

describe('Article Queries', () => {
  describe('buildGetArticleQuery', () => {
    it('should build query for article retrieval using JOLUX', () => {
      const query = buildGetArticleQuery('220', '1');

      expect(query).toContain('220');
      expect(query).toContain('1');
      // Uses inverse relationship: article → parent act via legalResourceSubdivisionIsPartOf
      expect(query).toContain('jolux:legalResourceSubdivisionIsPartOf');
      expect(query).toContain('jolux:LegalResourceSubdivision');
    });

    it('should include language filter when specified', () => {
      const query = buildGetArticleQuery('220', '1', 'de');

      expect(query).toContain('"de"');
    });
  });

  describe('buildListArticlesQuery', () => {
    it('should build query for listing articles', () => {
      const query = buildListArticlesQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('ORDER BY');
    });

    it('should respect custom limit', () => {
      const query = buildListArticlesQuery('220', undefined, 10);

      expect(query).toContain('LIMIT 10');
    });
  });
});

describe('Search Queries', () => {
  describe('buildSearchQuery', () => {
    it('should build full-text search query', () => {
      const query = buildSearchQuery('Vertrag');

      expect(query).toContain('Vertrag');
      expect(query).toContain('CONTAINS');
      expect(query).toContain('LCASE');
    });

    it('should include filters when provided', () => {
      const query = buildSearchQuery('Haftung', {
        language: 'de',
        srNumberPrefix: '22',
        limit: 20,
      });

      expect(query).toContain('"de"');
      expect(query).toContain('"22"');
      expect(query).toContain('LIMIT 20');
    });

    it('should include offset when provided', () => {
      const query = buildSearchQuery('test', { offset: 50, limit: 25 });

      expect(query).toContain('OFFSET 50');
      expect(query).toContain('LIMIT 25');
    });
  });

  describe('buildSearchByDomainQuery', () => {
    it('should build query for domain search', () => {
      const query = buildSearchByDomainQuery('2');

      expect(query).toContain('STRSTARTS');
      expect(query).toContain('"2"');
    });

    it('should include language filter when specified', () => {
      const query = buildSearchByDomainQuery('2', 'fr');

      expect(query).toContain('"fr"');
    });
  });

  describe('buildRecentlyModifiedQuery', () => {
    it('should build query for recently modified acts', () => {
      const query = buildRecentlyModifiedQuery();

      expect(query).toContain('ORDER BY DESC');
      expect(query).toContain('dateModified');
    });

    it('should include language filter when specified', () => {
      const query = buildRecentlyModifiedQuery('it');

      expect(query).toContain('"it"');
    });
  });

  describe('LEGAL_DOMAINS', () => {
    it('should contain all 9 legal domains', () => {
      expect(Object.keys(LEGAL_DOMAINS)).toHaveLength(9);
    });

    it('should have multilingual labels for each domain', () => {
      expect(LEGAL_DOMAINS['1']).toEqual({
        de: 'Staat - Volk - Behörden',
        fr: 'État - Peuple - Autorités',
        it: 'Stato - Popolo - Autorità',
      });
    });

    it('should include all domain codes 1-9', () => {
      for (let i = 1; i <= 9; i++) {
        expect(LEGAL_DOMAINS[String(i)]).toBeDefined();
        expect(LEGAL_DOMAINS[String(i)].de).toBeDefined();
        expect(LEGAL_DOMAINS[String(i)].fr).toBeDefined();
        expect(LEGAL_DOMAINS[String(i)].it).toBeDefined();
      }
    });
  });
});

describe('Related Legislation Queries', () => {
  describe('buildFindAmendingActsQuery', () => {
    it('should build query for amending acts using JOLUX', () => {
      const query = buildFindAmendingActsQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('jolux:legalResourceImpactHasLegalResource');
    });

    it('should include language filter when specified', () => {
      const query = buildFindAmendingActsQuery('220', 'de');

      expect(query).toContain('"de"');
    });

    it('should respect custom limit', () => {
      const query = buildFindAmendingActsQuery('220', undefined, 10);

      expect(query).toContain('LIMIT 10');
    });
  });

  describe('buildFindRelatedByDomainQuery', () => {
    it('should build query for domain-related acts', () => {
      const query = buildFindRelatedByDomainQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('REPLACE');
      expect(query).toContain('domainPrefix');
    });
  });

  describe('buildFindAllRelatedQuery', () => {
    it('should build comprehensive related query without filter', () => {
      const query = buildFindAllRelatedQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('UNION');
      expect(query).toContain('amends');
      expect(query).toContain('cites');
    });

    it('should delegate to specific query for relation type', () => {
      const query = buildFindAllRelatedQuery('220', 'amends');

      expect(query).toContain('jolux:legalResourceImpactHasLegalResource');
    });
  });
});

describe('Metadata Queries', () => {
  describe('buildGetMetadataQuery', () => {
    it('should build comprehensive metadata query using JOLUX', () => {
      const query = buildGetMetadataQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('skos:prefLabel');
      expect(query).toContain('jolux:typeDocument');
      expect(query).toContain('jolux:dateEntryInForce');
    });

    it('should include language filter when specified', () => {
      const query = buildGetMetadataQuery('220', 'de');

      expect(query).toContain('"de"');
    });
  });

  describe('buildGetLanguagesQuery', () => {
    it('should build query for available languages', () => {
      const query = buildGetLanguagesQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('LANG');
      expect(query).toContain('DISTINCT');
    });
  });

  describe('buildGetLegalStatusQuery', () => {
    it('should build query for legal status using JOLUX', () => {
      const query = buildGetLegalStatusQuery('220');

      expect(query).toContain('220');
      expect(query).toContain('jolux:inForce');
      expect(query).toContain('jolux:dateEntryInForce');
      expect(query).toContain('jolux:dateNoLongerInForce');
    });
  });
});

describe('Query Security', () => {
  it('should escape injection attempts in SR numbers', () => {
    const maliciousSR = '220" } UNION { ?x ?y ?z } #';
    const query = buildLookupStatuteQuery(maliciousSR);

    // Should contain escaped characters, not raw injection
    expect(query).toContain('\\"');
  });

  it('should escape injection attempts in search text', () => {
    const maliciousSearch = 'test") || 1=1 #';
    const query = buildSearchQuery(maliciousSearch);

    expect(query).toContain('\\"');
  });

  it('should escape newlines in input', () => {
    const inputWithNewline = 'line1\nline2';
    const query = buildSearchQuery(inputWithNewline);

    // The escaped newline should appear in the search term portion
    // Note: SPARQL queries naturally have newlines for formatting,
    // so we only verify the search term is properly escaped
    expect(query).toContain('line1\\nline2');
  });
});
