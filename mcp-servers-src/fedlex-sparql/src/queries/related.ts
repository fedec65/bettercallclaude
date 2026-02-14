/**
 * SPARQL Queries for Related Legislation
 * Queries to find relationships between legal acts using JOLUX ontology
 *
 * Fedlex Data Model (FRBR-based):
 * - jolux:Act = Primary legislation work
 * - Relationships: jolux:legalResourceLegalResourceAmendedBy, etc.
 * - SR numbers via taxonomy: jolux:classifiedByTaxonomyEntry → skos:notation
 *
 * Note: JOLUX uses different relationship predicates than ELI.
 * Some relationships are modeled via consolidation links or impact entries.
 */

import { withPrefixes } from './prefixes.js';
import { escapeForSPARQL } from '../sparql-client.js';
import { Language, RelationType } from '../types/legislation.js';

/**
 * Build a query to find acts that amend a specific act
 * In JOLUX, amendments are tracked via consolidation/impact entries
 */
export function buildFindAmendingActsQuery(
  srNumber: string,
  language?: Language,
  limit: number = 50
): string {
  const langFilter = language
    ? `FILTER(LANG(?amendingTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?amendingAct ?amendingSrNumber ?amendingTitle ?amendmentDate ?amendmentType
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Find acts that amend this act via consolidation links
  # JOLUX uses legalResourceImpactHasLegalResource or similar predicates
  {
    ?impactEntry jolux:legalResourceImpactHasLegalResource ?act .
    ?impactEntry jolux:impactFromLegalResource ?amendingAct .
  } UNION {
    # Alternative: direct amendment relationship if available
    ?amendingAct jolux:legalResourceLegalResourceAmends ?act .
  }

  ?amendingAct a jolux:Act ;
               jolux:classifiedByTaxonomyEntry ?amendingTax .

  ?amendingTax skos:notation ?amendingSrNumber ;
               skos:prefLabel ?amendingTitle .

  ${langFilter}

  OPTIONAL { ?amendingAct jolux:dateDocument ?amendmentDate }
  OPTIONAL { ?amendingAct jolux:typeDocument ?amendmentType }
}
ORDER BY DESC(?amendmentDate)
LIMIT ${limit}
  `);
}

/**
 * Build a query to find acts amended by a specific act
 */
export function buildFindAmendedActsQuery(
  srNumber: string,
  language?: Language,
  limit: number = 50
): string {
  const langFilter = language
    ? `FILTER(LANG(?amendedTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?amendedAct ?amendedSrNumber ?amendedTitle
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Find acts amended by this act
  {
    ?impactEntry jolux:impactFromLegalResource ?act .
    ?impactEntry jolux:legalResourceImpactHasLegalResource ?amendedAct .
  } UNION {
    ?act jolux:legalResourceLegalResourceAmends ?amendedAct .
  }

  ?amendedAct a jolux:Act ;
              jolux:classifiedByTaxonomyEntry ?amendedTax .

  ?amendedTax skos:notation ?amendedSrNumber ;
              skos:prefLabel ?amendedTitle .

  ${langFilter}
}
ORDER BY ?amendedSrNumber
LIMIT ${limit}
  `);
}

/**
 * Build a query to find acts that reference a specific act
 * In JOLUX, references are tracked via citation/cross-reference entries
 */
export function buildFindReferencingActsQuery(
  srNumber: string,
  language?: Language,
  limit: number = 50
): string {
  const langFilter = language
    ? `FILTER(LANG(?referencingTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?referencingAct ?referencingSrNumber ?referencingTitle ?referenceType
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Find acts that reference this act via various relationship types
  {
    ?referencingAct jolux:legalResourceLegalResourceCites ?act .
    BIND("cites" AS ?referenceType)
  } UNION {
    ?referencingAct jolux:legalResourceLegalResourceBasedOn ?act .
    BIND("based_on" AS ?referenceType)
  } UNION {
    ?referencingAct jolux:legalResourceLegalResourceImplements ?act .
    BIND("implements" AS ?referenceType)
  }

  ?referencingAct a jolux:Act ;
                  jolux:classifiedByTaxonomyEntry ?refTax .

  ?refTax skos:notation ?referencingSrNumber ;
          skos:prefLabel ?referencingTitle .

  ${langFilter}
}
ORDER BY ?referencingSrNumber
LIMIT ${limit}
  `);
}

/**
 * Build a query to find acts referenced by a specific act
 */
export function buildFindReferencedActsQuery(
  srNumber: string,
  language?: Language,
  limit: number = 50
): string {
  const langFilter = language
    ? `FILTER(LANG(?referencedTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?referencedAct ?referencedSrNumber ?referencedTitle ?referenceType
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Find acts referenced by this act
  {
    ?act jolux:legalResourceLegalResourceCites ?referencedAct .
    BIND("cites" AS ?referenceType)
  } UNION {
    ?act jolux:legalResourceLegalResourceBasedOn ?referencedAct .
    BIND("based_on" AS ?referenceType)
  } UNION {
    ?act jolux:legalResourceLegalResourceImplements ?referencedAct .
    BIND("implements" AS ?referenceType)
  }

  ?referencedAct a jolux:Act ;
                 jolux:classifiedByTaxonomyEntry ?refTax .

  ?refTax skos:notation ?referencedSrNumber ;
          skos:prefLabel ?referencedTitle .

  ${langFilter}
}
ORDER BY ?referencedSrNumber
LIMIT ${limit}
  `);
}

/**
 * Build a query to find related acts in the same legal domain
 * Uses taxonomy hierarchy for domain matching
 */
