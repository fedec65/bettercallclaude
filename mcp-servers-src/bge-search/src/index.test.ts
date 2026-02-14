/**
 * BGE Search MCP Server - Unit Tests
 * Tests for Swiss Federal Supreme Court decision search functionality
 */

import { describe, it, expect } from 'vitest';

// Import types and functions to test
interface BGEDecision {
  citation: string;
  volume: string;
  chamber: string;
  page: string;
  title: string;
  date: string;
  language: string;
  summary: string;
  legalAreas?: string[];
  fullTextUrl?: string;
}

interface SearchParams {
  query: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  chambers?: string[];
  legalAreas?: string[];
  limit?: number;
}

// Mock database for testing
const mockBGEDatabase: BGEDecision[] = [
  {
    citation: 'BGE 147 V 321',
    volume: '147',
    chamber: 'V',
    page: '321',
    title: 'Invalidenversicherung - Rentenanspruch bei psychischen Erkrankungen',
    date: '2021-09-15T00:00:00Z',
    language: 'DE',
    summary: 'Criteria for disability insurance benefits for mental health conditions',
    legalAreas: ['Sozialversicherungsrecht', 'Invalidenversicherung'],
  },
  {
    citation: 'BGE 146 II 150',
    volume: '146',
    chamber: 'II',
    page: '150',
    title: 'Haftung des Verwaltungsrats bei Konkurs',
    date: '2020-03-10T00:00:00Z',
    language: 'DE',
    summary: 'Board liability in bankruptcy proceedings under Swiss company law',
    legalAreas: ['Gesellschaftsrecht', 'Haftungsrecht'],
  },
  {
    citation: 'BGE 148 III 65',
    volume: '148',
    chamber: 'III',
    page: '65',
    title: 'Contrat de travail - Licenciement abusif',
    date: '2022-02-22T00:00:00Z',
    language: 'FR',
    summary: 'Unfair dismissal criteria under Swiss employment law',
    legalAreas: ['Arbeitsrecht', 'Zivilrecht'],
  },
];

// Search function (copied from main implementation)
function searchBGE(params: SearchParams): {
  decisions: BGEDecision[];
  totalResults: number;
  searchTimeMs: number;
} {
  const startTime = Date.now();
  let filtered = mockBGEDatabase;

  if (params.query) {
    const queryLower = params.query.toLowerCase();
    filtered = filtered.filter(
      (decision) =>
        decision.title.toLowerCase().includes(queryLower) ||
        decision.summary.toLowerCase().includes(queryLower) ||
        decision.citation.toLowerCase().includes(queryLower)
    );
  }

  if (params.language) {
    filtered = filtered.filter((decision) => decision.language === params.language);
  }

  if (params.dateFrom) {
    filtered = filtered.filter((decision) => decision.date >= params.dateFrom!);
  }

  if (params.dateTo) {
    filtered = filtered.filter((decision) => decision.date <= params.dateTo!);
  }

  if (params.chambers && params.chambers.length > 0) {
    filtered = filtered.filter((decision) => params.chambers!.includes(decision.chamber));
  }

  if (params.legalAreas && params.legalAreas.length > 0) {
    filtered = filtered.filter((decision) =>
      decision.legalAreas?.some((area) => params.legalAreas!.includes(area))
    );
  }

  const limit = params.limit || 10;
  const decisions = filtered.slice(0, limit);

  return {
    decisions,
    totalResults: filtered.length,
    searchTimeMs: Date.now() - startTime,
  };
}

// Validate citation function
function validateCitation(citation: string): {
  valid: boolean;
  volume?: string;
  chamber?: string;
  page?: string;
  normalized?: string;
  error?: string;
} {
  const bgeRegex = /^BGE\s+(\d+)\s+([IVX]+)\s+(\d+)$/i;
  const match = citation.match(bgeRegex);

  if (!match) {
    return {
      valid: false,
      error: "Invalid BGE citation format. Expected: 'BGE {volume} {chamber} {page}'",
    };
  }

  const [, volume, chamber, page] = match;

  return {
    valid: true,
    volume,
    chamber: chamber.toUpperCase(),
    page,
    normalized: `BGE ${volume} ${chamber.toUpperCase()} ${page}`,
  };
}

// Get decision function
function getBGEDecision(citation: string): {
  found: boolean;
  decision?: BGEDecision;
} {
  const decision = mockBGEDatabase.find((d) => d.citation === citation);
  return {
    found: !!decision,
    decision,
  };
}

