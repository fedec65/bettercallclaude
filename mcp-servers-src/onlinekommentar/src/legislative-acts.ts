/**
 * Swiss Legislative Acts - Static Mapping Schema
 *
 * Provides comprehensive mapping of Swiss law abbreviations across languages
 * (DE/FR/IT) to enable cross-language article reference resolution.
 *
 * Example: "Art. 97 OR" (DE) = "art. 97 CO" (FR) = "art. 97 CO" (IT)
 * All resolve to the same legislative act (Obligationenrecht/Code des obligations)
 */

import type { Language, LegislativeActMapping } from './types.js';

/**
 * Swiss Legislative Act Definition
 * Contains all language variants and metadata
 */
export interface SwissLegislativeAct {
  /** Internal identifier (will be replaced by API UUID at runtime) */
  id: string;
  /** German name */
  name_de: string;
  /** French name */
  name_fr: string;
  /** Italian name */
  name_it: string;
  /** German abbreviation */
  abbr_de: string;
  /** French abbreviation */
  abbr_fr: string;
  /** Italian abbreviation */
  abbr_it: string;
  /** SR (Systematische Rechtssammlung) number */
  sr_number: string;
  /** Primary legal domain */
  domain: LegalDomain;
}

/**
 * Legal domains for categorization
 */
export type LegalDomain =
  | 'civil'
  | 'obligations'
  | 'criminal'
  | 'procedure'
  | 'constitutional'
  | 'administrative'
  | 'commercial'
  | 'data_protection'
  | 'intellectual_property';

/**
 * Core Swiss Federal Codes
 * These are the most commonly referenced legislative acts
 */
