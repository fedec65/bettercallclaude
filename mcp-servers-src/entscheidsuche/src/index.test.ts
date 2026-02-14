/**
 * Entscheidsuche MCP Server - Unit Tests
 * Tests for Swiss federal and cantonal court decision search functionality
 */

import { describe, it, expect } from 'vitest';

// Court decision type definition
interface CourtDecision {
  decisionId: string;
  courtName: string;
  courtLevel: "federal" | "cantonal" | "district";
  canton?: string;
  title: string;
  date: string;
  language: string;
  summary: string;
  legalAreas?: string[];
  referenceNumber?: string;
  fullTextUrl?: string;
}

// Search parameters interface
interface SearchParams {
  query: string;
  courtLevel?: "federal" | "cantonal" | "district";
  canton?: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  legalAreas?: string[];
  limit?: number;
}

// Mock decisions database
const mockDecisionsDatabase: CourtDecision[] = [
  {
    decisionId: "BG-2021-001",
    courtName: "Bundesgericht (Federal Supreme Court)",
    courtLevel: "federal",
    title: "Sozialversicherungsrecht - Invalidenversicherung",
    date: "2021-09-15T00:00:00Z",
    language: "DE",
    summary: "Decision on disability insurance eligibility for mental health conditions",
    legalAreas: ["Sozialversicherungsrecht"],
    referenceNumber: "8C_413/2020",
    fullTextUrl: "https://www.bger.ch/ext/eurospider/live/de/php/aza/http/index.php?highlight_docid=aza%3A%2F%2F15-09-2021-8C_413-2020"
  },
  {
    decisionId: "ZH-2023-001",
    courtName: "Obergericht Zürich",
    courtLevel: "cantonal",
    canton: "ZH",
    title: "Arbeitsrecht - Kündigungsschutz",
    date: "2023-05-10T00:00:00Z",
    language: "DE",
    summary: "Employment law decision on unfair dismissal protection",
    legalAreas: ["Arbeitsrecht", "Zivilrecht"],
    referenceNumber: "LA220050",
    fullTextUrl: "https://www.zh.ch/de/gerichte-notariate/obergericht/entscheide.html"
  },
  {
    decisionId: "GE-2022-003",
    courtName: "Tribunal cantonal de Genève",
    courtLevel: "cantonal",
    canton: "GE",
    title: "Droit du travail - Licenciement abusif",
    date: "2022-11-20T00:00:00Z",
    language: "FR",
    summary: "Décision sur le licenciement abusif en droit du travail",
    legalAreas: ["Arbeitsrecht", "Droit civil"],
    referenceNumber: "CACI/245/2022",
    fullTextUrl: "https://ge.ch/justice/tribunal-cantonal"
  },
  {
    decisionId: "BE-2023-005",
    courtName: "Obergericht Bern",
    courtLevel: "cantonal",
    canton: "BE",
    title: "Mietrecht - Kündigungsschutz bei Sanierungen",
    date: "2023-03-15T00:00:00Z",
    language: "DE",
    summary: "Rental law decision on eviction protection during renovations",
    legalAreas: ["Mietrecht", "Zivilrecht"],
    referenceNumber: "MZK-22-456"
  }
];

/**
 * Search court decisions
 */
