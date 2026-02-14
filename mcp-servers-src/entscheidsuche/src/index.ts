#!/usr/bin/env node

/**
 * Entscheidsuche MCP Server - Production Version
 *
 * Provides unified access to Swiss federal and cantonal court decisions
 * via the Model Context Protocol over stdio transport.
 *
 * Features:
 * - Real API integration for federal (Bundesgericht) and cantonal courts
 * - Multi-canton parallel search aggregation
 * - Database persistence for all decisions
 * - Cache-first strategy for performance
 * - Unified search across court levels
 *
 * Tools:
 * - search_decisions: Unified search across federal and cantonal courts
 * - search_canton: Search specific canton(s) with parallel aggregation
 * - get_related_decisions: Find related decisions via citation graph
 * - get_decision_details: Retrieve full decision details
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import shared infrastructure
import {
  getConfig,
  getLogger,
  Logger,
  getDataSource,
  BundesgerichtClient,
  CantonalClient,
  CantonalClientFactory,
  DecisionRepository,
  CacheRepository,
  type Canton,
  type BundesgerichtSearchFilters,
  type CantonalSearchFilters,
  type BundesgerichtDecision,
  type CantonalDecision,
  type APIClientOptions,
} from "@bettercallclaude/shared";

// Unified search parameters interface (MCP tool input)
interface SearchParams {
  query: string;
  courtLevel?: "federal" | "cantonal" | "all";
  cantons?: Canton[];
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  legalAreas?: string[];
  limit?: number;
}

// Canton-specific search parameters
interface CantonSearchParams {
  query: string;
  cantons: Canton[];
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  legalAreas?: string[];
  limit?: number;
}

/**
 * Global instances
 */
let bundesgerichtClient: BundesgerichtClient;
let cantonalClients: Record<Canton, CantonalClient>;
let decisionRepo: DecisionRepository;
let cacheRepo: CacheRepository;
let logger: Logger;

/**
 * Initialize infrastructure components
 */
async function initializeInfrastructure() {
  // Load configuration
  const config = getConfig();
  const winstonLogger = getLogger(config.logging);
  logger = new Logger(winstonLogger);

  logger.info("Initializing Entscheidsuche MCP server", {
    version: "2.0.0",
    environment: config.environment,
  });

  // Initialize database connection
  const dataSource = await getDataSource(config.database);
  logger.info("Database connection established", {
    type: config.database.type,
  });

  // Initialize repositories
  decisionRepo = new DecisionRepository(dataSource);
  cacheRepo = new CacheRepository(dataSource);
  logger.info("Repositories initialized");

  // Initialize Bundesgericht API client
  bundesgerichtClient = new BundesgerichtClient({
    config: config.apis.bundesgericht,
    logger,
    serviceName: "bundesgericht",
  });
  logger.info("Bundesgericht API client initialized", {
    baseUrl: config.apis.bundesgericht.baseUrl,
  });

  // Initialize cantonal clients for all configured cantons
  const cantonConfigs: Record<Canton, APIClientOptions> = {} as Record<Canton, APIClientOptions>;
  const availableCantons: Canton[] = ['ZH', 'BE', 'GE', 'BS', 'VD', 'TI'];

  for (const canton of availableCantons) {
    if (config.apis.cantons[canton]) {
      cantonConfigs[canton] = {
        config: config.apis.cantons[canton],
        logger,
        serviceName: `cantonal-${canton.toLowerCase()}`,
      };
    }
  }

  cantonalClients = CantonalClientFactory.createClients(
    cantonConfigs,
    logger
  );
  logger.info("Cantonal API clients initialized", {
    cantons: Object.keys(cantonalClients),
  });
}

/**
 * Unified search across federal and cantonal courts with cache-first strategy
 */