export const SWISS_LEGISLATIVE_ACTS: readonly SwissLegislativeAct[] = [
  // === CIVIL LAW ===
  {
    id: 'zgb',
    name_de: 'Zivilgesetzbuch',
    name_fr: 'Code civil',
    name_it: 'Codice civile',
    abbr_de: 'ZGB',
    abbr_fr: 'CC',
    abbr_it: 'CC',
    sr_number: 'SR 210',
    domain: 'civil',
  },
  {
    id: 'or',
    name_de: 'Obligationenrecht',
    name_fr: 'Code des obligations',
    name_it: 'Codice delle obbligazioni',
    abbr_de: 'OR',
    abbr_fr: 'CO',
    abbr_it: 'CO',
    sr_number: 'SR 220',
    domain: 'obligations',
  },

  // === CRIMINAL LAW ===
  {
    id: 'stgb',
    name_de: 'Strafgesetzbuch',
    name_fr: 'Code pénal',
    name_it: 'Codice penale',
    abbr_de: 'StGB',
    abbr_fr: 'CP',
    abbr_it: 'CP',
    sr_number: 'SR 311.0',
    domain: 'criminal',
  },

  // === PROCEDURAL LAW ===
  {
    id: 'zpo',
    name_de: 'Zivilprozessordnung',
    name_fr: 'Code de procédure civile',
    name_it: 'Codice di procedura civile',
    abbr_de: 'ZPO',
    abbr_fr: 'CPC',
    abbr_it: 'CPC',
    sr_number: 'SR 272',
    domain: 'procedure',
  },
  {
    id: 'stpo',
    name_de: 'Strafprozessordnung',
    name_fr: 'Code de procédure pénale',
    name_it: 'Codice di procedura penale',
    abbr_de: 'StPO',
    abbr_fr: 'CPP',
    abbr_it: 'CPP',
    sr_number: 'SR 312.0',
    domain: 'procedure',
  },
  {
    id: 'schkg',
    name_de: 'Schuldbetreibungs- und Konkursgesetz',
    name_fr: 'Loi sur la poursuite pour dettes et la faillite',
    name_it: 'Legge federale sulla esecuzione e sul fallimento',
    abbr_de: 'SchKG',
    abbr_fr: 'LP',
    abbr_it: 'LEF',
    sr_number: 'SR 281.1',
    domain: 'procedure',
  },

  // === CONSTITUTIONAL LAW ===
  {
    id: 'bv',
    name_de: 'Bundesverfassung',
    name_fr: 'Constitution fédérale',
    name_it: 'Costituzione federale',
    abbr_de: 'BV',
    abbr_fr: 'Cst.',
    abbr_it: 'Cost.',
    sr_number: 'SR 101',
    domain: 'constitutional',
  },

  // === ADMINISTRATIVE LAW ===
  {
    id: 'vwvg',
    name_de: 'Verwaltungsverfahrensgesetz',
    name_fr: "Loi fédérale sur la procédure administrative",
    name_it: 'Legge federale sulla procedura amministrativa',
    abbr_de: 'VwVG',
    abbr_fr: 'PA',
    abbr_it: 'PA',
    sr_number: 'SR 172.021',
    domain: 'administrative',
  },
  {
    id: 'bgg',
    name_de: 'Bundesgerichtsgesetz',
    name_fr: 'Loi sur le Tribunal fédéral',
    name_it: 'Legge sul Tribunale federale',
    abbr_de: 'BGG',
    abbr_fr: 'LTF',
    abbr_it: 'LTF',
    sr_number: 'SR 173.110',
    domain: 'administrative',
  },

  // === COMMERCIAL LAW ===
  {
    id: 'uwg',
    name_de: 'Bundesgesetz gegen den unlauteren Wettbewerb',
    name_fr: 'Loi fédérale contre la concurrence déloyale',
    name_it: 'Legge federale contro la concorrenza sleale',
    abbr_de: 'UWG',
    abbr_fr: 'LCD',
    abbr_it: 'LCSl',
    sr_number: 'SR 241',
    domain: 'commercial',
  },
  {
    id: 'kartg',
    name_de: 'Kartellgesetz',
    name_fr: 'Loi sur les cartels',
    name_it: 'Legge sui cartelli',
    abbr_de: 'KG',
    abbr_fr: 'LCart',
    abbr_it: 'LCart',
    sr_number: 'SR 251',
    domain: 'commercial',
  },

  // === DATA PROTECTION ===
  {
    id: 'dsg',
    name_de: 'Datenschutzgesetz',
    name_fr: 'Loi sur la protection des données',
    name_it: 'Legge sulla protezione dei dati',
    abbr_de: 'DSG',
    abbr_fr: 'LPD',
    abbr_it: 'LPD',
    sr_number: 'SR 235.1',
    domain: 'data_protection',
  },

  // === INTELLECTUAL PROPERTY ===
  {
    id: 'urhg',
    name_de: 'Urheberrechtsgesetz',
    name_fr: "Loi sur le droit d'auteur",
    name_it: "Legge sul diritto d'autore",
    abbr_de: 'URG',
    abbr_fr: 'LDA',
    abbr_it: 'LDA',
    sr_number: 'SR 231.1',
    domain: 'intellectual_property',
  },
  {
    id: 'mschg',
    name_de: 'Markenschutzgesetz',
    name_fr: 'Loi sur la protection des marques',
    name_it: 'Legge sulla protezione dei marchi',
    abbr_de: 'MSchG',
    abbr_fr: 'LPM',
    abbr_it: 'LPM',
    sr_number: 'SR 232.11',
    domain: 'intellectual_property',
  },

  // === ADDITIONAL COMMON ACTS ===
  {
    id: 'arg',
    name_de: 'Arbeitsgesetz',
    name_fr: 'Loi sur le travail',
    name_it: 'Legge sul lavoro',
    abbr_de: 'ArG',
    abbr_fr: 'LTr',
    abbr_it: 'LL',
    sr_number: 'SR 822.11',
    domain: 'administrative',
  },
  {
    id: 'svg',
    name_de: 'Strassenverkehrsgesetz',
    name_fr: 'Loi sur la circulation routière',
    name_it: 'Legge sulla circolazione stradale',
    abbr_de: 'SVG',
    abbr_fr: 'LCR',
    abbr_it: 'LCStr',
    sr_number: 'SR 741.01',
    domain: 'administrative',
  },
  {
    id: 'vvg',
    name_de: 'Versicherungsvertragsgesetz',
    name_fr: "Loi sur le contrat d'assurance",
    name_it: 'Legge sul contratto d\'assicurazione',
    abbr_de: 'VVG',
    abbr_fr: 'LCA',
    abbr_it: 'LCA',
    sr_number: 'SR 221.229.1',
    domain: 'commercial',
  },
  {
    id: 'iprg',
    name_de: 'Bundesgesetz über das Internationale Privatrecht',
    name_fr: 'Loi fédérale sur le droit international privé',
    name_it: 'Legge federale sul diritto internazionale privato',
    abbr_de: 'IPRG',
    abbr_fr: 'LDIP',
    abbr_it: 'LDIP',
    sr_number: 'SR 291',
    domain: 'civil',
  },
] as const;

