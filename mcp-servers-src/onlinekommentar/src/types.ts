/**
 * OnlineKommentar MCP Server Types
 * Swiss Legal Doctrine (Commentary) Integration
 */

export type Language = 'de' | 'fr' | 'it' | 'en';

export type SortOption = 'title' | '-title' | 'date' | '-date';

export interface SearchCommentariesOptions {
  language?: Language;
  legislative_act?: string; // UUID
  sort?: SortOption;
  page?: number;
}

export interface Commentary {
  id: string;
  title: string;
  authors: string[];
  legislative_act: LegislativeActReference;
  language: Language;
  updated: string;
  abstract?: string;
  url: string;
}

export interface LegislativeActReference {
  id: string;
  name: string;
  abbreviation: string;
}

export interface CommentaryDetail extends Commentary {
  content: string;
  sections: CommentarySection[];
  citations: string[];
  related_commentaries: string[];
}

export interface CommentarySection {
  title: string;
  article_reference?: string;
  content: string;
}

export interface LegislativeAct {
  id: string; // UUID
  name: string;
  abbreviation: string;
  abbreviation_de?: string;
  abbreviation_fr?: string;
  abbreviation_it?: string;
  language: Language;
}

export interface SearchResult {
  count: number;
  page: number;
  total_pages: number;
  commentaries: Commentary[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Mapping for common Swiss law abbreviations to legislative act UUIDs
 * This enables "find commentary for Art. 97 OR" queries
 */
export interface LegislativeActMapping {
  [abbreviation: string]: string; // abbreviation -> UUID
}
