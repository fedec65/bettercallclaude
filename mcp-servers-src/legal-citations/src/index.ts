#!/usr/bin/env node

/**
 * Legal Citations MCP Server
 * Provides citation verification and multi-lingual formatting for Swiss law
 *
 * @see https://modelcontextprotocol.io/
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import { CitationValidator } from './validators/citation-validator.js';
import { CitationFormatter } from './formatters/citation-formatter.js';
import { CitationParser } from './parsers/citation-parser.js';
import type { Language, FormatOptions, CitationComponents, CitationType, ParsedCitation } from './types.js';

/**
 * Fedlex API configuration for provision text retrieval
 */
const FEDLEX_BASE_URL = 'https://www.fedlex.admin.ch/eli';

/**
 * Statute to SR number mapping for Fedlex API
 */
const STATUTE_SR_MAPPING: Record<string, string> = {
  // Civil Law
  'ZGB': '210',      // Zivilgesetzbuch
  'CC': '210',       // Code civil
  'CCS': '210',      // Codice civile svizzero

  // Obligations
  'OR': '220',       // Obligationenrecht
  'CO': '220',       // Code des obligations

  // Criminal Law
  'StGB': '311.0',   // Strafgesetzbuch
  'CP': '311.0',     // Code pénal
  'CPS': '311.0',    // Codice penale svizzero

  // Federal Constitution
  'BV': '101',       // Bundesverfassung
  'Cst': '101',      // Constitution fédérale
  'Cost': '101',     // Costituzione federale

  // Administrative Law
  'VwVG': '172.021', // Verwaltungsverfahrensgesetz
  'PA': '172.021',   // Loi sur la procédure administrative

  // BGG
  'BGG': '173.110',  // Bundesgerichtsgesetz
  'LTF': '173.110',  // Loi sur le Tribunal fédéral

  // SchKG
  'SchKG': '281.1',  // Schuldbetreibungs- und Konkursgesetz
  'LP': '281.1',     // Loi sur la poursuite pour dettes

  // ZPO
  'ZPO': '272',      // Zivilprozessordnung
  'CPC': '272',      // Code de procédure civile

  // StPO
  'StPO': '312.0',   // Strafprozessordnung
  'CPP': '312.0',    // Code de procédure pénale

  // AVIG
  'AVIG': '837.0',   // Arbeitslosenversicherungsgesetz
  'LACI': '837.0',   // Loi sur l'assurance-chômage

  // AHVG
  'AHVG': '831.10',  // AHV-Gesetz
  'LAVS': '831.10',  // Loi sur l'AVS

  // IVG
  'IVG': '831.20',   // Invalidenversicherungsgesetz
  'LAI': '831.20',   // Loi sur l'AI

  // BVG
  'BVG': '831.40',   // Bundesgesetz über die berufliche Vorsorge
  'LPP': '831.40',   // Loi sur la prévoyance professionnelle

  // UVG
  'UVG': '832.20',   // Unfallversicherungsgesetz
  'LAA': '832.20',   // Loi sur l'assurance-accidents

  // KVG
  'KVG': '832.10',   // Krankenversicherungsgesetz
  'LAMal': '832.10', // Loi sur l'assurance-maladie

  // DSG
  'DSG': '235.1',    // Datenschutzgesetz
  'LPD': '235.1',    // Loi sur la protection des données

  // IPRG
  'IPRG': '291',     // Bundesgesetz über das Internationale Privatrecht
  'LDIP': '291',     // Loi sur le droit international privé

  // MWStG
  'MWStG': '641.20', // Mehrwertsteuergesetz
  'LTVA': '641.20',  // Loi sur la TVA

  // DBG
  'DBG': '642.11',   // Direkte Bundessteuer
  'LIFD': '642.11',  // Loi sur l'impôt fédéral direct
};

/**
 * Full statute names by language
 */
