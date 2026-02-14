/**
 * SPARQL Queries for Legislation Metadata
 * Queries to retrieve detailed metadata about legal acts using JOLUX ontology
 *
 * Fedlex Data Model (FRBR-based):
 * - jolux:Act = Primary legislation work
 * - jolux:Expression = Language-specific realization (via jolux:isRealizedBy)
 * - jolux:Manifestation = Physical format (via jolux:isEmbodiedBy)
 * - SR numbers via taxonomy: jolux:classifiedByTaxonomyEntry → skos:notation
 * - Titles: taxonomy skos:prefLabel (with language tags)
 */

import { withPrefixes } from './prefixes.js';
import { escapeForSPARQL } from '../sparql-client.js';
import { Language } from '../types/legislation.js';

/**
 * Build a query to get comprehensive metadata for a legal act
 */
export function buildGetMetadataQuery(srNumber: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?act ?srNumber ?title ?abbreviation ?actType ?dateDocument ?dateInForce
       ?dateAbrogation ?publicationStatus ?responsibleAuthority ?legalBasis
       ?classificationNumber ?version ?expressionLanguage ?inForce
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
  ${langFilter}

  OPTIONAL { ?act jolux:titleShort ?abbreviation }
  OPTIONAL { ?act jolux:typeDocument ?actType }
  OPTIONAL { ?act jolux:dateDocument ?dateDocument }
  OPTIONAL { ?act jolux:dateEntryInForce ?dateInForce }
  OPTIONAL { ?act jolux:dateNoLongerInForce ?dateAbrogation }

  # In force status
  OPTIONAL {
    ?act jolux:inForce ?inForceStatus .
    BIND(?inForceStatus = <https://fedlex.data.admin.ch/vocabulary/enforcement-status/1> AS ?inForce)
  }

  # Authority and basis
  OPTIONAL { ?act dcterms:creator ?responsibleAuthority }
  OPTIONAL { ?act jolux:legalResourceLegalResourceBasedOn ?legalBasis }

  # Classification number (same as SR)
  BIND(?srNumber AS ?classificationNumber)

  # Version info via Expression
  OPTIONAL {
    ?act jolux:isRealizedBy ?version .
    ?version jolux:language ?expressionLanguage .
  }
}
LIMIT 50
  `);
}

/**
 * Build a query to get all available languages for a legal act
 * Uses taxonomy prefLabel language tags
 */
export function buildGetLanguagesQuery(srNumber: string): string {
  return withPrefixes(`
SELECT DISTINCT ?language ?title
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  BIND(LANG(?title) AS ?language)
  FILTER(BOUND(?language) && ?language != "")
}
ORDER BY ?language
  `);
}

/**
 * Build a query to get publication information
 * In JOLUX, publications are tracked via Expressions and Manifestations
 */
export function buildGetPublicationInfoQuery(srNumber: string): string {
  return withPrefixes(`
SELECT DISTINCT ?publication ?publicationType ?publicationDate ?publicationReference ?collection
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Publication info via Expression
  OPTIONAL {
    ?act jolux:isRealizedBy ?publication .
    OPTIONAL { ?publication jolux:typeDocument ?publicationType }
    OPTIONAL { ?publication jolux:dateDocument ?publicationDate }
    OPTIONAL { ?publication jolux:publicationReference ?publicationReference }
  }

  # Collection membership via taxonomy hierarchy
  OPTIONAL {
    ?taxonomy skos:broader ?collection .
  }
}
ORDER BY DESC(?publicationDate)
LIMIT 20
  `);
}

/**
 * Build a query to get subjects/keywords for a legal act
 * Uses taxonomy broader concepts and dcterms:subject
 */
export function buildGetSubjectsQuery(srNumber: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(!BOUND(?label) || LANG(?label) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?subject ?label ?scheme
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Get subjects from taxonomy hierarchy or dcterms:subject
  {
    ?taxonomy skos:broader ?subject .
  } UNION {
    ?act dcterms:subject ?subject .
  }

  OPTIONAL { ?subject skos:prefLabel ?label }
  OPTIONAL { ?subject skos:inScheme ?scheme }

  ${langFilter}
}
ORDER BY ?label
  `);
}

/**
 * Build a query to get responsible authority/creator
 */
export function buildGetAuthorityQuery(srNumber: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(!BOUND(?authorityName) || LANG(?authorityName) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?authority ?authorityName ?authorityType
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  {
    ?act dcterms:creator ?authority .
  } UNION {
    ?act jolux:responsibleDepartment ?authority .
  }

  OPTIONAL { ?authority rdfs:label ?authorityName }
  OPTIONAL { ?authority skos:prefLabel ?authorityName }
  OPTIONAL { ?authority a ?authorityType }

  ${langFilter}
}
  `);
}

/**
 * Build a query to get version history
 * In JOLUX, versions are tracked via Expressions
 */
export function buildGetVersionHistoryQuery(srNumber: string): string {
  return withPrefixes(`
SELECT DISTINCT ?version ?versionDate ?versionType ?title
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  ?act jolux:isRealizedBy ?version .

  OPTIONAL { ?version jolux:dateDocument ?versionDate }
  OPTIONAL { ?version jolux:typeDocument ?versionType }
  OPTIONAL { ?version jolux:title ?title }
}
ORDER BY DESC(?versionDate)
LIMIT 50
  `);
}

/**
 * Build a query to get legal effect/status information
 */
export function buildGetLegalStatusQuery(srNumber: string): string {
  return withPrefixes(`
