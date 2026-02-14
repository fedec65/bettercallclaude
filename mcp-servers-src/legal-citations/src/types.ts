/**
 * Legal citation types and interfaces for Swiss law
 */

export type Language = 'de' | 'fr' | 'it' | 'en';

export type CitationType =
  | 'bge'      // Bundesgericht (DE)
  | 'atf'      // Arrêts du Tribunal fédéral (FR)
  | 'dtf'      // Decisioni del Tribunale federale (IT)
  | 'statute'  // Federal statutes (ZGB, OR, StGB, etc.)
  | 'article'  // Article reference
  | 'cantonal' // Cantonal court decisions
  | 'unknown';

export interface ValidationResult {
  valid: boolean;
  type: CitationType;
  normalized?: string;
  components?: CitationComponents;
  errors?: string[];
  warnings?: string[];
}

export interface CitationComponents {
  // BGE/ATF/DTF components
  volume?: string;
  chamber?: string;
  page?: string;
  year?: string;

  // Statute components
  statute?: string;      // ZGB, OR, StGB, etc.
  article?: string;      // Article number
  paragraph?: string;    // Absatz/alinéa/capoverso
  letter?: string;       // Buchstabe/lettre/lettera
  number?: string;       // Ziffer/chiffre/numero

  // Cantonal components
  canton?: string;
  courtLevel?: string;
  caseNumber?: string;
}

export interface FormatOptions {
  language: Language;
  includeAbbreviations?: boolean;
  fullStatuteName?: boolean;
  includeYear?: boolean;
}

export interface ParsedCitation {
  original: string;
  type: CitationType;
  components: CitationComponents;
  language: Language;
  isValid: boolean;
  suggestions?: string[];
}

export interface FormattedCitation {
  citation: string;
  language: Language;
  type: CitationType;
  fullReference?: string;
  abbreviatedReference?: string;
}