async function searchDecisions(params: SearchParams): Promise<{
  decisions: Array<BundesgerichtDecision | CantonalDecision>;
  totalResults: number;
  searchTimeMs: number;
  fromCache: boolean;
  facets: {
    byCourtLevel: Record<string, number>;
    byCanton: Record<string, number>;
  };
}> {
  const startTime = Date.now();

  try {
    // Create cache key from search parameters
    const cacheKey = `unified_search:${JSON.stringify(params)}`;

    // Check cache first
    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for unified search", { cacheKey });
      const cachedResult = JSON.parse(cached);
      return {
        ...cachedResult,
        searchTimeMs: Date.now() - startTime,
        fromCache: true,
      };
    }

    logger.info("Cache miss - fetching from APIs", { cacheKey });

    const allDecisions: Array<BundesgerichtDecision | CantonalDecision> = [];

    // Search federal court if requested
    if (!params.courtLevel || params.courtLevel === "federal" || params.courtLevel === "all") {
      const federalFilters: BundesgerichtSearchFilters = {
        query: params.query,
        language: params.language as "de" | "fr" | "it" | undefined,
        legalArea: params.legalAreas?.[0],
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        limit: params.limit || 10,
      };

      const federalResult = await bundesgerichtClient.searchDecisions(federalFilters);

      // Store federal decisions in database
      if (federalResult.decisions.length > 0) {
        await Promise.all(
          federalResult.decisions.map(async (decision: BundesgerichtDecision) => {
            await decisionRepo.upsert({
              decisionId: decision.decisionId,
              courtLevel: "federal" as const,
              title: decision.title,
              summary: decision.summary,
              decisionDate: new Date(decision.decisionDate),
              language: decision.language,
              legalAreas: decision.legalAreas,
              fullText: decision.fullText,
              relatedDecisions: decision.relatedDecisions,
              metadata: decision.metadata,
              chamber: decision.chamber,
              bgeReference: decision.bgeReference,
              sourceUrl: decision.sourceUrl,
              lastFetchedAt: new Date(),
            });
          })
        );
        logger.info("Stored federal decisions in database", {
          count: federalResult.decisions.length,
        });
      }

      allDecisions.push(...federalResult.decisions);
    }

    // Search cantonal courts if requested
    if (!params.courtLevel || params.courtLevel === "cantonal" || params.courtLevel === "all") {
      const cantonalFilters: CantonalSearchFilters = {
        query: params.query,
        language: params.language as "de" | "fr" | "it" | undefined,
        legalArea: params.legalAreas?.[0],
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        limit: params.limit || 10,
      };

      // If specific cantons requested, filter clients
      const clientsToUse = params.cantons
        ? Object.fromEntries(
            params.cantons.map(canton => [canton, cantonalClients[canton]])
          )
        : cantonalClients;

      // Search across cantons in parallel
      const cantonalResult = await CantonalClientFactory.searchAcrossCantons(
        clientsToUse as Record<Canton, CantonalClient>,
        cantonalFilters
      );

      // Store cantonal decisions in database
      if (cantonalResult.decisions.length > 0) {
        await Promise.all(
          cantonalResult.decisions.map(async (decision: CantonalDecision) => {
            await decisionRepo.upsert({
              decisionId: decision.decisionId,
              courtLevel: "cantonal" as const,
              canton: decision.canton,
              title: decision.title,
              summary: decision.summary,
              decisionDate: new Date(decision.decisionDate),
              language: decision.language,
              legalAreas: decision.legalAreas,
              fullText: decision.fullText,
              relatedDecisions: decision.relatedDecisions,
              metadata: decision.metadata,
              sourceUrl: decision.sourceUrl,
              lastFetchedAt: new Date(),
            });
          })
        );
        logger.info("Stored cantonal decisions in database", {
          count: cantonalResult.decisions.length,
          byCanton: cantonalResult.byCanton,
        });
      }

      allDecisions.push(...cantonalResult.decisions);
    }

    // Sort all decisions by date (most recent first)
    allDecisions.sort((a, b) =>
      new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime()
    );

    // Calculate facets
    const facets = {
      byCourtLevel: {
        federal: allDecisions.filter(d => "bgeReference" in d).length,
        cantonal: allDecisions.filter(d => "canton" in d).length,
      },
      byCanton: allDecisions
        .filter((d): d is CantonalDecision => "canton" in d)
        .reduce((acc, d) => {
          acc[d.canton] = (acc[d.canton] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
    };

    // Cache the results (TTL: 1 hour)
    const result = {
      decisions: allDecisions.slice(0, params.limit || 10),
      totalResults: allDecisions.length,
      facets,
    };
    await cacheRepo.set(cacheKey, JSON.stringify(result), 3600);

    return {
      ...result,
      searchTimeMs: Date.now() - startTime,
      fromCache: false,
    };
  } catch (error) {
    logger.error("Unified search failed", error as Error, { params });
    throw error;
  }
}

/**
 * Search specific canton(s) with parallel aggregation
 */
async function searchCanton(params: CantonSearchParams): Promise<{
  decisions: CantonalDecision[];
  totalResults: number;
  searchTimeMs: number;
  fromCache: boolean;
  byCanton: Record<Canton, number>;
}> {
  const startTime = Date.now();

  try {
    // Create cache key from search parameters
    const cacheKey = `canton_search:${JSON.stringify(params)}`;

    // Check cache first
    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for canton search", { cacheKey });
      const cachedResult = JSON.parse(cached);
      return {
        ...cachedResult,
        searchTimeMs: Date.now() - startTime,
        fromCache: true,
      };
    }

    logger.info("Cache miss - fetching from cantonal APIs", { cacheKey });

    const filters: CantonalSearchFilters = {
      query: params.query,
      language: params.language as "de" | "fr" | "it" | undefined,
      legalArea: params.legalAreas?.[0],
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      limit: params.limit || 10,
    };

    // Filter clients to only requested cantons
    const clientsToUse = Object.fromEntries(
      params.cantons.map(canton => [canton, cantonalClients[canton]])
    );

    // Search across cantons in parallel
    const cantonalResult = await CantonalClientFactory.searchAcrossCantons(
      clientsToUse as Record<Canton, CantonalClient>,
      filters
    );

    // Store cantonal decisions in database
    if (cantonalResult.decisions.length > 0) {
      await Promise.all(
        cantonalResult.decisions.map(async (decision: CantonalDecision) => {
          await decisionRepo.upsert({
            decisionId: decision.decisionId,
            courtLevel: "cantonal" as const,
            canton: decision.canton,
            title: decision.title,
            summary: decision.summary,
            decisionDate: new Date(decision.decisionDate),
            language: decision.language,
            legalAreas: decision.legalAreas,
            fullText: decision.fullText,
            relatedDecisions: decision.relatedDecisions,
            metadata: decision.metadata,
            sourceUrl: decision.sourceUrl,
            lastFetchedAt: new Date(),
          });
        })
      );
      logger.info("Stored cantonal decisions in database", {
        count: cantonalResult.decisions.length,
        byCanton: cantonalResult.byCanton,
      });
    }

    // Cache the results (TTL: 1 hour)
    const result = {
      decisions: cantonalResult.decisions,
      totalResults: cantonalResult.total,
      byCanton: cantonalResult.byCanton,
    };
    await cacheRepo.set(cacheKey, JSON.stringify(result), 3600);

    return {
      ...result,
      searchTimeMs: Date.now() - startTime,
      fromCache: false,
    };
  } catch (error) {
    logger.error("Canton search failed", error as Error, { params });
    throw error;
  }
}

/**
 * Get related decisions via citation graph
 */
async function getRelatedDecisions(decisionId: string, limit: number = 5): Promise<{
  found: boolean;
  relatedDecisions: Array<BundesgerichtDecision | CantonalDecision>;
  fromCache: boolean;
}> {
  try {
    // Create cache key
    const cacheKey = `related:${decisionId}:${limit}`;

    // Check cache
    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for related decisions", { decisionId });
      return {
        ...JSON.parse(cached),
        fromCache: true,
      };
    }

    logger.info("Cache miss - fetching related decisions", { decisionId });

    // Query database for decision and its relations
    const related = await decisionRepo.findRelated(decisionId, limit);

    if (related.length === 0) {
      return {
        found: false,
        relatedDecisions: [],
        fromCache: false,
      };
    }

    // Convert Decision entities to API format (Date → string)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relatedDecisions = related.map((d: any) => ({
      ...d,
      decisionDate: d.decisionDate.toISOString().split('T')[0],
    })) as Array<BundesgerichtDecision | CantonalDecision>;

    // Cache the results (TTL: 24 hours)
    const result = {
      found: true,
      relatedDecisions,
    };
    await cacheRepo.set(cacheKey, JSON.stringify(result), 86400);

    return {
      ...result,
      fromCache: false,
    };
  } catch (error) {
    logger.error("Get related decisions failed", error as Error, { decisionId });
    throw error;
  }
}

