# BetterCallM

## Self-Hosted Swiss Legal Intelligence Webapp

A self-hosted web application for Swiss legal research, strategy, and document drafting. Powered by Ollama with DeepSeek-R1 running locally on your machine. No paid services, no API keys, no cloud dependencies.

BetterCallM provides 19 specialized legal agents, 8 research tools connected to free Swiss legal databases, and a multi-panel workspace with streaming chat, document viewer, and citation tracker.

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **Ollama** installed and running ([ollama.com](https://ollama.com))

### Install and Run

```bash
# 1. Pull the AI model
ollama pull deepseek-r1:8b

# 2. Install dependencies
cd webapp
npm install

# 3. Start the webapp
npm run dev
```

Open **http://localhost:3000** in your browser.

The status indicator in the top-right corner shows green when Ollama is connected and the model is available.

---

## Configuration

All settings are configurable via environment variables. Defaults work out of the box for a standard Ollama setup.

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API URL. Change if Ollama runs on a different machine. |
| `OLLAMA_MODEL` | `deepseek-r1:8b` | Model name. Any Ollama model works (e.g., `deepseek-r1:1.5b`, `llama3.1`, `qwen2.5`). |
| `WEBAPP_PORT` | `3000` | Port the webapp listens on. |
| `ENTSCHEIDSUCHE_API_URL` | `https://entscheidsuche.ch` | Swiss court decision search API. Free, no API key required. |
| `FEDLEX_SPARQL_URL` | `https://fedlex.data.admin.ch/sparqlendpoint` | Swiss federal legislation SPARQL endpoint. Free, no API key required. |
| `ENTSCHEIDSUCHE_TIMEOUT` | `15000` | Timeout in ms for court decision API calls. |
| `FEDLEX_TIMEOUT` | `15000` | Timeout in ms for SPARQL queries. |
| `LOG_LEVEL` | `info` | Logging level (`debug`, `info`, `warn`, `error`). |

Example with a remote Ollama server and a different model:

```bash
OLLAMA_URL=http://192.168.1.50:11434 OLLAMA_MODEL=deepseek-r1:1.5b npm run dev
```

---

## Workspace Layout

The webapp is a three-panel legal workspace:

```
+----------------------------------------------------------+
|  BetterCallM          [Agent: researcher v]    model info |
+------------------+---------------------+-----------------+
|                  |                     |                 |
|  CHAT            |  DOCUMENTS          |  CITATIONS      |
|                  |                     |                 |
|  Streaming       |  Court decisions,   |  BGE/ATF/DTF    |
|  conversation    |  legislation,       |  references     |
|  with markdown   |  articles from      |  with verify    |
|  rendering       |  legal databases    |  status and     |
|                  |  (tabbed view)      |  source links   |
|  Collapsible     |                     |                 |
|  <think> blocks  |                     |                 |
|  Tool call logs  |                     |                 |
|                  |                     |                 |
|  [input box]     |                     |                 |
+------------------+---------------------+-----------------+
|  Ready           | tool activity       | token count     |
+----------------------------------------------------------+
```

**Chat Panel** — Type your legal question. Responses stream in real-time with markdown rendering. DeepSeek-R1 reasoning (`<think>` blocks) appears in collapsible sections. Tool calls are shown inline with execution time.

**Document Viewer** — Populates automatically when the AI retrieves court decisions or legislation. Tabbed view for multiple documents. Links to original sources on entscheidsuche.ch and fedlex.admin.ch.

**Citations Panel** — Tracks every BGE/ATF/DTF citation and statutory reference mentioned in the conversation. Shows validation status (valid, invalid, unverified) and links to source documents.

Panels are resizable by dragging the borders between them.

---

## Agents

Select an agent from the dropdown in the header. Each agent has a specialized system prompt for its legal domain.

| Agent | Specialization |
|-------|----------------|
| **researcher** (default) | BGE/ATF/DTF precedent research, statutory interpretation, multi-lingual legal sources |
| **strategist** | Litigation strategy, case assessment, risk analysis, settlement evaluation |
| **drafter** | Legal document drafting — contracts, court briefs, opinions, memoranda |
| **orchestrator** | Multi-agent workflow coordination, pipeline routing |
| **advocate** | Builds the strongest case for a legal position |
| **adversary** | Challenges a legal position, finds weaknesses and counter-arguments |
| **judicial** | Neutral synthesis using Swiss Erwagung methodology |
| **citation** | Citation verification, cross-language conversion (DE/FR/IT/EN) |
| **compliance** | FINMA, GwG/AMLA, FIDLEG/FINIG regulatory compliance |
| **data-protection** | nDSG/FADP, GDPR adequacy, DPIA, cross-border transfers |
| **risk** | Risk quantification, Monte Carlo simulation, exposure analysis |
| **procedure** | ZPO/CPC, StPO/CPP, SchKG/LP procedure, deadlines, court competence |
| **fiscal** | Federal/cantonal tax, DTAs, transfer pricing, BEPS |
| **corporate** | AG/GmbH formation, M&A, governance, commercial contracts |
| **realestate** | Grundbuch, lex Koller, tenancy law, construction, property transactions |
| **translator** | Legal translation between DE, FR, IT, and EN |
| **cantonal** | All 26 Swiss cantons, cantonal law comparison |
| **briefing** | Structured pre-execution intake, specialist panel assembly |
| **summarizer** | Output consolidation, deduplication, length-calibrated summaries |

---

## Tools

The AI can call these tools during a conversation to access live Swiss legal data. Tool calls are shown in the chat and results populate the Document Viewer and Citations panels.

| Tool | Description |
|------|-------------|
| `search_bge` | Search Swiss Federal Supreme Court (BGE/ATF/DTF) decisions. Filters by language, date range, result count. |
| `search_decisions` | Search across all Swiss courts — federal and cantonal. Broader than `search_bge`. |
| `validate_bge_citation` | Validate and normalize a BGE citation format (e.g., "BGE 145 III 229"). |
| `lookup_statute` | Look up a Swiss federal statute by SR number (e.g., "220") or abbreviation (e.g., "OR", "ZGB"). |
| `get_article` | Retrieve a specific article of a federal statute (e.g., Art. 97 OR). |
| `search_legislation` | Search across Swiss federal legislation by keyword and legal domain. |
| `validate_citation` | Validate any Swiss legal citation — BGE/ATF/DTF or statutory (Art. X Statute). Multi-language output. |
| `extract_citations` | Extract all legal citations from a block of text. |

All tools use **free public APIs** with no authentication required:

- **entscheidsuche.ch** — Elasticsearch-based Swiss court decision database covering the Federal Supreme Court and all 26 cantonal courts
- **fedlex.data.admin.ch** — Federal legislation SPARQL endpoint with ~228,500 legal objects (CC BY-NC-SA 4.0)

Results are cached in memory to avoid redundant API calls.

---

## How Tool Calling Works

DeepSeek-R1 does not have native function calling. The webapp implements a **ReAct (Reasoning + Acting) loop**:

1. Tool descriptions are injected into the system prompt
2. The model outputs `<tool_call>{"name": "...", "arguments": {...}}</tool_call>` when it needs data
3. The backend parses the tag, executes the tool, and sends the result back
4. The model continues its analysis with the new data
5. This loops until the model produces a final answer (capped at 10 iterations)

This works transparently — you just ask a question and the AI decides which tools to call.

---

## API Reference

The webapp exposes a REST API for programmatic access.

### `POST /api/chat`

Main chat endpoint. Returns a Server-Sent Events stream.

**Request body:**

```json
{
  "message": "What is Art. 97 OR about?",
  "agent": "researcher",
  "history": []
}
```

**SSE event types:**

| Event | Payload | Description |
|-------|---------|-------------|
| `token` | `{ content: string }` | Streaming text token from the LLM |
| `thinking` | `{ content: string }` | DeepSeek reasoning block content |
| `tool_call` | `{ name: string, arguments: object }` | Tool being invoked |
| `tool_result` | `{ name: string, result: object, duration: number }` | Tool execution result |
| `document` | `object` | Legal document data for the viewer |
| `error` | `{ message: string }` | Error message |
| `done` | `{ totalTokens?: number }` | Stream complete |

### `GET /api/agents`

Returns the list of available agents.

### `POST /api/tools/:name`

Invoke a tool directly. Send the tool arguments as the JSON request body.

```bash
curl -X POST http://localhost:3000/api/tools/search_bge \
  -H 'Content-Type: application/json' \
  -d '{"query": "Vertragsverantwortung Art. 97 OR", "limit": 5}'
```

### `GET /api/health`

Health check. Returns Ollama connection status, model availability, agent count, and tool count.

---

## Architecture

```
Browser (localhost:3000)
    |
    |  SSE streaming + REST
    v
Express.js Backend (Node.js)
    |-- Chat Router (/api/chat)
    |     |-- Agent Loader (reads agents/*.md as system prompts)
    |     |-- ReAct Loop (tool calling for DeepSeek)
    |     |-- Ollama Client (POST /api/chat with streaming)
    |
    |-- Tool Registry (8 tools)
    |     |-- BGE Search (entscheidsuche.ch API)
    |     |-- Fedlex SPARQL (fedlex.data.admin.ch)
    |     |-- Citation Validation (regex + formatting)
    |
    v
Ollama (localhost:11434)
    |-- DeepSeek-R1:8b (or any configured model)
```

All data flows locally. The only external network calls are to the free Swiss legal databases (entscheidsuche.ch, fedlex.data.admin.ch).

---

## Project Structure

```
webapp/
  package.json                 Dependencies (express, cors)
  tsconfig.json                TypeScript configuration
  build.ts                     esbuild bundler script
  src/
    server.ts                  Express server entry point
    config.ts                  Environment variable configuration
    routes/
      chat.ts                  POST /api/chat (SSE streaming)
      agents.ts                GET /api/agents
      tools.ts                 POST /api/tools/:name
    llm/
      ollama.ts                Ollama API client (streaming)
      tool-calling.ts          ReAct loop for DeepSeek
    agents/
      agent-loader.ts          Reads agents/*.md into system prompts
    tools/
      registry.ts              Tool name -> handler mapping
      bge-search.ts            BGE + court decision search
      fedlex.ts                SPARQL legislation lookup
      citations.ts             Citation validation + extraction
    middleware/
      cors.ts                  CORS configuration
  public/
    index.html                 Three-panel workspace layout
    css/styles.css             Dark theme styles
    js/
      app.js                   App initialization, settings, health check
      chat.js                  Chat panel, SSE streaming, message rendering
      documents.js             Document viewer panel
      citations.js             Citations tracker panel
      markdown.js              Marked.js wrapper for legal markdown

agents/                        19 agent definition files (markdown with YAML frontmatter)
```

---

## Language Support

The webapp supports all four Swiss national languages plus English:

| Language | Code | Legal context |
|----------|------|---------------|
| German | DE | Primary for federal statutes (ZGB, OR, StGB). BGE citation format. |
| French | FR | Official for CO, CC, CP. ATF citation format. |
| Italian | IT | Official for CCS, CO, CPS. DTF citation format. |
| English | EN | Working language with Swiss legal term mapping. |

The AI detects your language automatically and adapts citation formats, terminology, and legal references accordingly.

---

## Data Sources

All external data sources are free and require no API keys or authentication.

| Source | URL | Data |
|--------|-----|------|
| EntscheidSuche | entscheidsuche.ch | Swiss court decisions — Federal Supreme Court (BGE/ATF/DTF), Federal Administrative Court, Federal Patent Court, Federal Criminal Court, and all 26 cantonal courts. Elasticsearch API. |
| Fedlex SPARQL | fedlex.data.admin.ch/sparqlendpoint | Swiss federal legislation — ~228,500 legal objects. SR-classified statutes, articles, amendment chains. JOLUX ontology (FRBR-based). CC BY-NC-SA 4.0. |

For details on the EntscheidSuche API, see: https://entscheidsuche.ch/pdf/EntscheidsucheAPI.pdf

---

## Scripts

```bash
# Development (hot reload)
cd webapp && npm run dev

# Production build
cd webapp && npm run build

# Start production server
cd webapp && npm start

# Or from the project root:
npm run webapp:dev
npm run webapp:build
npm run webapp:start
```

---

## Professional Disclaimer

BetterCallM is a legal research and analysis tool. All outputs:

- Require professional lawyer review and validation before use
- Do not constitute legal advice
- May contain errors, omissions, or outdated information
- Must be verified against official sources (admin.ch, court databases, official gazettes)
- Must be adapted to the specific circumstances of each case

Lawyers maintain full professional responsibility for all legal work products. This tool assists legal professionals but does not replace professional judgment, independent verification, or the duty of care owed to clients.

---

## License

AGPL-3.0 — See [LICENSE](LICENSE) for full terms.
