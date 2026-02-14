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
  BundesgerichtClient,
  DecisionRepository,
  CacheRepository,
  type BundesgerichtSearchFilters,
  type BundesgerichtDecision,
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
let bundesgerichtClient: BundesgerichtClient;
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

  logger.info("Initializing BGE Search MCP server", {
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
}

/**
 * Search BGE decisions with cache-first strategy
 */
async function searchBGE(params: SearchParams): Promise<{
  decisions: BundesgerichtDecision[];
  totalResults: number;
  searchTimeMs: number;
  fromCache: boolean;
}> {
  const startTime = Date.now();

  try {
    // Create cache key from search parameters
    const cacheKey = `bge_search:${JSON.stringify(params)}`;

    // Check cache first
    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for BGE search", { cacheKey });
      const cachedResult = JSON.parse(cached);
      return {
        ...cachedResult,
        searchTimeMs: Date.now() - startTime,
        fromCache: true,
      };
    }

    logger.info("Cache miss - fetching from API", { cacheKey });

    // Convert MCP params to API filters
    const filters: BundesgerichtSearchFilters = {
      query: params.query,
      language: params.language as "de" | "fr" | "it" | undefined,
      chamber: params.chambers?.[0] as "I" | "II" | "III" | "IV" | "V" | undefined,
      legalArea: params.legalAreas?.[0],
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      limit: params.limit || 10,
    };

    // Search via API
    const apiResult = await bundesgerichtClient.searchDecisions(filters);

    // Store decisions in database
    if (apiResult.decisions.length > 0) {
      await Promise.all(
        apiResult.decisions.map(async (decision: BundesgerichtDecision) => {
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
      logger.info("Stored decisions in database", {
        count: apiResult.decisions.length,
      });
    }

    // Cache the results (TTL: 1 hour)
    const result = {
      decisions: apiResult.decisions,
      totalResults: apiResult.total,
    };
    await cacheRepo.set(cacheKey, JSON.stringify(result), 3600);

    return {
      ...result,
      searchTimeMs: Date.now() - startTime,
      fromCache: false,
    };
  } catch (error) {
    logger.error("BGE search failed", error as Error, { params });
    throw error;
  }
}

/**
 * Get specific BGE decision by citation with cache-first strategy
 */
async function getBGEDecision(citation: string): Promise<{
  found: boolean;
  decision?: BundesgerichtDecision;
  fromCache: boolean;
}> {
  try {
    // Validate citation first
    const validation = bundesgerichtClient.validateCitation(citation);
    if (!validation.valid) {
      return {
        found: false,
        fromCache: false,
      };
    }

    // Create cache key
    const cacheKey = `bge_decision:${citation}`;

    // Check cache
    const cached = await cacheRepo.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for BGE decision", { citation });
      return {
        found: true,
        decision: JSON.parse(cached),
        fromCache: true,
      };
    }

    logger.info("Cache miss - fetching decision from API", { citation });

    // Fetch from API
    const decision = await bundesgerichtClient.getDecisionByCitation(citation);

    if (!decision) {
      return {
        found: false,
        fromCache: false,
      };
    }

    // Store in database
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

    // Cache the result (TTL: 24 hours)
    await cacheRepo.set(cacheKey, JSON.stringify(decision), 86400);

    return {
      found: true,
      decision,
      fromCache: false,
    };
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
    const validation = bundesgerichtClient.validateCitation(citation);

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error,
      };
    }

    // Parse citation to get components
    const parsed = bundesgerichtClient.parseCitation(citation);

    return {
      valid: true,
      volume: parsed.volume.toString(),
      chamber: parsed.chamber,
      page: parsed.page.toString(),
      normalized: parsed.formatted,
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
  // Initialize infrastructure
  await initializeInfrastructure();

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
            "Search Swiss Federal Supreme Court (BGE) decisions by query, date range, chamber, and legal area. Uses real Bundesgericht API with database caching.",
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
            "Retrieve a specific BGE decision by citation. Uses cache-first strategy with 24-hour TTL.",
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

  logger.info("BGE Search MCP server running on stdio");
  console.error("BGE Search MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
