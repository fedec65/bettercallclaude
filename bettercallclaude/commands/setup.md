---
description: "Check MCP server connectivity"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_bge-search__search_bge
  - mcp__plugin_bettercallclaude_bge-search__get_bge_decision
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_entscheidsuche__get_decision_details
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__format_citation
  - mcp__plugin_bettercallclaude_onlinekommentar__search_commentaries
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_decision
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_commentary
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__plugin_bettercallclaude_legal-persona__legal_analyze
  - mcp__plugin_bettercallclaude_legal-persona__legal_draft
  - mcp__plugin_bettercallclaude_legal-persona__legal_strategy
  - mcp__plugin_bettercallclaude_legal-persona__compute_deadlines
  - mcp__plugin_bettercallclaude_legal-persona__present_adversarial_analysis
  - mcp__plugin_bettercallclaude_legal-persona__present_intake_form
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_search
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_get_award
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_recent
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_by_sport
  - mcp__plugin_bettercallclaude_ollama__ollama_check_status
  - mcp__plugin_bettercallclaude_ollama__ollama_list_models
  - mcp__plugin_bettercallclaude_ollama__ollama_generate
  - mcp__plugin_bettercallclaude_ollama__ollama_classify_privacy
  - mcp__plugin_bettercallclaude_ollama__ollama_chat
---

# BetterCallClaude MCP Server Setup

When this command is invoked, perform the following diagnostic and transport management workflow.

## Step 1: Check Health Endpoint

Run this command via Bash to check the HTTP MCP service:

```bash
curl -sf https://mcp.bettercallclaude.ch/health
```

If the health check succeeds, the HTTP service is online. If it fails, note the error for the status table.

## Step 2: Probe MCP Servers

Check connectivity for each of the 9 MCP servers using a **two-stage non-blocking approach**:

**Stage A — Check tool availability (non-blocking)**

Look at your currently available tools. For each server, check whether its tools appear in your tool list:

| Server | Tools to look for |
|--------|-------------------|
| entscheidsuche | `search_decisions`, `get_decision_details`, etc. |
| bge-search | `search_bge`, `get_bge_decision`, etc. |
| legal-citations | `validate_citation`, `format_citation`, etc. |
| fedlex-sparql | `search_legislation`, `get_article`, etc. |
| onlinekommentar | `search_commentaries`, `get_commentary`, etc. |
| legal-persona | `legal_analyze`, `legal_draft`, `legal_strategy`, `compute_deadlines`, `present_adversarial_analysis`, `present_intake_form` |
| tas-jurisprudence | `cas_search`, `cas_get_award`, `cas_recent`, `cas_by_sport` |
| swiss-caselaw | `search_decisions`, `find_citations`, `find_appeal_chain`, `cite`, `get_decision`, etc. |
| ollama | `ollama_check_status`, `ollama_list_models`, `ollama_generate`, `ollama_classify_privacy`, `ollama_chat` |

**If a server's tools do not appear in your available tool list, mark it as `[ ] Not connected` immediately and move on — do not attempt to call any of its tools.**

**Stage B — Lightweight call (only for servers confirmed available in Stage A)**

For each server whose tools ARE available, make one lightweight call to confirm it responds:

| Server | Lightweight test |
|--------|-----------------|
| entscheidsuche | `search_decisions` with a minimal query |
| bge-search | `search_bge` with a minimal query |
| legal-citations | `validate_citation` with a simple citation |
| fedlex-sparql | `search_legislation` with a minimal query |
| onlinekommentar | `search_commentaries` with a minimal query |
| legal-persona | `legal_analyze` with a minimal legal question |
| tas-jurisprudence | `cas_search` with a minimal query |
| swiss-caselaw | `search_decisions` with a minimal query |
| ollama | `ollama_check_status` (or `ollama_list_models`) |

If a tool call does not respond promptly, mark that server as `[ ] Timeout` and continue — do not wait or retry.

## Step 3: Display Status Table

