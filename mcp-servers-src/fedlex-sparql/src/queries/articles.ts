/**
 * SPARQL Queries for Article Retrieval
 * Queries to retrieve specific articles within legal acts using JOLUX ontology
 *
 * Fedlex Data Model (FRBR-based):
 * - jolux:ConsolidationAbstract = Consolidated legislation work
 * - jolux:LegalResourceSubdivision = Article/subdivision structure
 * - jolux:legalResourceSubdivisionIsPartOf = inverse parent relationship (child → parent)
 * - jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail → jolux:legalResourceSubdivisionDetailId = Article number
 * - SR numbers via taxonomy: jolux:classifiedByTaxonomyEntry → skos:notation
 * - Titles: taxonomy skos:prefLabel (with language tags)
 *
 * Note: Only modified articles are stored in Fedlex (not original articles).
 * Article URIs follow pattern: /eli/cc/[id]/art_[number]/[date]
 */

import { withPrefixes } from './prefixes.js';
import { escapeForSPARQL } from '../sparql-client.js';
import { Language } from '../types/legislation.js';

/**
 * Build a query to get a specific article
 *
 * Fedlex stores articles as jolux:LegalResourceSubdivision with inverse parent relationship.
 * Article numbers are accessed via legalResourceSubdivisionHasSubdivisionIdentificationDetail.
 */
export function buildGetArticleQuery(
  srNumber: string,
  articleNumber: string,
  language?: Language
): string {
  const langFilter = language
    ? `FILTER(LANG(?actTitle) = "${language}")`
    : '';

  // Normalize article number (e.g., "97" or "Art. 97" -> "97")
  const normalizedArticle = articleNumber.replace(/^Art\.?\s*/i, '').trim();

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?actTitle ?article ?articleNumber ?articleTitle ?text ?paragraphNum ?paragraphText
WHERE {
  # Find the act via taxonomy (ConsolidationAbstract for consolidated laws)
  ?act a jolux:ConsolidationAbstract ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?actTitle .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
  ${langFilter}

  # Find articles that belong to this act (inverse relationship: article → parent)
  ?article a jolux:LegalResourceSubdivision ;
           jolux:legalResourceSubdivisionIsPartOf ?act ;
           jolux:legalResourceSubdivisionType <https://fedlex.data.admin.ch/vocabulary/subdivision-type/art> .

  # Get article number from subdivision detail
  ?article jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail ?detail .
  ?detail jolux:legalResourceSubdivisionDetailId ?articleNumber .

  # Match article number
  FILTER(
    STR(?articleNumber) = "${escapeForSPARQL(normalizedArticle)}" ||
    REGEX(STR(?articleNumber), "^${escapeForSPARQL(normalizedArticle)}[a-z]?$", "i")
  )

  # Article title (marginal note) from expression
  OPTIONAL {
    ?article jolux:isRealizedBy ?articleExpr .
    ?articleExpr jolux:title ?articleTitle .
    ${language ? `FILTER(LANG(?articleTitle) = "${language}")` : ''}
  }

  # Get text content from manifestation
  OPTIONAL {
    ?article jolux:isRealizedBy ?expr .
    ?expr jolux:isEmbodiedBy ?manif .
    ?manif jolux:text ?text .
  }

  # Paragraphs (sub-subdivisions)
  OPTIONAL {
    ?paragraph a jolux:LegalResourceSubdivision ;
               jolux:legalResourceSubdivisionIsPartOf ?article .
    ?paragraph jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail ?pDetail .
    ?pDetail jolux:legalResourceSubdivisionDetailId ?paragraphNum .

    OPTIONAL {
      ?paragraph jolux:isRealizedBy ?pExpr .
      ?pExpr jolux:isEmbodiedBy ?pManif .
      ?pManif jolux:text ?paragraphText .
    }
  }
}
ORDER BY ?paragraphNum
  `);
}

/**
 * Build a query to get an article with specific paragraph
 */
export function buildGetArticleParagraphQuery(
  srNumber: string,
  articleNumber: string,
  paragraphNumber: string,
  language?: Language
): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  const normalizedArticle = articleNumber.replace(/^Art\.?\s*/i, '').trim();

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?article ?articleNumber ?paragraph ?paragraphNum ?text
WHERE {
  ?act a jolux:ConsolidationAbstract ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
  ${langFilter}

  # Find article via inverse relationship
  ?article a jolux:LegalResourceSubdivision ;
           jolux:legalResourceSubdivisionIsPartOf ?act ;
           jolux:legalResourceSubdivisionType <https://fedlex.data.admin.ch/vocabulary/subdivision-type/art> .

  ?article jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail ?detail .
  ?detail jolux:legalResourceSubdivisionDetailId ?articleNumber .

  FILTER(
    STR(?articleNumber) = "${escapeForSPARQL(normalizedArticle)}" ||
    REGEX(STR(?articleNumber), "^${escapeForSPARQL(normalizedArticle)}[a-z]?$", "i")
  )

  # Find paragraph within article
  ?paragraph a jolux:LegalResourceSubdivision ;
             jolux:legalResourceSubdivisionIsPartOf ?article .

  ?paragraph jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail ?pDetail .
  ?pDetail jolux:legalResourceSubdivisionDetailId ?paragraphNum .

  FILTER(STR(?paragraphNum) = "${escapeForSPARQL(paragraphNumber)}")

  # Get paragraph text
  OPTIONAL {
    ?paragraph jolux:isRealizedBy ?pExpr .
    ?pExpr jolux:isEmbodiedBy ?pManif .
    ?pManif jolux:text ?text .
  }
}
  `);
}