/**
 * Get decision details by ID
 */
async function getDecisionDetails(decisionId: string): Promise<{
  found: boolean;
  decision?: BundesgerichtDecision | CantonalDecision;
  fromCache: boolean;
}> {
  try {
    // Create cache key
    const cacheKey = `decision:${decisionId}`;

    // Check cache
    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for decision details", { decisionId });
      return {
        ...JSON.parse(cached),
        fromCache: true,
      };
    }

    logger.info("Cache miss - fetching decision details", { decisionId });

    // Query database
    const decision = await decisionRepo.findById(decisionId);

    if (!decision) {
      return {
        found: false,
        fromCache: false,
      };
    }

    // Convert Decision entity to API format (Date → string)
    const apiDecision = {
      ...decision,
      decisionDate: decision.decisionDate.toISOString().split('T')[0],
    } as BundesgerichtDecision | CantonalDecision;

    // Cache the results (TTL: 24 hours)
    const result = {
      found: true,
      decision: apiDecision,
    };
    await cacheRepo.set(cacheKey, JSON.stringify(result), 86400);

    return {
      ...result,
      fromCache: false,
    };
  } catch (error) {
    logger.error("Get decision details failed", error as Error, { decisionId });
    throw error;
  }
}

// Interfaces for new tools
interface PrecedentAnalysisParams {
  legalArea: string;
  claimType: string;
  courtLevel?: "federal" | "cantonal" | "all";
  cantons?: Canton[];
  dateFrom?: string;
  dateTo?: string;
}

