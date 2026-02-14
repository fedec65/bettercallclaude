/**
 * SPARQL Queries for Statute Lookup
 * Queries to retrieve legal acts by SR number using JOLUX ontology
 *
 * Fedlex Data Model (FRBR-based):
 * - jolux:Act = Primary legislation work
 * - jolux:Expression = Language-specific realization (via jolux:isRealizedBy)
 * - jolux:Manifestation = Physical format (via jolux:isEmbodiedBy)
 * - SR numbers via taxonomy: jolux:classifiedByTaxonomyEntry → skos:notation
 */

import { withPrefixes } from './prefixes.js';
import { escapeForSPARQL } from '../sparql-client.js';
import { Language } from '../types/legislation.js';

/**
 * Build a query to look up a legal act by SR number
 * SR numbers are accessed via taxonomy classification
 */
export function buildLookupStatuteQuery(srNumber: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?inForce ?dateInForce ?dateDocument ?actType
WHERE {
  # Find act via taxonomy classification
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  # Get SR number from taxonomy
  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Get title from taxonomy prefLabel (has language tags)
  ?taxonomy skos:prefLabel ?title .
  ${langFilter}

  # Optional metadata
  OPTIONAL { ?act jolux:titleShort ?abbreviation }
  OPTIONAL { ?act jolux:dateDocument ?dateDocument }
  OPTIONAL { ?act jolux:dateEntryInForce ?dateInForce }
  OPTIONAL { ?act jolux:typeDocument ?actType }

  # Check if currently in force
  OPTIONAL {
    ?act jolux:inForce ?inForceStatus .
    BIND(?inForceStatus = <https://fedlex.data.admin.ch/vocabulary/enforcement-status/1> AS ?inForce)
  }
}
ORDER BY ?srNumber
LIMIT 10
  `);
}

/**
 * Build a query to look up a legal act with articles
 * Note: Article structure in JOLUX uses jolux:hasPart
 */
export function buildLookupStatuteWithArticlesQuery(srNumber: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?article ?articleNumber ?articleTitle ?articleText ?dateInForce
WHERE {
  # Find main act via taxonomy
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Get title from taxonomy
  ?taxonomy skos:prefLabel ?title .
  ${langFilter}

  OPTIONAL { ?act jolux:titleShort ?abbreviation }
  OPTIONAL { ?act jolux:dateEntryInForce ?dateInForce }

  # Articles (subdivisions) - JOLUX uses hasPart
  OPTIONAL {
    ?act jolux:hasPart ?article .
    ?article jolux:number ?articleNumber .
    OPTIONAL {
      ?article jolux:isRealizedBy ?articleExpr .
      ?articleExpr jolux:title ?articleTitle .
    }
    OPTIONAL { ?article jolux:text ?articleText }
  }
}
ORDER BY ?articleNumber
LIMIT 500
  `);
}

/**
 * Build a query to find act by abbreviation (e.g., "OR", "ZGB", "StGB")
 * Abbreviations may be in taxonomy or act properties
 */
export function buildLookupByAbbreviationQuery(abbreviation: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?inForce
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  ?taxonomy skos:prefLabel ?title .
  ${langFilter}

  # Search for abbreviation in various places
  {
    ?act jolux:titleShort ?abbreviation .
    FILTER(UCASE(STR(?abbreviation)) = "${escapeForSPARQL(abbreviation.toUpperCase())}")
  } UNION {
    ?taxonomy skos:altLabel ?abbreviation .
    FILTER(UCASE(STR(?abbreviation)) = "${escapeForSPARQL(abbreviation.toUpperCase())}")
  }

  OPTIONAL {
    ?act jolux:inForce ?inForceStatus .
    BIND(?inForceStatus = <https://fedlex.data.admin.ch/vocabulary/enforcement-status/1> AS ?inForce)
  }
}
ORDER BY ?srNumber
LIMIT 10
  `);
}

/**
 * Build a query to check if an SR number exists
 */
export function buildExistsQuery(srNumber: string): string {
  return withPrefixes(`
ASK {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .
  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
}
  `);
}

/**
 * Build a query to get all SR numbers for navigation
 */
export function buildListSRNumbersQuery(prefix?: string, limit: number = 100): string {
  const prefixFilter = prefix
    ? `FILTER(STRSTARTS(STR(?srNumber), "${escapeForSPARQL(prefix)}"))`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?srNumber ?title
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(LANG(?title) = "de")
  ${prefixFilter}
}
ORDER BY ?srNumber
LIMIT ${limit}
  `);
}

/**
 * Build a query to get the current consolidated version of an act
 */
export function buildConsolidatedVersionQuery(srNumber: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?consolidatedVersion ?srNumber ?title ?dateConsolidation
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
  ${langFilter}

  # Get the most recent consolidated version
  OPTIONAL {
    ?act jolux:isRealizedBy ?consolidatedVersion .
    ?consolidatedVersion jolux:dateDocument ?dateConsolidation .
  }
}
ORDER BY DESC(?dateConsolidation)
LIMIT 1
  `);
}
