#!/usr/bin/env node

/**
 * Fedlex SPARQL MCP Server
 *
 * Provides access to Swiss Federal Legislation via the Fedlex SPARQL endpoint.
 * Uses the JOLUX ontology (based on FRBR model) for structured legal data.
 *
 * Endpoint: https://fedlex.data.admin.ch/sparqlendpoint
 * Data: ~228,500 legal objects including SR/RS classified legislation
 * License: CC BY-NC-SA 4.0
 *
 * Data Model (FRBR-based):
 * - jolux:Act = Primary legislation work
 * - jolux:Expression = Language-specific realization (via jolux:isRealizedBy)
 * - jolux:Manifestation = Physical format (via jolux:isEmbodiedBy)
 * - SR numbers via taxonomy: jolux:classifiedByTaxonomyEntry → skos:notation
 * - Titles: taxonomy skos:prefLabel (with language tags)
 *
 * Tools:
 * - lookup_statute: Look up a legal act by SR number or abbreviation
 * - get_article: Retrieve specific articles within a legal act
 * - search_legislation: Full-text and filtered search across legislation
 * - find_related: Find related legislation (amendments, citations, same domain)
 * - get_metadata: Get comprehensive metadata about a legal act
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { SPARQLClient, createFedlexClient } from './sparql-client.js';
import {
  buildLookupStatuteQuery,
  buildLookupByAbbreviationQuery,
  buildGetArticleQuery,
  buildGetArticleParagraphQuery,
  // buildListArticlesQuery, // Reserved for future article listing endpoint
  buildSearchQuery,
  buildSearchCountQuery,
  buildSearchByDomainQuery,
  buildSearchByDateQuery,
  buildFindAllRelatedQuery,
  buildLegislativeHistoryQuery,
  buildGetMetadataQuery,
  buildGetLanguagesQuery,
  buildGetSubjectsQuery,
  buildGetVersionHistoryQuery,
  buildGetLegalStatusQuery,
  buildGetStructureQuery,
  LEGAL_DOMAINS,
} from './queries/index.js';

import type {
  Language,
  LegalAct,
  Article,
  RelatedAct,
  SearchFilters,
  LookupStatuteInput,
  LookupStatuteResult,
  GetArticleInput,
  GetArticleResult,
  SearchLegislationInput,
  SearchLegislationResult,
  FindRelatedInput,
  FindRelatedResult,
  GetMetadataInput,
  GetMetadataResult,
  SPARQLBinding,
  RelationType,
} from './types/legislation.js';

/**
 * Global SPARQL client instance
 */
let sparqlClient: SPARQLClient;

/**
 * Initialize the SPARQL client
 */
function initializeClient(): void {
  sparqlClient = createFedlexClient({
    timeout: 60000, // 60 seconds for complex queries
    maxRetries: 3,
    retryDelay: 2000,
  });

  console.error(`Fedlex SPARQL client initialized - endpoint: ${sparqlClient.getEndpoint()}`);
}

/**
 * Look up a legal act by SR number or abbreviation
 */
