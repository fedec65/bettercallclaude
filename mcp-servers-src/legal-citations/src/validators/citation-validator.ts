/**
 * Citation validation engine for Swiss legal citations
 * Validates BGE/ATF/DTF, federal statutes, and cantonal citations
 */

import type { ValidationResult, CitationType, CitationComponents } from '../types.js';

export class CitationValidator {
  // BGE/ATF/DTF citation patterns
  private static readonly BGE_PATTERN = /^BGE\s+(\d{1,3})\s+([IVX]+)\s+(\d+)$/i;
  private static readonly ATF_PATTERN = /^ATF\s+(\d{1,3})\s+([IVX]+)\s+(\d+)$/i;
  private static readonly DTF_PATTERN = /^DTF\s+(\d{1,3})\s+([IVX]+)\s+(\d+)$/i;

  // Statutory citation patterns (simplified)
  private static readonly STATUTE_PATTERN = /^Art\.\s*(\d+[a-z]?)(?:\s+Abs\.\s*(\d+))?(?:\s+lit\.\s*([a-z]))?(?:\s+Ziff\.\s*(\d+))?\s+(ZGB|OR|StGB|StPO|ZPO|BV|SchKG|DSG|URG|MSchG|PatG)/i;
  private static readonly STATUTE_PATTERN_FR = /^art\.\s*(\d+[a-z]?)(?:\s+al\.\s*(\d+))?(?:\s+let\.\s*([a-z]))?(?:\s+ch\.\s*(\d+))?\s+(CC|CO|CP|CPP|CPC|Cst|LP|LPD|LDA|LPM|LBI)/i;
  private static readonly STATUTE_PATTERN_IT = /^art\.\s*(\d+[a-z]?)(?:\s+cpv\.\s*(\d+))?(?:\s+lett\.\s*([a-z]))?(?:\s+n\.\s*(\d+))?\s+(CC|CO|CP|CPP|CPC|Cost|LEF|LPD|LDA|LPM|LBI)/i;

  // Valid Swiss federal statutes
  private static readonly VALID_STATUTES_DE = new Set([
    'ZGB', 'OR', 'StGB', 'StPO', 'ZPO', 'BV', 'SchKG', 'DSG', 'URG', 'MSchG', 'PatG',
    'KG', 'VVG', 'ATSG', 'AHVG', 'IVG', 'UVG', 'BVG', 'ELG', 'FZG', 'AVIG'
  ]);

  private static readonly VALID_STATUTES_FR = new Set([
    'CC', 'CO', 'CP', 'CPP', 'CPC', 'Cst', 'LP', 'LPD', 'LDA', 'LPM', 'LBI',
    'LCart', 'LCA', 'LPGA', 'LAVS', 'LAI', 'LAA', 'LPP', 'LPC', 'LACI', 'LPGA'
  ]);

  private static readonly VALID_STATUTES_IT = new Set([
    'CC', 'CO', 'CP', 'CPP', 'CPC', 'Cost', 'LEF', 'LPD', 'LDA', 'LPM', 'LBI',
    'LCart', 'LCA', 'LPGA', 'LAVS', 'LAI', 'LAINF', 'LPP', 'LPC', 'LADI'
  ]);

  // Valid BGE chambers (Roman numerals)
  private static readonly VALID_CHAMBERS = new Set([
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'
  ]);

