/**
 * Citation parser for Swiss legal citations
 * Extracts components and detects language from citation strings
 */

import type {
  ParsedCitation,
  Language,
  CitationType,
  CitationComponents
} from '../types.js';
import { CitationValidator } from '../validators/citation-validator.js';

export class CitationParser {
  private validator: CitationValidator;

  constructor() {
    this.validator = new CitationValidator();
  }

  /**
   * Detect language from citation string
   */
  detectLanguage(citation: string): Language {
    const normalized = citation.trim().toLowerCase();

    // Check for French-specific markers
    if (normalized.includes(' al. ') || normalized.includes(' let. ') || normalized.includes(' ch. ')) {
      return 'fr';
    }

    // Check for Italian-specific markers
    if (normalized.includes(' cpv. ') || normalized.includes(' lett. ')) {
      return 'it';
    }

    // Check for German-specific markers
    if (normalized.includes(' abs. ') || normalized.includes(' lit. ') || normalized.includes(' ziff. ')) {
      return 'de';
    }

    // Check for court citation prefixes
    if (normalized.startsWith('atf')) {
      return 'fr';
    }
    if (normalized.startsWith('dtf')) {
      return 'it';
    }
    if (normalized.startsWith('bge')) {
      return 'de';
    }

    // Check for statute codes
    if (normalized.includes(' cc') || normalized.includes(' co') || normalized.includes(' cst')) {
      // Could be FR or IT
      if (normalized.includes(' cpv.')) return 'it';
      return 'fr';
    }

    if (normalized.includes(' zgb') || normalized.includes(' or') || normalized.includes(' bv')) {
      return 'de';
    }

    // Default to German (most common for Swiss federal law)
    return 'de';
  }

  /**
   * Detect citation type
   */
  detectType(citation: string): CitationType {
    const normalized = citation.trim().toUpperCase();

    if (normalized.startsWith('BGE')) return 'bge';
    if (normalized.startsWith('ATF')) return 'atf';
    if (normalized.startsWith('DTF')) return 'dtf';
    if (normalized.startsWith('ART.')) return 'statute';

    return 'unknown';
  }

  /**
   * Parse any Swiss legal citation
   */
  parse(citation: string): ParsedCitation {
    const type = this.detectType(citation);
    const language = this.detectLanguage(citation);

    // Validate and extract components
    const validationResult = this.validator.validate(citation);

    const parsed: ParsedCitation = {
      original: citation,
      type,
      components: validationResult.components || {},
      language,
      isValid: validationResult.valid
    };

    // Add suggestions for invalid citations
    if (!validationResult.valid && validationResult.errors) {
      parsed.suggestions = this.generateSuggestions(citation, type, language);
    }

    return parsed;
  }

  /**
   * Parse multiple citations from text
   */
  parseMultiple(text: string): ParsedCitation[] {
    // Common citation patterns
    const patterns = [
      // BGE/ATF/DTF: "BGE 123 IV 456"
      /(?:BGE|ATF|DTF)\s+\d{1,3}\s+[IVX]+\s+\d+/gi,
      // Statutory: "Art. 123 OR"
      /Art\.\s*\d+[a-z]?(?:\s+(?:Abs|al|cpv)\.\s*\d+)?(?:\s+(?:lit|let|lett)\.\s*[a-z])?(?:\s+(?:Ziff|ch|n)\.\s*\d+)?\s+[A-Z]{2,}/gi
    ];

    const citations: ParsedCitation[] = [];
    const foundCitations = new Set<string>();

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const citation = match[0];
        if (!foundCitations.has(citation)) {
          foundCitations.add(citation);
          citations.push(this.parse(citation));
        }
      }
    }

    return citations;
  }

  /**
   * Generate suggestions for invalid citations
   */
  private generateSuggestions(citation: string, type: CitationType, language: Language): string[] {
    const suggestions: string[] = [];

    if (type === 'bge' || type === 'atf' || type === 'dtf') {
      suggestions.push('Format: BGE [volume] [chamber] [page]');
      suggestions.push('Example: BGE 147 IV 73');
      suggestions.push('Chamber must be Roman numeral (I-X)');
    }

    if (type === 'statute') {
      if (language === 'de') {
        suggestions.push('Format: Art. [number] [Abs. X] [lit. a] [statute]');
        suggestions.push('Example: Art. 97 Abs. 1 OR');
      } else if (language === 'fr') {
        suggestions.push('Format: art. [number] [al. X] [let. a] [statute]');
        suggestions.push('Example: art. 97 al. 1 CO');
      } else if (language === 'it') {
        suggestions.push('Format: art. [number] [cpv. X] [lett. a] [statute]');
        suggestions.push('Example: art. 97 cpv. 1 CO');
      }
    }

    return suggestions;
  }

  /**
   * Extract article number from citation
   */
  extractArticleNumber(citation: string): string | null {
    const match = /Art\.\s*(\d+[a-z]?)/i.exec(citation);
    return match ? match[1] : null;
  }

  /**
   * Extract statute code from citation
   */
  extractStatuteCode(citation: string): string | null {
    const match = /\s([A-Z]{2,})$/i.exec(citation.trim());
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * Check if text contains legal citations
   */
  containsCitations(text: string): boolean {
    return /(?:BGE|ATF|DTF)\s+\d{1,3}\s+[IVX]+\s+\d+|Art\.\s*\d+[a-z]?.*[A-Z]{2,}/i.test(text);
  }

  /**
   * Count citations in text
   */
  countCitations(text: string): number {
    return this.parseMultiple(text).length;
  }
}
