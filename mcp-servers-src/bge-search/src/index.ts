#!/usr/bin/env node

/**
 * BGE Search MCP Server - Production Version
 *
 * Provides access to Swiss Federal Supreme Court (Bundesgericht) decisions
 * via the Model Context Protocol over stdio transport.
 *
 * Features:
 * - Real Bundesgericht API integration
 * - Database persistence for search results
 * - Cache-first strategy for performance
 * - Citation parsing and validation
 *
 * Tools:
 * - search_bge: Search BGE decisions by query, date range, chamber, legal area
 * - get_bge_decision: Retrieve specific decision by citation
 * - validate_citation: Validate BGE citation format
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
  EntscheidSucheClient,
  DecisionRepository,
  CacheRepository,
  type EntscheidSucheDecision,
  type EntscheidSucheSearchFilters,
} from "@bettercallclaude/shared";

// Search parameters interface (MCP tool input)
interface SearchParams {
  query: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  chambers?: string[];
  legalAreas?: string[];
  limit?: number;
}

/**
 * Global instances
 */
let entscheidSucheClient: EntscheidSucheClient;
let decisionRepo: DecisionRepository;
let cacheRepo: CacheRepository;
let logger: Logger;

/**
 * Degradation state flags
 */
let configReady = false;
let databaseReady = false;

/**
 * Search BGE decisions with cache-first, API, then database fallback strategy
 */
async function searchBGE(params: SearchParams): Promise<{
  decisions: EntscheidSucheDecision[];
  totalResults: number;
  searchTimeMs: number;
  fromCache: boolean;
  source: string;
}> {
  if (!configReady) {
    throw new Error("Server running in degraded mode: configuration/API clients not initialized. Database or network initialization failed at startup.");
  }

  const startTime = Date.now();

  try {
    // Create cache key from search parameters
    const cacheKey = `bge_search:${JSON.stringify(params)}`;

    // Check cache first (only if database is available)
    if (databaseReady) {
      const cached = await cacheRepo.get(cacheKey);
      if (cached) {
        logger.info("Cache hit for BGE search", { cacheKey });
        const cachedResult = JSON.parse(cached);
        return {
          ...cachedResult,
          searchTimeMs: Date.now() - startTime,
          fromCache: true,
          source: "cache",
        };
      }
    }

    logger.info("Searching entscheidsuche.ch for BGE decisions" + (databaseReady ? " with database fallback" : " (no database)"), { });

    // Build EntscheidSuche search filters restricted to federal courts
    const filters: EntscheidSucheSearchFilters = {
      query: params.query,
      courts: ['CH_BGer', 'CH_BGE'],
      language: params.language as 'de' | 'fr' | 'it' | undefined,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      size: params.limit || 10,
    };

    // Try API first, fall back to local database
    try {
      const apiResult = await entscheidSucheClient.searchDecisions(filters);

      // Store decisions in database for future fallback (only if DB available)
      if (databaseReady && apiResult.decisions.length > 0) {
        await Promise.all(
          apiResult.decisions.map(async (decision) => {
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
              chamber: decision.chamber as 'I' | 'II' | 'III' | 'IV' | 'V' | undefined,
              bgeReference: decision.bgeReference,
              sourceUrl: decision.sourceUrl,
              lastFetchedAt: new Date(),
            });
          })
        );
        logger.info("Stored BGE decisions in database", {
          count: apiResult.decisions.length,
        });
      }

      const result = {
        decisions: apiResult.decisions,
        totalResults: apiResult.total,
      };
      if (databaseReady) {
        await cacheRepo.set(cacheKey, JSON.stringify(result), 3600);
      }

      return {
        ...result,
        searchTimeMs: Date.now() - startTime,
        fromCache: false,
        source: "api",
      };
    } catch (apiError) {
      if (!databaseReady) {
        throw new Error(`API unavailable and database not initialized: ${(apiError as Error).message}`);
      }

      // API failed - fall back to local database
      logger.info("API unavailable, falling back to local database", {
        error: (apiError as Error).message,
      });

      const dbResults = await decisionRepo.search({
        query: params.query,
        courtLevel: "federal" as any,
        language: params.language as any,
        chamber: params.chambers?.[0],
        legalAreas: params.legalAreas,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        limit: params.limit || 10,
      });

      const decisions = dbResults.map((d) => ({
        decisionId: d.decisionId,
        signature: d.decisionId,
        title: d.title || "",
        summary: d.summary || "",
        decisionDate: d.decisionDate instanceof Date
          ? d.decisionDate.toISOString().split("T")[0]
          : String(d.decisionDate),
        language: (d.language || "de") as 'de' | 'fr' | 'it',
        court: "Bundesgericht",
        courtLevel: "federal" as const,
        legalAreas: d.legalAreas || [],
        fullText: d.fullText,
        relatedDecisions: d.relatedDecisions || [],
        metadata: d.metadata || {},
        chamber: d.chamber,
        bgeReference: (d as any).bgeReference,
        sourceUrl: (d as any).sourceUrl || "",
        score: 1.0,
      })) as EntscheidSucheDecision[];

      const result = {
        decisions,
        totalResults: decisions.length,
      };

      if (decisions.length > 0) {
        await cacheRepo.set(cacheKey, JSON.stringify(result), 1800);
      }

      return {
        ...result,
        searchTimeMs: Date.now() - startTime,
        fromCache: false,
        source: "database",
      };
    }
  } catch (error) {
    logger.error("BGE search failed", error as Error, { params });
    throw error;
  }
}