describe('BGE Search MCP Server', () => {
  describe('searchBGE', () => {
    it('should return all decisions when no filters applied', () => {
      const result = searchBGE({ query: '' });
      expect(result.decisions).toHaveLength(3);
      expect(result.totalResults).toBe(3);
    });

    it('should filter by query text', () => {
      const result = searchBGE({ query: 'Invalidenversicherung' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].citation).toBe('BGE 147 V 321');
    });

    it('should filter by language', () => {
      const result = searchBGE({ query: '', language: 'FR' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].language).toBe('FR');
    });

    it('should filter by chamber', () => {
      const result = searchBGE({ query: '', chambers: ['V'] });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].chamber).toBe('V');
    });

    it('should filter by legal area', () => {
      const result = searchBGE({ query: '', legalAreas: ['Arbeitsrecht'] });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].citation).toBe('BGE 148 III 65');
    });

    it('should filter by date range', () => {
      const result = searchBGE({
        query: '',
        dateFrom: '2021-01-01T00:00:00Z',
      });
      expect(result.decisions).toHaveLength(2);
    });

    it('should respect limit parameter', () => {
      const result = searchBGE({ query: '', limit: 2 });
      expect(result.decisions).toHaveLength(2);
    });

    it('should return search time', () => {
      const result = searchBGE({ query: '' });
      expect(result.searchTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should combine multiple filters', () => {
      const result = searchBGE({
        query: '',
        language: 'DE',
        chambers: ['V'],
      });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].citation).toBe('BGE 147 V 321');
    });
  });

  describe('validateCitation', () => {
    it('should validate correct BGE citation', () => {
      const result = validateCitation('BGE 147 V 321');
      expect(result.valid).toBe(true);
      expect(result.volume).toBe('147');
      expect(result.chamber).toBe('V');
      expect(result.page).toBe('321');
      expect(result.normalized).toBe('BGE 147 V 321');
    });

    it('should normalize lowercase citations', () => {
      const result = validateCitation('bge 147 v 321');
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('BGE 147 V 321');
    });

    it('should reject invalid format (missing spaces)', () => {
      const result = validateCitation('BGE147V321');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid BGE citation format');
    });

    it('should reject invalid format (wrong separator)', () => {
      const result = validateCitation('BGE-147-V-321');
      expect(result.valid).toBe(false);
    });

    it('should reject non-roman numeral chambers', () => {
      const result = validateCitation('BGE 147 6 321');
      expect(result.valid).toBe(false);
    });

    it('should handle all valid chambers', () => {
      const chambers = ['I', 'II', 'III', 'IV', 'V'];
      chambers.forEach((chamber) => {
        const result = validateCitation(`BGE 147 ${chamber} 321`);
        expect(result.valid).toBe(true);
        expect(result.chamber).toBe(chamber);
      });
    });
  });

  describe('getBGEDecision', () => {
    it('should find existing decision', () => {
      const result = getBGEDecision('BGE 147 V 321');
      expect(result.found).toBe(true);
      expect(result.decision).toBeDefined();
      expect(result.decision?.citation).toBe('BGE 147 V 321');
    });

    it('should return not found for non-existent citation', () => {
      const result = getBGEDecision('BGE 999 X 999');
      expect(result.found).toBe(false);
      expect(result.decision).toBeUndefined();
    });

    it('should return full decision details', () => {
      const result = getBGEDecision('BGE 147 V 321');
      expect(result.decision?.title).toContain('Invalidenversicherung');
      expect(result.decision?.legalAreas).toContain('Sozialversicherungsrecht');
      expect(result.decision?.language).toBe('DE');
    });
  });

  describe('Integration Tests', () => {
    it('should support validate -> get decision workflow', () => {
      const validation = validateCitation('bge 147 v 321');
      expect(validation.valid).toBe(true);

      const decision = getBGEDecision(validation.normalized!);
      expect(decision.found).toBe(true);
      expect(decision.decision?.citation).toBe('BGE 147 V 321');
    });

    it('should support search -> validate -> get workflow', () => {
      const search = searchBGE({ query: 'disability insurance', limit: 1 });
      expect(search.decisions.length).toBeGreaterThan(0);

      const firstCitation = search.decisions[0].citation;
      const validation = validateCitation(firstCitation);
      expect(validation.valid).toBe(true);

      const decision = getBGEDecision(firstCitation);
      expect(decision.found).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const result = searchBGE({ query: '' });
      expect(result.totalResults).toBeGreaterThan(0);
    });

    it('should handle query with no results', () => {
      const result = searchBGE({ query: 'xyznonexistent' });
      expect(result.decisions).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    it('should handle empty chambers filter', () => {
      const result = searchBGE({ query: '', chambers: [] });
      expect(result.decisions).toHaveLength(3);
    });

    it('should handle limit larger than results', () => {
      const result = searchBGE({ query: '', limit: 100 });
      expect(result.decisions).toHaveLength(3);
    });

    it('should handle limit of 1', () => {
      const result = searchBGE({ query: '', limit: 1 });
      expect(result.decisions).toHaveLength(1);
    });
  });
});
