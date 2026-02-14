/**
 * TypeScript Types for Swiss Federal Legislation (Fedlex)
 * Based on LINDAS/Fedlex SPARQL endpoint data model
 *
 * Data source: https://ld.admin.ch/query
 * License: CC BY-NC-SA 4.0 (non-commercial)
 */

/**
 * Supported languages for Swiss legislation
 */
export type Language = 'de' | 'fr' | 'it' | 'rm' | 'en';

/**
 * Official language codes used in Fedlex URIs
 */
export const LANGUAGE_CODES: Record<Language, string> = {
  de: 'de',
  fr: 'fr',
  it: 'it',
  rm: 'rm',
  en: 'en',
};

/**
 * SR/RS Number - Swiss legislation classification number
 * Format: XXX.XXX.XXX (e.g., 210 for ZGB, 220 for OR)
 */
export type SRNumber = string;

/**
 * Types of legal acts in the Swiss federal collection
 */
export type LegalActType = string; // Flexible to handle various act types from SPARQL

/**
 * Publication status of a legal act
 */
export type PublicationStatus =
  | 'in_force'        // In Kraft
  | 'not_yet_in_force' // Noch nicht in Kraft
  | 'repealed'        // Aufgehoben
  | 'partial'         // Teilweise in Kraft
  | 'abrogated'       // Aufgehoben
  | 'pending'         // Noch nicht in Kraft
  | 'unknown';        // Status unknown

/**
 * Multilingual text representation
 */
export interface MultilingualText {
  de?: string;
  fr?: string;
  it?: string;
  rm?: string;
  en?: string;
  [key: string]: string | undefined;
}

/**
 * Article reference within a legal act
 */
export interface ArticleReference {
  articleNumber: string;      // e.g., "97", "1a", "102bis"
  paragraph?: string;         // Absatz/alinéa
  letter?: string;           // Buchstabe/lettre
  number?: string;           // Ziffer/chiffre
}

/**
 * A single article within a legal act
 */
export interface Article {
  uri: string;                // Fedlex URI
  number: string;             // Article number (e.g., "97", "1", "1a")
  articleNumber?: string;     // Alias for number
  title?: MultilingualText;   // Article title/marginal note
  text: MultilingualText;     // Article content
  paragraphs?: Paragraph[];   // Sub-divisions
  inForceFrom?: string;       // ISO date when article came into force
  inForceUntil?: string;      // ISO date when article was repealed
  lastModified?: string;      // Last modification date
}

/**
 * Paragraph within an article
 */
export interface Paragraph {
  number: string;             // Paragraph number (1, 2, 3...)
  text?: MultilingualText;    // Paragraph content (optional)
  letters?: Letter[];         // Sub-divisions (a, b, c...)
}

/**
 * Letter subdivision within a paragraph
 */
export interface Letter {
  letter?: string;            // a, b, c, etc.
  literal?: string;           // Alternative name for letter
  text?: MultilingualText;
  numbers?: NumberItem[];     // Sub-divisions (1, 2, 3...)
}

/**
 * Number subdivision within a letter
 */
export interface NumberItem {
  number: string;
  text: MultilingualText;
}

/**
 * Legal act (statute, ordinance, treaty, etc.)
 */
export interface LegalAct {
  uri: string;                        // Fedlex URI (e.g., https://fedlex.data.admin.ch/eli/cc/24/233_245_233)
  srNumber: SRNumber;                 // SR/RS classification number
  title: MultilingualText;            // Official title
  abbreviation?: MultilingualText;    // Short name (e.g., OR, ZGB, StGB)
  actType?: LegalActType;             // Type of legal act
  status?: PublicationStatus;         // Current status
  dateDocument?: string;              // Document date (ISO)
  dateInForce?: string;               // Entry into force date (ISO)
  inForceFrom?: string;               // Alias for dateInForce
  inForceUntil?: string;              // End date if repealed (ISO)
  lastModified?: string;              // Last consolidated version date
  publicationDate?: string;           // Original publication date
  articles?: Article[];               // Articles (if requested)
  relatedActs?: RelatedAct[];         // Related legislation
  metadata?: LegalActMetadata;        // Extended metadata
}

/**
 * Types of relationships between legal acts
 */
export type RelationType =
  | 'amends'           // Ändert
  | 'amended_by'       // Geändert durch
  | 'cites'            // Zitiert
  | 'cited_by'         // Zitiert durch
  | 'repeals'          // Hebt auf
  | 'repealed_by'      // Aufgehoben durch
  | 'implements'       // Vollzug von
  | 'implemented_by'   // Vollzogen durch
  | 'references'       // Verweist auf
  | 'referenced_by'    // Verwiesen durch
  | 'based_on'         // Gestützt auf
  | 'basis_for'        // Grundlage für
  | 'same_domain'      // Gleiches Rechtsgebiet
  | 'same_subject';    // Gleiches Thema

// Alias for backward compatibility
export type RelationshipType = RelationType;

/**
 * Related legal act reference
 */
export interface RelatedAct {
  uri: string;
  srNumber: SRNumber;
  title: MultilingualText;
  relationType?: RelationType;
  relationshipType?: RelationType; // Alias
  relationDate?: string;
}

/**
 * Extended metadata for a legal act
 */
export interface LegalActMetadata {
  uri?: string;
  srNumber?: SRNumber;
  title?: MultilingualText;
  abbreviation?: MultilingualText;
  actType?: string;
  dateDocument?: string;
  dateInForce?: string;
  dateAbrogation?: string;
  status?: PublicationStatus;
  officialCollection?: string;        // AS/RO number
  federalGazette?: string;            // BBl/FF reference
  dateOfDecision?: string;            // Decision date
  dateOfPublication?: string;         // Publication date
  responsibleDepartment?: MultilingualText;
  keywords?: MultilingualText[];
  subjects?: string[];
  availableLanguages?: Language[];
  versionHistory?: Array<{
    date: string;
    type?: string;
    description?: string;
  }>;
  abrogatedBy?: string;
  structure?: Array<{
    partNumber: string;
    partTitle?: string;
    partType?: string;
  }>;
  legalDomain?: { de: string; fr: string; it: string };
}

