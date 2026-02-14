/**
 * SPARQL Queries for Legislation Search
 * Full-text and filtered search across the legislation corpus using JOLUX ontology
 *
 * Fedlex Data Model (FRBR-based):
 * - jolux:Act = Primary legislation work
 * - Titles: taxonomy skos:prefLabel (with language tags) OR Expression jolux:title (no tags)
 * - SR numbers via taxonomy: jolux:classifiedByTaxonomyEntry → skos:notation
 */

import { withPrefixes } from './prefixes.js';
import { escapeForSPARQL } from '../sparql-client.js';
import { Language, SearchFilters } from '../types/legislation.js';

/**
 * Build a full-text search query
 */
export function buildSearchQuery(
  searchText: string,
  filters: SearchFilters = {}
): string {
  const {
    language,
    actType,
    // status filter not yet implemented - Fedlex uses jolux:inForce vocabulary
    srNumberPrefix,
    limit = 50,
    offset = 0,
  } = filters;

  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  const srPrefixFilter = srNumberPrefix
    ? `FILTER(STRSTARTS(STR(?srNumber), "${escapeForSPARQL(srNumberPrefix)}"))`
    : '';

  const actTypeFilter = actType && actType.length > 0
    ? `FILTER(?actType IN (${actType.map(t => `"${t}"`).join(', ')}))`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?actType ?dateInForce
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  # Get SR number from taxonomy
  ?taxonomy skos:notation ?srNumber .

  # Get title from taxonomy prefLabel (has language tags)
  ?taxonomy skos:prefLabel ?title .

  # Text search in title or SR number
  FILTER(
    CONTAINS(LCASE(STR(?title)), LCASE("${escapeForSPARQL(searchText)}")) ||
    CONTAINS(LCASE(STR(?srNumber)), LCASE("${escapeForSPARQL(searchText)}"))
  )

  ${langFilter}
  ${srPrefixFilter}
  ${actTypeFilter}

  OPTIONAL { ?act jolux:titleShort ?abbreviation }
  OPTIONAL { ?act jolux:typeDocument ?actType }
  OPTIONAL { ?act jolux:dateEntryInForce ?dateInForce }
}
ORDER BY ?srNumber
OFFSET ${offset}
LIMIT ${limit}
  `);
}

/**
 * Build a search query for counting results
 */
export function buildSearchCountQuery(
  searchText: string,
  filters: SearchFilters = {}
): string {
  const { language, srNumberPrefix, actType } = filters;

  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  const srPrefixFilter = srNumberPrefix
    ? `FILTER(STRSTARTS(STR(?srNumber), "${escapeForSPARQL(srNumberPrefix)}"))`
    : '';

  const actTypeFilter = actType && actType.length > 0
    ? `FILTER(?actType IN (${actType.map(t => `"${t}"`).join(', ')}))`
    : '';

  return withPrefixes(`
SELECT (COUNT(DISTINCT ?act) AS ?count)
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(
    CONTAINS(LCASE(STR(?title)), LCASE("${escapeForSPARQL(searchText)}")) ||
    CONTAINS(LCASE(STR(?srNumber)), LCASE("${escapeForSPARQL(searchText)}"))
  )

  ${langFilter}
  ${srPrefixFilter}
  ${actTypeFilter}

  OPTIONAL { ?act jolux:typeDocument ?actType }
}
  `);
}

/**
 * Build a search query by legal domain (SR number prefix)
 */
export function buildSearchByDomainQuery(
  domain: string,
  language?: Language,
  limit: number = 100
): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  // Domain codes map to SR number prefixes:
  // 1 = Constitutional law, 2 = Private law, 3 = Criminal law, etc.
  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(STRSTARTS(STR(?srNumber), "${escapeForSPARQL(domain)}"))
  ${langFilter}

  OPTIONAL { ?act jolux:titleShort ?abbreviation }
}
ORDER BY ?srNumber
LIMIT ${limit}
  `);
}

/**
 * Build a search query by date range
 */