/**
 * Build a query to list all articles in an act
 *
 * Note: Fedlex only stores modified articles, not all articles.
 * This returns articles that have been amended/modified.
 */
export function buildListArticlesQuery(
  srNumber: string,
  language?: Language,
  limit: number = 1000
): string {
  const langFilter = language
    ? `FILTER(LANG(?actTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?article ?articleNumber ?title ?actTitle
WHERE {
  ?act a jolux:ConsolidationAbstract ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?actTitle .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
  ${langFilter}

  # Find all article subdivisions belonging to this act
  ?article a jolux:LegalResourceSubdivision ;
           jolux:legalResourceSubdivisionIsPartOf ?act ;
           jolux:legalResourceSubdivisionType <https://fedlex.data.admin.ch/vocabulary/subdivision-type/art> .

  # Get article number
  ?article jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail ?detail .
  ?detail jolux:legalResourceSubdivisionDetailId ?articleNumber .

  # Get article title if available
  OPTIONAL {
    ?article jolux:isRealizedBy ?articleExpr .
    ?articleExpr jolux:title ?title .
    ${language ? `FILTER(LANG(?title) = "${language}")` : ''}
  }
}
ORDER BY xsd:integer(?articleNumber)
LIMIT ${limit}
  `);
}

/**
 * Build a query to search for articles containing specific text
 *
 * Searches in article titles (marginal notes) from expressions.
 */
export function buildSearchArticlesQuery(
  srNumber: string,
  searchText: string,
  language?: Language
): string {
  const langFilter = language
    ? `FILTER(LANG(?actTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?article ?articleNumber ?title ?actTitle
WHERE {
  ?act a jolux:ConsolidationAbstract ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?actTitle .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
  ${langFilter}

  # Find articles
  ?article a jolux:LegalResourceSubdivision ;
           jolux:legalResourceSubdivisionIsPartOf ?act ;
           jolux:legalResourceSubdivisionType <https://fedlex.data.admin.ch/vocabulary/subdivision-type/art> .

  # Get article number
  ?article jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail ?detail .
  ?detail jolux:legalResourceSubdivisionDetailId ?articleNumber .

  # Get article title for search
  ?article jolux:isRealizedBy ?articleExpr .
  ?articleExpr jolux:title ?title .
  ${language ? `FILTER(LANG(?title) = "${language}")` : ''}

  # Search in article title
  FILTER(CONTAINS(LCASE(STR(?title)), LCASE("${escapeForSPARQL(searchText)}")))
}
ORDER BY xsd:integer(?articleNumber)
LIMIT 50
  `);
}

/**
 * Build a query to get article history (versions over time)
 *
 * Articles in Fedlex have temporal versions via expressions with dates.
 */
export function buildArticleHistoryQuery(
  srNumber: string,
  articleNumber: string
): string {
  const normalizedArticle = articleNumber.replace(/^Art\.?\s*/i, '').trim();

  return withPrefixes(`
SELECT DISTINCT ?article ?articleNumber ?version ?date ?language
WHERE {
  ?act a jolux:ConsolidationAbstract ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Find article
  ?article a jolux:LegalResourceSubdivision ;
           jolux:legalResourceSubdivisionIsPartOf ?act ;
           jolux:legalResourceSubdivisionType <https://fedlex.data.admin.ch/vocabulary/subdivision-type/art> .

  ?article jolux:legalResourceSubdivisionHasSubdivisionIdentificationDetail ?detail .
  ?detail jolux:legalResourceSubdivisionDetailId ?articleNumber .

  FILTER(
    STR(?articleNumber) = "${escapeForSPARQL(normalizedArticle)}" ||
    REGEX(STR(?articleNumber), "^${escapeForSPARQL(normalizedArticle)}[a-z]?$", "i")
  )

  # Get version history via expressions
  ?article jolux:isRealizedBy ?version .

  # Get date and language from expression
  OPTIONAL { ?version jolux:dateDocument ?date }
  OPTIONAL { ?version jolux:language ?language }
}
ORDER BY DESC(?date) ?language
LIMIT 50
  `);
}