async function lookupStatute(input: LookupStatuteInput): Promise<LookupStatuteResult> {
  const startTime = Date.now();

  try {
    let query: string;
    let searchType: 'srNumber' | 'abbreviation';

    // Determine if input is SR number or abbreviation
    if (/^\d/.test(input.identifier)) {
      // Starts with digit → SR number
      query = buildLookupStatuteQuery(input.identifier, input.language);
      searchType = 'srNumber';
    } else {
      // Likely abbreviation (e.g., "OR", "ZGB")
      query = buildLookupByAbbreviationQuery(input.identifier, input.language);
      searchType = 'abbreviation';
    }

    const result = await sparqlClient.query(query);
    const bindings = result.results.bindings;

    if (bindings.length === 0) {
      return {
        found: false,
        searchTimeMs: Date.now() - startTime,
      };
    }

    // Group by act URI to handle multiple language versions
    const actGroups = sparqlClient.groupBindings(bindings, 'act');
    const acts: LegalAct[] = [];

    for (const [actUri, actBindings] of actGroups) {
      const firstBinding = actBindings[0];

      const act: LegalAct = {
        uri: actUri,
        srNumber: sparqlClient.extractValue(firstBinding.srNumber) || '',
        title: sparqlClient.extractMultilingualValue(actBindings, 'title'),
        abbreviation: sparqlClient.extractMultilingualValue(actBindings, 'abbreviation'),
        actType: sparqlClient.extractValue(firstBinding.actType),
        dateDocument: sparqlClient.extractValue(firstBinding.dateDocument),
        dateInForce: sparqlClient.extractValue(firstBinding.dateInForce),
        status: firstBinding.inForce ? 'in_force' : 'unknown',
      };

      acts.push(act);
    }

    return {
      found: true,
      acts,
      searchType,
      searchTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Lookup statute failed:', error);
    throw error;
  }
}

/**
 * Get a specific article within a legal act
 */
async function getArticle(input: GetArticleInput): Promise<GetArticleResult> {
  const startTime = Date.now();

  try {
    let query: string;

    if (input.paragraph) {
      query = buildGetArticleParagraphQuery(
        input.srNumber,
        input.articleNumber,
        input.paragraph,
        input.language
      );
    } else {
      query = buildGetArticleQuery(
        input.srNumber,
        input.articleNumber,
        input.language
      );
    }

    const result = await sparqlClient.query(query);
    const bindings = result.results.bindings;

    if (bindings.length === 0) {
      return {
        found: false,
        searchTimeMs: Date.now() - startTime,
      };
    }

    // Extract act information
    const firstBinding = bindings[0];
    const actInfo = {
      uri: sparqlClient.extractValue(firstBinding.act) || '',
      srNumber: sparqlClient.extractValue(firstBinding.srNumber) || '',
      title: sparqlClient.extractMultilingualValue(bindings, 'actTitle'),
    };

    // Group by article to handle paragraphs and letters
    const articleGroups = sparqlClient.groupBindings(bindings, 'article');
    const articles: Article[] = [];

    for (const [articleUri, articleBindings] of articleGroups) {
      const articleFirst = articleBindings[0];

      // Extract paragraphs
      const paragraphs: Array<{
        number: string;
        text?: Record<string, string>;
        letters?: Array<{ literal: string; text?: Record<string, string> }>;
      }> = [];

      const paragraphGroups = sparqlClient.groupBindings(articleBindings, 'paragraphNum');
      for (const [paragraphNum, paragraphBindings] of paragraphGroups) {
        if (!paragraphNum) continue;

        // Extract letters within paragraph
        const letters: Array<{ literal: string; text?: Record<string, string> }> = [];
        for (const binding of paragraphBindings) {
          const letterLit = sparqlClient.extractValue(binding.letterLit);
          if (letterLit) {
            letters.push({
              literal: letterLit,
              text: binding.letterText ? { [binding.letterText['xml:lang'] || 'de']: binding.letterText.value } : undefined,
            });
          }
        }

        paragraphs.push({
          number: paragraphNum,
          text: sparqlClient.extractMultilingualValue(paragraphBindings, 'paragraphText'),
          letters: letters.length > 0 ? letters : undefined,
        });
      }

      const article: Article = {
        uri: articleUri,
        number: sparqlClient.extractValue(articleFirst.articleNumber) || '',
        title: sparqlClient.extractMultilingualValue(articleBindings, 'articleTitle'),
        text: sparqlClient.extractMultilingualValue(articleBindings, 'articleText'),
        paragraphs: paragraphs.length > 0 ? paragraphs : undefined,
      };

      articles.push(article);
    }

    return {
      found: true,
      act: actInfo,
      articles,
      searchTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Get article failed:', error);
    throw error;
  }
}

/**
 * Search across legislation
 */
async function searchLegislation(input: SearchLegislationInput): Promise<SearchLegislationResult> {
  const startTime = Date.now();

  try {
    const filters: SearchFilters = {
      language: input.language,
      actType: input.actType,
      status: input.status,
      srNumberPrefix: input.srNumberPrefix,
      limit: input.limit || 50,
      offset: input.offset || 0,
    };

    // Build appropriate query based on search type
    let query: string;
    let countQuery: string | undefined;

    if (input.domain && !input.query) {
      // Domain-only search
      query = buildSearchByDomainQuery(input.domain, input.language, filters.limit);
    } else if (input.dateFrom || input.dateTo) {
      // Date range search
      query = buildSearchByDateQuery(input.dateFrom, input.dateTo, input.language, filters.limit);
    } else {
      // Full-text search
      query = buildSearchQuery(input.query || '', filters);
      countQuery = buildSearchCountQuery(input.query || '', filters);
    }

    // Execute search query
    const result = await sparqlClient.query(query);
    const bindings = result.results.bindings;

    // Execute count query if available
    let totalCount = bindings.length;
    if (countQuery) {
      const countResult = await sparqlClient.query(countQuery);
      if (countResult.results.bindings.length > 0) {
        const countValue = sparqlClient.extractValue(countResult.results.bindings[0].count);
        totalCount = countValue ? parseInt(countValue, 10) : bindings.length;
      }
    }

    // Parse results
    const acts: LegalAct[] = bindings.map((binding: Record<string, SPARQLBinding>) => ({
      uri: sparqlClient.extractValue(binding.act) || '',
      srNumber: sparqlClient.extractValue(binding.srNumber) || '',
      title: binding.title ? { [binding.title['xml:lang'] || 'de']: binding.title.value } : {},
      abbreviation: binding.abbreviation ? { [binding.abbreviation['xml:lang'] || 'de']: binding.abbreviation.value } : undefined,
      actType: sparqlClient.extractValue(binding.actType),
      dateInForce: sparqlClient.extractValue(binding.dateInForce),
    }));

    // Group by SR number prefix for domain facets
    const domainFacets: Record<string, number> = {};
    for (const act of acts) {
      const prefix = act.srNumber.split('.')[0];
      if (prefix && LEGAL_DOMAINS[prefix]) {
        domainFacets[prefix] = (domainFacets[prefix] || 0) + 1;
      }
    }

    return {
      acts,
      totalCount,
      hasMore: (filters.offset || 0) + acts.length < totalCount,
      facets: {
        byDomain: domainFacets,
      },
      searchTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Search legislation failed:', error);
    throw error;
  }
}

/**
 * Find related legislation
 */
async function findRelated(input: FindRelatedInput): Promise<FindRelatedResult> {
  const startTime = Date.now();

  try {
    // Get all related acts
    const query = buildFindAllRelatedQuery(
      input.srNumber,
      input.relationType as RelationType,
      input.language,
      input.limit || 50
    );

    const result = await sparqlClient.query(query);
    const bindings = result.results.bindings;

    // Parse related acts
    const relatedActs: RelatedAct[] = bindings.map((binding: Record<string, SPARQLBinding>) => ({
      uri: sparqlClient.extractValue(binding.relatedAct) || '',
      srNumber: sparqlClient.extractValue(binding.relatedSrNumber) || '',
      title: binding.relatedTitle ? { [binding.relatedTitle['xml:lang'] || 'de']: binding.relatedTitle.value } : {},
      relationType: (sparqlClient.extractValue(binding.relationType) as RelationType) || 'same_domain',
      relationDate: sparqlClient.extractValue(binding.relationDate),
    }));

    // Group by relation type for summary
    const byRelationType: Record<string, number> = {};
    for (const act of relatedActs) {
      const relType = act.relationType || 'unknown';
      byRelationType[relType] = (byRelationType[relType] || 0) + 1;
    }

    // Get legislative history if requested
    let legislativeHistory: Array<{ date: string; description?: string }> | undefined;
    if (input.includeHistory) {
      const historyQuery = buildLegislativeHistoryQuery(input.srNumber, input.language);
      const historyResult = await sparqlClient.query(historyQuery);

      legislativeHistory = historyResult.results.bindings.map((binding: Record<string, SPARQLBinding>) => ({
        date: sparqlClient.extractValue(binding.date) || '',
        description: sparqlClient.extractValue(binding.changeDescription),
      }));
    }

    return {
      srNumber: input.srNumber,
      relatedActs,
      byRelationType,
      legislativeHistory,
      searchTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Find related failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive metadata about a legal act
 */
async function getMetadata(input: GetMetadataInput): Promise<GetMetadataResult> {
  const startTime = Date.now();

  try {
    // Fetch metadata in parallel
    const [
      metadataResult,
      languagesResult,
      subjectsResult,
      historyResult,
      statusResult,
      structureResult,
    ] = await Promise.all([
      sparqlClient.query(buildGetMetadataQuery(input.srNumber, input.language)),
      sparqlClient.query(buildGetLanguagesQuery(input.srNumber)),
      sparqlClient.query(buildGetSubjectsQuery(input.srNumber, input.language)),
      sparqlClient.query(buildGetVersionHistoryQuery(input.srNumber)),
      sparqlClient.query(buildGetLegalStatusQuery(input.srNumber)),
      input.includeStructure
        ? sparqlClient.query(buildGetStructureQuery(input.srNumber, input.language))
        : Promise.resolve({ results: { bindings: [] } }),
    ]);

    const metadataBindings = metadataResult.results.bindings;

    if (metadataBindings.length === 0) {
      return {
        found: false,
        searchTimeMs: Date.now() - startTime,
      };
    }

    const firstBinding = metadataBindings[0];

    // Parse basic metadata
    const metadata: GetMetadataResult['metadata'] = {
      uri: sparqlClient.extractValue(firstBinding.act) || '',
      srNumber: sparqlClient.extractValue(firstBinding.srNumber) || '',
      title: sparqlClient.extractMultilingualValue(metadataBindings, 'title'),
      abbreviation: sparqlClient.extractMultilingualValue(metadataBindings, 'abbreviation'),
      actType: sparqlClient.extractValue(firstBinding.actType),
      dateDocument: sparqlClient.extractValue(firstBinding.dateDocument),
      dateInForce: sparqlClient.extractValue(firstBinding.dateInForce),
      dateAbrogation: sparqlClient.extractValue(firstBinding.dateAbrogation),
      status: 'unknown',
    };

    // Parse languages
    metadata.availableLanguages = languagesResult.results.bindings
      .map((b: Record<string, SPARQLBinding>) => sparqlClient.extractValue(b.language))
      .filter((lang): lang is string => !!lang) as Language[];

    // Parse subjects/keywords
    const subjects = subjectsResult.results.bindings
      .map((b: Record<string, SPARQLBinding>) => sparqlClient.extractValue(b.label))
      .filter((s): s is string => !!s);
    if (subjects.length > 0) {
      metadata.subjects = subjects;
    }

    // Parse version history
    const versions = historyResult.results.bindings.map((b: Record<string, SPARQLBinding>) => ({
      date: sparqlClient.extractValue(b.versionDate) || '',
      type: sparqlClient.extractValue(b.versionType),
      description: sparqlClient.extractValue(b.changeDescription),
    }));
    if (versions.length > 0) {
      metadata.versionHistory = versions;
    }

    // Parse legal status
    if (statusResult.results.bindings.length > 0) {
      const statusBinding = statusResult.results.bindings[0];
      const status = sparqlClient.extractValue(statusBinding.status);
      if (status === 'in_force' || status === 'abrogated' || status === 'pending') {
        metadata.status = status;
      }
      metadata.abrogatedBy = sparqlClient.extractValue(statusBinding.abrogatedBy);
    }

    // Parse structure (table of contents)
    if (input.includeStructure && structureResult.results.bindings.length > 0) {
      metadata.structure = structureResult.results.bindings.map((b: Record<string, SPARQLBinding>) => ({
        partNumber: sparqlClient.extractValue(b.partNumber) || '',
        partTitle: sparqlClient.extractValue(b.partTitle),
        partType: sparqlClient.extractValue(b.partType),
      }));
    }

    // Add legal domain info
    const domainPrefix = input.srNumber.split('.')[0];
    if (LEGAL_DOMAINS[domainPrefix]) {
      metadata.legalDomain = LEGAL_DOMAINS[domainPrefix];
    }

    return {
      found: true,
      metadata,
      searchTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Get metadata failed:', error);
    throw error;
  }
}

/**
 * Main server setup
 */
async function main() {
  // Initialize SPARQL client
  initializeClient();

  const server = new Server(
    {
      name: "fedlex-sparql",
      version: "2.0.1",
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
          name: "lookup_statute",
          description:
            "Look up a Swiss federal legal act by SR number (e.g., '220' for OR) or abbreviation (e.g., 'OR', 'ZGB'). Returns basic information including title, type, and status in multiple languages (DE/FR/IT).",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description:
                  "SR number (e.g., '220', '210') or abbreviation (e.g., 'OR', 'ZGB', 'StGB')",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it", "rm"],
                description: "Preferred language for results (de=German, fr=French, it=Italian, rm=Romansh)",
              },
            },
            required: ["identifier"],
          },
        },
        {
          name: "get_article",
          description:
            "Retrieve a specific article within a Swiss legal act. Returns article text, marginal notes, paragraphs (Absätze), and letters (Buchstaben) in structured format.",
          inputSchema: {
            type: "object",
            properties: {
              srNumber: {
                type: "string",
                description: "SR number of the legal act (e.g., '220' for OR)",
              },
              articleNumber: {
                type: "string",
                description: "Article number (e.g., '97', '41', 'Art. 97')",
              },
              paragraph: {
                type: "string",
                description: "Specific paragraph/Absatz number (optional)",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it", "rm"],
                description: "Preferred language for article text",
              },
            },
            required: ["srNumber", "articleNumber"],
          },
        },
        {
          name: "search_legislation",
          description:
            "Search across Swiss federal legislation with full-text search and filters. Supports filtering by legal domain, date range, act type, and language.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Full-text search query (searches title and SR number)",
              },
              domain: {
                type: "string",
                enum: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
                description:
                  "Legal domain filter by SR prefix: 1=State/Constitutional, 2=Private/Civil, 3=Criminal, 4=Education/Culture, 5=Defense, 6=Finance, 7=Public Works/Transport, 8=Health/Labor/Social Security, 9=Economy",
              },
              srNumberPrefix: {
                type: "string",
                description: "Filter by SR number prefix (e.g., '22' for contract law)",
              },
              dateFrom: {
                type: "string",
                format: "date",
                description: "Filter acts in force from this date (ISO 8601: YYYY-MM-DD)",
              },
              dateTo: {
                type: "string",
                format: "date",
                description: "Filter acts in force until this date (ISO 8601: YYYY-MM-DD)",
              },
              actType: {
                type: "array",
                items: { type: "string" },
                description: "Filter by act types (e.g., 'Bundesgesetz', 'Verordnung')",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it", "rm"],
                description: "Language filter for results",
              },
              limit: {
                type: "number",
                minimum: 1,
                maximum: 100,
                default: 50,
                description: "Maximum number of results",
              },
              offset: {
                type: "number",
                minimum: 0,
                default: 0,
                description: "Offset for pagination",
              },
            },
          },
        },
        {
          name: "find_related",
          description:
            "Find legislation related to a specific act through amendments, citations, references, or shared legal domain. Optionally includes legislative history (consolidation chain).",
          inputSchema: {
            type: "object",
            properties: {
              srNumber: {
                type: "string",
                description: "SR number of the legal act (e.g., '220' for OR)",
              },
              relationType: {
                type: "string",
                enum: [
                  "amends",
                  "amended_by",
                  "cites",
                  "cited_by",
                  "implements",
                  "implemented_by",
                  "based_on",
                  "same_domain",
                  "same_subject",
                ],
                description: "Filter by specific relation type (optional - returns all if not specified)",
              },
              includeHistory: {
                type: "boolean",
                default: false,
                description: "Include legislative history (consolidation chain)",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it", "rm"],
                description: "Preferred language for results",
              },
              limit: {
                type: "number",
                minimum: 1,
                maximum: 100,
                default: 50,
                description: "Maximum number of related acts",
              },
            },
            required: ["srNumber"],
          },
        },
        {
          name: "get_metadata",
          description:
            "Get comprehensive metadata about a legal act including publication info, subjects/keywords, version history, legal status, available languages, and optionally the document structure (table of contents).",
          inputSchema: {
            type: "object",
            properties: {
              srNumber: {
                type: "string",
                description: "SR number of the legal act (e.g., '220' for OR)",
              },
              includeStructure: {
                type: "boolean",
                default: false,
                description: "Include document structure (table of contents with chapters, sections, articles)",
              },
              language: {
                type: "string",
                enum: ["de", "fr", "it", "rm"],
                description: "Preferred language for metadata text",
              },
            },
            required: ["srNumber"],
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "lookup_statute") {
        const input = args as unknown as LookupStatuteInput;
        const result = await lookupStatute(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "get_article") {
        const input = args as unknown as GetArticleInput;
        const result = await getArticle(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "search_legislation") {
        const input = args as unknown as SearchLegislationInput;
        const result = await searchLegislation(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "find_related") {
        const input = args as unknown as FindRelatedInput;
        const result = await findRelated(input);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (name === "get_metadata") {
        const input = args as unknown as GetMetadataInput;
        const result = await getMetadata(input);
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
      console.error(`Tool execution failed: ${name}`, error);

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

  console.error("Fedlex SPARQL MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
