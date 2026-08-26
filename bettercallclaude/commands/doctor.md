---
description: "Diagnose MCP server connectivity — tests each server, reports status and impact in plain language, suggests fixes for issues."
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_bge-search__search_bge
  - mcp__plugin_bettercallclaude_entscheidsuche__search_decisions
  - mcp__plugin_bettercallclaude_fedlex-sparql__search_legislation
  - mcp__plugin_bettercallclaude_legal-citations__validate_citation
  - mcp__plugin_bettercallclaude_onlinekommentar__search_commentaries
  - mcp__plugin_bettercallclaude_legal-persona__legal_analyze
  - mcp__plugin_bettercallclaude_tas-jurisprudence__cas_search
  - mcp__plugin_bettercallclaude_workflows-ch__list_workflows
  - mcp__plugin_bettercallclaude_ollama__ollama_check_status
---

# BetterCallClaude — Diagnostics

You are invoked via `/bettercallclaude:doctor`. Diagnose the health of all BetterCallClaude MCP servers and report results in user-friendly language.

## Step 1: Health Endpoint

Check the HTTP MCP gateway:

- Attempt to reach `https://mcp.bettercallclaude.ch/health`
- If the health check succeeds, note "Gateway online".
- If it fails, note "Gateway non raggiungibile" and the likely impact.

## Step 2: Probe Each Server

For each of the 10 MCP servers, use a **two-stage approach**:

**Stage A — Tool availability**: Check whether the server's tools appear in your available tool list. If they do not appear, mark the server as "non connesso" immediately.

**Stage B — Lightweight call** (only if Stage A passed): Make one minimal call to confirm responsiveness.

| Server | What it provides | Test call |
|--------|-----------------|-----------|
| entscheidsuche | Ricerca sentenze cantonali e federali | `search_decisions` (minimal) |
| bge-search | Ricerca sentenze Tribunale federale | `search_bge` (minimal) |
| legal-citations | Verifica e formattazione citazioni | `validate_citation` (minimal) |
| fedlex-sparql | Banca dati legislativa federale | `search_legislation` (minimal) |
| onlinekommentar | Commentari giuridici online | `search_commentaries` (minimal) |
| legal-persona | Analisi, strategia e drafting documenti legali svizzeri | `legal_analyze` (minimal) |
| tas-jurisprudence | Lodi arbitrali CAS/TAS | `cas_search` (minimal) |
| workflows-ch | Flussi di lavoro personalizzati | `list_workflows` (no args) |
| swiss-caselaw | Giurisprudenza, catene citazioni, dottrina | `search_decisions` (minimal) |
| ollama | Classificatore privacy locale | `ollama_check_status` |

## Step 3: Display Results

Present results in the user's language, without technical jargon. Example (IT):

```
╔══════════════════════════════════════════════════════════╗
  BetterCallClaude — Diagnostica Servizi
╠══════════════════════════════════════════════════════════╣

  Servizio                       Stato        Impatto se assente
  ────────                       ─────        ──────────────────
  Sentenze federali (BGE)        ✓ attivo     —
  Sentenze cantonali             ✓ attivo     —
  Banca dati legislativa         ✓ attivo     —
  Verifica citazioni             ✓ attivo     —
  Commentari online              ✓ attivo     —
  Analisi documenti (MCP)        ✓ attivo     —
  Arbitrato sportivo (TAS)       ✓ attivo     —
  Flussi personalizzati          ✓ attivo     —
  Giurisprudenza svizzera        ✓ attivo     —
  Classificatore privacy         ✗ assente    Traduzioni/riassunti non filtrati localmente

  Gateway: https://mcp.bettercallclaude.ch — online
  Servizi attivi: 9/10

╚══════════════════════════════════════════════════════════╝
```

Adapt labels to DE/FR/EN based on user language.

## Step 4: Guidance

### All servers active:
> Tutti i servizi sono operativi. BetterCallClaude funziona a piena capacità.

### Some servers unavailable:
For each unavailable server, explain in plain language:

| Server | Impact if unavailable |
|--------|-----------------------|
| entscheidsuche | Le ricerche di sentenze cantonali non sono disponibili. Le analisi si basano sulle conoscenze generali del modello. |
| bge-search | La ricerca strutturata di sentenze del Tribunale federale non è disponibile. |
| legal-citations | Le citazioni non vengono verificate automaticamente — controllare manualmente. |
| fedlex-sparql | I testi di legge non vengono recuperati in tempo reale. Le citazioni di articoli si basano sulle conoscenze del modello. |
| onlinekommentar | I commentari dottrinali non sono accessibili. |
| legal-persona | L'analisi documenti, la strategia legale e il drafting automatizzato non sono disponibili via MCP. |
| tas-jurisprudence | La ricerca di lodi CAS/TAS non è disponibile. |
| workflows-ch | I flussi di lavoro personalizzati non possono essere salvati o eseguiti. |
| swiss-caselaw | Ricerca giurisprudenziale, catene di citazioni e analisi dottrinale non disponibili. |
| ollama | La classificazione di privacy locale non è attiva. Traduzioni e riassunti non vengono filtrati localmente. |

### Suggested fixes:
> Se un servizio risulta non disponibile:
> 1. Riavviare Cowork Desktop (o Claude Code)
> 2. Verificare la connessione internet
> 3. Eseguire di nuovo `/bettercallclaude:doctor` dopo qualche minuto
> 4. Se il problema persiste, il servizio potrebbe essere temporaneamente offline

### Gateway unreachable:
> Il gateway MCP (mcp.bettercallclaude.ch) non è raggiungibile.
> Possibili cause: assenza di connessione internet, blocco firewall, servizio temporaneamente non disponibile.
> BetterCallClaude funziona in modalità ridotta: le analisi si basano sulle conoscenze del modello senza accesso alle banche dati.

## Backend Error Reference

| Errore | Causa probabile | Soluzione |
|--------|----------------|-----------|
| HTTP 429 | Troppe richieste (limite: 60/min) | Attendere un momento e riprovare |
| Timeout / HTTP 5xx su fedlex | Servizio Fedlex temporaneamente non disponibile | Riprovare più tardi |
| ECONNREFUSED | Il server non raggiunge l'API esterna | Verificare la connessione internet |
| Nessun risultato | Query senza corrispondenze | Provare termini di ricerca più ampi |

---

## User Query

$ARGUMENTS