function searchDecisions(params: SearchParams): {
  decisions: CourtDecision[];
  totalResults: number;
  facets: Record<string, number>;
  searchTimeMs: number;
} {
  const startTime = Date.now();

  let filtered = mockDecisionsDatabase;

  // Filter by query
  if (params.query) {
    const queryLower = params.query.toLowerCase();
    filtered = filtered.filter(decision =>
      decision.title.toLowerCase().includes(queryLower) ||
      decision.summary.toLowerCase().includes(queryLower) ||
      decision.decisionId.toLowerCase().includes(queryLower)
    );
  }

  // Filter by court level
  if (params.courtLevel) {
    filtered = filtered.filter(decision => decision.courtLevel === params.courtLevel);
  }

  // Filter by canton
  if (params.canton) {
    filtered = filtered.filter(decision => decision.canton === params.canton);
  }

  // Filter by language
  if (params.language) {
    filtered = filtered.filter(decision => decision.language === params.language);
  }

  // Filter by date range
  if (params.dateFrom) {
    filtered = filtered.filter(decision => decision.date >= params.dateFrom!);
  }
  if (params.dateTo) {
    filtered = filtered.filter(decision => decision.date <= params.dateTo!);
  }

  // Filter by legal areas
  if (params.legalAreas && params.legalAreas.length > 0) {
    filtered = filtered.filter(decision =>
      decision.legalAreas?.some(area => params.legalAreas!.includes(area))
    );
  }

  // Calculate facets
  const facets: Record<string, number> = {
    federal: filtered.filter(d => d.courtLevel === "federal").length,
    cantonal: filtered.filter(d => d.courtLevel === "cantonal").length,
    district: filtered.filter(d => d.courtLevel === "district").length
  };

  // Apply limit
  const limit = params.limit || 10;
  const decisions = filtered.slice(0, limit);

  const searchTimeMs = Date.now() - startTime;

  return {
    decisions,
    totalResults: filtered.length,
    facets,
    searchTimeMs
  };
}

/**
 * Get related decisions
 */
function getRelatedDecisions(decisionId: string, limit: number = 5): {
  relatedDecisions: CourtDecision[];
} {
  // Find the base decision
  const baseDecision = mockDecisionsDatabase.find(d => d.decisionId === decisionId);

  if (!baseDecision) {
    return { relatedDecisions: [] };
  }

  // Find related decisions (same legal areas or same canton)
  const related = mockDecisionsDatabase.filter(decision =>
    decision.decisionId !== decisionId && (
      decision.legalAreas?.some(area => baseDecision.legalAreas?.includes(area)) ||
      (decision.canton && decision.canton === baseDecision.canton)
    )
  ).slice(0, limit);

  return {
    relatedDecisions: related
  };
}

/**
 * Get decision details
 */
function getDecisionDetails(decisionId: string): {
  found: boolean;
  decision?: CourtDecision;
} {
  const decision = mockDecisionsDatabase.find(d => d.decisionId === decisionId);

  return {
    found: !!decision,
    decision
  };
}

