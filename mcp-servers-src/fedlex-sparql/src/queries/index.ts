/**
 * SPARQL Queries Index
 * Barrel export for all Fedlex SPARQL query builders
 */

// Prefixes and base URIs
export {
  RDF_PREFIXES,
  FEDLEX_PREFIXES,
  LINDAS_PREFIXES,
  ALL_PREFIXES,
  withPrefixes,
  FEDLEX_BASE,
  buildFedlexSearchURI,
} from './prefixes.js';

// Statute lookup queries
export {
  buildLookupStatuteQuery,
  buildLookupStatuteWithArticlesQuery,
  buildLookupByAbbreviationQuery,
  buildExistsQuery,
  buildListSRNumbersQuery,
  buildConsolidatedVersionQuery,
} from './lookup.js';

// Article retrieval queries
export {
  buildGetArticleQuery,
  buildGetArticleParagraphQuery,
  buildListArticlesQuery,
  buildSearchArticlesQuery,
  buildArticleHistoryQuery,
} from './articles.js';

// Search queries
export {
  buildSearchQuery,
  buildSearchCountQuery,
  buildSearchByDomainQuery,
  buildSearchByDateQuery,
  buildRecentlyModifiedQuery,
  buildKeywordSearchQuery,
  LEGAL_DOMAINS,
} from './search.js';

// Related legislation queries
export {
  buildFindAmendingActsQuery,
  buildFindAmendedActsQuery,
  buildFindReferencingActsQuery,
  buildFindReferencedActsQuery,
  buildFindRelatedByDomainQuery,
  buildFindRelatedBySubjectQuery,
  buildFindAllRelatedQuery,
  buildLegislativeHistoryQuery,
} from './related.js';

// Metadata queries
export {
  buildGetMetadataQuery,
  buildGetLanguagesQuery,
  buildGetPublicationInfoQuery,
  buildGetSubjectsQuery,
  buildGetAuthorityQuery,
  buildGetVersionHistoryQuery,
  buildGetLegalStatusQuery,
  buildGetStructureQuery,
  buildGetFormatInfoQuery,
  buildGetStatisticsQuery,
  buildListAllActsQuery,
  buildListActTypesQuery,
} from './metadata.js';