export function buildFindRelatedByDomainQuery(
  srNumber: string,
  language?: Language,
  limit: number = 20
): string {
  const langFilter = language
    ? `FILTER(LANG(?relatedTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?relatedAct ?relatedSrNumber ?relatedTitle
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Get the domain prefix (first digit(s) of SR number)
  BIND(REPLACE(STR(?srNumber), "^([0-9]+)\\\\..*", "$1") AS ?domainPrefix)

  # Find acts in the same domain via taxonomy
  ?relatedAct a jolux:Act ;
              jolux:classifiedByTaxonomyEntry ?relatedTax .

  ?relatedTax skos:notation ?relatedSrNumber ;
              skos:prefLabel ?relatedTitle .

  FILTER(?relatedAct != ?act)
  FILTER(STRSTARTS(STR(?relatedSrNumber), ?domainPrefix))

  ${langFilter}
}
ORDER BY ?relatedSrNumber
LIMIT ${limit}
  `);
}

/**
 * Build a query to find acts with shared keywords/subjects
 * Uses taxonomy broader concepts for subject matching
 */
export function buildFindRelatedBySubjectQuery(
  srNumber: string,
  language?: Language,
  limit: number = 20
): string {
  const langFilter = language
    ? `FILTER(LANG(?relatedTitle) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?relatedAct ?relatedSrNumber ?relatedTitle ?sharedSubject
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  # Get subject via taxonomy or dcterms:subject
  {
    ?taxonomy skos:broader ?subject .
  } UNION {
    ?act dcterms:subject ?subject .
  }

  # Find acts with the same subject
  {
    ?relatedAct jolux:classifiedByTaxonomyEntry ?relatedTax .
    ?relatedTax skos:broader ?subject .
  } UNION {
    ?relatedAct dcterms:subject ?subject .
  }

  ?relatedAct a jolux:Act ;
              jolux:classifiedByTaxonomyEntry ?relatedTaxMain .

  ?relatedTaxMain skos:notation ?relatedSrNumber ;
                  skos:prefLabel ?relatedTitle .

  FILTER(?relatedAct != ?act)

  OPTIONAL { ?subject skos:prefLabel ?sharedSubject }

  ${langFilter}
}
ORDER BY ?relatedSrNumber
LIMIT ${limit}
  `);
}

/**
 * Build a comprehensive query to find all related acts
 */
export function buildFindAllRelatedQuery(
  srNumber: string,
  relationType?: RelationType,
  language?: Language,
  limit: number = 50
): string {
  const langFilter = language
    ? `FILTER(LANG(?relatedTitle) = "${language}")`
    : '';

  // If specific relation type requested, build targeted query
  if (relationType) {
    switch (relationType) {
      case 'amends':
        return buildFindAmendingActsQuery(srNumber, language, limit);
      case 'amended_by':
        return buildFindAmendedActsQuery(srNumber, language, limit);
      case 'cites':
      case 'cited_by':
      case 'implements':
      case 'implemented_by':
      case 'based_on':
        return buildFindReferencingActsQuery(srNumber, language, limit);
      case 'same_domain':
        return buildFindRelatedByDomainQuery(srNumber, language, limit);
      case 'same_subject':
        return buildFindRelatedBySubjectQuery(srNumber, language, limit);
    }
  }

  // Default: return all relationships via impact/consolidation links
  return withPrefixes(`
SELECT DISTINCT ?relatedAct ?relatedSrNumber ?relatedTitle ?relationType ?relationDate
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber .
  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")

  {
    # Amending acts (via impact entries)
    ?impactEntry jolux:impactFromLegalResource ?relatedAct .
    ?impactEntry jolux:legalResourceImpactHasLegalResource ?act .
    BIND("amends" AS ?relationType)
  } UNION {
    # Amended acts
    ?impactEntry jolux:impactFromLegalResource ?act .
    ?impactEntry jolux:legalResourceImpactHasLegalResource ?relatedAct .
    BIND("amended_by" AS ?relationType)
  } UNION {
    # Citing acts
    ?relatedAct jolux:legalResourceLegalResourceCites ?act .
    BIND("cites" AS ?relationType)
  } UNION {
    # Cited acts
    ?act jolux:legalResourceLegalResourceCites ?relatedAct .
    BIND("cited_by" AS ?relationType)
  } UNION {
    # Based on
    ?relatedAct jolux:legalResourceLegalResourceBasedOn ?act .
    BIND("based_on" AS ?relationType)
  }

  ?relatedAct a jolux:Act ;
              jolux:classifiedByTaxonomyEntry ?relatedTax .

  ?relatedTax skos:notation ?relatedSrNumber ;
              skos:prefLabel ?relatedTitle .

  ${langFilter}

  OPTIONAL { ?relatedAct jolux:dateDocument ?relationDate }
}
ORDER BY ?relationType ?relatedSrNumber
LIMIT ${limit}
  `);
}

/**
 * Build a query to get the legislative history (consolidation chain)
 * In JOLUX, consolidations are tracked via jolux:isRealizedBy expressions
 */
export function buildLegislativeHistoryQuery(
  srNumber: string,
  language?: Language
): string {
  const langFilter = language
    ? `FILTER(LANG(?title) = "${language}")`
    : '';

  return withPrefixes(`
SELECT DISTINCT ?version ?date ?title ?changeDescription
WHERE {
  ?act a jolux:Act ;
       jolux:classifiedByTaxonomyEntry ?taxonomy .

  ?taxonomy skos:notation ?srNumber ;
            skos:prefLabel ?title .

  FILTER(STR(?srNumber) = "${escapeForSPARQL(srNumber)}")
  ${langFilter}

  # Get all versions/expressions in the consolidation
  ?act jolux:isRealizedBy ?version .
  ?version jolux:dateDocument ?date .

  OPTIONAL { ?version jolux:title ?changeDescription }
}
ORDER BY DESC(?date)
LIMIT 100
  `);
}
