#!/usr/bin/env node
/**
 * OnlineKommentar MCP Server
 * Swiss Legal Doctrine (Commentary) Integration
 *
 * Provides access to OnlineKommentar.ch API for Swiss legal commentaries
 * Part of the BetterCallClaude "Swiss Legal Research Trinity"
 *
 * Tools:
 * - search_commentaries: Search commentaries with filters
 * - get_commentary: Get detailed commentary by ID
 * - get_commentary_for_article: Find commentaries for article references (KEY FEATURE)
 * - list_legislative_acts: List available legislative acts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { OnlineKommentarClient } from './client.js';
import type { Language, SortOption } from './types.js';

// Initialize server
const server = new Server(
  {
    name: 'onlinekommentar',
    version: '2.2.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize client
const client = new OnlineKommentarClient();

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_commentaries',
        description: `Search Swiss legal commentaries on OnlineKommentar.ch.

Supports filtering by:
- Language (de, fr, it, en)
- Legislative act (UUID from list_legislative_acts)
- Sorting (title, -title, date, -date)
- Pagination

Example queries:
- "Art. 97 OR" - Find commentaries on contractual liability
- "Vertragshaftung" - Search for contract liability commentaries
- "responsabilité contractuelle" - French search`,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string (article reference, legal term, etc.)',
            },
            language: {
              type: 'string',
              enum: ['de', 'fr', 'it', 'en'],
              description: 'Filter by language (de=German, fr=French, it=Italian, en=English)',
            },
            legislative_act: {
              type: 'string',
              description: 'Filter by legislative act UUID (get UUIDs from list_legislative_acts)',
            },
            sort: {
              type: 'string',
              enum: ['title', '-title', 'date', '-date'],
              description: 'Sort order: title (A-Z), -title (Z-A), date (oldest), -date (newest)',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_commentary',
        description: `Get detailed commentary content by ID.

Returns:
- Full commentary text and sections
- Authors and metadata
- Citations (BGE, ATF, DTF references)
- Related commentaries
- Direct URL to source

Use after search_commentaries to get full content.`,
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Commentary UUID (from search_commentaries results)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_commentary_for_article',
        description: `KEY FEATURE: Find commentaries for a specific Swiss law article reference.

Automatically parses article references in multiple formats:
- German: "Art. 97 OR", "Art. 97 Abs. 1 OR", "Art. 97 Abs. 1 lit. a OR"
- French: "art. 97 CO", "art. 97 al. 2 CO", "art. 97 al. 2 let. a CO"
- Italian: "art. 97 CO", "art. 97 cpv. 1 CO", "art. 97 cpv. 1 lett. a CO"

Resolves abbreviations across languages:
- OR/CO → Obligationenrecht / Code des obligations
- ZGB/CC → Zivilgesetzbuch / Code civil
- StGB/CP → Strafgesetzbuch / Code pénal

Example: "Art. 97 OR" → Finds all commentaries on OR Article 97`,
        inputSchema: {
          type: 'object',
          properties: {
            article_reference: {
              type: 'string',
              description: 'Article reference (e.g., "Art. 97 OR", "art. 97 al. 2 CO")',
            },
            language: {
              type: 'string',
              enum: ['de', 'fr', 'it', 'en'],
              description: 'Preferred language for results',
            },
          },
          required: ['article_reference'],
        },
      },
      {
        name: 'list_legislative_acts',
        description: `List all available Swiss legislative acts (codes/statutes).

Returns:
- Legislative act UUIDs (for filtering searches)
- Names and abbreviations in all languages
- DE: OR, ZGB, StGB, ZPO, StPO, BV, DSG, UWG...
- FR: CO, CC, CP, CPC, CPP...
- IT: CO, CC, CP, CPC, CPP...

Use this to get UUIDs for filtering search_commentaries by legislative act.`,
        inputSchema: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              enum: ['de', 'fr', 'it', 'en'],
              description: 'Filter by language (optional)',
            },
          },
          required: [],
        },
      },
    ],
  };
});

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_commentaries': {
        const query = (args?.query as string) || '';
        const options = {
          language: args?.language as Language | undefined,
          legislative_act: args?.legislative_act as string | undefined,
          sort: args?.sort as SortOption | undefined,
          page: args?.page as number | undefined,
        };

        const result = await client.searchCommentaries(query, options);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  count: result.count,
                  page: result.page,
                  total_pages: result.total_pages,
                  commentaries: result.commentaries.map((c) => ({
                    id: c.id,
                    title: c.title,
                    authors: c.authors,
                    legislative_act: c.legislative_act.abbreviation,
                    language: c.language,
                    updated: c.updated,
                    url: c.url,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_commentary': {
        const id = args?.id as string;

        if (!id) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Commentary ID is required' }),
              },
            ],
            isError: true,
          };
        }

        const result = await client.getCommentary(id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  commentary: {
                    id: result.id,
                    title: result.title,
                    authors: result.authors,
                    legislative_act: result.legislative_act,
                    language: result.language,
                    updated: result.updated,
                    url: result.url,
                    abstract: result.abstract,
                    content: result.content,
                    sections: result.sections,
                    citations: result.citations,
                    related_commentaries: result.related_commentaries,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_commentary_for_article': {
        const articleReference = args?.article_reference as string;
        const language = args?.language as Language | undefined;

        if (!articleReference) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Article reference is required (e.g., "Art. 97 OR")',
                }),
              },
            ],
            isError: true,
          };
        }

        const result = await client.getCommentaryForArticle(articleReference, language);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  article_reference: articleReference,
                  count: result.count,
                  page: result.page,
                  total_pages: result.total_pages,
                  commentaries: result.commentaries.map((c) => ({
                    id: c.id,
                    title: c.title,
                    authors: c.authors,
                    legislative_act: c.legislative_act.abbreviation,
                    language: c.language,
                    updated: c.updated,
                    url: c.url,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_legislative_acts': {
        const language = args?.language as Language | undefined;

        const result = await client.listLegislativeActs(language);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  count: result.length,
                  legislative_acts: result.map((act) => ({
                    id: act.id,
                    name: act.name,
                    abbreviation: act.abbreviation,
                    abbreviation_de: act.abbreviation_de,
                    abbreviation_fr: act.abbreviation_fr,
                    abbreviation_it: act.abbreviation_it,
                    language: act.language,
                  })),
                  mapping: client.getLegislativeActMapping(),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`,
              }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OnlineKommentar MCP Server v2.2.0 running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