/**
 * Subject classification
 */
export interface Subject {
  code: string;
  label: MultilingualText;
}

/**
 * Search result from legislation search
 */
export interface LegislationSearchResult {
  totalCount: number;
  results: LegalAct[];
  query: string;
  filters?: SearchFilters;
  executionTimeMs?: number;
}

/**
 * Search filters for legislation queries
 */
export interface SearchFilters {
  language?: Language;
  actType?: LegalActType[];
  status?: PublicationStatus[];
  srNumberPrefix?: string;           // e.g., "2" for all civil law
  dateFrom?: string;                 // ISO date
  dateTo?: string;                   // ISO date
  textSearch?: string;               // Full-text search
  limit?: number;
  offset?: number;
}

/**
 * SPARQL query result binding
 */
export interface SPARQLBinding {
  type: 'uri' | 'literal' | 'bnode';
  value: string;
  'xml:lang'?: string;
  datatype?: string;
}

/**
 * SPARQL query result
 */
export interface SPARQLResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: Array<Record<string, SPARQLBinding>>;
  };
}

/**
 * Fedlex-specific SPARQL error
 */
export interface FedlexError {
  code: string;
  message: string;
  query?: string;
  endpoint?: string;
}

/**
 * Tool input types for MCP tools
 */
export interface LookupStatuteInput {
  identifier: string;         // SR number or abbreviation
  srNumber?: SRNumber;        // Alias
  language?: Language;
  includeArticles?: boolean;
}

export interface GetArticleInput {
  srNumber: SRNumber;
  articleNumber: string;
  paragraph?: string;
  letter?: string;
  language?: Language;
}

export interface SearchLegislationInput {
  query?: string;
  domain?: string;
  srNumberPrefix?: string;
  dateFrom?: string;
  dateTo?: string;
  language?: Language;
  actType?: LegalActType[];
  status?: PublicationStatus[];
  limit?: number;
  offset?: number;
}

export interface FindRelatedInput {
  srNumber: SRNumber;
  relationType?: RelationType;
  relationshipType?: RelationType; // Alias
  includeHistory?: boolean;
  language?: Language;
  limit?: number;
}

export interface GetMetadataInput {
  srNumber: SRNumber;
  includeStructure?: boolean;
  language?: Language;
}

/**
 * Tool output types
 */
export interface LookupStatuteResult {
  found: boolean;
  acts?: LegalAct[];
  legalAct?: LegalAct;
  searchType?: 'srNumber' | 'abbreviation';
  searchTimeMs?: number;
  success?: boolean;
  error?: string;
}

export interface GetArticleResult {
  found: boolean;
  act?: {
    uri: string;
    srNumber: SRNumber;
    title: MultilingualText;
  };
  articles?: Article[];
  article?: Article;
  legalActTitle?: MultilingualText;
  srNumber?: SRNumber;
  searchTimeMs?: number;
  success?: boolean;
  error?: string;
}

export interface SearchLegislationResult {
  acts?: LegalAct[];
  totalCount?: number;
  hasMore?: boolean;
  facets?: {
    byDomain?: Record<string, number>;
  };
  searchTimeMs?: number;
  success?: boolean;
  results?: LegislationSearchResult;
  error?: string;
}

export interface FindRelatedResult {
  srNumber?: SRNumber;
  relatedActs?: RelatedAct[];
  byRelationType?: Record<string, number>;
  legislativeHistory?: Array<{
    date: string;
    description?: string;
  }>;
  searchTimeMs?: number;
  success?: boolean;
  sourceAct?: {
    srNumber: SRNumber;
    title: MultilingualText;
  };
  error?: string;
}

export interface GetMetadataResult {
  found: boolean;
  metadata?: LegalActMetadata;
  legalAct?: Partial<LegalAct>;
  searchTimeMs?: number;
  success?: boolean;
  error?: string;
}

/**
 * Common SR numbers for frequently accessed Swiss laws
 */
export const COMMON_SR_NUMBERS: Record<string, { de: string; fr: string; it: string }> = {
  '101': { de: 'Bundesverfassung', fr: 'Constitution fédérale', it: 'Costituzione federale' },
  '210': { de: 'Zivilgesetzbuch (ZGB)', fr: 'Code civil (CC)', it: 'Codice civile (CC)' },
  '220': { de: 'Obligationenrecht (OR)', fr: 'Code des obligations (CO)', it: 'Codice delle obbligazioni (CO)' },
  '311.0': { de: 'Strafgesetzbuch (StGB)', fr: 'Code pénal (CP)', it: 'Codice penale (CP)' },
  '272': { de: 'Zivilprozessordnung (ZPO)', fr: 'Code de procédure civile (CPC)', it: 'Codice di procedura civile (CPC)' },
  '312.0': { de: 'Strafprozessordnung (StPO)', fr: 'Code de procédure pénale (CPP)', it: 'Codice di procedura penale (CPP)' },
  '281.1': { de: 'SchKG', fr: 'LP', it: 'LEF' },
  '221.229.1': { de: 'Versicherungsvertragsgesetz (VVG)', fr: 'LCA', it: 'LCA' },
  '151.1': { de: 'Gleichstellungsgesetz (GlG)', fr: 'LEg', it: 'LPar' },
  '235.1': { de: 'Datenschutzgesetz (DSG)', fr: 'LPD', it: 'LPD' },
};