/**
 * Build a comprehensive abbreviation-to-ID mapping
 * Includes all language variants (lowercase for case-insensitive lookup)
 */
export function buildDefaultMapping(): LegislativeActMapping {
  const mapping: LegislativeActMapping = {};

  for (const act of SWISS_LEGISLATIVE_ACTS) {
    // Add all abbreviation variants (lowercase for consistent lookup)
    mapping[act.abbr_de.toLowerCase()] = act.id;
    mapping[act.abbr_fr.toLowerCase()] = act.id;
    mapping[act.abbr_it.toLowerCase()] = act.id;
  }

  return mapping;
}

/**
 * Default mapping for immediate use (pre-built)
 */
export const DEFAULT_LEGISLATIVE_ACT_MAPPING: LegislativeActMapping =
  buildDefaultMapping();

/**
 * Get legislative act by any abbreviation (language-agnostic)
 */
export function getActByAbbreviation(
  abbreviation: string
): SwissLegislativeAct | undefined {
  const abbr = abbreviation.toLowerCase();
  return SWISS_LEGISLATIVE_ACTS.find(
    (act) =>
      act.abbr_de.toLowerCase() === abbr ||
      act.abbr_fr.toLowerCase() === abbr ||
      act.abbr_it.toLowerCase() === abbr
  );
}

/**
 * Get legislative act by internal ID
 */
export function getActById(id: string): SwissLegislativeAct | undefined {
  return SWISS_LEGISLATIVE_ACTS.find((act) => act.id === id);
}

/**
 * Get the appropriate abbreviation for a given language
 */
export function getAbbreviationForLanguage(
  act: SwissLegislativeAct,
  language: Language
): string {
  switch (language) {
    case 'de':
      return act.abbr_de;
    case 'fr':
      return act.abbr_fr;
    case 'it':
      return act.abbr_it;
    case 'en':
      return act.abbr_de; // Default to German for English
  }
}

/**
 * Get the name for a given language
 */
export function getNameForLanguage(
  act: SwissLegislativeAct,
  language: Language
): string {
  switch (language) {
    case 'de':
      return act.name_de;
    case 'fr':
      return act.name_fr;
    case 'it':
      return act.name_it;
    case 'en':
      return act.name_de; // Default to German for English
  }
}

/**
 * Get all acts in a specific legal domain
 */
export function getActsByDomain(domain: LegalDomain): SwissLegislativeAct[] {
  return SWISS_LEGISLATIVE_ACTS.filter((act) => act.domain === domain);
}

/**
 * Check if an abbreviation is a known Swiss legislative act
 */
export function isKnownAbbreviation(abbreviation: string): boolean {
  return getActByAbbreviation(abbreviation) !== undefined;
}

/**
 * Get all abbreviations for a given act (all languages)
 */
export function getAllAbbreviations(act: SwissLegislativeAct): string[] {
  const abbrs = new Set([act.abbr_de, act.abbr_fr, act.abbr_it]);
  return Array.from(abbrs);
}
