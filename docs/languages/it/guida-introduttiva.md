# Guida Introduttiva - BetterCallClaude

**Intelligenza Giuridica per Avvocati Svizzeri** - Versione 1.3.2

---

## Panoramica

BetterCallClaude è un framework completo di intelligenza giuridica che offre agli avvocati svizzeri:

- **80% di risparmio di tempo** nell'analisi dei precedenti e nella ricerca giuridica
- **25% di miglioramento della qualità** attraverso la verifica sistematica
- **Tutti i 26 Cantoni**: Copertura completa di tutti i cantoni svizzeri
- **Precisione multilingue** nella terminologia giuridica (DE, FR, IT, EN)
- **14 agenti specializzati** per conformità, fiscalità, immobiliare e altro
- **Integrazione Ollama** per inferenza LLM locale su dati sensibili

---

## Novità v1.3.2

### Proxy Intelligente (`/legal`)
- **Linguaggio naturale**: Descrivi la tua esigenza semplicemente con le tue parole
- **Routing automatico**: Reindirizzamento agli agenti specializzati appropriati
- **Workflow multi-agente**: Esecuzione coordinata di richieste complesse

### 14 Agenti Specializzati
| Agente | Ambito |
|--------|--------|
| `@researcher` | Ricerca giuridica svizzera |
| `@strategist` | Strategia processuale |
| `@drafter` | Redazione documenti |
| `@compliance` | FINMA, AML/KYC |
| `@data-protection` | GDPR, nLPD/LPD |
| `@risk` | Probabilità, risarcimenti |
| `@procedure` | Termini, CPC/CPP |
| `@translator` | Terminologia DE/FR/IT |
| `@fiscal` | Diritto fiscale, CDI |
| `@corporate` | M&A, contratti |
| `@cantonal` | Tutti i 26 cantoni |
| `@realestate` | Registro fondiario, Lex Koller |

### Integrazione Ollama
- Inferenza LLM locale per lavori sensibili alla privacy
- Nessun trasferimento di dati verso server esterni

---

## Requisiti di Sistema

| Componente | Richiesto | Raccomandato |
|------------|-----------|--------------|
| **Sistema operativo** | macOS, Linux, Windows (WSL2) | macOS o Linux |
| **Claude Code** | Ultima versione | Ultima versione |
| **Node.js** | v18.0.0+ | v20.0.0+ |
| **Python** | 3.10+ | 3.11+ |
| **RAM** | 8GB | 16GB |
| **Spazio disco** | 500MB | 1GB |

---

## Installazione

### Installazione Rapida (Raccomandata)

Il modo più semplice per installare BetterCallClaude è con l'installatore interattivo:

```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash
```

L'installatore ti guida attraverso:
1. **Ambito dell'installazione**: Solo utente o sistema
2. **Percorso server MCP**: Predefinito o personalizzato
3. **Ambiente Python**: Ambiente virtuale, Python di sistema o salta
4. **Opzioni di backup**: Backup automatico delle configurazioni esistenti

### Opzioni di Installazione

```bash
# Anteprima dell'installazione (nessuna modifica)
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --dry-run

# Installazione non-interattiva con valori predefiniti
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --no-interactive

# Forzare la reinstallazione
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --force
```

### Installazione per Sviluppatori

Per lo sviluppo o i contributi:

```bash
git clone https://github.com/fedec65/bettercallclaude.git
cd bettercallclaude
./install.sh
```

### Dopo l'Installazione

Verifica che tutto funzioni:

```bash
# Controllare lo stato dell'installazione
./install.sh doctor
```

### Opzionale: Configurare le Chiavi API

Crea un file `.env` solo se hai bisogno delle funzionalità opzionali:

```bash
# Opzionale - Per ricerca web avanzata
TAVILY_API_KEY=la_tua_chiave_tavily

# Opzionale - Per Ollama LLM locale
OLLAMA_HOST=http://localhost:11434
```

> **Nota**: Quando si utilizza BetterCallClaude tramite Claude Code CLI, non sono richieste chiavi API per le funzionalità di base.

---

## Utilizzo del Proxy Intelligente

Il modo più semplice per usare BetterCallClaude è il proxy intelligente `/legal`:

### Modalità A - Linguaggio Naturale (La Più Semplice)
```
/legal Ho bisogno di analizzare una controversia contrattuale e preparare un atto di citazione
→ Routing automatico: Researcher → Strategist → Drafter
```