/**
 * Get specific BGE decision by citation with cache-first, API, then database fallback
 */
async function getBGEDecision(citation: string): Promise<{
  found: boolean;
  decision?: EntscheidSucheDecision;
  fromCache: boolean;
  source?: string;
}> {
  if (!configReady) {
    throw new Error("Server running in degraded mode: configuration/API clients not initialized.");
  }

  try {
    // Validate citation format locally
    const validation = validateCitation(citation);
    if (!validation.valid) {
      return { found: false, fromCache: false };
    }

    // Create cache key
    const cacheKey = `bge_decision:${citation}`;

    // Check cache (only if database is available)
    if (databaseReady) {
      const cached = await cacheRepo.get(cacheKey);
      if (cached) {
        logger.info("Cache hit for BGE decision", { citation });
        return {
          found: true,
          decision: JSON.parse(cached),
          fromCache: true,
          source: "cache",
        };
      }
    }

    logger.info("Searching entscheidsuche.ch for BGE citation" + (databaseReady ? " with database fallback" : " (no database)"), { citation });

    // Try API first using structured BGE search
    try {
      const apiResult = await entscheidSucheClient.searchBGE(citation);

      if (apiResult.decisions.length === 0) {
        // API returned no result - try database before giving up
        if (databaseReady) {
          const dbDecision = await decisionRepo.findByDecisionId(citation);
          if (dbDecision) {
            return {
              found: true,
              decision: dbDecision as unknown as EntscheidSucheDecision,
              fromCache: false,
              source: "database",
            };
          }
        }
        return { found: false, fromCache: false };
      }

      const decision = apiResult.decisions[0];

      // Store in database (only if DB available)
      if (databaseReady) {
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
          chamber: decision.chamber as 'I' | 'II' | 'III' | 'IV' | 'V' | undefined,
          bgeReference: decision.bgeReference,
          sourceUrl: decision.sourceUrl,
          lastFetchedAt: new Date(),
        });

        await cacheRepo.set(cacheKey, JSON.stringify(decision), 86400);
      }

      return {
        found: true,
        decision,
        fromCache: false,
        source: "api",
      };
    } catch (apiError) {
      if (!databaseReady) {
        throw new Error(`API unavailable and database not initialized: ${(apiError as Error).message}`);
      }

      // API failed - fall back to local database
      logger.info("API unavailable, falling back to local database for citation lookup", {
        citation,
        error: (apiError as Error).message,
      });

      const dbDecision = await decisionRepo.findByDecisionId(citation);
      if (dbDecision) {
        return {
          found: true,
          decision: dbDecision as unknown as EntscheidSucheDecision,
          fromCache: false,
          source: "database",
        };
      }

      // Also try searching by citation text in the query
      const searchResults = await decisionRepo.search({
        query: citation,
        courtLevel: "federal" as any,
        limit: 1,
      });
      if (searchResults.length > 0) {
        return {
          found: true,
          decision: searchResults[0] as unknown as EntscheidSucheDecision,
          fromCache: false,
          source: "database",
        };
      }

      return { found: false, fromCache: false };
    }
  } catch (error) {
    logger.error("Get BGE decision failed", error as Error, { citation });
    throw error;
  }
}