For each server, determine the transport type by checking the server configuration in `mcp.json`.

Output the following formatted status report, replacing status indicators and transport types based on Steps 1-2:

```
==============================================
  BetterCallClaude MCP Server Status
==============================================

  Server                    Status              Transport
  ------                    ------              ---------
  entscheidsuche            [x] Connected       HTTP
  bge-search                [x] Connected       HTTP
  legal-citations           [x] Connected       HTTP
  fedlex-sparql             [x] Connected       HTTP
  onlinekommentar           [x] Connected       HTTP
  legal-persona             [x] Connected       HTTP
  tas-jurisprudence         [x] Connected       HTTP
  swiss-caselaw             [x] Connected       SSE
  ollama                    [x] Connected       Local

  HTTP Service: https://mcp.bettercallclaude.ch
  Health: OK / Unreachable
  Connected: X/9 servers
==============================================
```

Mark each server as `[x] Connected`, `[ ] Not connected`, or `[ ] Timeout` based on Step 2 results. Show `HTTP`, `SSE`, or `Local` in the Transport column.

## Step 4: Provide Guidance Based on Results

### If all 9 servers are connected:

```
All 9 MCP servers are operational. No action needed.
BetterCallClaude is running at full capability.
```

### If HTTP servers are not connected but health check passed:

The HTTP service is online but the servers are not registering. Suggest:

```
The HTTP service is healthy but servers are not connecting.
Try restarting Claude Code or Cowork to reload the plugin configuration.
If the issue persists, run: /mcp to check registered servers.
```

### If servers show `[ ] Timeout`:

The server is registered (tools appear in your tool list) but is not responding to calls. Suggest:

```
One or more servers are registered but not responding.
This may indicate a temporary service issue or network timeout.

Try:
1. Restart your Claude Code or Cowork session
2. Re-run /bettercallclaude:setup to check again
3. If the HTTP service health check failed, the service may be temporarily unavailable
```

### If health check failed:

```
The HTTP MCP service at mcp.bettercallclaude.ch is not reachable.

Possible causes:
- No internet connection
- DNS resolution failure (try: nslookup mcp.bettercallclaude.ch)
- Firewall blocking HTTPS on port 443
- Service temporarily unavailable (check again in a few minutes)

```

### If ollama is not connected:

The ollama server runs locally and does not depend on the HTTP service. Suggest:

```
The ollama privacy classifier is not connected.
This server requires the plugin's bundled files. Try:
1. Restart Claude Code or Cowork
2. Verify the plugin is installed: claude plugin list
3. Check that Node.js 18+ is available: node --version
```

## Step 5: Backend Error Diagnostics

If a server connects but returns errors during use, consult this diagnostic guide:

| Error Pattern | Likely Cause | Resolution |
|---------------|-------------|------------|
| HTTP 429 or "rate limited" | Too many requests (limit: 60 req/min per IP) | Wait a moment and retry. Reduce request frequency. |
| SPARQL endpoint timeout or HTTP 5xx from fedlex-sparql | Fedlex service (`fedlex.data.admin.ch`) is temporarily unavailable | Retry later. The server has built-in retry logic (3 attempts, 2s delay). This is an external service issue. |
| "ECONNREFUSED" or "ENOTFOUND" in local mode | Server cannot reach the external API | Check internet connection. Verify DNS resolution for the relevant domain. |
| Connection works but no search results | Server is healthy but the query returned no matches | Try broader search terms or different parameters. |

## Notes

- MCP servers are required for live database access (court decisions, legislation, citation verification)
- Without MCP servers, BetterCallClaude operates in **reduced mode** using built-in Swiss law knowledge
- Reduced mode cannot search live databases, verify citation existence, or access current legislation
- All servers are self-contained and require no API keys or external accounts
- The HTTP service is rate-limited to 60 requests per minute per IP address
- The ollama privacy classifier always runs locally to keep sensitive data on your machine

## User Query

$ARGUMENTS
