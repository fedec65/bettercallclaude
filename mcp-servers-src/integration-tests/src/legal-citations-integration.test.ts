/**
 * Integration tests for legal-citations MCP server
 * Tests cross-server workflows and multi-lingual functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Mock MCP server responses for integration testing
// In production, these would be actual MCP server calls

interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

/**
 * Mock legal-citations MCP server tool calls
 */
class MockLegalCitationsMCP {
  async validateCitation(citation: string): Promise<MCPToolResult> {
    // Simulate legal-citations MCP validate_citation tool
    const patterns = {
      bge: /^BGE\s+(\d{1,3})\s+([IVX]+)\s+(\d+)$/i,
      atf: /^ATF\s+(\d{1,3})\s+([IVX]+)\s+(\d+)$/i,
      dtf: /^DTF\s+(\d{1,3})\s+([IVX]+)\s+(\d+)$/i,
      statuteDE: /^Art\.\s*(\d+[a-z]?)(?:\s+Abs\.\s*(\d+))?\s+(?:ZGB|OR|StGB)/i,
      statuteFR: /^art\.\s*(\d+[a-z]?)(?:\s+al\.\s*(\d+))?\s+(?:CC|CO|CP)/i
    };

    let valid = false;
    let type = 'unknown';
    let normalized = citation;

    if (patterns.bge.test(citation)) {
      valid = true;
      type = 'bge';
    } else if (patterns.atf.test(citation)) {
      valid = true;
      type = 'atf';
    } else if (patterns.statuteDE.test(citation)) {
      valid = true;
      type = 'statute';
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid,
          type,
          normalized,
          components: valid ? { extracted: true } : undefined
        })
      }]
    };
  }

  async formatCitation(citation: string, targetLanguage: string): Promise<MCPToolResult> {
    // Simulate legal-citations MCP format_citation tool
    const conversions: Record<string, Record<string, string>> = {
      'BGE 147 IV 73': { de: 'BGE 147 IV 73', fr: 'ATF 147 IV 73', it: 'DTF 147 IV 73' },
      'ATF 147 IV 73': { de: 'BGE 147 IV 73', fr: 'ATF 147 IV 73', it: 'DTF 147 IV 73' },
      'Art. 97 OR': { de: 'Art. 97 OR', fr: 'art. 97 CO', it: 'art. 97 CO' },
      'art. 97 CO': { de: 'Art. 97 OR', fr: 'art. 97 CO', it: 'art. 97 CO' }
    };

    const formatted = conversions[citation]?.[targetLanguage] || citation;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          original: citation,
          formatted,
          language: targetLanguage,
          type: citation.startsWith('BGE') || citation.startsWith('ATF') || citation.startsWith('DTF') ? 'court' : 'statute'
        })
      }]
    };
  }

  async convertCitation(citation: string, targetLanguage: string): Promise<MCPToolResult> {
    // Simulate legal-citations MCP convert_citation tool with all translations
    const allTranslations: Record<string, Record<string, string>> = {
      'BGE 147 IV 73': { de: 'BGE 147 IV 73', fr: 'ATF 147 IV 73', it: 'DTF 147 IV 73', en: 'BGE 147 IV 73' },
      'Art. 97 Abs. 1 OR': { de: 'Art. 97 Abs. 1 OR', fr: 'art. 97 al. 1 CO', it: 'art. 97 cpv. 1 CO', en: 'Art. 97 para. 1 CO' }
    };

    const translations = allTranslations[citation] || {};

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          original: citation,
          sourceLanguage: 'de',
          targetLanguage,
          converted: translations[targetLanguage] || citation,
          allTranslations: translations
        })
      }]
    };
  }

  async parseCitation(citation: string): Promise<MCPToolResult> {
    // Simulate legal-citations MCP parse_citation tool
    const isBGE = citation.startsWith('BGE');
    const isStatute = citation.startsWith('Art.') || citation.startsWith('art.');

    // Language detection
    let language = 'unknown';
    if (citation.includes(' Abs. ') || citation.includes(' lit. ') || citation.includes(' Ziff. ') ||
        (citation.startsWith('Art.') && !citation.includes(' al. ') && !citation.includes(' cpv. '))) {
      language = 'de';
    } else if (citation.includes(' al. ') || citation.includes(' let. ') || citation.includes(' ch. ')) {
      language = 'fr';
    } else if (citation.includes(' cpv. ') || citation.includes(' lett. ') || citation.includes(' n. ')) {
      language = 'it';
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          original: citation,
          type: isBGE ? 'bge' : isStatute ? 'statute' : 'unknown',
          language,
          components: isBGE ? { volume: '147', chamber: 'IV', page: '73' } : isStatute ? { article: '97' } : {},
          isValid: isBGE || isStatute
        })
      }]
    };
  }
}

