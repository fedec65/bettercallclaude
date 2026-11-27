# MCP Server Integration -- CONNECTORS

This document describes the nine MCP (Model Context Protocol) servers included with the BetterCallClaude plugin. These servers provide direct integration with Swiss legal databases for precedent search, court decision retrieval, citation verification, federal legislation lookup, legal commentary access, document intelligence (strategy/drafting/analysis), CAS/TAS sports arbitration, custom workflows, and case law graphs. No local server is shipped.

---

## Overview

| Server | Purpose | Transport |
|--------|---------|-----------|
| `bge-search` | Search and retrieve Federal Supreme Court (BGE/ATF/DTF) decisions | HTTP |
| `entscheidsuche` | Search across Swiss federal and cantonal court databases | HTTP |
| `legal-citations` | Validate citation format and convert between languages | HTTP |
| `fedlex-sparql` | Look up Swiss federal legislation via the Fedlex SPARQL endpoint | HTTP |
| `onlinekommentar` | Search and retrieve Swiss legal commentaries (Kommentare) | HTTP |
| `legal-persona` | Swiss-law document intelligence — strategy, drafting, analysis | HTTP |
| `tas-jurisprudence` | CAS/TAS sports arbitration awards and jurisprudence | HTTP |
| `workflows-ch` | Custom workflow validation, persistence, and run logging | HTTP |
| `swiss-caselaw` | Case law search, citation graphs, appeal chains, doctrine (opencaselaw.ch) | SSE |

### Configuration

#### All platforms (default -- HTTP transport)

Eight servers connect to the hosted HTTP MCP service at `https://mcp.bettercallclaude.ch`. One server (`swiss-caselaw`) connects via SSE to `https://mcp.opencaselaw.ch`. The plugin's `.mcp.json` configures these automatically — no local setup, Node.js, or API keys are required.

After plugin installation, verify with `/mcp` that all 9 remote servers appear. Restart Claude Code or Cowork if needed.

#### Optional manual server (not shipped)

The `ollama` privacy classifier is not included in the standard plugin. Advanced users can build it from `mcp-servers-src/ollama` and register it in a separate manual MCP configuration. See `README.md` for build instructions and the marketplace-overwrite warning.

#### Local mode (Claude Code CLI only)

For lower latency or offline capability in Claude Code, you can switch the HTTP servers to local stdio transport. This feature is not available in Cowork Desktop (which uses HTTP-only transport).

