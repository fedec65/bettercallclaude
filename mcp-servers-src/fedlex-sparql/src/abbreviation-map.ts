/**
 * Static mapping of Swiss law abbreviations to SR numbers.
 * Used as a fast lookup before falling back to SPARQL abbreviation queries,
 * which fail because Fedlex doesn't populate jolux:titleShort or skos:altLabel.
 *
 * Includes DE, FR, and IT abbreviation variants (case-insensitive lookup).
 * Data sourced from mcp-servers-src/onlinekommentar/src/legislative-acts.ts
 * and mcp-servers-src/fedlex-sparql/src/types/legislation.ts.
 */

const ABBREVIATION_TO_SR: ReadonlyMap<string, string> = new Map([
  // === CONSTITUTIONAL LAW ===
  // Bundesverfassung / Constitution federale / Costituzione federale
  ['bv', '101'],
  ['cst', '101'],
  ['cst.', '101'],
  ['cost', '101'],
  ['cost.', '101'],

  // === CIVIL LAW ===
  // Zivilgesetzbuch / Code civil / Codice civile
  ['zgb', '210'],
  ['cc', '210'],

  // Obligationenrecht / Code des obligations / Codice delle obbligazioni
  ['or', '220'],
  ['co', '220'],

  // === CRIMINAL LAW ===
  // Strafgesetzbuch / Code penal / Codice penale
  ['stgb', '311.0'],
  ['cp', '311.0'],

  // === PROCEDURAL LAW ===
  // Zivilprozessordnung / Code de procedure civile / Codice di procedura civile
  ['zpo', '272'],
  ['cpc', '272'],

  // Strafprozessordnung / Code de procedure penale / Codice di procedura penale
  ['stpo', '312.0'],
  ['cpp', '312.0'],

  // Schuldbetreibungs- und Konkursgesetz / LP / LEF
  ['schkg', '281.1'],
  ['lp', '281.1'],
  ['lef', '281.1'],

  // === ADMINISTRATIVE LAW ===
  // Verwaltungsverfahrensgesetz / PA
  ['vwvg', '172.021'],
  ['pa', '172.021'],

  // Bundesgerichtsgesetz / LTF
  ['bgg', '173.110'],
  ['ltf', '173.110'],

  // === COMMERCIAL LAW ===
  // Bundesgesetz gegen den unlauteren Wettbewerb / LCD / LCSl
  ['uwg', '241'],
  ['lcd', '241'],
  ['lcsl', '241'],

  // Kartellgesetz / LCart
  ['kg', '251'],
  ['lcart', '251'],

  // === DATA PROTECTION ===
  // Datenschutzgesetz / LPD
  ['dsg', '235.1'],
  ['lpd', '235.1'],

  // === INTELLECTUAL PROPERTY ===
  // Urheberrechtsgesetz / LDA
  ['urg', '231.1'],
  ['lda', '231.1'],

  // Markenschutzgesetz / LPM
  ['mschg', '232.11'],
  ['lpm', '232.11'],

  // === EMPLOYMENT / LABOR ===
  // Arbeitsgesetz / LTr / LL
  ['arg', '822.11'],
  ['ltr', '822.11'],
  ['ll', '822.11'],

  // === TRANSPORT ===
  // Strassenverkehrsgesetz / LCR / LCStr
  ['svg', '741.01'],
  ['lcr', '741.01'],
  ['lcstr', '741.01'],

  // === INSURANCE ===
  // Versicherungsvertragsgesetz / LCA
  ['vvg', '221.229.1'],
  ['lca', '221.229.1'],

  // === PRIVATE INTERNATIONAL LAW ===
  // IPRG / LDIP
  ['iprg', '291'],
  ['ldip', '291'],

  // === ADDITIONAL COMMON ACTS ===
  // Gleichstellungsgesetz / LEg / LPar
  ['glg', '151.1'],
  ['leg', '151.1'],
  ['lpar', '151.1'],

  // Bundesgesetz über die Mehrwertsteuer / LTVA / LIVA
  ['mwstg', '641.20'],
  ['ltva', '641.20'],
  ['liva', '641.20'],

  // Bundesgesetz über die direkte Bundessteuer / LIFD
  ['dbg', '642.11'],
  ['lifd', '642.11'],

  // Steuerharmonisierungsgesetz / LHID
  ['sthg', '642.14'],
  ['lhid', '642.14'],

  // Miete (Tenancy) - Part of OR but commonly referenced
  // OR 253ff, no separate SR

  // Bundesgesetz über Schuldbetreibung und Konkurs (already covered as SchKG)

  // Fusionsgesetz / LFus
  ['fusg', '221.301'],
  ['lfus', '221.301'],

  // GwG / LBA (Anti-Money Laundering)
  ['gwg', '955.0'],
  ['lba', '955.0'],

  // FINMAG
  ['finmag', '956.1'],
  ['lfinma', '956.1'],

  // FIDLEG / LSFin
  ['fidleg', '950.1'],
  ['lsfin', '950.1'],

  // FINIG / LEFin
  ['finig', '954.1'],
  ['lefin', '954.1'],
]);

/**
 * Look up an SR number by abbreviation (case-insensitive).
 * Returns the SR number string if found, or undefined.
 */
export function lookupSRByAbbreviation(abbreviation: string): string | undefined {
  // Normalize: lowercase, remove trailing dots
  const normalized = abbreviation.toLowerCase().replace(/\.+$/, '');
  return ABBREVIATION_TO_SR.get(normalized);
}