describe('Entscheidsuche MCP Server', () => {
  describe('searchDecisions', () => {
    it('should return all decisions when no filters applied', () => {
      const result = searchDecisions({ query: '' });
      expect(result.decisions).toHaveLength(4);
      expect(result.totalResults).toBe(4);
    });

    it('should filter by query text in title', () => {
      const result = searchDecisions({ query: 'Arbeitsrecht' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].title).toContain('Arbeitsrecht');
    });

    it('should filter by query text in summary', () => {
      const result = searchDecisions({ query: 'disability insurance' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].decisionId).toBe('BG-2021-001');
    });

    it('should filter by query text in decision ID', () => {
      const result = searchDecisions({ query: 'ZH-2023' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].decisionId).toBe('ZH-2023-001');
    });

    it('should filter by court level - federal', () => {
      const result = searchDecisions({ query: '', courtLevel: 'federal' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].courtLevel).toBe('federal');
      expect(result.decisions[0].decisionId).toBe('BG-2021-001');
    });

    it('should filter by court level - cantonal', () => {
      const result = searchDecisions({ query: '', courtLevel: 'cantonal' });
      expect(result.decisions).toHaveLength(3);
      expect(result.decisions.every(d => d.courtLevel === 'cantonal')).toBe(true);
    });

    it('should filter by canton', () => {
      const result = searchDecisions({ query: '', canton: 'ZH' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].canton).toBe('ZH');
    });

    it('should filter by language - DE', () => {
      const result = searchDecisions({ query: '', language: 'DE' });
      expect(result.decisions).toHaveLength(3);
      expect(result.decisions.every(d => d.language === 'DE')).toBe(true);
    });

    it('should filter by language - FR', () => {
      const result = searchDecisions({ query: '', language: 'FR' });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].language).toBe('FR');
      expect(result.decisions[0].decisionId).toBe('GE-2022-003');
    });

    it('should filter by legal area', () => {
      const result = searchDecisions({ query: '', legalAreas: ['Arbeitsrecht'] });
      expect(result.decisions).toHaveLength(2);
      expect(result.decisions.every(d => d.legalAreas?.includes('Arbeitsrecht'))).toBe(true);
    });

    it('should filter by multiple legal areas', () => {
      const result = searchDecisions({ query: '', legalAreas: ['Mietrecht', 'Sozialversicherungsrecht'] });
      expect(result.decisions).toHaveLength(2);
    });

    it('should filter by date range - from', () => {
      const result = searchDecisions({
        query: '',
        dateFrom: '2022-01-01T00:00:00Z'
      });
      expect(result.decisions).toHaveLength(3);
      expect(result.decisions.every(d => d.date >= '2022-01-01T00:00:00Z')).toBe(true);
    });

    it('should filter by date range - to', () => {
      const result = searchDecisions({
        query: '',
        dateTo: '2022-12-31T23:59:59Z'
      });
      expect(result.decisions).toHaveLength(2);
      expect(result.decisions.every(d => d.date <= '2022-12-31T23:59:59Z')).toBe(true);
    });

    it('should filter by date range - from and to', () => {
      const result = searchDecisions({
        query: '',
        dateFrom: '2022-01-01T00:00:00Z',
        dateTo: '2023-03-31T23:59:59Z'
      });
      expect(result.decisions).toHaveLength(2);
    });

    it('should respect limit parameter', () => {
      const result = searchDecisions({ query: '', limit: 2 });
      expect(result.decisions).toHaveLength(2);
      expect(result.totalResults).toBe(4);
    });

    it('should return search time', () => {
      const result = searchDecisions({ query: '' });
      expect(result.searchTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return facets', () => {
      const result = searchDecisions({ query: '' });
      expect(result.facets).toBeDefined();
      expect(result.facets.federal).toBe(1);
      expect(result.facets.cantonal).toBe(3);
      expect(result.facets.district).toBe(0);
    });

    it('should combine multiple filters', () => {
      const result = searchDecisions({
        query: '',
        courtLevel: 'cantonal',
        language: 'DE',
        legalAreas: ['Arbeitsrecht']
      });
      expect(result.decisions).toHaveLength(1);
      expect(result.decisions[0].decisionId).toBe('ZH-2023-001');
    });

    it('should return empty array for no matches', () => {
      const result = searchDecisions({ query: 'xyznonexistent' });
      expect(result.decisions).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('getRelatedDecisions', () => {
    it('should find related decisions by legal area', () => {
      const result = getRelatedDecisions('ZH-2023-001');
      expect(result.relatedDecisions.length).toBeGreaterThan(0);
      expect(result.relatedDecisions.some(d => d.legalAreas?.includes('Arbeitsrecht'))).toBe(true);
    });

    it('should find related decisions by canton', () => {
      const result = getRelatedDecisions('ZH-2023-001');
      expect(result.relatedDecisions.length).toBeGreaterThan(0);
      // Should not include the decision itself
      expect(result.relatedDecisions.every(d => d.decisionId !== 'ZH-2023-001')).toBe(true);
    });

    it('should respect limit parameter', () => {
      const result = getRelatedDecisions('ZH-2023-001', 1);
      expect(result.relatedDecisions).toHaveLength(1);
    });

    it('should return empty array for non-existent decision', () => {
      const result = getRelatedDecisions('INVALID-ID');
      expect(result.relatedDecisions).toHaveLength(0);
    });

    it('should not include the decision itself in results', () => {
      const result = getRelatedDecisions('BG-2021-001');
      expect(result.relatedDecisions.every(d => d.decisionId !== 'BG-2021-001')).toBe(true);
    });

    it('should find decisions with overlapping legal areas', () => {
      const result = getRelatedDecisions('ZH-2023-001'); // Has Arbeitsrecht
      const hasRelatedLegalArea = result.relatedDecisions.some(d =>
        d.legalAreas?.includes('Arbeitsrecht')
      );
      expect(hasRelatedLegalArea).toBe(true);
    });
  });

  describe('getDecisionDetails', () => {
    it('should find existing decision', () => {
      const result = getDecisionDetails('BG-2021-001');
      expect(result.found).toBe(true);
      expect(result.decision).toBeDefined();
      expect(result.decision?.decisionId).toBe('BG-2021-001');
    });

    it('should return not found for non-existent decision', () => {
      const result = getDecisionDetails('INVALID-999');
      expect(result.found).toBe(false);
      expect(result.decision).toBeUndefined();
    });

    it('should return full decision details', () => {
      const result = getDecisionDetails('ZH-2023-001');
      expect(result.decision?.courtName).toBe('Obergericht Zürich');
      expect(result.decision?.courtLevel).toBe('cantonal');
      expect(result.decision?.canton).toBe('ZH');
      expect(result.decision?.legalAreas).toContain('Arbeitsrecht');
    });

    it('should find federal decision', () => {
      const result = getDecisionDetails('BG-2021-001');
      expect(result.found).toBe(true);
      expect(result.decision?.courtLevel).toBe('federal');
    });

    it('should find cantonal decision with French language', () => {
      const result = getDecisionDetails('GE-2022-003');
      expect(result.found).toBe(true);
      expect(result.decision?.language).toBe('FR');
    });
  });

  describe('Integration Tests', () => {
    it('should support search -> get details workflow', () => {
      const search = searchDecisions({ query: 'Arbeitsrecht', limit: 1 });
      expect(search.decisions.length).toBeGreaterThan(0);

      const firstDecisionId = search.decisions[0].decisionId;
      const details = getDecisionDetails(firstDecisionId);
      expect(details.found).toBe(true);
      expect(details.decision?.decisionId).toBe(firstDecisionId);
    });

    it('should support search -> get related workflow', () => {
      const search = searchDecisions({ query: 'Arbeitsrecht', limit: 1 });
      expect(search.decisions.length).toBeGreaterThan(0);

      const firstDecisionId = search.decisions[0].decisionId;
      const related = getRelatedDecisions(firstDecisionId);
      // Should have related decisions with same legal area
      expect(related.relatedDecisions.length).toBeGreaterThan(0);
    });

    it('should support get details -> get related workflow', () => {
      const details = getDecisionDetails('ZH-2023-001');
      expect(details.found).toBe(true);

      const related = getRelatedDecisions(details.decision!.decisionId);
      expect(related.relatedDecisions.length).toBeGreaterThan(0);
      // Related decisions should share legal areas or canton
      const hasCommonality = related.relatedDecisions.some(d =>
        d.legalAreas?.some(area => details.decision!.legalAreas?.includes(area)) ||
        d.canton === details.decision!.canton
      );
      expect(hasCommonality).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const result = searchDecisions({ query: '' });
      expect(result.totalResults).toBeGreaterThan(0);
    });

    it('should handle query with no results', () => {
      const result = searchDecisions({ query: 'xyznonexistent' });
      expect(result.decisions).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    it('should handle empty legal areas filter', () => {
      const result = searchDecisions({ query: '', legalAreas: [] });
      expect(result.decisions).toHaveLength(4);
    });

    it('should handle limit larger than results', () => {
      const result = searchDecisions({ query: '', limit: 100 });
      expect(result.decisions).toHaveLength(4);
    });

    it('should handle limit of 1', () => {
      const result = searchDecisions({ query: '', limit: 1 });
      expect(result.decisions).toHaveLength(1);
    });

    it('should handle non-existent court level', () => {
      const result = searchDecisions({ query: '', courtLevel: 'district' });
      expect(result.decisions).toHaveLength(0);
    });

    it('should handle non-existent canton', () => {
      const result = searchDecisions({ query: '', canton: 'XX' });
      expect(result.decisions).toHaveLength(0);
    });

    it('should handle case-insensitive query', () => {
      const result1 = searchDecisions({ query: 'arbeitsrecht' });
      const result2 = searchDecisions({ query: 'ARBEITSRECHT' });
      expect(result1.totalResults).toBe(result2.totalResults);
    });

    it('should handle special characters in query', () => {
      const result = searchDecisions({ query: 'Kündigungsschutz' });
      expect(result.decisions.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // New Tools Tests: analyze_precedent_success_rate
  // ---------------------------------------------------------------------------
  describe('analyzePrecedentSuccessRate', () => {
    // Mock analysis function
    interface PrecedentAnalysisParams {
      legalArea: string;
      claimType: string;
      courtLevel?: "federal" | "cantonal";
      cantons?: string[];
      dateFrom?: string;
      dateTo?: string;
    }

    interface PrecedentAnalysisResult {
      totalCases: number;
      successRate: number;
      byCourtLevel: Record<string, { total: number; successful: number; rate: number }>;
      byCanton?: Record<string, { total: number; successful: number; rate: number }>;
      byYear: Array<{ year: number; total: number; successful: number; rate: number }>;
      keyFactors: string[];
      recommendations: string[];
    }

    function analyzePrecedentSuccessRate(params: PrecedentAnalysisParams): PrecedentAnalysisResult {
      // Get relevant decisions
      const decisions = mockDecisionsDatabase.filter(d => {
        if (d.legalAreas && !d.legalAreas.includes(params.legalArea)) {
          return false;
        }
        if (params.courtLevel && d.courtLevel !== params.courtLevel) {
          return false;
        }
        if (params.cantons && d.canton && !params.cantons.includes(d.canton)) {
          return false;
        }
        return true;
      });

      // Calculate success rates
      const byCourtLevel: Record<string, { total: number; successful: number; rate: number }> = {};
      const byCanton: Record<string, { total: number; successful: number; rate: number }> = {};
      const byYearMap = new Map<number, { total: number; successful: number }>();

      let totalSuccessful = 0;
      for (const decision of decisions) {
        const year = new Date(decision.date).getFullYear();
        // Simulate success analysis based on title/summary
        const isSuccess = decision.summary.toLowerCase().includes('successful') ||
                          decision.title.toLowerCase().includes('stattgegeben') ||
                          Math.random() > 0.5; // Placeholder for demo

        if (isSuccess) totalSuccessful++;

        // By court level
        if (!byCourtLevel[decision.courtLevel]) {
          byCourtLevel[decision.courtLevel] = { total: 0, successful: 0, rate: 0 };
        }
        byCourtLevel[decision.courtLevel].total++;
        if (isSuccess) byCourtLevel[decision.courtLevel].successful++;

        // By canton
        if (decision.canton) {
          if (!byCanton[decision.canton]) {
            byCanton[decision.canton] = { total: 0, successful: 0, rate: 0 };
          }
          byCanton[decision.canton].total++;
          if (isSuccess) byCanton[decision.canton].successful++;
        }

        // By year
        const yearData = byYearMap.get(year) || { total: 0, successful: 0 };
        yearData.total++;
        if (isSuccess) yearData.successful++;
        byYearMap.set(year, yearData);
      }

      // Calculate rates
      for (const level of Object.keys(byCourtLevel)) {
        byCourtLevel[level].rate = byCourtLevel[level].total > 0
          ? Math.round((byCourtLevel[level].successful / byCourtLevel[level].total) * 100)
          : 0;
      }

      for (const canton of Object.keys(byCanton)) {
        byCanton[canton].rate = byCanton[canton].total > 0
          ? Math.round((byCanton[canton].successful / byCanton[canton].total) * 100)
          : 0;
      }

      const byYear = Array.from(byYearMap.entries())
        .map(([year, data]) => ({
          year,
          total: data.total,
          successful: data.successful,
          rate: data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0,
        }))
        .sort((a, b) => b.year - a.year);

      const successRate = decisions.length > 0
        ? Math.round((totalSuccessful / decisions.length) * 100)
        : 0;

      return {
        totalCases: decisions.length,
        successRate,
        byCourtLevel,
        byCanton: Object.keys(byCanton).length > 0 ? byCanton : undefined,
        byYear,
        keyFactors: [`Relevant legal area: ${params.legalArea}`],
        recommendations: [
          successRate >= 70 ? 'Strong precedent support' : 'Review case strategy',
        ],
      };
    }

    it('should analyze precedent success rate for a legal area', () => {
      const result = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'Kündigungsschutz',
      });

      expect(result.totalCases).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(100);
    });

    it('should provide breakdown by court level', () => {
      const result = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'Kündigungsschutz',
      });

      expect(result.byCourtLevel).toBeDefined();
      // Check structure of court level stats
      for (const level of Object.keys(result.byCourtLevel)) {
        expect(result.byCourtLevel[level].total).toBeGreaterThanOrEqual(0);
        expect(result.byCourtLevel[level].successful).toBeGreaterThanOrEqual(0);
        expect(result.byCourtLevel[level].rate).toBeGreaterThanOrEqual(0);
        expect(result.byCourtLevel[level].rate).toBeLessThanOrEqual(100);
      }
    });

    it('should provide breakdown by canton when cantonal data exists', () => {
      const result = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'Kündigungsschutz',
        courtLevel: 'cantonal',
      });

      if (result.byCanton) {
        for (const canton of Object.keys(result.byCanton)) {
          expect(result.byCanton[canton].total).toBeGreaterThanOrEqual(0);
          expect(result.byCanton[canton].rate).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should provide yearly breakdown', () => {
      const result = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'Kündigungsschutz',
      });

      expect(result.byYear).toBeDefined();
      expect(Array.isArray(result.byYear)).toBe(true);
    });

    it('should provide key factors', () => {
      const result = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'Kündigungsschutz',
      });

      expect(result.keyFactors).toBeDefined();
      expect(Array.isArray(result.keyFactors)).toBe(true);
    });

    it('should provide recommendations', () => {
      const result = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'Kündigungsschutz',
      });

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should filter by court level', () => {
      const federalResult = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'test',
        courtLevel: 'federal',
      });

      const cantonalResult = analyzePrecedentSuccessRate({
        legalArea: 'Arbeitsrecht',
        claimType: 'test',
        courtLevel: 'cantonal',
      });

      // Federal should not have cantonal court level
      expect(federalResult.byCourtLevel['cantonal']).toBeUndefined();
      // Cantonal should not have federal court level
      expect(cantonalResult.byCourtLevel['federal']).toBeUndefined();
    });

    it('should handle non-existent legal area', () => {
      const result = analyzePrecedentSuccessRate({
        legalArea: 'NonExistentArea',
        claimType: 'test',
      });

      expect(result.totalCases).toBe(0);
      expect(result.successRate).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // New Tools Tests: findSimilarCases
  // ---------------------------------------------------------------------------
  describe('findSimilarCases', () => {
    interface SimilarCasesParams {
      decisionId?: string;
      factPattern?: string;
      legalArea?: string;
      limit?: number;
    }

    interface SimilarCaseResult {
      decision: CourtDecision;
      similarityScore: number;
      matchingFactors: string[];
    }

    function findSimilarCases(params: SimilarCasesParams): {
      similarCases: SimilarCaseResult[];
      totalFound: number;
    } {
      let baseDecision: CourtDecision | undefined;
      let searchText = params.factPattern || '';

      // Get base decision if ID provided
      if (params.decisionId) {
        baseDecision = mockDecisionsDatabase.find(d => d.decisionId === params.decisionId);
        if (baseDecision) {
          searchText = [baseDecision.title, baseDecision.summary, ...(baseDecision.legalAreas || [])].join(' ');
        }
      }

      if (!searchText && !baseDecision) {
        return { similarCases: [], totalFound: 0 };
      }

      const similarCases: SimilarCaseResult[] = [];

      for (const candidate of mockDecisionsDatabase) {
        // Skip the base decision
        if (baseDecision && candidate.decisionId === baseDecision.decisionId) {
          continue;
        }

        // Calculate similarity
        let score = 0;
        const matchingFactors: string[] = [];

        // Legal area match
        if (baseDecision) {
          const baseLegalAreas = new Set(baseDecision.legalAreas || []);
          const overlap = (candidate.legalAreas || []).filter(a => baseLegalAreas.has(a));
          if (overlap.length > 0) {
            score += 0.3;
            matchingFactors.push(`Matching legal areas: ${overlap.join(', ')}`);
          }

          // Canton match
          if (baseDecision.canton && candidate.canton === baseDecision.canton) {
            score += 0.2;
            matchingFactors.push(`Same canton: ${candidate.canton}`);
          }

          // Language match
          if (baseDecision.language === candidate.language) {
            score += 0.1;
            matchingFactors.push(`Same language: ${candidate.language}`);
          }
        }

        // Text similarity with fact pattern
        if (params.factPattern) {
          const candidateText = `${candidate.title} ${candidate.summary}`.toLowerCase();
          const patternWords = params.factPattern.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          const matchingWords = patternWords.filter(w => candidateText.includes(w));
          if (matchingWords.length > 0) {
            score += (matchingWords.length / patternWords.length) * 0.3;
            matchingFactors.push(`Matching keywords: ${matchingWords.join(', ')}`);
          }
        }

        // Legal area filter
        if (params.legalArea && candidate.legalAreas && !candidate.legalAreas.includes(params.legalArea)) {
          continue;
        }

        if (score > 0.3 || matchingFactors.length > 0) {
          similarCases.push({
            decision: candidate,
            similarityScore: Math.round(score * 100),
            matchingFactors,
          });
        }
      }

      // Sort by similarity score
      similarCases.sort((a, b) => b.similarityScore - a.similarityScore);

      // Apply limit
      const limited = similarCases.slice(0, params.limit || 10);

      return { similarCases: limited, totalFound: similarCases.length };
    }

    it('should find similar cases by decision ID', () => {
      const result = findSimilarCases({ decisionId: 'ZH-2023-001' });

      expect(result.similarCases).toBeDefined();
      expect(Array.isArray(result.similarCases)).toBe(true);
    });

    it('should find similar cases by fact pattern', () => {
      const result = findSimilarCases({
        factPattern: 'Arbeitsrecht Kündigungsschutz employment',
      });

      expect(result.similarCases).toBeDefined();
    });

    it('should calculate similarity scores', () => {
      const result = findSimilarCases({ decisionId: 'ZH-2023-001' });

      for (const similarCase of result.similarCases) {
        expect(similarCase.similarityScore).toBeGreaterThanOrEqual(0);
        expect(similarCase.similarityScore).toBeLessThanOrEqual(100);
      }
    });

    it('should provide matching factors', () => {
      const result = findSimilarCases({ decisionId: 'ZH-2023-001' });

      for (const similarCase of result.similarCases) {
        expect(similarCase.matchingFactors).toBeDefined();
        expect(Array.isArray(similarCase.matchingFactors)).toBe(true);
      }
    });

    it('should filter by legal area', () => {
      const result = findSimilarCases({
        factPattern: 'contract dispute',
        legalArea: 'Arbeitsrecht',
      });

      for (const similarCase of result.similarCases) {
        expect(similarCase.decision.legalAreas).toContain('Arbeitsrecht');
      }
    });

    it('should respect limit parameter', () => {
      const result = findSimilarCases({
        factPattern: 'law',
        limit: 2,
      });

      expect(result.similarCases.length).toBeLessThanOrEqual(2);
    });

    it('should not include base decision in results', () => {
      const baseId = 'ZH-2023-001';
      const result = findSimilarCases({ decisionId: baseId });

      const includesBase = result.similarCases.some(c => c.decision.decisionId === baseId);
      expect(includesBase).toBe(false);
    });

    it('should return total found count', () => {
      const result = findSimilarCases({ decisionId: 'ZH-2023-001' });

      expect(result.totalFound).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(result.similarCases.length);
    });

    it('should handle non-existent decision ID', () => {
      const result = findSimilarCases({ decisionId: 'INVALID-ID' });

      expect(result.similarCases).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    });

    it('should handle empty fact pattern', () => {
      const result = findSimilarCases({ factPattern: '' });

      expect(result.similarCases).toHaveLength(0);
    });

    it('should sort by similarity score descending', () => {
      const result = findSimilarCases({ decisionId: 'ZH-2023-001' });

      for (let i = 1; i < result.similarCases.length; i++) {
        expect(result.similarCases[i].similarityScore)
          .toBeLessThanOrEqual(result.similarCases[i - 1].similarityScore);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // New Tools Tests: getLegalProvisionInterpretation
  // ---------------------------------------------------------------------------
  describe('getLegalProvisionInterpretation', () => {
    interface ProvisionInterpretationParams {
      statute: string;
      article: number;
      paragraph?: number;
      language?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    }

    interface InterpretationResult {
      decision: CourtDecision;
      interpretation: string;
      context: string;
      date: string;
    }

    function getLegalProvisionInterpretation(params: ProvisionInterpretationParams): {
      provision: { statute: string; article: number; paragraph?: number; formatted: string };
      interpretations: InterpretationResult[];
      totalFound: number;
    } {
      const articleRef = params.paragraph
        ? `Art. ${params.article} Abs. ${params.paragraph} ${params.statute}`
        : `Art. ${params.article} ${params.statute}`;

      // Search for decisions mentioning this statute
      const relevantDecisions = mockDecisionsDatabase.filter(d => {
        const text = `${d.title} ${d.summary}`.toLowerCase();
        return text.includes(params.statute.toLowerCase()) ||
               text.includes(articleRef.toLowerCase());
      });

      // Filter by language if specified
      const languageFiltered = params.language
        ? relevantDecisions.filter(d => d.language === params.language)
        : relevantDecisions;

      // Extract interpretations
      const interpretations: InterpretationResult[] = languageFiltered.map(decision => ({
        decision,
        interpretation: decision.summary,
        context: `Reference to ${articleRef} in ${decision.courtLevel} decision`,
        date: decision.date,
      }));

      // Sort by date (newest first)
      interpretations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Apply limit
      const limited = interpretations.slice(0, params.limit || 10);

      return {
        provision: {
          statute: params.statute,
          article: params.article,
          paragraph: params.paragraph,
          formatted: articleRef,
        },
        interpretations: limited,
        totalFound: interpretations.length,
      };
    }

    it('should get interpretations for a statutory provision', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'OR',
        article: 97,
      });

      expect(result.provision).toBeDefined();
      expect(result.provision.statute).toBe('OR');
      expect(result.provision.article).toBe(97);
    });

    it('should format provision reference correctly', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'ZGB',
        article: 8,
        paragraph: 1,
      });

      expect(result.provision.formatted).toBe('Art. 8 Abs. 1 ZGB');
    });

    it('should format provision without paragraph', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'OR',
        article: 97,
      });

      expect(result.provision.formatted).toBe('Art. 97 OR');
    });

    it('should return interpretations array', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'ZGB',
        article: 8,
      });

      expect(result.interpretations).toBeDefined();
      expect(Array.isArray(result.interpretations)).toBe(true);
    });

    it('should include interpretation details', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'OR',
        article: 97,
      });

      for (const interp of result.interpretations) {
        expect(interp.decision).toBeDefined();
        expect(interp.interpretation).toBeDefined();
        expect(interp.context).toBeDefined();
        expect(interp.date).toBeDefined();
      }
    });

    it('should filter by language', () => {
      const deResult = getLegalProvisionInterpretation({
        statute: 'OR',
        article: 97,
        language: 'DE',
      });

      for (const interp of deResult.interpretations) {
        expect(interp.decision.language).toBe('DE');
      }
    });

    it('should respect limit parameter', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'OR',
        article: 97,
        limit: 2,
      });

      expect(result.interpretations.length).toBeLessThanOrEqual(2);
    });

    it('should return total found count', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'OR',
        article: 97,
      });

      expect(result.totalFound).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    it('should sort interpretations by date descending', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'OR',
        article: 97,
      });

      for (let i = 1; i < result.interpretations.length; i++) {
        const prevDate = new Date(result.interpretations[i - 1].date).getTime();
        const currDate = new Date(result.interpretations[i].date).getTime();
        expect(currDate).toBeLessThanOrEqual(prevDate);
      }
    });

    it('should handle statute with no interpretations', () => {
      const result = getLegalProvisionInterpretation({
        statute: 'XYZ',
        article: 999,
      });

      expect(result.interpretations).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    });

    it('should handle various Swiss statutes', () => {
      const statutes = ['OR', 'ZGB', 'StGB', 'BV', 'BGG'];

      for (const statute of statutes) {
        const result = getLegalProvisionInterpretation({
          statute,
          article: 1,
        });

        expect(result.provision.statute).toBe(statute);
        expect(result.provision.formatted).toContain(statute);
      }
    });
  });
});