Refer to the Claude Code CLI edition ([fedec65/bettercallclaude-cli](https://github.com/fedec65/bettercallclaude-cli)) for local transport setup instructions.

#### Without MCP Servers

BetterCallClaude operates in reduced mode when servers are unavailable. Commands fall back to built-in Swiss law knowledge but cannot search live databases, verify citation existence, or access current legislation. Run `/bettercallclaude:doctor` to check connectivity.

---

## bge-search

Provides search and retrieval of Federal Supreme Court decisions from the BGE (Bundesgerichtsentscheide) / ATF (Arrets du Tribunal federal) / DTF (Decisioni del Tribunale federale) database.

### Tools

#### search_bge

Search BGE decisions by keywords, article references, date ranges, and court sections.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query. Supports keywords, legal concepts, and natural language descriptions of the legal issue. |
| `article_ref` | string | No | Filter by statutory article reference. Accepts standard Swiss citation format (e.g., `"Art. 97 OR"`, `"art. 41 CO"`, `"Art. 2 ZGB"`). |
| `date_from` | string | No | Start date for date range filter. Format: `YYYY-MM-DD`. |
| `date_to` | string | No | End date for date range filter. Format: `YYYY-MM-DD`. |
| `section` | string | No | Filter by BGE section code. One of: `I` (Constitutional Law), `Ia` (International Law / Fundamental Rights), `II` (Civil Law), `III` (Obligations and Property), `IV` (Social Insurance), `V` (Administrative Law), `VI` (Criminal Law). |
| `limit` | number | No | Maximum number of results to return. Default: `10`. Maximum: `50`. |

**Example request:**

```json
{
  "tool": "search_bge",
  "arguments": {
    "query": "Vertragshaftung Lieferverzug",
    "article_ref": "Art. 97 OR",
    "date_from": "2015-01-01",
    "section": "III",
    "limit": 10
  }
}
```

**Response format:**

Returns an array of decision objects:

```json
{
  "results": [
    {
      "reference": "BGE 145 III 229",
      "date": "2019-06-12",
      "section": "III",
      "summary": "Vertragliche Haftung; Schadenersatz bei Lieferverzug...",
      "full_text": "...",
      "considerations": [
        {
          "number": "4.2",
          "text": "Das Bundesgericht hat in seiner Rechtsprechung..."
        }
      ],
      "articles_cited": ["Art. 97 OR", "Art. 102 OR", "Art. 106 OR"],
      "language": "de"
    }
  ],
  "total_count": 23,
  "returned_count": 10
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `reference` | string | Official BGE reference number (e.g., `"BGE 145 III 229"`). |
| `date` | string | Decision date in `YYYY-MM-DD` format. |
| `section` | string | BGE section code (`I` through `VI`). |
| `summary` | string | Brief summary of the decision (Regeste / regeste / regesto). |
| `full_text` | string | Full text of the decision. |
| `considerations` | array | Array of consideration objects, each with `number` (e.g., `"4.2"`) and `text` fields. |
| `articles_cited` | array | List of statutory articles cited in the decision. |
| `language` | string | Language of the decision (`de`, `fr`, or `it`). |
| `total_count` | number | Total number of matching decisions in the database. |
| `returned_count` | number | Number of decisions returned in this response. |

---

#### get_bge_decision

Retrieve the full text of a specific BGE decision by its reference number.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reference` | string | Yes | Official BGE reference number. Accepts German (`"BGE 145 III 229"`), French (`"ATF 145 III 229"`), or Italian (`"DTF 145 III 229"`) format. |

**Example request:**

```json
{
  "tool": "get_bge_decision",
  "arguments": {
    "reference": "BGE 145 III 229"
  }
}
```

**Response format:**

Returns a single decision object with the same structure as `search_bge` results, including full text and all considerations.

---

## entscheidsuche

Provides search across multiple Swiss court databases, including the Federal Supreme Court and cantonal courts. This server aggregates results from different court systems into a unified interface.

### Tools

#### search_decisions

Search across Swiss court databases with filtering by court, date, and language.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query. Supports keywords, legal concepts, article references, and natural language descriptions. |
| `court` | string | No | Filter by court system. One of: `bundesgericht` (Federal Supreme Court), or any of the 26 cantonal codes in lowercase: `ag`, `ai`, `ar`, `be`, `bl`, `bs`, `fr`, `ge`, `gl`, `gr`, `ju`, `lu`, `ne`, `nw`, `ow`, `sg`, `sh`, `so`, `sz`, `tg`, `ti`, `ur`, `vd`, `vs`, `zg`, `zh`. If omitted, searches all available court databases. |
| `date_from` | string | No | Start date for date range filter. Format: `YYYY-MM-DD`. |
| `date_to` | string | No | End date for date range filter. Format: `YYYY-MM-DD`. |
| `language` | string | No | Filter by decision language. One of: `de`, `fr`, `it`. If omitted, returns decisions in all available languages. |
| `limit` | number | No | Maximum number of results to return. Default: `10`. Maximum: `50`. |

**Example request:**

```json
{
  "tool": "search_decisions",
  "arguments": {
    "query": "bail commercial resiliation",
    "court": "ge",
    "language": "fr",
    "date_from": "2020-01-01",
    "limit": 15
  }
}
```

**Response format:**

Returns an array of decision objects:

```json
{
  "results": [
    {
      "id": "ge-2023-12345",
      "court": "ge",
      "court_name": "Cour de justice de Geneve",
      "chamber": "Chambre civile",
      "date": "2023-03-15",
      "reference": "C/12345/2022",
      "language": "fr",
      "summary": "Resiliation de bail commercial; conditions de forme...",
      "full_text": "...",
      "articles_cited": ["art. 257f CO", "art. 271 CO"],
      "related_bge": ["ATF 142 III 336"]
    }
  ],
  "total_count": 8,
  "returned_count": 8
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the decision within the entscheidsuche system. |
| `court` | string | Court system code (e.g., `"ge"`, `"zh"`, `"bundesgericht"`). |
| `court_name` | string | Full name of the court that issued the decision. |
| `chamber` | string | Specific chamber or division within the court. |
| `date` | string | Decision date in `YYYY-MM-DD` format. |
| `reference` | string | Court-specific reference number. |
| `language` | string | Language of the decision (`de`, `fr`, or `it`). |
| `summary` | string | Brief summary of the decision. |
| `full_text` | string | Full text of the decision. |
| `articles_cited` | array | List of statutory articles cited in the decision. |
| `related_bge` | array | List of BGE/ATF/DTF decisions referenced by this cantonal decision. |
| `total_count` | number | Total number of matching decisions. |
| `returned_count` | number | Number of decisions returned in this response. |

---

#### get_decision

Retrieve the full text of a specific court decision by its entscheidsuche identifier.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique decision identifier as returned by `search_decisions` (e.g., `"ge-2023-12345"`). |

**Example request:**

```json
{
  "tool": "get_decision",
  "arguments": {
    "id": "ge-2023-12345"
  }
}
```

**Response format:**

Returns a single decision object with the same structure as `search_decisions` results, including full text.

---

## legal-citations

Provides citation format validation and cross-language conversion for Swiss legal references. This server verifies that citations follow correct format conventions and can convert references between German, French, Italian, and English formats.

### Tools

#### validate_citation

Verify that a citation follows the correct format for Swiss legal references and check whether the cited source exists in the database.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `citation` | string | Yes | The citation string to validate. Accepts statutory references (e.g., `"Art. 97 Abs. 1 OR"`), BGE references (e.g., `"BGE 145 III 229 E. 4.2"`), and doctrine references. |
| `language` | string | No | Language context for validation. One of: `de`, `fr`, `it`. If omitted, the server detects the language from the citation format. |

**Example request:**

```json
{
  "tool": "validate_citation",
  "arguments": {
    "citation": "Art. 97 Abs. 1 OR",
    "language": "de"
  }
}
```

**Response format:**

```json
{
  "is_valid": true,
  "citation_type": "statutory",
  "corrected_format": "Art. 97 Abs. 1 OR",
  "exists_in_database": true,
  "detected_language": "de",
  "issues": [],
  "normalized_reference": {
    "statute": "OR",
    "article": 97,
    "paragraph": 1,
    "letter": null
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `is_valid` | boolean | Whether the citation follows correct format conventions. |
| `citation_type` | string | Type of citation: `"statutory"`, `"bge"`, `"cantonal_decision"`, or `"doctrine"`. |
| `corrected_format` | string | The citation in its correct canonical format. If the input had formatting errors, this field contains the corrected version. |
| `exists_in_database` | boolean | Whether the cited source was found in the connected legal databases. Only applicable to BGE and statutory references. |
| `detected_language` | string | The language detected from the citation format (`de`, `fr`, or `it`). |
| `issues` | array | List of formatting issues found, if any. Each issue is a string describing the problem (e.g., `"Missing space between Art. and number"`). |
| `normalized_reference` | object | Parsed components of the citation for programmatic use. |

**Validation examples:**

| Input | is_valid | corrected_format | Issues |
|-------|----------|------------------|--------|
| `Art. 97 Abs. 1 OR` | true | `Art. 97 Abs. 1 OR` | none |
| `Art.97 OR` | false | `Art. 97 OR` | `"Missing space after Art."` |
| `BGE 145 III 229 E. 4.2` | true | `BGE 145 III 229 E. 4.2` | none |
| `BGE145III229` | false | `BGE 145 III 229` | `"Missing spaces in BGE reference"` |
| `art. 97 al. 1 CO` | true | `art. 97 al. 1 CO` | none |

---

#### format_citation

Convert a citation from one language format to another. This tool handles the differences in abbreviation conventions between German, French, Italian, and English legal citation styles.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `citation` | string | Yes | The citation string to convert. Must be in a recognized Swiss legal citation format. |
| `target_language` | string | Yes | Target language for the converted citation. One of: `de`, `fr`, `it`, `en`. |

**Example request:**

```json
{
  "tool": "format_citation",
  "arguments": {
    "citation": "BGE 145 III 229 E. 4.2",
    "target_language": "fr"
  }
}
```

**Response format:**

```json
{
  "original": "BGE 145 III 229 E. 4.2",
  "original_language": "de",
  "converted": "ATF 145 III 229 consid. 4.2",
  "target_language": "fr",
  "conversion_notes": []
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `original` | string | The input citation as provided. |
| `original_language` | string | Detected language of the input citation. |
| `converted` | string | The citation in the target language format. |
| `target_language` | string | The target language that was requested. |
| `conversion_notes` | array | Any notes about the conversion (e.g., terms without direct equivalents). |

**Conversion reference table:**

The following table shows how key citation elements map across languages:

| Element | DE | FR | IT | EN |
|---------|----|----|----|----|
| Federal court decisions | BGE | ATF | DTF | BGE |
| Article | Art. | art. | art. | Art. |
| Paragraph | Abs. | al. | cpv. | para. |
| Letter | lit. | let. | lett. | let. |
| Number | Ziff. | ch. | n. | no. |
| Consideration | E. | consid. | consid. | consideration |
| Margin number | N / Rz. | ch. | n. | para. |
| Civil Code | ZGB | CC | CC | CC |
| Code of Obligations | OR | CO | CO | CO |
| Criminal Code | StGB | CP | CP | CC |
| Civil Procedure | ZPO | CPC | CPC | CPC |
| Criminal Procedure | StPO | CPP | CPP | CPP |
| Federal Constitution | BV | Cst. | Cost. | FC |

---

## fedlex-sparql

Provides access to Swiss federal legislation via the official Fedlex SPARQL endpoint (fedlex.data.admin.ch). The server queries the JOLUX ontology (FRBR-based model) covering approximately 228,500 legal objects including all SR/RS classified legislation.

**Data source**: https://fedlex.data.admin.ch/sparqlendpoint (CC BY-NC-SA 4.0)

⚠️ **Important Limitation**: Fedlex only stores articles that have been modified or amended since the last consolidation. Original unmodified articles will return `found: false`. Use `list_articles` to see which articles are available for a given SR number, or check fedlex.admin.ch for complete texts.

### Tools

#### lookup_statute

Look up a Swiss legal act by its SR number or standard abbreviation.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | string | Yes | SR number (e.g., `"220"`, `"210"`) or abbreviation (e.g., `"OR"`, `"ZGB"`, `"StGB"`). |
| `language` | string | No | Preferred language for results. One of: `de`, `fr`, `it`, `rm`. |

**Example request:**

```json
{
  "tool": "lookup_statute",
  "arguments": {
    "identifier": "OR",
    "language": "de"
  }
}
```

**Response**: Returns the legal act with SR number, title in requested language, abbreviation, date of enactment, and current legal status.

---

#### get_article

Retrieve a specific article within a Swiss legal act, including marginal notes, paragraphs (Absatze), and letters (Buchstaben).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `srNumber` | string | Yes | SR number of the legal act (e.g., `"220"` for OR). |
| `articleNumber` | string | Yes | Article number (e.g., `"97"`, `"41"`, `"Art. 97"`). |
| `paragraph` | string | No | Specific paragraph/Absatz number. |
| `language` | string | No | Preferred language for article text. One of: `de`, `fr`, `it`, `rm`. |

**Example request:**

```json
{
  "tool": "get_article",
  "arguments": {
    "srNumber": "220",
    "articleNumber": "97",
    "language": "de"
  }
}
```

**Response**: Returns article text, marginal note, paragraphs, and letters in the requested language.

---

#### list_articles

List all articles available in Fedlex for a given SR number. Use this when `get_article` returns `found: false` to discover which articles exist in the database.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `srNumber` | string | Yes | SR number of the legal act (e.g., `"220"` for OR, `"272"` for ZPO). |
| `language` | string | No | Preferred language for results. One of: `de`, `fr`, `it`, `rm`. |
| `limit` | number | No | Maximum number of articles to return. Default: `1000`. Maximum: `2000`. |

**Example request:**

```json
{
  "tool": "list_articles",
  "arguments": {
    "srNumber": "272",
    "language": "de"
  }
}
```

**Response format:**

```json
{
  "found": true,
  "srNumber": "272",
  "actTitle": {
    "de": "Zivilprozessordnung"
  },
  "articles": [
    { "number": "5", "title": { "de": "Anwendungsbereich" } },
    { "number": "6", "title": { "de": "Rechtsweg" } },
    { "number": "8", "title": { "de": "Örtliche Zuständigkeit" } }
  ],
  "count": 150,
  "note": "Fedlex only stores modified/amended articles. This list contains articles that have been changed since consolidation.",
  "searchTimeMs": 450
}
```

---

#### search_legislation

Search across Swiss federal legislation with full-text search and filters.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Full-text search query (searches title and SR number). |
| `domain` | string | No | Legal domain filter by SR prefix: `1`=State/Constitutional, `2`=Private/Civil, `3`=Criminal, `4`=Education/Culture, `5`=Defense, `6`=Finance, `7`=Public Works/Transport, `8`=Health/Labor/Social Security, `9`=Economy. |
| `srNumberPrefix` | string | No | Filter by SR number prefix (e.g., `"22"` for contract law). |
| `dateFrom` | string | No | Filter acts in force from this date (ISO 8601: `YYYY-MM-DD`). |
| `dateTo` | string | No | Filter acts in force until this date (ISO 8601: `YYYY-MM-DD`). |
| `actType` | array | No | Filter by act types (e.g., `["Bundesgesetz", "Verordnung"]`). |
| `language` | string | No | Preferred language for results. One of: `de`, `fr`, `it`, `rm`. |
| `limit` | number | No | Maximum results. Default: `20`. Maximum: `100`. |

**Example request:**

```json
{
  "tool": "search_legislation",
  "arguments": {
    "query": "Datenschutz",
    "domain": "2",
    "language": "de",
    "limit": 10
  }
}
```

**Response**: Returns array of matching legal acts with SR numbers, titles, abbreviations, dates, and legal status.

---

#### find_related

Find legislation related to a given legal act by amendment chains, citations, or subject domain.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `srNumber` | string | Yes | SR number of the legal act (e.g., `"220"` for OR). |
| `relationType` | string | No | Filter by relation type: `amends`, `amended_by`, `cites`, `cited_by`, `implements`, `implemented_by`, `based_on`, `same_domain`, `same_subject`. Returns all if omitted. |
| `includeHistory` | boolean | No | Include legislative history (consolidation chain). Default: `false`. |
| `language` | string | No | Preferred language for results. One of: `de`, `fr`, `it`, `rm`. |

**Example request:**

```json
{
  "tool": "find_related",
  "arguments": {
    "srNumber": "235.1",
    "relationType": "amended_by",
    "language": "de"
  }
}
```

**Response**: Returns array of related legal acts with relationship type, SR numbers, titles, and dates.

---

#### get_metadata

Get comprehensive metadata about a legal act including structure, languages, subjects, and version history.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `srNumber` | string | Yes | SR number of the legal act (e.g., `"220"` for OR). |
| `includeStructure` | boolean | No | Include document structure (table of contents with chapters, sections, articles). Default: `false`. |
| `language` | string | No | Preferred language for metadata text. One of: `de`, `fr`, `it`, `rm`. |

**Example request:**

```json
{
  "tool": "get_metadata",
  "arguments": {
    "srNumber": "220",
    "includeStructure": true,
    "language": "de"
  }
}
```

**Response**: Returns full metadata including title, abbreviation, SR number, date of enactment, legal status, available languages, subject classifications, version history, and optionally the document structure.

---

## onlinekommentar

Provides access to Swiss legal commentaries (Kommentare / Commentaires) from the Onlinekommentar platform. Commentaries provide scholarly analysis of individual statutory provisions and are essential for doctrinal research.

### Tools

#### search_commentaries

Search across Swiss legal commentaries by keyword, language, or legislative act.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search query string (article reference, legal term, concept). |
| `language` | string | No | Filter by language. One of: `de`, `fr`, `it`, `en`. |
| `legislative_act` | string | No | Filter by legislative act UUID (get UUIDs from `list_legislative_acts`). |
| `sort` | string | No | Sort order: `title` (A-Z), `-title` (Z-A), `date` (oldest), `-date` (newest). |
| `page` | number | No | Page number for pagination. Default: `1`. |

**Example request:**

```json
{
  "tool": "search_commentaries",
  "arguments": {
    "query": "Vertragshaftung",
    "language": "de"
  }
}
```

**Response**: Returns paginated array of commentary objects with id, title, authors, publication date, and abstract.

---

#### get_commentary

Retrieve the full text of a specific commentary by its UUID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Commentary UUID as returned by `search_commentaries`. |

**Example request:**

```json
{
  "tool": "get_commentary",
  "arguments": {
    "id": "abc123-def456"
  }
}
```

**Response**: Returns full commentary including title, authors, publication date, full text, cited articles, cited BGE decisions, and bibliography.

---

#### get_commentary_for_article

Find all commentaries for a specific Swiss law article reference. This is the key tool for doctrinal research.

Automatically parses article references in multiple formats:
- German: `"Art. 97 OR"`, `"Art. 97 Abs. 1 OR"`, `"Art. 97 Abs. 1 lit. a OR"`
- French: `"art. 97 CO"`, `"art. 97 al. 2 CO"`, `"art. 97 al. 2 let. a CO"`
- Italian: `"art. 97 CO"`, `"art. 97 cpv. 1 CO"`, `"art. 97 cpv. 1 lett. a CO"`

Resolves abbreviations across languages: OR/CO, ZGB/CC, StGB/CP, etc.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `article_reference` | string | Yes | Article reference (e.g., `"Art. 97 OR"`, `"art. 97 al. 2 CO"`). |
| `language` | string | No | Preferred language for results. One of: `de`, `fr`, `it`, `en`. |

**Example request:**

```json
{
  "tool": "get_commentary_for_article",
  "arguments": {
    "article_reference": "Art. 97 OR",
    "language": "de"
  }
}
```

**Response**: Returns all commentaries covering the specified article, with each commentary's title, authors, key arguments, and cited precedents.

---

#### list_legislative_acts

List all available Swiss legislative acts with their UUIDs, names, and abbreviations in all languages. Use this to get UUIDs for filtering `search_commentaries` by legislative act.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | No | Filter by language. One of: `de`, `fr`, `it`, `en`. |

**Example request:**

```json
{
  "tool": "list_legislative_acts",
  "arguments": {
    "language": "de"
  }
}
```

**Response**: Returns array of legislative act objects with UUID, name, and abbreviation in the requested language (or all languages if not specified).

---

## legal-persona

Provides Swiss-law document intelligence: strategy analysis, automated drafting, and compliance checking. Connects to the HTTP MCP service at `https://mcp.bettercallclaude.ch/legal-persona/mcp`.

### Tools

#### legal_strategy

Develops comprehensive legal strategy for Swiss law cases. Analyzes case facts and provides strength/weakness assessment, success likelihood, strategic approach recommendations, settlement analysis, procedural guidance, risk assessment, and next steps.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `case_facts` | string | Yes | Detailed description of the case facts. |
| `legal_area` | string | Yes | Area of law: `contract`, `corporate`, `employment`, `tort`, `property`, `family`, `succession`, `intellectual_property`, `competition`, `banking`, `tax`, `administrative`, `criminal`. |
| `client_position` | string | Yes | Client's position: `plaintiff`, `defendant`, `appellant`, `respondent`. |
| `jurisdiction` | string | No | Jurisdiction level: `federal` (default), `cantonal`. |
| `canton` | string | No | Canton for cantonal jurisdiction: `ZH`, `BE`, `GE`, `BS`, `VD`, `TI`. |
| `dispute_amount` | number | No | Amount in dispute in CHF. |
| `deadline_pressure` | string | No | Timeline urgency: `urgent`, `normal` (default), `flexible`. |
| `language` | string | No | Output language: `de` (default), `fr`, `it`, `en`. |

**Response**: Returns a structured strategy object with assessment sections, risk analysis, and recommended next steps.

#### legal_draft

Drafts Swiss legal documents with proper structure and terminology. Supports contracts (service agreement, employment contract, NDA, shareholders' agreement, loan agreement, lease agreement), litigation documents (Klageschrift, Klageantwort, Berufung, Beschwerde, Replik, Duplik), and opinions (Rechtsgutachten, memorandum, legal brief).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document_type` | string | Yes | Type of document: `service_agreement`, `employment_contract`, `nda`, `shareholders_agreement`, `loan_agreement`, `lease_agreement`, `klageschrift`, `klageantwort`, `berufung`, `beschwerde`, `replik`, `duplik`, `rechtsgutachten`, `memorandum`, `legal_brief`. |
| `context` | string | Yes | Description of the situation and requirements. |
| `parties` | array | Yes | Parties involved. Each party object has: `name` (required), `role` (required), `address` (optional), `representative` (optional). |
| `jurisdiction` | string | No | Jurisdiction level: `federal` (default), `cantonal`. |
| `canton` | string | No | Canton for cantonal jurisdiction: `ZH`, `BE`, `GE`, `BS`, `VD`, `TI`. |
| `language` | string | No | Output language: `de` (default), `fr`, `it`, `en`. |
| `format` | string | No | Output format: `full` (default), `outline`, `template`. |
| `include_comments` | boolean | No | Include explanatory comments (default: false). |

**Response**: Returns a structured document object with content, metadata, and format information.

#### legal_analyze

Analyzes legal documents for issues, risks, and compliance. Performs document type identification, party extraction, issue detection with severity levels, missing clause identification, compliance checking (OR, ZGB, DSG, etc.), and recommendations with priorities.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | string | Yes | Full text of the document to analyze. |
| `document_type` | string | No | Expected document type (auto-detected if not specified). Same values as `legal_draft`. |
| `analysis_depth` | string | No | Depth of analysis: `quick`, `standard` (default), `comprehensive`. |
| `focus_areas` | array | No | Areas to focus on: `liability`, `termination`, `payment`, `ip`, `confidentiality`, `dispute`, `compliance`, `data_protection`, `employment`, `general` (default). |
| `language` | string | No | Output language: `de` (default), `fr`, `it`, `en`. |
| `check_compliance` | boolean | No | Run compliance checks (default: true). |

**Response**: Returns a structured analysis with identified issues, risk scores, compliance status, and prioritized recommendations.

---

## tas-jurisprudence

Provides search and retrieval of CAS/TAS (Court of Arbitration for Sport) arbitration awards. Connects to `https://mcp.bettercallclaude.ch/tas-jurisprudence/mcp`.

### Tools

#### cas_search

Search CAS/TAS arbitration decisions by keywords, sport, year range, or procedure type.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query for case content, parties, or keywords. |
| `sport` | string | No | Filter by sport (e.g., "Football", "Cycling", "Athletics"). |
| `year_from` | number | No | Filter decisions from this year (1984–2026). |
| `year_to` | number | No | Filter decisions until this year (1984–2026). |
| `procedure_type` | string | No | Filter by procedure type: `Appeal`, `Ordinary`, `Anti-Doping`, `Advisory`. |
| `page` | number | No | Page number for pagination (default: 1). |
| `page_size` | number | No | Results per page, max 25 (default: 10). |

**Response**: Returns an array of award summaries with case number, parties, sport, date, procedure type, and links to full awards.

#### cas_get_award

Retrieve detailed information about a specific CAS/TAS award including parties, arbitrators, keywords, and optionally the full text.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `case_number` | string | No | CAS case number (e.g., "CAS 2023/A/9876"). |
| `url` | string | No | Direct URL to the award page. |
| `include_full_text` | boolean | No | Include full PDF text (default: false). |

At least one of `case_number` or `url` must be provided.

**Response**: Returns detailed award information: parties, arbitrators, keywords, summary, and optionally full text.

#### cas_recent

Get the most recent CAS/TAS arbitration decisions.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Maximum number of recent decisions (1–50, default: 10). |

**Response**: Returns a list of the latest published awards with basic information and PDF links.

#### cas_by_sport

Browse CAS/TAS decisions by sport category.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sport` | string | Yes | Sport to browse (e.g., "Football", "Cycling"). |
| `page` | number | No | Page number for pagination (default: 1). |

**Response**: Returns paginated results for a specific sport with case summaries.

---

## swiss-caselaw

Provides case law search, citation graphs, appeal chains, and doctrine via the opencaselaw.ch platform. Connects via SSE to `https://mcp.opencaselaw.ch`.

This is an external server operated by opencaselaw.ch. The database contains 969K+ decisions with full text. Unlike the HTTP servers hosted at `mcp.bettercallclaude.ch`, this server uses SSE (Server-Sent Events) transport.

### Tools

Tools exposed by this server include:

- `search_decisions(query, filters)` — fulltext search across federal and cantonal courts
- `get_decision(id)` — retrieve full decision text
- `find_leading_cases(topic)` — locate Leitentscheide for a legal topic
- `get_citation_graph(decision_id)` — map citing and cited-by relationships
- `get_legislation(canton?, topic)` — retrieve cantonal legislation

Refer to the opencaselaw.ch MCP documentation for the full parameter specifications. The server is read-only and idempotent.

---

## Error Handling

All remote servers return errors in a consistent format:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "No decision found with reference BGE 999 III 999",
    "details": {}
  }
}
```

### Error codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | The requested resource does not exist in the database. |
| `INVALID_REFERENCE` | The provided reference string could not be parsed as a valid Swiss legal citation. |
| `INVALID_PARAMETERS` | One or more required parameters are missing or have invalid values. |
| `DATABASE_UNAVAILABLE` | The upstream legal database is temporarily unavailable. Retry after a short delay. |
| `RATE_LIMITED` | Too many requests in a short period. Retry after the delay specified in the `retry_after` field. |

---

## Usage Notes

### Search strategies

For best results with `search_bge` and `search_decisions`:

- Use German legal terminology when searching for German-language decisions, and French for French-language decisions. The search indexes are language-specific.
- Combine keyword queries with article references to narrow results. For example, searching for `"Schadenersatz"` with `article_ref: "Art. 97 OR"` returns more relevant results than either filter alone.
- Use the `section` parameter in `bge-search` to focus on the relevant area of law. Section `III` covers obligations and property law, which is the most common section for commercial disputes.
- Date range filtering is useful for finding recent developments in a specific area of law, or for restricting results to decisions issued after a relevant statutory amendment.

### Citation verification workflow

A recommended workflow for citation verification:

1. Use `validate_citation` to check each citation for format correctness.
2. Review the `corrected_format` field and update the document if corrections are needed.
3. Check the `exists_in_database` field to confirm the cited source is real.
4. Use `format_citation` to generate equivalent citations in other languages when producing multi-lingual documents.

### Cross-server queries

The `entscheidsuche` server aggregates cantonal decisions that may reference BGE precedents. The `related_bge` field in cantonal decision results can be used as input to the `bge-search` server's `get_bge_decision` tool to retrieve the full text of referenced federal decisions.
