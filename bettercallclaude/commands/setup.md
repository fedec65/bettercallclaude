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
  - mcp__bge-search__search_bge
  - mcp__plugin_bettercallclaude_bge-search__get_bge_decision
  - mcp__bge-search__get_bge_decision
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_entscheidsuche__get_decision_details
  - mcp__entscheidsuche__get_decision_details
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_fedlex-sparql__get_article
  - mcp__fedlex-sparql__get_article
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_legal-citations__format_citation
  - mcp__legal-citations__format_citation
  - mcp__plugin_bettercallclaude_onlinekommentar__search_commentaries
  - mcp__onlinekommentar__search_commentaries
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_decision
  - mcp__swiss-caselaw__get_decision
  - mcp__plugin_bettercallclaude_swiss-caselaw__find_citations
  - mcp__swiss-caselaw__find_citations
  - mcp__plugin_bettercallclaude_swiss-caselaw__get_commentary
  - mcp__swiss-caselaw__get_commentary
  - mcp__plugin_bettercallclaude_swiss-caselaw__cite
  - mcp__swiss-caselaw__cite
  - mcp__plugin_bettercallclaude_legal-persona__legal_analyze
  - mcp__legal-persona__legal_analyze
  - mcp__plugin_bettercallclaude_legal-persona__legal_draft
  - mcp__legal-persona__legal_draft
  - mcp__plugin_bettercallclaude_legal-persona__legal_strategy
  - mcp__legal-persona__legal_strategy
  - mcp__plugin_bettercallclaude_legal-persona__compute_deadlines
  - mcp__legal-persona__compute_deadlines
  - mcp__plugin_bettercallclaude_legal-persona__present_adversarial_analysis
  - mcp__legal-persona__present_adversarial_analysis
  - mcp__plugin_bettercallclaude_legal-persona__present_intake_form
  - mcp__legal-persona__present_intake_form
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_search
  - mcp__tas-jurisprudence__cas_search
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_get_award
  - mcp__tas-jurisprudence__cas_get_award
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_recent
  - mcp__tas-jurisprudence__cas_recent
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_by_sport
  - mcp__tas-jurisprudence__cas_by_sport
  - mcp__plugin_bettercallclaude_workflows-ch__list_workflows
  - mcp__workflows-ch__list_workflows
  - mcp__plugin_bettercallclaude_workflows-ch__list_agents
  - mcp__workflows-ch__list_agents
  - mcp__plugin_bettercallclaude_ollama__ollama_check_status
  - mcp__ollama__ollama_check_status
  - mcp__plugin_bettercallclaude_ollama__ollama_list_models
  - mcp__ollama__ollama_list_models
  - mcp__plugin_bettercallclaude_ollama__ollama_generate
  - mcp__ollama__ollama_generate
  - mcp__plugin_bettercallclaude_ollama__ollama_classify_privacy
  - mcp__ollama__ollama_classify_privacy
  - mcp__plugin_bettercallclaude_ollama__ollama_chat
  - mcp__ollama__ollama_chat
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

Check connectivity for each of the **9 required remote MCP servers** using a **two-stage non-blocking approach**. The optional local Ollama classifier is checked separately and does not affect the required-server count.

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
| workflows-ch | `list_agents`, `validate_pipeline`, `save_workflow`, `list_workflows`, `get_workflow`, `delete_workflow`, `log_run` |
| swiss-caselaw | `search_decisions`, `find_citations`, `find_appeal_chain`, `cite`, `get_decision`, etc. |

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
| workflows-ch | `list_workflows` with `{"user_id": "default"}` |
| swiss-caselaw | `search_decisions` with a minimal query |

If a tool call does not respond promptly, mark that server as `[ ] Timeout` and continue — do not wait or retry.

**Optional local classifier check**

After the nine remote servers, check the optional Ollama classifier separately. If `ollama_check_status` is in your tool list, call it once. Record the result as one of:

- `[x] configured` — responded
- `[ ] not responding` — tools appear but the service does not answer
- `[ ] not configured` — not in the tool list

Do not treat a missing Ollama classifier as an error; standard operation does not require it.

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
  workflows-ch              [x] Connected       HTTP
  swiss-caselaw             [x] Connected       SSE

  Optional local classifier: [x] configured / [ ] not responding / [ ] not configured

  HTTP Service: https://mcp.bettercallclaude.ch
  Health: OK / Unreachable
  Connected: X/9 remote servers
==============================================
```

Mark each server as `[x] Connected`, `[ ] Not connected`, or `[ ] Timeout` based on Step 2 results. Show `HTTP`, `SSE`, or `Local` in the Transport column.

## Step 4: Provide Guidance Based on Results

### If all 9 remote servers are connected:

```
All 9 remote MCP servers are operational. No action needed.
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

### If the optional local classifier is not connected:

The Ollama privacy classifier is optional and runs locally; it does not depend on the HTTP service. Standard operation does not require it.

```
The optional local privacy classifier is not connected.
No local MCP server or Ollama setup is required for standard operation; the included privacy hook still uses the host's Node.js runtime.
To enable local classification manually, see README.md#optional-local-classification.
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
- All remote servers are self-contained and require no API keys or external accounts
- The HTTP service is rate-limited to 60 requests per minute per IP address
- The optional Ollama privacy classifier runs locally to keep sensitive data on your machine; it is not installed by the plugin and is not required for standard operation

## User Query

$ARGUMENTS