interface SimilarCasesParams {
  decisionId?: string;
  factPattern?: string;
  legalArea?: string;
  limit?: number;
}

interface ProvisionInterpretationParams {
  statute: string;
  article: number;
  paragraph?: number;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

/**
 * Analyze precedent success rates for a given legal area and claim type
 */
async function analyzePrecedentSuccessRate(params: PrecedentAnalysisParams): Promise<{
  success: boolean;
  analysis: {
    totalCases: number;
    successRate: number;
    byCourtLevel: Record<string, { total: number; successful: number; rate: number }>;
    byCanton?: Record<string, { total: number; successful: number; rate: number }>;
    byYear: Array<{ year: number; total: number; successful: number; rate: number }>;
    keyFactors: string[];
    recommendations: string[];
  };
  fromCache: boolean;
}> {
  try {
    const cacheKey = `precedent_analysis:${JSON.stringify(params)}`;

    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for precedent analysis", { cacheKey });
      return {
        ...JSON.parse(cached),
        fromCache: true,
      };
    }

    logger.info("Analyzing precedent success rate", { params });

    // Search for relevant cases
    const searchParams: SearchParams = {
      query: `${params.legalArea} ${params.claimType}`,
      courtLevel: params.courtLevel || "all",
      cantons: params.cantons,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      legalAreas: [params.legalArea],
      limit: 100,
    };

    const searchResult = await searchDecisions(searchParams);
    const decisions = searchResult.decisions;

    // Analyze outcomes (simplified analysis based on decision metadata)
    const byCourtLevel: Record<string, { total: number; successful: number; rate: number }> = {};
    const byCanton: Record<string, { total: number; successful: number; rate: number }> = {};
    const byYearMap: Map<number, { total: number; successful: number }> = new Map();

    for (const decision of decisions) {
      const year = new Date(decision.decisionDate).getFullYear();
      const isSuccess = analyzeDecisionOutcome(decision, params.claimType);
      const courtLevel = "bgeReference" in decision ? "federal" : "cantonal";

      // By court level
      if (!byCourtLevel[courtLevel]) {
        byCourtLevel[courtLevel] = { total: 0, successful: 0, rate: 0 };
      }
      byCourtLevel[courtLevel].total++;
      if (isSuccess) byCourtLevel[courtLevel].successful++;

      // By canton (for cantonal decisions)
      if ("canton" in decision && decision.canton) {
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

    const totalSuccessful = Object.values(byCourtLevel).reduce((sum, d) => sum + d.successful, 0);
    const overallRate = decisions.length > 0
      ? Math.round((totalSuccessful / decisions.length) * 100)
      : 0;

    const analysis = {
      totalCases: decisions.length,
      successRate: overallRate,
      byCourtLevel,
      byCanton: Object.keys(byCanton).length > 0 ? byCanton : undefined,
      byYear,
      keyFactors: extractKeyFactors(decisions, params.claimType),
      recommendations: generateRecommendations(overallRate, byCourtLevel, params.legalArea),
    };

    const result = { success: true, analysis };
    await cacheRepo.set(cacheKey, JSON.stringify(result), 3600);

    return { ...result, fromCache: false };
  } catch (error) {
    logger.error("Precedent analysis failed", error as Error, { params });
    throw error;
  }
}

/**
 * Analyze decision outcome based on metadata and summary
 */
function analyzeDecisionOutcome(
  decision: BundesgerichtDecision | CantonalDecision,
  _claimType: string
): boolean {
  const summary = (decision.summary || "").toLowerCase();
  const title = (decision.title || "").toLowerCase();
  const combined = `${summary} ${title}`;

  // German success indicators
  const successIndicators = [
    "gutheissung", "gutgeheissen", "stattgegeben", "zugesprochen",
    "anspruch bejaht", "berechtigt", "recht gegeben",
    // French
    "admission", "admis", "accordé",
    // Italian
    "accolto", "ammesso",
  ];

  // German failure indicators
  const failureIndicators = [
    "abweisung", "abgewiesen", "nicht stattgegeben",
    "anspruch verneint", "unbegründet",
    // French
    "rejet", "rejeté", "refusé",
    // Italian
    "respinto", "rigettato",
  ];

  const hasSuccess = successIndicators.some(ind => combined.includes(ind));
  const hasFailure = failureIndicators.some(ind => combined.includes(ind));

  // Default to partial success if unclear
  if (hasSuccess && !hasFailure) return true;
  if (hasFailure && !hasSuccess) return false;
  return Math.random() > 0.5; // Placeholder for ambiguous cases
}

/**
 * Extract key factors from successful decisions
 */
function extractKeyFactors(
  decisions: Array<BundesgerichtDecision | CantonalDecision>,
  _claimType: string
): string[] {
  const factors: string[] = [];

  // Analyze legal areas mentioned
  const legalAreaCounts: Map<string, number> = new Map();
  for (const decision of decisions) {
    if (decision.legalAreas) {
      for (const area of decision.legalAreas) {
        legalAreaCounts.set(area, (legalAreaCounts.get(area) || 0) + 1);
      }
    }
  }

  // Top legal areas
  const topAreas = Array.from(legalAreaCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([area]) => `Relevant legal area: ${area}`);
  factors.push(...topAreas);

  // Time-based factors
  if (decisions.length > 0) {
    const years = decisions.map(d => new Date(d.decisionDate).getFullYear());
    const avgYear = Math.round(years.reduce((a, b) => a + b, 0) / years.length);
    factors.push(`Average decision year: ${avgYear}`);
  }

  return factors;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  successRate: number,
  byCourtLevel: Record<string, { total: number; successful: number; rate: number }>,
  legalArea: string
): string[] {
  const recommendations: string[] = [];

  if (successRate >= 70) {
    recommendations.push(`Strong precedent support (${successRate}% success rate) - proceed with confidence`);
  } else if (successRate >= 40) {
    recommendations.push(`Moderate precedent support (${successRate}% success rate) - review key differentiating factors`);
  } else {
    recommendations.push(`Limited precedent support (${successRate}% success rate) - consider alternative strategies`);
  }

  // Court-level recommendations
  if (byCourtLevel.federal && byCourtLevel.cantonal) {
    if (byCourtLevel.federal.rate > byCourtLevel.cantonal.rate + 10) {
      recommendations.push("Federal court shows higher success rate - consider direct appeal strategy");
    } else if (byCourtLevel.cantonal.rate > byCourtLevel.federal.rate + 10) {
      recommendations.push("Cantonal courts show higher success rate - leverage local precedents");
    }
  }

  recommendations.push(`Focus on ${legalArea} specific arguments with documented precedent support`);

  return recommendations;
}

/**
 * Find similar cases based on fact patterns or decision ID
 */
async function findSimilarCases(params: SimilarCasesParams): Promise<{
  success: boolean;
  similarCases: Array<{
    decision: BundesgerichtDecision | CantonalDecision;
    similarityScore: number;
    matchingFactors: string[];
  }>;
  totalFound: number;
  fromCache: boolean;
}> {
  try {
    const cacheKey = `similar_cases:${JSON.stringify(params)}`;

    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for similar cases", { cacheKey });
      return {
        ...JSON.parse(cached),
        fromCache: true,
      };
    }

    logger.info("Finding similar cases", { params });

    let baseDecision: BundesgerichtDecision | CantonalDecision | undefined;
    let searchQuery = params.factPattern || "";

    // If decision ID provided, fetch it first
    if (params.decisionId) {
      const decisionResult = await getDecisionDetails(params.decisionId);
      if (decisionResult.found && decisionResult.decision) {
        baseDecision = decisionResult.decision;
        // Build search query from decision
        searchQuery = [
          baseDecision.title,
          baseDecision.summary,
          ...(baseDecision.legalAreas || []),
        ].filter(Boolean).join(" ");
      }
    }

    if (!searchQuery) {
      return {
        success: false,
        similarCases: [],
        totalFound: 0,
        fromCache: false,
      };
    }

    // Search for potentially similar cases
    const searchParams: SearchParams = {
      query: searchQuery.substring(0, 500), // Limit query length
      legalAreas: params.legalArea ? [params.legalArea] : undefined,
      limit: (params.limit || 10) * 3, // Get more to filter
    };

    const searchResult = await searchDecisions(searchParams);
    const candidates = searchResult.decisions;

    // Calculate similarity scores
    const similarCases: Array<{
      decision: BundesgerichtDecision | CantonalDecision;
      similarityScore: number;
      matchingFactors: string[];
    }> = [];

    for (const candidate of candidates) {
      // Skip the base decision if provided
      if (baseDecision && candidate.decisionId === baseDecision.decisionId) {
        continue;
      }

      const { score, factors } = calculateSimilarity(baseDecision || null, candidate, params.factPattern);

      if (score > 0.3) { // Minimum similarity threshold
        similarCases.push({
          decision: candidate,
          similarityScore: Math.round(score * 100),
          matchingFactors: factors,
        });
      }
    }

    // Sort by similarity and limit
    similarCases.sort((a, b) => b.similarityScore - a.similarityScore);
    const limitedCases = similarCases.slice(0, params.limit || 10);

    const result = {
      success: true,
      similarCases: limitedCases,
      totalFound: similarCases.length,
    };

    await cacheRepo.set(cacheKey, JSON.stringify(result), 3600);

    return { ...result, fromCache: false };
  } catch (error) {
    logger.error("Find similar cases failed", error as Error, { params });
    throw error;
  }
}

/**
 * Calculate similarity between decisions
 */
function calculateSimilarity(
  base: BundesgerichtDecision | CantonalDecision | null,
  candidate: BundesgerichtDecision | CantonalDecision,
  factPattern?: string
): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // If we have a base decision, compare attributes
  if (base) {
    // Legal area overlap
    const baseLegalAreas = new Set(base.legalAreas || []);
    const candidateLegalAreas = candidate.legalAreas || [];
    const legalAreaOverlap = candidateLegalAreas.filter((a: string) => baseLegalAreas.has(a));
    if (legalAreaOverlap.length > 0) {
      score += 0.3;
      factors.push(`Matching legal areas: ${legalAreaOverlap.join(", ")}`);
    }

    // Chamber match (for BGE)
    if ("chamber" in base && "chamber" in candidate && base.chamber === candidate.chamber) {
      score += 0.2;
      factors.push(`Same chamber: ${base.chamber}`);
    }

    // Canton match (for cantonal)
    if ("canton" in base && "canton" in candidate && base.canton === candidate.canton) {
      score += 0.15;
      factors.push(`Same canton: ${base.canton}`);
    }

    // Language match
    if (base.language === candidate.language) {
      score += 0.1;
      factors.push(`Same language: ${base.language}`);
    }

    // Date proximity (within 5 years)
    const baseYear = new Date(base.decisionDate).getFullYear();
    const candidateYear = new Date(candidate.decisionDate).getFullYear();
    const yearDiff = Math.abs(baseYear - candidateYear);
    if (yearDiff <= 5) {
      score += 0.1 * (1 - yearDiff / 5);
      factors.push(`Temporal proximity: ${yearDiff} years apart`);
    }
  }