### Modalità B - Agente Diretto
```
/legal @compliance Verificare i requisiti FINMA per la custodia di crypto
→ Routing diretto all'agente Compliance Officer
```

### Modalità C - Workflow Esplicito
```
/legal --workflow full "Violazione art. 97 CO, CHF 500'000 in controversia"
→ Esecuzione del workflow definito con checkpoint
```

---

## Comandi

### Comandi di Ricerca Giuridica

| Comando | Descrizione |
|---------|-------------|
| `/legal:research` | Cerca nelle fonti giuridiche svizzere |
| `/legal:analyze` | Analizza gli argomenti giuridici |
| `/legal:compare` | Confronta i precedenti |
| `/legal:strategy` | Sviluppa una strategia processuale |
| `/legal:draft` | Redigi documenti giuridici |

### Comandi Agente

| Comando | Descrizione |
|---------|-------------|
| `/agent:researcher` | Avvia la ricerca giuridica autonoma |
| `/agent:strategist` | Avvia l'analisi strategica |
| `/agent:drafter` | Avvia la redazione documenti |

### Comandi di Aiuto

| Comando | Descrizione |
|---------|-------------|
| `/legal:help` | Mostra l'aiuto dei comandi |
| `/legal:federal` | Forza la modalità diritto federale |
| `/legal:cantonal [CANTONE]` | Forza la modalità diritto cantonale |

---

## Esempi di Utilizzo

### Ricerca Giuridica

```bash
# Avviare Claude Code
claude

# Ricerca DTF
"Cerca DTF sulla responsabilità contrattuale art. 97 CO"

# Con il proxy intelligente
"/legal Trova tutti i DTF rilevanti sul diritto di locazione e la protezione contro le disdette"
```

### Strategia del Caso

```bash
"/legal @strategist Analizza la strategia processuale per una violazione del contratto ai sensi dell'art. 97 CO"
```

### Redazione di Documenti

```bash
"/legal @drafter Redigi un contratto di servizi secondo il CO svizzero per lo sviluppo software"
```

### Verifica di Conformità

```bash
"/legal @compliance Verifica i requisiti LRD per una transazione immobiliare di CHF 2 Mio."
```

---

## Cantoni Supportati

BetterCallClaude v1.3.2 supporta tutti i 26 cantoni svizzeri:

| Germanofoni | Francofoni | Italiano/Romancio |
|-------------|------------|-------------------|
| ZH, BE, LU, UR | GE, VD, NE, JU | TI, GR |
| SZ, OW, NW, GL | FR (bilingue) | |
| ZG, SO, BS, BL | BE, VS (bilingue) | |
| SH, AR, AI, SG | | |
| AG, TG | | |

---

## Server MCP

### Server Entscheidsuche
Cerca le decisioni su bundesgericht.ch e tribunali cantonali.

### Server Legal Citations
Verifica e formatta le citazioni secondo gli standard svizzeri:
- Formato DTF (DTF 123 III 456)
- Formati cantonali (tutti i 26 cantoni)
- Adattamento multilingue

---

## Risoluzione dei Problemi

### Framework non caricato
```bash
# Controllare lo stato dell'installazione
./install.sh doctor

# Riavviare Claude Code
claude
```

### Problemi del Server MCP
```bash
# Eseguire il comando doctor
./install.sh doctor

# Reinstallare i moduli Node
cd mcp-servers/legal-citations
rm -rf node_modules
npm install
npm run build
```

### Cantone sbagliato applicato
- Tutti i 26 cantoni sono supportati in v1.3.2
- Usa le abbreviazioni cantonali standard (ZH, BE, GE, etc.)
- Menzione esplicita: "secondo il diritto di TI"

---

## Risorse Aggiuntive

- [Documentazione in inglese](../../getting-started.md)
- [Riferimento dei Comandi](../../.claude/commands/legal:help.md)
- [Repository GitHub](https://github.com/fedec65/bettercallclaude)

---

## Avvertenza

**IMPORTANTE**: BetterCallClaude è uno strumento di ricerca e analisi giuridica. Tutti i risultati:

- Richiedono una revisione professionale da parte di un avvocato
- Non costituiscono consulenza legale
- Possono contenere errori o omissioni
- Devono essere verificati presso le fonti ufficiali
- Devono essere adattati alle circostanze specifiche del caso

**Gli avvocati mantengono la piena responsabilità professionale per tutti i lavori giuridici.**

---

*BetterCallClaude v1.3.2 - Intelligenza Giuridica per gli Avvocati Svizzeri*