export function buildSearchByDateQuery(
  dateFrom?: string,
  dateTo?: string,
  language?: Language,
  limit: number = 50
): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  let dateFilter = '';
  if (dateFrom && dateTo) {
    dateFilter = `FILTER(?dateInForce >= "${dateFrom}"^^xsd:date && ?dateInForce <= "${dateTo}"^^xsd:date)`;
  } else if (dateFrom) {
    dateFilter = `FILTER(?dateInForce >= "${dateFrom}"^^xsd:date)`;
  } else if (dateTo) {
    dateFilter = `FILTER(?dateInForce <= "${dateTo}"^^xsd:date)`;
  }

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?dateInForce
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy ;
       jolux:dateEntryInForce ?dateInForce .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  ${dateFilter}
  ${langFilter}

  OPTIONAL { ?act jolux:titleShort ?abbreviation }
}
ORDER BY DESC(?dateInForce)
LIMIT ${limit}
  `);
}

/**
 * Build a search query for recently modified legislation
 *
 * Uses dcterms:modified which is the actual modification timestamp in Fedlex.
 * Searches both jolux:Act (official collection) and jolux:ConsolidationAbstract (consolidated laws).
 */
export function buildRecentlyModifiedQuery(
  language?: Language,
  limit: number = 20
): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?dateModified
WHERE {
  # Match both Act (official collection) and ConsolidationAbstract (consolidated)
  ?act a ?actType ;
       jolux:classifiedByTaxonomyEntry ?taxonomy ;
       dcterms:modified ?dateModified .

  FILTER(?actType IN (jolux:Act, jolux:ConsolidationAbstract))

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  ${langFilter}

  OPTIONAL { ?act jolux:titleShort ?abbreviation }
}
ORDER BY DESC(?dateModified)
LIMIT ${limit}
  `);
}

/**
 * Build a keyword search query (using SKOS concepts from taxonomy)
 */
export function buildKeywordSearchQuery(
  keyword: string,
  language?: Language,
  limit: number = 50
): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?keyword
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  # Search in taxonomy broader concepts and keywords
  {
    ?taxonomy skos:broader* ?broaderTax .
    ?broaderTax skos:prefLabel ?keyword .
    FILTER(CONTAINS(LCASE(STR(?keyword)), LCASE("${escapeForSPARQL(keyword)}")))
  } UNION {
    # Search in subject/keyword annotations
    ?act dcterms:subject ?subject .
    ?subject skos:prefLabel ?keyword .
    FILTER(CONTAINS(LCASE(STR(?keyword)), LCASE("${escapeForSPARQL(keyword)}")))
  }

  ${langFilter}

  OPTIONAL { ?act jolux:titleShort ?abbreviation }
}
ORDER BY ?srNumber
LIMIT ${limit}
  `);
}

/**
 * Legal domain mapping (SR number prefixes)
 */
export const LEGAL_DOMAINS: Record<string, { de: string; fr: string; it: string }> = {
  '1': { de: 'Staat - Volk - Behörden', fr: 'État - Peuple - Autorités', it: 'Stato - Popolo - Autorità' },
  '2': { de: 'Privatrecht - Zivilrechtspflege - Vollstreckung', fr: 'Droit privé - Procédure civile - Exécution forcée', it: 'Diritto privato - Procedura civile - Esecuzione' },
  '3': { de: 'Strafrecht - Strafrechtspflege - Strafvollzug', fr: 'Droit pénal - Procédure pénale - Exécution des peines', it: 'Diritto penale - Procedura penale - Esecuzione delle pene' },
  '4': { de: 'Schule - Wissenschaft - Kultur', fr: 'École - Science - Culture', it: 'Scuola - Scienza - Cultura' },
  '5': { de: 'Landesverteidigung', fr: 'Défense nationale', it: 'Difesa nazionale' },
  '6': { de: 'Finanzen', fr: 'Finances', it: 'Finanze' },
  '7': { de: 'Öffentliche Werke - Energie - Verkehr', fr: 'Travaux publics - Énergie - Transports', it: 'Lavori pubblici - Energia - Trasporti' },
  '8': { de: 'Gesundheit - Arbeit - Soziale Sicherheit', fr: 'Santé - Travail - Sécurité sociale', it: 'Sanità - Lavoro - Sicurezza sociale' },
  '9': { de: 'Wirtschaft - Technische Zusammenarbeit', fr: 'Économie - Coopération technique', it: 'Economia - Cooperazione tecnica' },
};