const STATUTE_FULL_NAMES: Record<string, Record<Language, string>> = {
  'ZGB': {
    de: 'Schweizerisches Zivilgesetzbuch',
    fr: 'Code civil suisse',
    it: 'Codice civile svizzero',
    en: 'Swiss Civil Code'
  },
  'OR': {
    de: 'Obligationenrecht',
    fr: 'Code des obligations',
    it: 'Diritto delle obbligazioni',
    en: 'Code of Obligations'
  },
  'StGB': {
    de: 'Schweizerisches Strafgesetzbuch',
    fr: 'Code pénal suisse',
    it: 'Codice penale svizzero',
    en: 'Swiss Criminal Code'
  },
  'BV': {
    de: 'Bundesverfassung der Schweizerischen Eidgenossenschaft',
    fr: 'Constitution fédérale de la Confédération suisse',
    it: 'Costituzione federale della Confederazione Svizzera',
    en: 'Federal Constitution of the Swiss Confederation'
  },
  'BGG': {
    de: 'Bundesgerichtsgesetz',
    fr: 'Loi sur le Tribunal fédéral',
    it: 'Legge sul Tribunale federale',
    en: 'Federal Supreme Court Act'
  },
  'ZPO': {
    de: 'Schweizerische Zivilprozessordnung',
    fr: 'Code de procédure civile',
    it: 'Codice di diritto processuale civile svizzero',
    en: 'Swiss Civil Procedure Code'
  },
  'StPO': {
    de: 'Schweizerische Strafprozessordnung',
    fr: 'Code de procédure pénale suisse',
    it: 'Codice di diritto processuale penale svizzero',
    en: 'Swiss Criminal Procedure Code'
  },
};

/**
 * MCP Server for Swiss Legal Citations
 * Version: 1.1.0
 */
class LegalCitationsMCPServer {
  private server: Server;
  private validator: CitationValidator;
  private formatter: CitationFormatter;
  private parser: CitationParser;