SELECT DISTINCT ?status ?inForce ?dateInForce ?dateAbrogation ?abrogatedBy
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  OPTIONAL {
    ?act jolux:inForce ?inForceStatus .
    BIND(?inForceStatus = <https://fedlex.data.admin.ch/vocabulary/enforcement-status/1> AS ?inForce)
  }
  OPTIONAL { ?act jolux:dateEntryInForce ?dateInForce }
  OPTIONAL { ?act jolux:dateNoLongerInForce ?dateAbrogation }

  # Check if abrogated by another act
  OPTIONAL {
    ?abrogatingAct jolux:legalResourceLegalResourceRepeals ?act .
    ?abrogatingAct jolux:classifiedByTaxonomyEntry ?abrogatingTax .
    ?abrogatingTax skos:notation ?abrogatedBy .
  }

  BIND(
    IF(BOUND(?dateAbrogation), "abrogated",
      IF(BOUND(?dateInForce), "in_force", "pending")
    ) AS ?status
  )
}
  `);
}

/**
 * Build a query to get document structure (table of contents)
 * Uses jolux:hasPart for hierarchical structure
 */
export function buildGetStructureQuery(srNumber: string, language?: Language): string {
  const langFilter = language
    ? `FILTER(!BOUND(?partTitle) || LANG(?partTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?part ?partNumber ?partTitle ?partType ?parentPart
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Get structural parts (chapters, sections, articles)
  ?act jolux:hasPart+ ?part .

  ?part jolux:number ?partNumber .

  OPTIONAL {
    ?part jolux:isRealizedBy ?partExpr .
    ?partExpr jolux:title ?partTitle .
  }
  OPTIONAL { ?part a ?partType }

  # Get parent relationship for hierarchy
  OPTIONAL {
    ?parentPart jolux:hasPart ?part .
    FILTER(?parentPart != ?act)
  }

  ${langFilter}
}
ORDER BY ?partNumber
LIMIT 500
  `);
}

/**
 * Build a query to get document format/encoding information
 * In JOLUX, formats are via Manifestations (jolux:isEmbodiedBy)
 */
export function buildGetFormatInfoQuery(srNumber: string): string {
  return withPrefixes(`
SELECT DISTINCT ?format ?formatType ?encoding ?fileSize ?downloadUrl
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Expression -> Manifestation chain
  ?act jolux:isRealizedBy ?expression .
  ?expression jolux:isEmbodiedBy ?manifestation .

  OPTIONAL { ?manifestation dcterms:format ?format }
  OPTIONAL { ?format dcterms:type ?formatType }
  OPTIONAL { ?format dcterms:encoding ?encoding }
  OPTIONAL { ?manifestation schema:contentSize ?fileSize }
  OPTIONAL { ?manifestation schema:contentUrl ?downloadUrl }
}
  `);
}

/**
 * Build a query to get statistical metadata
 */
export function buildGetStatisticsQuery(srNumber: string): string {
  return withPrefixes(`
SELECT ?articleCount ?partCount
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Count articles (direct parts)
  {
    SELECT (COUNT(DISTINCT ?article) AS ?articleCount)
    WHERE {
      ?act jolux:hasPart ?article .
      ?article jolux:number ?num .
    }
  }

  # Count all parts (recursive)
  {
    SELECT (COUNT(DISTINCT ?part) AS ?partCount)
    WHERE {
      ?act jolux:hasPart+ ?part .
    }
  }
}
  `);
}

/**
 * Build a query to get all available SR numbers with their metadata
 */
export function buildListAllActsQuery(
  language?: Language,
  limit: number = 100,
  offset: number = 0
): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?srNumber ?title ?abbreviation ?actType ?dateInForce
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  ${langFilter}

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
 * Build a query to get act types available in the system
 */
export function buildListActTypesQuery(language?: Language): string {
  const langFilter = language
    ? `FILTER(LANG(?typeLabel) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?actType ?typeLabel (COUNT(?act) AS ?count)
WHERE {
  ?act a jolux:Act ;
       jolux:typeDocument ?actType .

  OPTIONAL { ?actType rdfs:label ?typeLabel }
  OPTIONAL { ?actType skos:prefLabel ?typeLabel }

  ${langFilter}
}
GROUP BY ?actType ?typeLabel
ORDER BY DESC(?count)
  `);
}
