# Getting Started with BetterCallClaude

**Welcome to BetterCallClaude v2.2.1** - Your AI-powered legal intelligence framework for Swiss law.

This guide will help you set up and start using BetterCallClaude for legal research, case strategy, and document drafting.

---

## 📋 Table of Contents

1. [What is BetterCallClaude?](#what-is-bettercallclaude)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [First Steps](#first-steps)
5. [Using the Intelligent Proxy](#using-the-intelligent-proxy)
6. [Using the Legal Personas](#using-the-legal-personas)
7. [Specialized Agents](#specialized-agents)
8. [Understanding Swiss Law Modes](#understanding-swiss-law-modes)
9. [Multi-Lingual Usage](#multi-lingual-usage)
10. [Common Workflows](#common-workflows)
11. [Tips & Best Practices](#tips--best-practices)
12. [Troubleshooting](#troubleshooting)
13. [Next Steps](#next-steps)

---

## What is BetterCallClaude?

BetterCallClaude is a specialized legal intelligence framework built on Claude Code that helps Swiss lawyers with:

- **Legal Research**: Search and analyze BGE (Bundesgericht) precedents, federal statutes, and cantonal law
- **Case Strategy**: Develop litigation strategies with evidence-based risk assessments
- **Document Drafting**: Create Swiss-standard contracts, court submissions, and legal opinions
- **Intelligent Routing**: The `/legal` proxy automatically routes your queries to the right specialized agents

### Key Benefits

✅ **Save 80% of time** on legal research and precedent analysis
✅ **Improve quality by 25%** through systematic verification
✅ **All 26 cantons**: Complete coverage of Swiss cantonal law systems
✅ **Multi-lingual**: Native support for DE, FR, IT, EN with proper legal terminology
✅ **Citation accuracy >95%**: Automated verification against official sources
✅ **14 specialized agents**: Domain experts for compliance, tax, real estate, and more
✅ **Ollama integration**: Local LLM inference for privacy-sensitive work

---

## Prerequisites

Before you begin, ensure you have:

### System Requirements

| Component | Required | Recommended |
|-----------|----------|-------------|
| **OS** | macOS, Linux, Windows 10+ | macOS or Linux |
| **Claude Code** | Latest version | Latest version |
| **Node.js** | v18.0.0+ | v20.0.0+ |
| **Python** | 3.10+ | 3.11+ |
| **RAM** | 8GB | 16GB |
| **Disk Space** | 500MB | 1GB |

> **Windows Users**: Native Windows is now supported! See [Windows Installation Guide](windows-installation.md) for PowerShell-based installation, or use WSL2 with the standard bash installer.

### Optional API Keys
- **Tavily API Key**: For enhanced web research at [app.tavily.com](https://app.tavily.com/)
- **Ollama**: For local LLM inference (privacy-sensitive work)

> **Note**: When using BetterCallClaude via Claude Code CLI, no API keys are required for basic functionality. Claude Code handles authentication automatically.

---

## Installation

### Quick Install - macOS / Linux (Recommended)

The easiest way to install BetterCallClaude is with the interactive installer:

```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash
```

The installer will guide you through:
1. **Installation scope**: User-only or system-wide
2. **MCP server location**: Default or custom path
3. **Python environment**: Virtual environment, system Python, or skip
4. **Backup options**: Automatic backup of existing configurations

### Quick Install - Windows (Native)

Open PowerShell as Administrator and run:

```powershell
irm https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.ps1 | iex
```

> **Note**: For detailed Windows instructions, see the [Windows Installation Guide](windows-installation.md).

### Installation Options

**macOS / Linux:**
```bash
# Preview what will be installed (no changes made)
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --dry-run

# Non-interactive installation with defaults
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --no-interactive

# Force reinstall
curl -fsSL https://raw.githubusercontent.com/fedec65/bettercallclaude/main/install.sh | bash -s -- --force
```

**Windows:**
```powershell
# Preview what will be installed (no changes made)
.\install.ps1 -DryRun

# Non-interactive installation with defaults
.\install.ps1 -NoInteractive

# Force reinstall
.\install.ps1 -Force
```

### Developer Installation

For development or contributing:

```bash
# macOS / Linux
git clone https://github.com/fedec65/bettercallclaude.git
cd bettercallclaude
./install.sh
```

```powershell
# Windows
git clone https://github.com/fedec65/bettercallclaude.git
cd bettercallclaude
.\install.ps1
```

### Post-Installation

After installation, verify everything is working:

```bash
# macOS / Linux
./install.sh doctor
# Or if installed globally
bettercallclaude doctor
```

```powershell
# Windows
.\install.ps1 -Doctor
# Or from any location
bettercallclaude doctor
```

### CLI Management Commands

BetterCallClaude includes a CLI for managing your installation:

| Command | Description |
|---------|-------------|
| `bettercallclaude doctor` | Check installation health and MCP server status |
| `bettercallclaude mcp-setup` | Register MCP servers in Claude Code settings |
| `bettercallclaude repair` | Fix broken symlinks and reinstall commands |
| `bettercallclaude update` | Update to the latest version |
| `bettercallclaude list` | List all installed commands |
| `bettercallclaude version` | Show version and check for updates |
| `bettercallclaude help` | Show all available commands |

### Optional: Configure API Keys

Create a `.env` file only if you need optional features:

```bash
# Optional - For enhanced web research
TAVILY_API_KEY=your_tavily_key

# Optional - For Ollama local LLM
OLLAMA_HOST=http://localhost:11434
```

---

## First Steps

### Starting Claude Code

Open your terminal and start Claude Code:

```bash
claude
```

Claude Code will automatically detect and load the BetterCallClaude framework configuration.

### Your First Query

Try a simple legal research query:

```
"Search BGE for recent decisions on Art. 62 OR"
```

BetterCallClaude will:
1. Automatically activate the **Legal Researcher** persona
2. Search bundesgericht.ch using the **entscheidsuche** MCP server
3. Verify citations using the **legal-citations** MCP server
4. Present structured analysis with proper Swiss legal terminology

### Understanding the Response

The response will include:
- **Persona**: Which legal expert is responding (🎭)
- **Mode**: Which Swiss law mode is active (📖)
- **Jurisdiction**: Federal or cantonal law context (🇨🇭)
- **Analysis**: Legal analysis with proper citations
- **Sources**: BGE references with verification status

---

## Using the Intelligent Proxy

The easiest way to use BetterCallClaude is the `/legal` intelligent proxy. It understands natural language and routes your request to the right agent(s).

### Three Usage Modes

**Mode A - Natural Language (Simplest)**:
```
/legal I need to analyze a contract dispute and prepare a Klageschrift
→ Automatically routes: Researcher → Strategist → Drafter
```

**Mode B - Direct Agent**:
```
/legal @compliance Check FINMA requirements for crypto custody
→ Routes directly to Compliance Officer agent
```

**Mode C - Explicit Workflow**:
```
/legal --workflow full "Art. 97 OR breach, CHF 500,000 dispute"
→ Executes defined pipeline with checkpoints
```

### Available Agent Routes

| Route | Agent | Purpose |
|-------|-------|---------|
| `@researcher` | ResearcherAgent | Swiss legal research |
| `@strategist` | StrategistAgent | Litigation strategy |
| `@drafter` | DrafterAgent | Document drafting |
| `@compliance` | Compliance Officer | FINMA, AML/KYC |
| `@data-protection` | Data Protection | GDPR, nDSG/FADP |
| `@risk` | Risk Analyst | Probability, damages |
| `@procedure` | Procedure Specialist | Deadlines, ZPO/StPO |
| `@translator` | Legal Translator | DE/FR/IT terminology |
| `@fiscal` | Fiscal Expert | Tax law, DTAs |
| `@corporate` | Corporate & Commercial | M&A, contracts |
| `@cantonal` | Cantonal Law Expert | All 26 cantons |
| `@realestate` | Real Estate Expert | Grundbuch, Lex Koller |

---

## Using the Legal Personas

BetterCallClaude has **three specialized legal expert personas** that automatically activate based on your query:

### 1. Legal Researcher 📚

**Activation Keywords**: "search BGE", "find precedents", "relevant case law", "Art. [X]", "federal law"

**Capabilities**:
- BGE precedent search and analysis
- Statutory analysis (ZGB, OR, StGB, StPO, ZPO, BV)
- Multi-lingual legal research
- Citation verification and formatting

**Example Queries**:
```
"Search BGE for precedents on contractual liability under Art. 97 OR"
"Find decisions on good faith principle (Art. 2 ZGB)"
"What does the Federal Supreme Court say about Art. 41 OR unlawful act requirements?"
```

### 2. Case Strategist ⚔️

**Activation Keywords**: "case strategy", "litigation approach", "risk assessment", "chances of success", "settlement value"

**Capabilities**:
- Litigation strategy development
- Evidence-based risk probability assessment
- Procedural strategy analysis (ZPO federal + cantonal)
- Settlement value calculation

**Example Queries**:
```
"Analyze litigation strategy for breach of contract case, CHF 500,000 damages"
"Assess the chances of success for a negligence claim under Art. 41 OR"
"What are the procedural options for this case in Zürich Canton?"
```

### 3. Legal Drafter ✍️

**Activation Keywords**: "draft contract", "prepare agreement", "write brief", "legal opinion", "memorandum"

**Capabilities**:
- Contract drafting (Swiss OR framework)
- Court submissions (complaints, responses, appeals)
- Legal opinions and memoranda
- Multi-lingual document creation

**Example Queries**:
```
"Draft a service agreement under Swiss OR for software development"
"Prepare a complaint for breach of contract in Zürich commercial court"
"Write a legal opinion on liability under Art. 41 OR"
```

---

## Understanding Swiss Law Modes

BetterCallClaude operates in **three Swiss law modes** that provide the correct legal framework:

### 1. Federal Law Mode 🇨🇭

**Automatic Activation**: Keywords like "federal law", "Bundesrecht", "BGE", "Art. [X] ZGB/OR/StGB"

**Coverage**:
- **ZGB**: Zivilgesetzbuch (Civil Code)
- **OR**: Obligationenrecht (Code of Obligations)
- **StGB**: Strafgesetzbuch (Criminal Code)
- **StPO**: Strafprozessordnung (Criminal Procedure)
- **ZPO**: Zivilprozessordnung (Civil Procedure)
- **BV**: Bundesverfassung (Federal Constitution)

**Example**:
```
"Explain Art. 41 OR liability requirements"
→ Federal Law Mode activated
→ Analysis based on Swiss federal law and BGE precedents
```

### 2. Cantonal Law Mode 🏛️

**Automatic Activation**: Canton codes or canton names

**Supported Cantons** (v1.3.2 - All 26 cantons):

| German-speaking | French-speaking | Italian/Romansh |
|-----------------|-----------------|-----------------|
| ZH, BE, LU, UR | GE, VD, NE, JU | TI, GR |
| SZ, OW, NW, GL | FR (bilingual) | |
| ZG, SO, BS, BL | BE, VS (bilingual) | |
| SH, AR, AI, SG | | |
| AG, TG | | |

**Example**:
```
"What are the court fees for commercial litigation in Zürich?"
→ Cantonal Law Mode (ZH) activated
→ Analysis based on Zürich cantonal law and court rules
```

### 3. Multi-Lingual Mode 🌐

**Automatic Activation**: Detects your input language or mixed-language queries

**Supported Languages**:
- **German (DE)**: Primary Swiss language
- **French (FR)**: Western Switzerland
- **Italian (IT)**: Ticino region
- **English (EN)**: International contexts

**Example**:
```
Query in French: "Quels sont les délais de prescription selon l'art. 127 CO?"
→ Multi-Lingual Mode (FR) activated
→ Response in French with proper legal terminology
→ Cross-references provided in DE/IT where relevant
```

---

## Using Explicit Commands (Professional Mode)

### Why Use Explicit Commands?

BetterCallClaude supports **two activation methods**:

1. **Natural Language** (Auto-Detection) - Just ask your question naturally
2. **Explicit Commands** (Professional Assurance) - Use `/legal:` prefix for certainty

**When to use explicit `/legal:` commands:**
- ✅ Creating client deliverables or billable work
- ✅ Need audit trail for professional documentation
- ✅ Want absolute certainty framework is active
- ✅ Working on high-stakes legal matters
- ✅ Teaching or demonstrating the framework

### Available Commands

#### Persona Commands

**`/legal:research`** - Legal Research & Precedent Analysis
```
/legal:research Art. 97 OR contractual liability

Response includes:
🎭 Persona: Legal Researcher (/legal:research activated)
📖 Mode: Federal Law
🇨🇭 Jurisdiction: Swiss Federal Law
```

**`/legal:strategy`** - Case Strategy & Litigation Planning
```
/legal:strategy Breach of contract case, CHF 500,000 damages

Response includes:
🎭 Persona: Case Strategist (/legal:strategy activated)
⚖️ Analysis Type: Strategic Assessment
```

**`/legal:draft`** - Document Creation & Drafting
```
/legal:draft Service agreement under Swiss OR

Response includes:
🎭 Persona: Legal Drafter (/legal:draft activated)
📄 Document Type: Contract
```

#### Mode Override Commands

**`/legal:federal`** - Force Federal Law Mode
```
/legal:federal
Explain Art. 41 OR liability requirements
```

**`/legal:cantonal [CANTON]`** - Force Cantonal Law Mode
```
/legal:cantonal ZH
Court fees for Zürich Commercial Court

Supported cantons: All 26 Swiss cantons
```

#### Help Command

**`/legal:help`** - Show All Commands
```
/legal:help

Shows complete command reference with examples
```

### Command Combinations

You can combine persona and mode commands:

```bash
# Federal research
/legal:federal
/legal:research BGE on Art. 97 OR

# Zürich strategy
/legal:cantonal ZH
/legal:strategy Commercial dispute options

# Geneva drafting (French)
/legal:cantonal GE
/legal:draft Complaint for Tribunal de première instance
```

### Natural Language vs. Explicit Commands

**Same Query, Two Ways:**

**Natural Language (Auto-Detection):**
```
Query: "Search BGE for Art. 97 OR cases"

Response:
🎭 Persona: Legal Researcher
📖 Mode: Federal Law
[Analysis...]
```

**Explicit Command:**
```
Query: /legal:research Art. 97 OR

Response:
🎭 Persona: Legal Researcher (/legal:research activated)
📖 Mode: Federal Law
⚡ Activation: Explicit command override
[Analysis...]
```

**Key Difference**: Explicit commands show activation confirmation and override any ambiguity.

---

## Multi-Lingual Usage

### Language Detection

BetterCallClaude automatically detects your input language:

```
German input:    "Suche BGE zu Art. 97 OR"
French input:    "Rechercher ATF sur art. 97 CO"
Italian input:   "Cercare DTF su art. 97 CO"
English input:   "Search BGE on Art. 97 OR"
```

All queries will receive appropriate responses in the input language with correct legal terminology.

### Citation Formats

Citations automatically adapt to your language:

| Language | Statute | BGE | Format |
|----------|---------|-----|--------|
| German   | Art. 1 Abs. 2 OR | BGE 145 III 229 | Art. X Abs. Y [Statute] |
| French   | art. 1 al. 2 CO | ATF 145 III 229 | art. X al. Y [Statute] |
| Italian  | art. 1 cpv. 2 CO | DTF 145 III 229 | art. X cpv. Y [Statute] |
| English  | Art. 1 para. 2 OR | BGE 145 III 229 | Art. X para. Y [Statute] |

### Legal Terminology

BetterCallClaude maintains proper legal terminology across languages:

```
German:   Widerrechtlichkeit, Schaden, Verschulden
French:   illicéité, dommage, faute
Italian:  illiceità, danno, colpa
English:  unlawfulness, damage, fault
```

---

## Common Workflows

### Workflow 1: Legal Research for a Case

**Goal**: Find relevant BGE precedents for a contractual liability case

```bash
# Step 1: Search for precedents
"Search BGE for cases on Art. 97 OR contractual liability"

# Step 2: Analyze specific decision
"Explain the key holding in BGE 142 III 102"

# Step 3: Compare with other precedents
"How does BGE 142 III 102 compare to BGE 140 III 86?"

# Step 4: Get citation formatting
"Format the citation for BGE 142 III 102 in French (ATF format)"
```

### Workflow 2: Develop Case Strategy

**Goal**: Assess litigation options for a breach of contract dispute

```bash
# Step 1: Case analysis
"Analyze case strategy for breach of contract, CHF 300,000 damages, Zürich jurisdiction"

# Step 2: Risk assessment
"What are the chances of success given these facts: [describe facts]"

# Step 3: Procedural options
"What procedural options do we have under ZPO Zürich?"

# Step 4: Settlement analysis
"Calculate appropriate settlement range based on risk assessment"
```

### Workflow 3: Draft Legal Document

**Goal**: Create a service agreement under Swiss law

```bash
# Step 1: Initial draft
"Draft a service agreement under Swiss OR for software development services"

# Step 2: Add specific clauses
"Add a liability limitation clause compliant with Art. 100 OR"

# Step 3: Review and refine
"Review the liability clause for enforceability under Swiss law"

# Step 4: Multi-lingual version
"Translate the agreement to French with proper legal terminology"
```

---

## Tips & Best Practices

### 1. Be Specific with Your Queries

❌ **Less Effective**: "Tell me about contracts"
✅ **More Effective**: "Explain the formation requirements for contracts under Art. 1 OR"

### 2. Include Relevant Context

Provide case-specific information for better analysis:
- Jurisdiction (federal, canton)
- Relevant statutes (Art. X OR/ZGB)
- Key facts or circumstances
- Language preference

### 3. Use Proper Swiss Legal Citations

When referencing statutes, use the Swiss citation format:
- **Correct**: "Art. 97 OR"
- **Incorrect**: "Article 97 of the Swiss Code of Obligations"

### 4. Leverage Multi-Lingual Capabilities

Switch languages naturally:
```
"Analyse en français: Art. 97 CO"  (French analysis)
"Erkläre auf Deutsch: Art. 97 OR" (German analysis)
"Spiega in italiano: Art. 97 CO" (Italian analysis)
```

### 5. Verify Critical Information

Always verify:
- BGE citations against bundesgericht.ch
- Statutory references against fedlex.admin.ch
- Cantonal law against official cantonal sources

### 6. Use Personas Strategically

Activate the right persona for your task:
- **Research** → Legal Researcher
- **Strategy** → Case Strategist
- **Drafting** → Legal Drafter

---

## Troubleshooting

### Issue: Framework Not Loading

**Symptoms**: Claude Code doesn't recognize BetterCallClaude commands

**Solutions**:
1. Verify Claude Code is installed: `claude --version`
2. Run the doctor command: `./install.sh doctor`
3. Check framework directory is in correct location
4. Restart Claude Code

### Issue: MCP Servers Not Responding

**Symptoms**: No BGE search results or citation verification, messages like "MCP servers not installed or configured"

**Solutions**:
1. Run the doctor command to check status:
   ```bash
   bettercallclaude doctor
   ```
2. If paths are invalid, run the MCP setup command:
   ```bash
   bettercallclaude mcp-setup
   ```
3. Check MCP servers are built:
   ```bash
   cd ~/.bettercallclaude/mcp-servers && npm run build
   ```
4. Restart Claude Code to reload MCP server configuration
5. Verify API keys in `.env` file (if using Tavily)
6. Check network connectivity

### Issue: MCP Server Paths Invalid

**Symptoms**: `bettercallclaude doctor` shows `[✗]` for MCP servers with "(path invalid)"

**Cause**: The MCP server paths in `~/.claude/settings.json` don't match actual file locations

**Solutions**:
1. Run the MCP setup command to fix paths:
   ```bash
   bettercallclaude mcp-setup
   ```
2. Restart Claude Code after running mcp-setup
3. Verify with doctor command:
   ```bash
   bettercallclaude doctor
   ```

### Issue: Wrong Language Output

**Symptoms**: Response in unexpected language

**Solutions**:
1. Explicitly state preferred language in query
2. Check `config.yaml` language settings
3. Use language codes: "in German", "auf Deutsch", "en français"

### Issue: Cantonal Law Not Applied

**Symptoms**: Federal law applied instead of cantonal law

**Solutions**:
1. Explicitly mention canton: "according to ZH law"
2. All 26 cantons are supported in v1.3.2
3. Use standard canton abbreviations (ZH, BE, GE, etc.)

### Issue: Citation Not Found

**Symptoms**: BGE citation cannot be verified

**Solutions**:
1. Verify citation format: "BGE [volume] [section] [page]"
2. Check for typos in citation
3. Use entscheidsuche search: "search BGE for [topic]"
4. Verify against bundesgericht.ch manually

---

## Next Steps

### Explore Advanced Features

- [Legal Research Workflow](workflows/research-precedents.md) - Deep dive into BGE precedent research
- [Case Strategy Workflow](workflows/case-strategy.md) - Advanced litigation strategy development
- [Document Drafting Workflow](workflows/draft-contracts.md) - Professional document creation

### Multi-Lingual Documentation

- [Deutsch: Erste Schritte](languages/de/erste-schritte.md)
- [Français: Guide de Démarrage](languages/fr/guide-demarrage.md)
- [Italiano: Guida Introduttiva](languages/it/guida-introduttiva.md)

### Configuration

Customize BetterCallClaude for your practice:
- [Configuration Guide](configuration.md)
- [Privacy Settings](privacy.md)
- [MCP Server Setup](mcp-servers.md)

### Community

Join the Swiss legal tech community:
- [GitHub Discussions](https://github.com/yourusername/bettercallclaude/discussions)
- [Report Issues](https://github.com/yourusername/bettercallclaude/issues)
- [Contributing Guide](../CONTRIBUTING.md)

---

## Support

Need help? We're here for you:

- **Documentation**: Browse all guides at [docs/](../docs/)
- **GitHub Issues**: Report bugs at [github.com/yourusername/bettercallclaude/issues](https://github.com/yourusername/bettercallclaude/issues)
- **Community Q&A**: Ask questions at [GitHub Discussions](https://github.com/yourusername/bettercallclaude/discussions)

---

## Professional Disclaimer

**IMPORTANT**: BetterCallClaude is a legal research and analysis tool. All outputs:

- Require professional lawyer review and validation
- Do not constitute legal advice
- May contain errors or omissions
- Should be verified against official sources
- Must be adapted to specific case circumstances

**Lawyers maintain full professional responsibility for all legal work products.**

---

**Welcome to BetterCallClaude!** 🎉

You're now ready to transform your legal research and case strategy with AI-powered intelligence.

*BetterCallClaude v2.2.1 - Built for Swiss Legal Professionals*