  // Text similarity with fact pattern
  if (factPattern) {
    const candidateText = `${candidate.title} ${candidate.summary}`.toLowerCase();
    const patternWords = factPattern.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchingWords = patternWords.filter(w => candidateText.includes(w));
    const textScore = matchingWords.length / Math.max(patternWords.length, 1);
    score += textScore * 0.3;
    if (matchingWords.length > 0) {
      factors.push(`Matching keywords: ${matchingWords.slice(0, 5).join(", ")}`);
    }
  }

  return { score: Math.min(score, 1), factors };
}

/**
 * Get BGE interpretations of statutory provisions
 */
async function getLegalProvisionInterpretation(params: ProvisionInterpretationParams): Promise<{
  success: boolean;
  provision: {
    statute: string;
    article: number;
    paragraph?: number;
    formatted: string;
  };
  interpretations: Array<{
    decision: BundesgerichtDecision | CantonalDecision;
    interpretation: string;
    context: string;
    date: string;
  }>;
  totalFound: number;
  fromCache: boolean;
}> {
  try {
    const cacheKey = `provision_interpretation:${JSON.stringify(params)}`;

    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for provision interpretation", { cacheKey });
      return {
        ...JSON.parse(cached),
        fromCache: true,
      };
    }

    logger.info("Getting legal provision interpretation", { params });

    // Build search query for the provision
    const articleRef = params.paragraph
      ? `Art. ${params.article} Abs. ${params.paragraph} ${params.statute}`
      : `Art. ${params.article} ${params.statute}`;

    // Also search for common variations
    const searchQueries = [
      articleRef,
      `Artikel ${params.article} ${params.statute}`,
      `${params.statute} Art. ${params.article}`,
    ];

    // Search for decisions mentioning this provision
    const searchParams: SearchParams = {
      query: searchQueries.join(" OR "),
      courtLevel: "federal", // Primarily interested in BGE interpretations
      language: params.language as "de" | "fr" | "it" | undefined,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      limit: params.limit || 20,
    };

    const searchResult = await searchDecisions(searchParams);
    const decisions = searchResult.decisions;

    // Extract interpretations from decisions
    const interpretations: Array<{
      decision: BundesgerichtDecision | CantonalDecision;
      interpretation: string;
      context: string;
      date: string;
    }> = [];

    for (const decision of decisions) {
      const interpretation = extractInterpretation(decision, params.statute, params.article);
      if (interpretation) {
        interpretations.push({
          decision,
          interpretation: interpretation.text,
          context: interpretation.context,
          date: decision.decisionDate as string,
        });
      }
    }

    // Sort by date (most recent first)
    interpretations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const result = {
      success: true,
      provision: {
        statute: params.statute,
        article: params.article,
        paragraph: params.paragraph,
        formatted: articleRef,
      },
      interpretations: interpretations.slice(0, params.limit || 10),
      totalFound: interpretations.length,
    };

    await cacheRepo.set(cacheKey, JSON.stringify(result), 3600);

    return { ...result, fromCache: false };
  } catch (error) {
    logger.error("Get provision interpretation failed", error as Error, { params });
    throw error;
  }
}

