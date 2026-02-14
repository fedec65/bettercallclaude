/**
 * SPARQL Prefixes for Fedlex Queries
 * Common namespace prefixes used in the Fedlex SPARQL endpoint
 *
 * NOTE: Fedlex uses the JOLUX ontology (FRBR-like model), not ELI
 * - jolux:Act = Primary legislation entity
 * - jolux:Expression = Language-specific version (titles here, NO language tags)
 * - jolux:Manifestation = Physical format (PDF, XML, etc.)
 * - SR numbers via taxonomy: jolux:classifiedByTaxonomyEntry → skos:notation
 */

/**
 * Standard RDF prefixes
 */
export const RDF_PREFIXES = `
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dcat: <http://www.w3.org/ns/dcat#>
`;

/**
 * Fedlex-specific prefixes
 * - jolux: Primary ontology used by Fedlex (FRBR model)
 * - eli: European Legislation Identifier (limited use in Fedlex)
 */
export const FEDLEX_PREFIXES = `
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX fedlex: <https://fedlex.data.admin.ch/vocabulary/>
PREFIX fedlex-eli: <https://fedlex.data.admin.ch/eli/>
PREFIX fedlex-cc: <https://fedlex.data.admin.ch/eli/cc/>
PREFIX schema: <http://schema.org/>
`;

/**
 * LINDAS-specific prefixes (legacy, kept for compatibility)
 */
export const LINDAS_PREFIXES = `
PREFIX ld: <https://ld.admin.ch/>
PREFIX cube: <https://cube.link/>
PREFIX qudt: <http://qudt.org/schema/qudt/>
`;

/**
 * All prefixes combined for use in queries
 */
export const ALL_PREFIXES = `${RDF_PREFIXES}${FEDLEX_PREFIXES}${LINDAS_PREFIXES}`;

/**
 * Create a query with standard prefixes
 */
export function withPrefixes(query: string): string {
  return `${ALL_PREFIXES}\n${query}`;
}

/**
 * Fedlex ELI base URIs
 */
export const FEDLEX_BASE = {
  CC: 'https://fedlex.data.admin.ch/eli/cc/',          // Classified compilation
  OC: 'https://fedlex.data.admin.ch/eli/oc/',          // Official collection
  FGA: 'https://fedlex.data.admin.ch/eli/fga/',        // Federal Gazette
  TREATY: 'https://fedlex.data.admin.ch/eli/treaty/',  // International treaties
} as const;

/**
 * Build a Fedlex URI from SR number
 * SR numbers like "210" become URIs like "https://fedlex.data.admin.ch/eli/cc/24/233_245_233"
 * Note: The actual mapping requires looking up the official URI
 */
export function buildFedlexSearchURI(srNumber: string): string {
  // SR number is used for searching, not direct URI construction
  // The actual mapping from SR to ELI URI is done via SPARQL query
  return srNumber;
}