  /**
   * Validate a BGE (Bundesgericht) citation
   */
  validateBGE(citation: string): ValidationResult {
    const normalized = citation.trim();
    const match = CitationValidator.BGE_PATTERN.exec(normalized);

    if (!match) {
      return {
        valid: false,
        type: 'bge',
        errors: ['Invalid BGE citation format. Expected: BGE [volume] [chamber] [page]']
      };
    }

    const [, volume, chamber, page] = match;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate volume (typically 1-150)
    const volumeNum = parseInt(volume, 10);
    if (volumeNum < 1 || volumeNum > 200) {
      warnings.push(`Unusual BGE volume number: ${volume}`);
    }

    // Validate chamber (Roman numerals I-X)
    if (!CitationValidator.VALID_CHAMBERS.has(chamber.toUpperCase())) {
      errors.push(`Invalid BGE chamber: ${chamber}. Must be Roman numeral I-X`);
    }

    // Validate page number
    const pageNum = parseInt(page, 10);
    if (pageNum < 1) {
      errors.push(`Invalid page number: ${page}`);
    }

    const components: CitationComponents = {
      volume,
      chamber: chamber.toUpperCase(),
      page
    };

    return {
      valid: errors.length === 0,
      type: 'bge',
      normalized: `BGE ${volume} ${chamber.toUpperCase()} ${page}`,
      components,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate an ATF (Arrêts du Tribunal fédéral) citation
   */
  validateATF(citation: string): ValidationResult {
    const normalized = citation.trim();
    const match = CitationValidator.ATF_PATTERN.exec(normalized);

    if (!match) {
      return {
        valid: false,
        type: 'atf',
        errors: ['Invalid ATF citation format. Expected: ATF [volume] [chamber] [page]']
      };
    }

    const [, volume, chamber, page] = match;
    const errors: string[] = [];
    const warnings: string[] = [];

    const volumeNum = parseInt(volume, 10);
    if (volumeNum < 1 || volumeNum > 200) {
      warnings.push(`Unusual ATF volume number: ${volume}`);
    }

    if (!CitationValidator.VALID_CHAMBERS.has(chamber.toUpperCase())) {
      errors.push(`Invalid ATF chamber: ${chamber}. Must be Roman numeral I-X`);
    }

    const pageNum = parseInt(page, 10);
    if (pageNum < 1) {
      errors.push(`Invalid page number: ${page}`);
    }

    const components: CitationComponents = {
      volume,
      chamber: chamber.toUpperCase(),
      page
    };

    return {
      valid: errors.length === 0,
      type: 'atf',
      normalized: `ATF ${volume} ${chamber.toUpperCase()} ${page}`,
      components,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate a DTF (Decisioni del Tribunale federale) citation
   */
  validateDTF(citation: string): ValidationResult {
    const normalized = citation.trim();
    const match = CitationValidator.DTF_PATTERN.exec(normalized);

    if (!match) {
      return {
        valid: false,
        type: 'dtf',
        errors: ['Invalid DTF citation format. Expected: DTF [volume] [chamber] [page]']
      };
    }

    const [, volume, chamber, page] = match;
    const errors: string[] = [];
    const warnings: string[] = [];

    const volumeNum = parseInt(volume, 10);
    if (volumeNum < 1 || volumeNum > 200) {
      warnings.push(`Unusual DTF volume number: ${volume}`);
    }

    if (!CitationValidator.VALID_CHAMBERS.has(chamber.toUpperCase())) {
      errors.push(`Invalid DTF chamber: ${chamber}. Must be Roman numeral I-X`);
    }

    const pageNum = parseInt(page, 10);
    if (pageNum < 1) {
      errors.push(`Invalid page number: ${page}`);
    }

    const components: CitationComponents = {
      volume,
      chamber: chamber.toUpperCase(),
      page
    };

    return {
      valid: errors.length === 0,
      type: 'dtf',
      normalized: `DTF ${volume} ${chamber.toUpperCase()} ${page}`,
      components,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validate a statutory citation (German)
   */
  validateStatuteDE(citation: string): ValidationResult {
    const normalized = citation.trim();
    const match = CitationValidator.STATUTE_PATTERN.exec(normalized);

    if (!match) {
      return {
        valid: false,
        type: 'statute',
        errors: ['Invalid statute citation format (DE). Expected: Art. [number] [Abs. X] [lit. a] [statute]']
      };
    }

    const [, article, paragraph, letter, number, statute] = match;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate statute code
    const statuteUpper = statute.toUpperCase();
    if (!CitationValidator.VALID_STATUTES_DE.has(statuteUpper)) {
      errors.push(`Unknown statute code: ${statute}. Valid codes: ${Array.from(CitationValidator.VALID_STATUTES_DE).join(', ')}`);
    }

    const components: CitationComponents = {
      statute: statute.toUpperCase(),
      article,
      paragraph: paragraph || undefined,
      letter: letter || undefined,
      number: number || undefined
    };

    // Build normalized citation
    let norm = `Art. ${article}`;
    if (paragraph) norm += ` Abs. ${paragraph}`;
    if (letter) norm += ` lit. ${letter}`;
    if (number) norm += ` Ziff. ${number}`;
    norm += ` ${statute.toUpperCase()}`;

    return {
      valid: errors.length === 0,
      type: 'statute',
      normalized: norm,
      components,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate a statutory citation (French)
   */
  validateStatuteFR(citation: string): ValidationResult {
    const normalized = citation.trim();
    const match = CitationValidator.STATUTE_PATTERN_FR.exec(normalized);

    if (!match) {
      return {
        valid: false,
        type: 'statute',
        errors: ['Invalid statute citation format (FR). Expected: art. [number] [al. X] [let. a] [statute]']
      };
    }

    const [, article, paragraph, letter, number, statute] = match;
    const errors: string[] = [];

    if (!CitationValidator.VALID_STATUTES_FR.has(statute.toUpperCase())) {
      errors.push(`Unknown statute code: ${statute}`);
    }

    const components: CitationComponents = {
      statute: statute.toUpperCase(),
      article,
      paragraph: paragraph || undefined,
      letter: letter || undefined,
      number: number || undefined
    };

    let norm = `art. ${article}`;
    if (paragraph) norm += ` al. ${paragraph}`;
    if (letter) norm += ` let. ${letter}`;
    if (number) norm += ` ch. ${number}`;
    norm += ` ${statute.toUpperCase()}`;

    return {
      valid: errors.length === 0,
      type: 'statute',
      normalized: norm,
      components,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validate a statutory citation (Italian)
   */
  validateStatuteIT(citation: string): ValidationResult {
    const normalized = citation.trim();
    const match = CitationValidator.STATUTE_PATTERN_IT.exec(normalized);

    if (!match) {
      return {
        valid: false,
        type: 'statute',
        errors: ['Invalid statute citation format (IT). Expected: art. [number] [cpv. X] [lett. a] [statute]']
      };
    }

    const [, article, paragraph, letter, number, statute] = match;
    const errors: string[] = [];

    if (!CitationValidator.VALID_STATUTES_IT.has(statute.toUpperCase())) {
      errors.push(`Unknown statute code: ${statute}`);
    }

    const components: CitationComponents = {
      statute: statute.toUpperCase(),
      article,
      paragraph: paragraph || undefined,
      letter: letter || undefined,
      number: number || undefined
    };

    let norm = `art. ${article}`;
    if (paragraph) norm += ` cpv. ${paragraph}`;
    if (letter) norm += ` lett. ${letter}`;
    if (number) norm += ` n. ${number}`;
    norm += ` ${statute.toUpperCase()}`;

    return {
      valid: errors.length === 0,
      type: 'statute',
      normalized: norm,
      components,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Auto-detect citation type and validate
   */
  validate(citation: string): ValidationResult {
    const normalized = citation.trim().toUpperCase();

    // Try BGE/ATF/DTF first
    if (normalized.startsWith('BGE')) {
      return this.validateBGE(citation);
    }
    if (normalized.startsWith('ATF')) {
      return this.validateATF(citation);
    }
    if (normalized.startsWith('DTF')) {
      return this.validateDTF(citation);
    }

    // Try statutory citations
    if (normalized.startsWith('ART.')) {
      // Try German first, then French, then Italian
      const resultDE = this.validateStatuteDE(citation);
      if (resultDE.valid) return resultDE;

      const resultFR = this.validateStatuteFR(citation);
      if (resultFR.valid) return resultFR;

      const resultIT = this.validateStatuteIT(citation);
      if (resultIT.valid) return resultIT;

      // Return the first attempt's errors
      return resultDE;
    }

    return {
      valid: false,
      type: 'unknown',
      errors: ['Unable to detect citation type. Supported: BGE/ATF/DTF, Art. [statute]']
    };
  }
}