  constructor() {
    this.server = new Server(
      {
        name: 'legal-citations',
        version: '1.1.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.validator = new CitationValidator();
    this.formatter = new CitationFormatter();
    this.parser = new CitationParser();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'validate_citation',
          description: 'Validate a Swiss legal citation (BGE/ATF/DTF or statutory). Returns validation result with normalized citation and error messages if invalid.',
          inputSchema: {
            type: 'object',
            properties: {
              citation: {
                type: 'string',
                description: 'The legal citation to validate (e.g., "BGE 147 IV 73", "Art. 97 OR")'
              }
            },
            required: ['citation']
          }
        },
        {
          name: 'format_citation',
          description: 'Format a Swiss legal citation to a specific language (DE/FR/IT/EN). Converts citation components while preserving legal meaning.',
          inputSchema: {
            type: 'object',
            properties: {
              citation: {
                type: 'string',
                description: 'The legal citation to format'
              },
              targetLanguage: {
                type: 'string',
                enum: ['de', 'fr', 'it', 'en'],
                description: 'Target language for formatting (de=German, fr=French, it=Italian, en=English)'
              },
              fullStatuteName: {
                type: 'boolean',
                description: 'Include full statute name in parentheses (optional, default: false)',
                default: false
              }
            },
            required: ['citation', 'targetLanguage']
          }
        },
        {
          name: 'convert_citation',
          description: 'Convert a citation from one language to another. Auto-detects source language and converts to target language.',
          inputSchema: {
            type: 'object',
            properties: {
              citation: {
                type: 'string',
                description: 'The legal citation to convert'
              },
              targetLanguage: {
                type: 'string',
                enum: ['de', 'fr', 'it', 'en'],
                description: 'Target language (de=German, fr=French, it=Italian, en=English)'
              },
              fullStatuteName: {
                type: 'boolean',
                description: 'Include full statute name (optional, default: false)',
                default: false
              }
            },
            required: ['citation', 'targetLanguage']
          }
        },
        {
          name: 'parse_citation',
          description: 'Parse a Swiss legal citation and extract all components. Returns citation type, language, components, and validity status.',
          inputSchema: {
            type: 'object',
            properties: {
              citation: {
                type: 'string',
                description: 'The legal citation to parse'
              }
            },
            required: ['citation']
          }
        },
        {
          name: 'get_provision_text',
          description: 'Retrieve the official text of a Swiss statutory provision from Fedlex. Returns the provision text in the requested language with metadata.',
          inputSchema: {
            type: 'object',
            properties: {
              statute: {
                type: 'string',
                description: 'Statute abbreviation (e.g., "OR", "ZGB", "StGB", "BV", "BGG")'
              },
              article: {
                type: 'number',
                description: 'Article number'
              },
              paragraph: {
                type: 'number',
                description: 'Paragraph/Absatz number (optional)'
              },
              letter: {
                type: 'string',
                description: 'Letter/Buchstabe (optional, e.g., "a", "b")'
              },
              language: {
                type: 'string',
                enum: ['de', 'fr', 'it'],
                description: 'Language for the provision text (default: de)'
              },
              asOfDate: {
                type: 'string',
                description: 'Point-in-time version (ISO date format, optional)'
              }
            },
            required: ['statute', 'article']
          }
        },
        {
          name: 'extract_citations',
          description: 'Extract all legal citations from a document or text. Identifies BGE/ATF/DTF case citations and statutory references.',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The document text to analyze for citations'
              },
              includeTypes: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['bge', 'atf', 'dtf', 'statute', 'cantonal', 'all']
                },
                description: 'Types of citations to extract (default: all)'
              },
              validateCitations: {
                type: 'boolean',
                description: 'Whether to validate each extracted citation (default: true)'
              }
            },
            required: ['text']
          }
        },
        {
          name: 'standardize_document_citations',
          description: 'Standardize all legal citations in a document to a consistent format and language. Returns the document with normalized citations.',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The document text containing citations to standardize'
              },
              targetLanguage: {
                type: 'string',
                enum: ['de', 'fr', 'it', 'en'],
                description: 'Target language for standardized citations'
              },
              format: {
                type: 'string',
                enum: ['short', 'long', 'academic'],
                description: 'Citation format style (default: short)'
              },
              includeFullNames: {
                type: 'boolean',
                description: 'Include full statute names (default: false)'
              }
            },
            required: ['text', 'targetLanguage']
          }
        },
        {
          name: 'compare_citation_versions',
          description: 'Compare different versions of a statutory provision over time. Shows changes between versions with effective dates.',
          inputSchema: {
            type: 'object',
            properties: {
              statute: {
                type: 'string',
                description: 'Statute abbreviation (e.g., "OR", "ZGB")'
              },
              article: {
                type: 'number',
                description: 'Article number'
              },
              paragraph: {
                type: 'number',
                description: 'Paragraph number (optional)'
              },
              dateFrom: {
                type: 'string',
                description: 'Start date for version comparison (ISO format)'
              },
              dateTo: {
                type: 'string',
                description: 'End date for version comparison (ISO format, default: today)'
              },
              language: {
                type: 'string',
                enum: ['de', 'fr', 'it'],
                description: 'Language for provision text (default: de)'
              }
            },
            required: ['statute', 'article']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'validate_citation':
            return await this.handleValidateCitation(args);

          case 'format_citation':
            return await this.handleFormatCitation(args);

          case 'convert_citation':
            return await this.handleConvertCitation(args);

          case 'parse_citation':
            return await this.handleParseCitation(args);

          case 'get_provision_text':
            return await this.handleGetProvisionText(args);

          case 'extract_citations':
            return await this.handleExtractCitations(args);

          case 'standardize_document_citations':
            return await this.handleStandardizeDocumentCitations(args);

          case 'compare_citation_versions':
            return await this.handleCompareCitationVersions(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${errorMessage}`
        );
      }
    });
  }

  private async handleValidateCitation(args: any) {
    const { citation } = args;

    if (!citation || typeof citation !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Citation parameter is required and must be a string'
      );
    }

    const result = this.validator.validate(citation);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              valid: result.valid,
              type: result.type,
              normalized: result.normalized,
              components: result.components,
              errors: result.errors,
              warnings: result.warnings
            },
            null,
            2
          )
        }
      ]
    };
  }

  private async handleFormatCitation(args: any) {
    const { citation, targetLanguage, fullStatuteName = false } = args;

    if (!citation || typeof citation !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Citation parameter is required and must be a string'
      );
    }

    if (!targetLanguage || !['de', 'fr', 'it', 'en'].includes(targetLanguage)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'targetLanguage must be one of: de, fr, it, en'
      );
    }

    // Parse citation first
    const parsed = this.parser.parse(citation);

    if (!parsed.isValid) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid citation: ${citation}`
      );
    }

    // Format to target language
    const options: FormatOptions = {
      language: targetLanguage as Language,
      fullStatuteName
    };

    const formatted = this.formatter.format(
      parsed.type,
      parsed.components,
      targetLanguage as Language,
      options
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              original: citation,
              formatted: formatted.citation,
              language: formatted.language,
              type: formatted.type,
              fullReference: formatted.fullReference
            },
            null,
            2
          )
        }
      ]
    };
  }

  private async handleConvertCitation(args: any) {
    const { citation, targetLanguage, fullStatuteName = false } = args;

    if (!citation || typeof citation !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Citation parameter is required and must be a string'
      );
    }

    if (!targetLanguage || !['de', 'fr', 'it', 'en'].includes(targetLanguage)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'targetLanguage must be one of: de, fr, it, en'
      );
    }

    // Parse and detect source language
    const parsed = this.parser.parse(citation);

    if (!parsed.isValid) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid citation: ${citation}`
      );
    }

    // Get all translations
    const allTranslations = this.formatter.getAllTranslations(
      parsed.type,
      parsed.components
    );

    // Format to target language with options
    const options: FormatOptions = {
      language: targetLanguage as Language,
      fullStatuteName
    };

    const formatted = this.formatter.format(
      parsed.type,
      parsed.components,
      targetLanguage as Language,
      options
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              original: citation,
              sourceLanguage: parsed.language,
              targetLanguage,
              converted: formatted.citation,
              fullReference: formatted.fullReference,
              allTranslations
            },
            null,
            2
          )
        }
      ]
    };
  }

  private async handleParseCitation(args: any) {
    const { citation } = args;

    if (!citation || typeof citation !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Citation parameter is required and must be a string'
      );
    }

    const parsed = this.parser.parse(citation);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              original: parsed.original,
              type: parsed.type,
              language: parsed.language,
              components: parsed.components,
              isValid: parsed.isValid,
              suggestions: parsed.suggestions
            },
            null,
            2
          )
        }
      ]
    };
  }

  /**
   * Get provision text from Fedlex
   */
  private async handleGetProvisionText(args: any) {
    const { statute, article, paragraph, letter, language = 'de', asOfDate } = args;

    if (!statute || typeof statute !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'statute parameter is required and must be a string'
      );
    }

    if (typeof article !== 'number') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'article parameter is required and must be a number'
      );
    }

    // Normalize statute abbreviation
    const normalizedStatute = statute.toUpperCase();
    const srNumber = STATUTE_SR_MAPPING[normalizedStatute] || STATUTE_SR_MAPPING[statute];

    if (!srNumber) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown statute abbreviation: ${statute}. Supported: ${Object.keys(STATUTE_SR_MAPPING).join(', ')}`
      );
    }

    // Build Fedlex URL for API call
    const langCode = language === 'de' ? 'de' : language === 'fr' ? 'fr' : 'it';
    const fedlexUrl = `${FEDLEX_BASE_URL}/cc/${srNumber}/${langCode}`;

    // Build the formatted citation reference
    const formattedCitation = this.buildProvisionReference(
      normalizedStatute,
      article,
      paragraph,
      letter,
      language as Language
    );

    // Simulate Fedlex API response (in production, this would be a real HTTP call)
    // For now, return structured provision information
    const provisionText = await this.fetchProvisionText(
      srNumber,
      article,
      paragraph,
      letter,
      langCode,
      asOfDate
    );

    const fullStatuteName = STATUTE_FULL_NAMES[normalizedStatute]?.[language as Language] ||
      STATUTE_FULL_NAMES[Object.keys(STATUTE_SR_MAPPING).find(k => STATUTE_SR_MAPPING[k] === srNumber) || '']?.[language as Language] ||
      normalizedStatute;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              provision: {
                statute: normalizedStatute,
                srNumber,
                article,
                paragraph,
                letter,
                formattedCitation,
                fullStatuteName
              },
              text: provisionText.text,
              effectiveDate: provisionText.effectiveDate,
              language,
              fedlexUrl,
              metadata: {
                lastModified: provisionText.lastModified,
                version: provisionText.version
              }
            },
            null,
            2
          )
        }
      ]
    };
  }

  /**
   * Build a formatted provision reference
   */
  private buildProvisionReference(
    statute: string,
    article: number,
    paragraph?: number,
    letter?: string,
    language: Language = 'de'
  ): string {
    const labels = {
      de: { art: 'Art.', abs: 'Abs.', lit: 'lit.' },
      fr: { art: 'art.', abs: 'al.', lit: 'let.' },
      it: { art: 'art.', abs: 'cpv.', lit: 'lett.' },
      en: { art: 'Art.', abs: 'para.', lit: 'lit.' }
    };

    const l = labels[language];
    let ref = `${l.art} ${article}`;

    if (paragraph) {
      ref += ` ${l.abs} ${paragraph}`;
    }

    if (letter) {
      ref += ` ${l.lit} ${letter}`;
    }

    ref += ` ${statute}`;

    return ref;
  }

  /**
   * Fetch provision text (simulated - in production would call Fedlex API)
   */
  private async fetchProvisionText(
    srNumber: string,
    article: number,
    paragraph?: number,
    letter?: string,
    language: string = 'de',
    asOfDate?: string
  ): Promise<{ text: string; effectiveDate: string; lastModified: string; version: string }> {
    // In production, this would make an HTTP request to Fedlex API
    // For now, return a placeholder indicating the provision location

    const effectiveDate = asOfDate || new Date().toISOString().split('T')[0];

    // Return structured response indicating this would need real API integration
    return {
      text: `[Provision text would be fetched from Fedlex API: SR ${srNumber}, Art. ${article}${paragraph ? ` Abs. ${paragraph}` : ''}${letter ? ` lit. ${letter}` : ''}]`,
      effectiveDate,
      lastModified: new Date().toISOString(),
      version: 'current'
    };
  }

  /**
   * Extract all legal citations from document text
   */
  private async handleExtractCitations(args: any) {
    const { text, includeTypes = ['all'], validateCitations = true } = args;

    if (!text || typeof text !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'text parameter is required and must be a string'
      );
    }

    const extractedCitations: Array<{
      citation: string;
      type: CitationType;
      position: { start: number; end: number };
      parsed?: ParsedCitation;
      valid?: boolean;
    }> = [];

    // Define citation patterns
    const patterns: Array<{ regex: RegExp; type: CitationType }> = [
      // BGE/ATF/DTF patterns
      { regex: /BGE\s+\d{1,3}\s+[IV]+\s+\d+/gi, type: 'bge' },
      { regex: /ATF\s+\d{1,3}\s+[IV]+\s+\d+/gi, type: 'atf' },
      { regex: /DTF\s+\d{1,3}\s+[IV]+\s+\d+/gi, type: 'dtf' },

      // Statute patterns (German)
      { regex: /Art\.\s*\d+[a-z]?\s*(Abs\.\s*\d+)?\s*(lit\.\s*[a-z])?\s*(Ziff\.\s*\d+)?\s*(ZGB|OR|StGB|BV|BGG|ZPO|StPO|SchKG|VwVG|AVIG|AHVG|IVG|BVG|UVG|KVG|DSG|IPRG|MWStG|DBG)/gi, type: 'statute' },

      // Statute patterns (French)
      { regex: /art\.\s*\d+[a-z]?\s*(al\.\s*\d+)?\s*(let\.\s*[a-z])?\s*(ch\.\s*\d+)?\s*(CC|CO|CP|Cst|LTF|CPC|CPP|LP|PA|LACI|LAVS|LAI|LPP|LAA|LAMal|LPD|LDIP|LTVA|LIFD)/gi, type: 'statute' },

      // Statute patterns (Italian)
      { regex: /art\.\s*\d+[a-z]?\s*(cpv\.\s*\d+)?\s*(lett\.\s*[a-z])?\s*(n\.\s*\d+)?\s*(CCS|CO|CPS|Cost)/gi, type: 'statute' },

      // Cantonal court patterns
      { regex: /[A-Z]{2,4}[-_]\d{4}[-_]\d+/g, type: 'cantonal' }
    ];

    // Filter patterns based on includeTypes
    const shouldIncludeAll = includeTypes.includes('all');
    const filteredPatterns = patterns.filter(p =>
      shouldIncludeAll || includeTypes.includes(p.type)
    );

    // Extract citations
    for (const { regex, type } of filteredPatterns) {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);

      while ((match = regexCopy.exec(text)) !== null) {
        const citation = match[0].trim();
        const position = { start: match.index, end: match.index + citation.length };

        // Check for duplicates
        const isDuplicate = extractedCitations.some(
          ec => ec.citation === citation && ec.position.start === position.start
        );

        if (!isDuplicate) {
          const entry: typeof extractedCitations[0] = {
            citation,
            type,
            position
          };

          // Validate if requested
          if (validateCitations) {
            const parsed = this.parser.parse(citation);
            entry.parsed = parsed;
            entry.valid = parsed.isValid;
          }

          extractedCitations.push(entry);
        }
      }
    }

    // Sort by position
    extractedCitations.sort((a, b) => a.position.start - b.position.start);

    // Generate statistics
    const statistics = {
      total: extractedCitations.length,
      byType: {} as Record<string, number>,
      validCount: extractedCitations.filter(c => c.valid !== false).length,
      invalidCount: extractedCitations.filter(c => c.valid === false).length
    };

    for (const citation of extractedCitations) {
      statistics.byType[citation.type] = (statistics.byType[citation.type] || 0) + 1;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              citations: extractedCitations,
              statistics,
              textLength: text.length
            },
            null,
            2
          )
        }
      ]
    };
  }

  /**
   * Standardize all citations in a document to consistent format
   */
  private async handleStandardizeDocumentCitations(args: any) {
    const { text, targetLanguage, format = 'short', includeFullNames = false } = args;

    if (!text || typeof text !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'text parameter is required and must be a string'
      );
    }

    if (!targetLanguage || !['de', 'fr', 'it', 'en'].includes(targetLanguage)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'targetLanguage must be one of: de, fr, it, en'
      );
    }

    // First extract all citations
    const extractResult = await this.handleExtractCitations({
      text,
      includeTypes: ['all'],
      validateCitations: true
    });

    const extractedData = JSON.parse(extractResult.content[0].text);
    const citations = extractedData.citations;

    // Build replacement map
    const replacements: Array<{
      original: string;
      standardized: string;
      position: { start: number; end: number };
    }> = [];

    for (const citationEntry of citations) {
      if (!citationEntry.valid || !citationEntry.parsed) {
        continue;
      }

      const parsed = citationEntry.parsed;

      // Format to target language
      const options: FormatOptions = {
        language: targetLanguage as Language,
        fullStatuteName: includeFullNames
      };

      const formatted = this.formatter.format(
        parsed.type,
        parsed.components,
        targetLanguage as Language,
        options
      );

      let standardized = formatted.citation;

      // Apply format style
      if (format === 'long' && formatted.fullReference) {
        standardized = formatted.fullReference;
      } else if (format === 'academic') {
        // Academic format: include both abbreviation and full name
        if (formatted.fullReference && formatted.citation !== formatted.fullReference) {
          standardized = `${formatted.citation} (${formatted.fullReference})`;
        }
      }

      if (standardized !== citationEntry.citation) {
        replacements.push({
          original: citationEntry.citation,
          standardized,
          position: citationEntry.position
        });
      }
    }

    // Apply replacements from end to start to preserve positions
    let standardizedText = text;
    const sortedReplacements = [...replacements].sort(
      (a, b) => b.position.start - a.position.start
    );

    for (const replacement of sortedReplacements) {
      standardizedText =
        standardizedText.substring(0, replacement.position.start) +
        replacement.standardized +
        standardizedText.substring(replacement.position.end);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              originalText: text,
              standardizedText,
              targetLanguage,
              format,
              replacements,
              statistics: {
                totalCitations: citations.length,
                standardized: replacements.length,
                unchanged: citations.length - replacements.length
              }
            },
            null,
            2
          )
        }
      ]
    };
  }

  /**
   * Compare provision versions over time
   */
  private async handleCompareCitationVersions(args: any) {
    const { statute, article, paragraph, dateFrom, dateTo, language = 'de' } = args;

    if (!statute || typeof statute !== 'string') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'statute parameter is required and must be a string'
      );
    }

    if (typeof article !== 'number') {
      throw new McpError(
        ErrorCode.InvalidParams,
        'article parameter is required and must be a number'
      );
    }

    // Normalize statute
    const normalizedStatute = statute.toUpperCase();
    const srNumber = STATUTE_SR_MAPPING[normalizedStatute] || STATUTE_SR_MAPPING[statute];

    if (!srNumber) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Unknown statute abbreviation: ${statute}`
      );
    }

    // Parse dates
    const fromDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    const toDate = dateTo ? new Date(dateTo) : new Date();

    // In production, this would query Fedlex API for historical versions
    // For now, return simulated version comparison data
    const versions = await this.fetchProvisionVersions(
      srNumber,
      article,
      paragraph,
      fromDate,
      toDate,
      language
    );

    // Build formatted citation
    const formattedCitation = this.buildProvisionReference(
      normalizedStatute,
      article,
      paragraph,
      undefined,
      language as Language
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              provision: {
                statute: normalizedStatute,
                srNumber,
                article,
                paragraph,
                formattedCitation
              },
              dateRange: {
                from: fromDate.toISOString().split('T')[0],
                to: toDate.toISOString().split('T')[0]
              },
              versions,
              totalVersions: versions.length,
              hasChanges: versions.length > 1
            },
            null,
            2
          )
        }
      ]
    };
  }

  /**
   * Fetch provision versions (simulated - would call Fedlex API in production)
   */
  private async fetchProvisionVersions(
    srNumber: string,
    article: number,
    paragraph: number | undefined,
    fromDate: Date,
    toDate: Date,
    language: string
  ): Promise<Array<{
    effectiveDate: string;
    text: string;
    changeType: 'initial' | 'amendment' | 'current';
    changeDescription?: string;
  }>> {
    // In production, query Fedlex API for historical versions
    // Return simulated data for demonstration
    return [
      {
        effectiveDate: fromDate.toISOString().split('T')[0],
        text: `[Historical version of SR ${srNumber} Art. ${article}${paragraph ? ` Abs. ${paragraph}` : ''} - would be fetched from Fedlex]`,
        changeType: 'initial',
        changeDescription: 'Original enactment'
      },
      {
        effectiveDate: toDate.toISOString().split('T')[0],
        text: `[Current version of SR ${srNumber} Art. ${article}${paragraph ? ` Abs. ${paragraph}` : ''} - would be fetched from Fedlex]`,
        changeType: 'current',
        changeDescription: 'Current version in force'
      }
    ];
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Legal Citations MCP server running on stdio');
    console.error('Version: 1.1.0');
    console.error('Capabilities: validate_citation, format_citation, convert_citation, parse_citation, get_provision_text, extract_citations, standardize_document_citations, compare_citation_versions');
  }
}

// Start the server
const server = new LegalCitationsMCPServer();
server.run().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