/**
 * Validate BGE citation format
 */
function validateCitation(citation: string): {
  valid: boolean;
  volume?: string;
  chamber?: string;
  page?: string;
  normalized?: string;
  error?: string;
} {
  try {
    // Parse BGE citation format: "BGE 145 III 229" or "145 III 229" or "ATF 145 III 229"
    const match = citation.match(
      /(?:BGE|ATF|DTF)?\s*(\d{2,3})\s+(I{1,3}|IV|V)\s+(\d+)/i
    );

    if (!match) {
      return {
        valid: false,
        error: "Invalid BGE citation format. Expected: 'BGE {volume} {chamber} {page}' (e.g., 'BGE 145 III 229')",
      };
    }

    const volume = match[1];
    const chamber = match[2].toUpperCase();
    const page = match[3];

    return {
      valid: true,
      volume,
      chamber,
      page,
      normalized: `BGE ${volume} ${chamber} ${page}`,
    };
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Main server setup
 */
async function main() {
  // 1. Minimal logger (works without config)
  const minLogger = getLogger();
  logger = new Logger(minLogger);

  // 2. Register MCP server and tools FIRST (always succeeds)
  const server = new Server(
    {
      name: "bge-search",
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
          name: "search_bge",
          description:
            "Search Swiss Federal Supreme Court (BGE) decisions by query, date range, chamber, and legal area. Uses cache-first strategy with API and local database fallback.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "Search query for BGE decisions (searches title, summary, full text)",
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
              chambers: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["I", "II", "III", "IV", "V"],
                },
                description:
                  "Filter by chamber (I=Civil, II=Public, III=Civil, IV=Criminal, V=Social)",
              },
              legalAreas: {
                type: "array",
                items: { type: "string" },
                description:
                  "Filter by legal areas (e.g., 'Sozialversicherungsrecht', 'Zivilrecht')",
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
          name: "get_bge_decision",
          description:
            "Retrieve a specific BGE decision by citation. Uses cache-first strategy with API and local database fallback.",
          inputSchema: {
            type: "object",
            properties: {
              citation: {
                type: "string",
                description:
                  "BGE citation in format 'BGE {volume} {chamber} {page}' or '{volume} {chamber} {page}' (e.g., 'BGE 147 V 321')",
              },
            },
            required: ["citation"],
          },
        },
        {
          name: "validate_citation",
          description: "Validate BGE citation format and normalize it",
          inputSchema: {
            type: "object",
            properties: {
              citation: {
                type: "string",
                description: "BGE citation to validate",
              },
            },
            required: ["citation"],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "search_bge") {
        const searchParams = args as unknown as SearchParams;
        const result = await searchBGE(searchParams);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "get_bge_decision") {
        const { citation } = args as unknown as { citation: string };
        const result = await getBGEDecision(citation);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "validate_citation") {
        const { citation } = args as unknown as { citation: string };
        const result = validateCitation(citation);
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
  console.error("BGE Search MCP server running on stdio");

  // 3. Try config + API clients (non-fatal)
  try {
    const config = getConfig();
    logger = new Logger(getLogger(config.logging));
    entscheidSucheClient = new EntscheidSucheClient({
      config: config.apis.entscheidsuche,
      logger,
      serviceName: "entscheidsuche",
    });
    configReady = true;
    logger.info("Config and EntscheidSuche API client initialized", {
      baseUrl: config.apis.entscheidsuche.baseUrl,
    });
  } catch (error) {
    console.error(`[WARN] Config/API init failed, running in degraded mode: ${(error as Error).message}`);
  }

  // 4. Try database (non-fatal, expected to fail in sandboxed VMs)
  if (configReady) {
    try {
      const config = getConfig();
      const dataSource = await getDataSource(config.database);
      decisionRepo = new DecisionRepository(dataSource);
      cacheRepo = new CacheRepository(dataSource);
      databaseReady = true;
      logger.info("Database initialized", { type: config.database.type });
    } catch (error) {
      logger.warn("Database init failed, running without cache/persistence", {
        error: (error as Error).message,
      });
    }
  }

  logger.info("BGE Search MCP server ready", {
    configReady,
    databaseReady,
    mode: configReady ? (databaseReady ? "full" : "api-only") : "degraded",
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