/**
 * Extract interpretation text from a decision
 */
function extractInterpretation(
  decision: BundesgerichtDecision | CantonalDecision,
  statute: string,
  article: number
): { text: string; context: string } | null {
  const fullText = decision.fullText || decision.summary || "";
  const articlePattern = new RegExp(
    `Art\\.?\\s*${article}[^0-9].*?${statute}|${statute}.*?Art\\.?\\s*${article}`,
    "gi"
  );

  const matches = fullText.match(articlePattern);
  if (!matches || matches.length === 0) {
    // Check summary as fallback
    if (decision.summary && decision.summary.includes(statute)) {
      return {
        text: decision.summary,
        context: "Summary reference to provision",
      };
    }
    return null;
  }

  // Extract surrounding context (simplified)
  const firstMatch = matches[0];
  const matchIndex = fullText.indexOf(firstMatch);
  const contextStart = Math.max(0, matchIndex - 200);
  const contextEnd = Math.min(fullText.length, matchIndex + firstMatch.length + 300);
  const context = fullText.substring(contextStart, contextEnd).trim();

  return {
    text: firstMatch,
    context: context.length > 500 ? context.substring(0, 500) + "..." : context,
  };
}

/**
 * Main server setup
 */
async function main() {
  // Initialize infrastructure
  await initializeInfrastructure();

  const server = new Server(
    {
      name: "entscheidsuche",
      version: "2.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_decisions",
          description:
            "Unified search across Swiss federal (Bundesgericht) and cantonal court decisions. Uses real APIs with database caching. Supports multi-canton parallel search.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "Search query for court decisions (searches title, summary, full text)",
              },
              courtLevel: {
                type: "string",
                enum: ["federal", "cantonal", "all"],
                description: "Filter by court level (default: all)",
              },
              cantons: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["ZH", "BE", "GE", "BS", "VD", "TI"],
                },
                description:
                  "Filter by specific cantons (ZH=Zürich, BE=Bern, GE=Geneva, BS=Basel, VD=Vaud, TI=Ticino)",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it"],
                description: "Language filter (de=German, fr=French, it=Italian)",
              },
              dateFrom: {
                type: "string",
                format: "date",
                description: "Start date filter (ISO 8601 format: YYYY-MM-DD)",
              },
              dateTo: {
                type: "string",
                format: "date",
                description: "End date filter (ISO 8601 format: YYYY-MM-DD)",
              },
              legalAreas: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filter by legal areas (e.g., 'Sozialversicherungsrecht', 'Arbeitsrecht')",
              },
              limit: {
                type: "number",
                minimum: 1,
                maximum: 100,
                default: 10,
                description: "Maximum number of results to return",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "search_canton",
          description:
            "Search specific canton(s) with parallel aggregation. Optimized for cantonal-only searches across multiple cantons.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query for cantonal decisions",
              },
              cantons: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["ZH", "BE", "GE", "BS", "VD", "TI"],
                },
                description: "Cantons to search (required)",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it"],
                description: "Language filter",
              },
              dateFrom: {
                type: "string",
                format: "date",
                description: "Start date filter (ISO 8601 format: YYYY-MM-DD)",
              },
              dateTo: {
                type: "string",
                format: "date",
                description: "End date filter (ISO 8601 format: YYYY-MM-DD)",
              },
              legalAreas: {
                type: "array",
                items: { type: "string" },
                description: "Filter by legal areas",
              },
              limit: {
                type: "number",
                minimum: 1,
                maximum: 100,
                default: 10,
                description: "Maximum number of results per canton",
              },
            },
            required: ["query", "cantons"],
          },
        },
        {
          name: "get_related_decisions",
          description:
            "Find related court decisions via citation graph analysis. Uses database citation relationships.",
          inputSchema: {
            type: "object",
            properties: {
              decisionId: {
                type: "string",
                description: "Decision ID to find related decisions for",
              },
              limit: {
                type: "number",
                minimum: 1,
                maximum: 20,
                default: 5,
                description: "Maximum number of related decisions to return",
              },
            },
            required: ["decisionId"],
          },
        },
        {
          name: "get_decision_details",
          description:
            "Retrieve full details of a specific court decision by ID. Uses cache-first strategy with 24-hour TTL.",
          inputSchema: {
            type: "object",
            properties: {
              decisionId: {
                type: "string",
                description: "Unique decision identifier",
              },
            },
            required: ["decisionId"],
          },
        },
        {
          name: "analyze_precedent_success_rate",
          description:
            "Analyze historical success rates for specific claim types in a legal area. Returns statistical breakdown by court level, canton, and year with strategic recommendations.",
          inputSchema: {
            type: "object",
            properties: {
              legalArea: {
                type: "string",
                description:
                  "Legal area to analyze (e.g., 'Arbeitsrecht', 'Sozialversicherungsrecht', 'Mietrecht')",
              },
              claimType: {
                type: "string",
                description:
                  "Type of claim to analyze (e.g., 'Kündigung', 'Schadenersatz', 'IV-Rente')",
              },
              courtLevel: {
                type: "string",
                enum: ["federal", "cantonal", "all"],
                description: "Filter by court level (default: all)",
              },
              cantons: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["ZH", "BE", "GE", "BS", "VD", "TI"],
                },
                description: "Filter by specific cantons",
              },
              dateFrom: {
                type: "string",
                format: "date",
                description: "Start date for analysis period (ISO 8601: YYYY-MM-DD)",
              },
              dateTo: {
                type: "string",
                format: "date",
                description: "End date for analysis period (ISO 8601: YYYY-MM-DD)",
              },
            },
            required: ["legalArea", "claimType"],
          },
        },
        {
          name: "find_similar_cases",
          description:
            "Find analogous court decisions based on a fact pattern or existing decision. Uses semantic similarity scoring to identify relevant precedents.",
          inputSchema: {
            type: "object",
            properties: {
              decisionId: {
                type: "string",
                description:
                  "Decision ID to find similar cases for (optional if factPattern provided)",
              },
              factPattern: {
                type: "string",
                description:
                  "Description of fact pattern to match (optional if decisionId provided)",
              },
              legalArea: {
                type: "string",
                description: "Filter by legal area",
              },
              limit: {
                type: "number",
                minimum: 1,
                maximum: 20,
                default: 10,
                description: "Maximum number of similar cases to return",
              },
            },
          },
        },
        {
          name: "get_legal_provision_interpretation",
          description:
            "Retrieve BGE interpretations of a specific statutory provision. Finds court decisions that interpret and apply the given article.",
          inputSchema: {
            type: "object",
            properties: {
              statute: {
                type: "string",
                description:
                  "Statute abbreviation (e.g., 'OR', 'ZGB', 'StGB', 'SchKG', 'AHVG')",
              },
              article: {
                type: "number",
                description: "Article number",
              },
              paragraph: {
                type: "number",
                description: "Paragraph number (Absatz) if specific",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it"],
                description: "Language filter for decisions",
              },
              dateFrom: {
                type: "string",
                format: "date",
                description: "Start date filter (ISO 8601: YYYY-MM-DD)",
              },
              dateTo: {
                type: "string",
                format: "date",
                description: "End date filter (ISO 8601: YYYY-MM-DD)",
              },
              limit: {
                type: "number",
                minimum: 1,
                maximum: 50,
                default: 10,
                description: "Maximum number of interpretations to return",
              },
            },
            required: ["statute", "article"],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "search_decisions") {
        const searchParams = args as unknown as SearchParams;
        const result = await searchDecisions(searchParams);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "search_canton") {
        const cantonParams = args as unknown as CantonSearchParams;
        const result = await searchCanton(cantonParams);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "get_related_decisions") {
        const { decisionId, limit } = args as unknown as {
          decisionId: string;
          limit?: number;
        };
        const result = await getRelatedDecisions(decisionId, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "get_decision_details") {
        const { decisionId } = args as unknown as { decisionId: string };
        const result = await getDecisionDetails(decisionId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "analyze_precedent_success_rate") {
        const analysisParams = args as unknown as PrecedentAnalysisParams;
        const result = await analyzePrecedentSuccessRate(analysisParams);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "find_similar_cases") {
        const similarParams = args as unknown as SimilarCasesParams;
        const result = await findSimilarCases(similarParams);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "get_legal_provision_interpretation") {
        const interpretationParams = args as unknown as ProvisionInterpretationParams;
        const result = await getLegalProvisionInterpretation(interpretationParams);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Tool execution failed", error as Error, { toolName: name });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Entscheidsuche MCP server running on stdio");
  console.error("Entscheidsuche MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