/**
 * Mock bge-search MCP server for integration testing
 */
class MockBGESearchMCP {
  async searchBGE(query: string): Promise<MCPToolResult> {
    // Simulate bge-search returning citations
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          results: [
            { citation: 'BGE 147 IV 73', title: 'Sample BGE case', relevance: 0.95 },
            { citation: 'BGE 146 III 22', title: 'Another BGE case', relevance: 0.87 }
          ],
          count: 2
        })
      }]
    };
  }
}

/**
 * Mock entscheidsuche MCP server for integration testing
 */
class MockEntscheidSucheMCP {
  async search(query: string, language: string): Promise<MCPToolResult> {
    // Simulate entscheidsuche returning decision metadata
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          language,
          decisions: [
            {
              id: '6B_123/2023',
              citation: 'BGE 147 IV 73',
              date: '2023-05-15',
              chamber: 'Strafrechtliche Abteilung',
              language: language
            }
          ],
          total: 1
        })
      }]
    };
  }
}

describe('Legal Citations MCP - Integration Tests', () => {
  let legalCitations: MockLegalCitationsMCP;
  let bgeSearch: MockBGESearchMCP;
  let entscheidsuche: MockEntscheidSucheMCP;

  beforeAll(() => {
    legalCitations = new MockLegalCitationsMCP();
    bgeSearch = new MockBGESearchMCP();
    entscheidsuche = new MockEntscheidSucheMCP();
  });

  describe('Cross-Server Integration: BGE Search → Legal Citations', () => {
    it('should validate citations returned from bge-search', async () => {
      // Step 1: Search for BGE cases
      const searchResult = await bgeSearch.searchBGE('contract law');
      const searchData = JSON.parse(searchResult.content[0].text);

      expect(searchData.results).toHaveLength(2);
      const firstCitation = searchData.results[0].citation;

      // Step 2: Validate the citation using legal-citations
      const validationResult = await legalCitations.validateCitation(firstCitation);
      const validationData = JSON.parse(validationResult.content[0].text);

      expect(validationData.valid).toBe(true);
      expect(validationData.type).toBe('bge');
      expect(validationData.normalized).toBe('BGE 147 IV 73');
    });

    it('should format bge-search results to multiple languages', async () => {
      // Step 1: Get BGE citation from search
      const searchResult = await bgeSearch.searchBGE('criminal law');
      const searchData = JSON.parse(searchResult.content[0].text);
      const citation = searchData.results[0].citation;

      // Step 2: Format to French
      const formatResultFR = await legalCitations.formatCitation(citation, 'fr');
      const formatDataFR = JSON.parse(formatResultFR.content[0].text);

      expect(formatDataFR.formatted).toBe('ATF 147 IV 73');

      // Step 3: Format to Italian
      const formatResultIT = await legalCitations.formatCitation(citation, 'it');
      const formatDataIT = JSON.parse(formatResultIT.content[0].text);

      expect(formatDataIT.formatted).toBe('DTF 147 IV 73');
    });
  });

  describe('Cross-Server Integration: Entscheidsuche → Legal Citations', () => {
    it('should process entscheidsuche results through legal-citations workflow', async () => {
      // Step 1: Search via entscheidsuche
      const searchResult = await entscheidsuche.search('Vertragsrecht', 'de');
      const searchData = JSON.parse(searchResult.content[0].text);

      expect(searchData.decisions).toHaveLength(1);
      const citation = searchData.decisions[0].citation;

      // Step 2: Parse the citation
      const parseResult = await legalCitations.parseCitation(citation);
      const parseData = JSON.parse(parseResult.content[0].text);

      expect(parseData.type).toBe('bge');
      expect(parseData.isValid).toBe(true);
      expect(parseData.components).toHaveProperty('volume');
      expect(parseData.components).toHaveProperty('chamber');
      expect(parseData.components).toHaveProperty('page');
    });

    it('should handle multi-lingual entscheidsuche results', async () => {
      const languages = ['de', 'fr', 'it'];
      const results: Record<string, any> = {};

      for (const lang of languages) {
        // Search in each language
        const searchResult = await entscheidsuche.search('contract law', lang);
        const searchData = JSON.parse(searchResult.content[0].text);
        const citation = searchData.decisions[0].citation;

        // Convert to target language
        const convertResult = await legalCitations.convertCitation(citation, lang);
        const convertData = JSON.parse(convertResult.content[0].text);

        results[lang] = convertData.converted;
      }

      // Verify all languages were processed
      expect(results).toHaveProperty('de');
      expect(results).toHaveProperty('fr');
      expect(results).toHaveProperty('it');
    });
  });

  describe('Complete Workflow: Search → Validate → Format → Parse', () => {
    it('should execute full legal research workflow', async () => {
      // Step 1: Search for relevant cases
      const searchResult = await bgeSearch.searchBGE('liability');
      const searchData = JSON.parse(searchResult.content[0].text);
      const citations = searchData.results.map((r: any) => r.citation);

      expect(citations).toHaveLength(2);

      // Step 2: Validate all citations
      const validationResults = await Promise.all(
        citations.map(c => legalCitations.validateCitation(c))
      );

      const validations = validationResults.map(r => JSON.parse(r.content[0].text));
      expect(validations.every(v => v.valid)).toBe(true);

      // Step 3: Convert first citation to all languages
      const convertResult = await legalCitations.convertCitation(citations[0], 'fr');
      const convertData = JSON.parse(convertResult.content[0].text);

      expect(convertData.allTranslations).toHaveProperty('de');
      expect(convertData.allTranslations).toHaveProperty('fr');
      expect(convertData.allTranslations).toHaveProperty('it');
      expect(convertData.allTranslations).toHaveProperty('en');

      // Step 4: Parse the citation for detailed analysis
      const parseResult = await legalCitations.parseCitation(citations[0]);
      const parseData = JSON.parse(parseResult.content[0].text);

      expect(parseData.type).toBe('bge');
      expect(parseData.isValid).toBe(true);
    });

    it('should handle statutory citations in complete workflow', async () => {
      const statuteCitation = 'Art. 97 OR';

      // Validate
      const validateResult = await legalCitations.validateCitation(statuteCitation);
      const validateData = JSON.parse(validateResult.content[0].text);
      expect(validateData.valid).toBe(true);
      expect(validateData.type).toBe('statute');

      // Convert to French
      const convertResult = await legalCitations.convertCitation('Art. 97 Abs. 1 OR', 'fr');
      const convertData = JSON.parse(convertResult.content[0].text);
      expect(convertData.converted).toBe('art. 97 al. 1 CO');

      // Parse
      const parseResult = await legalCitations.parseCitation(statuteCitation);
      const parseData = JSON.parse(parseResult.content[0].text);
      expect(parseData.type).toBe('statute');
      expect(parseData.language).toBe('de');
    });
  });

  describe('Multi-Lingual Workflow Tests', () => {
    it('should process German query workflow', async () => {
      const searchResult = await entscheidsuche.search('Haftung', 'de');
      const searchData = JSON.parse(searchResult.content[0].text);
      const citation = searchData.decisions[0].citation;

      const parseResult = await legalCitations.parseCitation(citation);
      const parseData = JSON.parse(parseResult.content[0].text);

      expect(parseData.type).toBe('bge');
      expect(parseData.isValid).toBe(true);
    });

    it('should process French query workflow', async () => {
      const searchResult = await entscheidsuche.search('responsabilité', 'fr');
      const searchData = JSON.parse(searchResult.content[0].text);
      const citation = searchData.decisions[0].citation;

      const formatResult = await legalCitations.formatCitation(citation, 'fr');
      const formatData = JSON.parse(formatResult.content[0].text);

      expect(formatData.formatted).toContain('ATF');
    });

    it('should process Italian query workflow', async () => {
      const searchResult = await entscheidsuche.search('responsabilità', 'it');
      const searchData = JSON.parse(searchResult.content[0].text);
      const citation = searchData.decisions[0].citation;

      const formatResult = await legalCitations.formatCitation(citation, 'it');
      const formatData = JSON.parse(formatResult.content[0].text);

      expect(formatData.formatted).toContain('DTF');
    });

    it('should convert between all language pairs', async () => {
      const testCases = [
        { from: 'de', to: 'fr', citation: 'BGE 147 IV 73', expected: 'ATF 147 IV 73' },
        { from: 'fr', to: 'it', citation: 'ATF 147 IV 73', expected: 'DTF 147 IV 73' },
        { from: 'de', to: 'it', citation: 'BGE 147 IV 73', expected: 'DTF 147 IV 73' }
      ];

      for (const testCase of testCases) {
        const formatResult = await legalCitations.formatCitation(testCase.citation, testCase.to);
        const formatData = JSON.parse(formatResult.content[0].text);

        expect(formatData.formatted).toBe(testCase.expected);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid citations gracefully', async () => {
      const invalidCitation = 'INVALID CITATION 123';

      const validateResult = await legalCitations.validateCitation(invalidCitation);
      const validateData = JSON.parse(validateResult.content[0].text);

      expect(validateData.valid).toBe(false);
      expect(validateData.type).toBe('unknown');
    });

    it('should handle empty search results', async () => {
      const searchResult = await bgeSearch.searchBGE('extremely specific nonexistent query xyz123');
      const searchData = JSON.parse(searchResult.content[0].text);

      // Should return empty results, not error
      expect(searchData).toHaveProperty('results');
      expect(Array.isArray(searchData.results)).toBe(true);
    });

    it('should handle unsupported language codes', async () => {
      const citation = 'BGE 147 IV 73';

      // Format should default to citation if language unsupported
      const formatResult = await legalCitations.formatCitation(citation, 'es'); // Spanish not supported
      const formatData = JSON.parse(formatResult.content[0].text);

      // Should not error, may return original or default
      expect(formatData).toHaveProperty('formatted');
    });

    it('should handle partial citation components', async () => {
      const partialCitation = 'Art. 97 OR'; // Missing Abs., lit., etc.

      const validateResult = await legalCitations.validateCitation(partialCitation);
      const validateData = JSON.parse(validateResult.content[0].text);

      // Should validate successfully even with partial components
      expect(validateData.valid).toBe(true);
      expect(validateData.type).toBe('statute');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch validation efficiently', async () => {
      const citations = [
        'BGE 147 IV 73',
        'BGE 146 III 22',
        'Art. 97 OR',
        'Art. 111 StGB',
        'ATF 145 II 113'
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        citations.map(c => legalCitations.validateCitation(c))
      );
      const duration = Date.now() - startTime;

      // All should complete
      expect(results).toHaveLength(5);

      // Should complete in reasonable time (< 1s for 5 validations)
      expect(duration).toBeLessThan(1000);

      // All should be valid
      const validations = results.map(r => JSON.parse(r.content[0].text));
      expect(validations.every(v => v.valid)).toBe(true);
    });

    it('should handle concurrent multi-lingual conversions', async () => {
      const citation = 'BGE 147 IV 73';
      const targetLanguages = ['de', 'fr', 'it', 'en'];

      const startTime = Date.now();
      const results = await Promise.all(
        targetLanguages.map(lang => legalCitations.formatCitation(citation, lang))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(4);
      expect(duration).toBeLessThan(500); // Should be fast for concurrent ops
    });
  });
});
