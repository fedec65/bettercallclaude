# BetterCallClaude -- Swiss Legal Intelligence Plugin for Cowork and Claude Code

BetterCallClaude is a plugin for legal professionals working in Cowork or Claude Code. It transforms legal research, case strategy, and document drafting for Swiss lawyers by providing deep integration with Swiss legal databases, multi-lingual analysis across German, French, Italian, and English, and built-in privacy protection for attorney-client privilege.

The plugin covers the full spectrum of Swiss legal work: BGE/ATF/DTF precedent research, case strategy development with risk assessment, adversarial legal analysis, compliance and data protection advisory, fiscal and corporate law expertise, real estate law, legal drafting with jurisdiction-aware templates, legal translation, and citation verification across all 26 Swiss cantons. Privacy compliance with Anwaltsgeheimnis (Art. 321 StGB) is enforced automatically through a pre-tool-use hook that detects privileged content before it leaves the local environment.

**Version**: 2.2.4 -- 17 agents, 15 commands, 9 skills, 5 MCP servers.

---

## Installation

BetterCallClaude can be installed through three channels.

### From GitHub (Available Now)

Register the marketplace and install the plugin from within Cowork or Claude Code:

```
/plugin marketplace add fedec65/BetterCallClaude_Marketplace
/plugin install bettercallclaude@bettercallclaude-marketplace
```

### Official Marketplace (Coming Soon)

Once accepted into the Anthropic official plugin catalog:

```
/plugin install bettercallclaude@claude-plugins-official
```

### Manual Installation

Clone the repository and point Claude Code to the plugin directory:

```bash
git clone https://github.com/fedec65/BetterCallClaude_Marketplace.git
cd BetterCallClaude_Marketplace
claude --plugin-dir ./plugins/bettercallclaude
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `/bettercallclaude:legal` | Intelligent gateway -- analyzes intent, routes to the appropriate specialist agent, and manages multi-step legal workflows. |
| `/bettercallclaude:research` | Search Swiss legal precedents and compile research memoranda. Supports BGE/ATF/DTF databases, doctrine references, and cross-jurisdictional analysis. |
| `/bettercallclaude:strategy` | Develop litigation strategy with risk assessment, cost-benefit analysis, and procedural pathway evaluation. |
| `/bettercallclaude:draft` | Draft Swiss legal documents including contracts, court briefs, legal opinions, and memoranda with proper citation formatting. |
| `/bettercallclaude:cite` | Verify and format Swiss legal citations across all four national languages (BGE/ATF/DTF formats). |
| `/bettercallclaude:validate` | Validate Swiss legal citations in bulk -- check format, existence, and cross-language consistency. |
| `/bettercallclaude:precedent` | Search and analyze BGE/ATF/DTF precedents with precedent chain tracking and evolution analysis. |
| `/bettercallclaude:federal` | Analyze a legal question under federal Swiss law (ZGB, OR, StGB, BV, and related federal statutes). |
| `/bettercallclaude:cantonal` | Analyze a legal question under cantonal law for a specific canton. |
| `/bettercallclaude:adversarial` | Run three-agent adversarial analysis -- advocate builds the case, adversary challenges it, judicial analyst synthesizes. |
| `/bettercallclaude:workflow` | Define and execute multi-agent legal workflows (due diligence, litigation prep, contract lifecycle, real estate closing). |
| `/bettercallclaude:translate` | Translate Swiss legal documents between DE, FR, IT, and EN while preserving legal terminology precision. |
| `/bettercallclaude:doc-analyze` | Analyze Swiss legal documents -- identify legal issues, extract key clauses, verify citations, assess compliance. |
| `/bettercallclaude:help` | Show complete command reference, available agents, skills, and usage examples. |
| `/bettercallclaude:version` | Display plugin version, installed components, and system status. |

### Usage examples

```
/bettercallclaude:legal I need to assess our exposure under Art. 97 OR for late delivery

/bettercallclaude:research Art. 97 OR contractual liability for late delivery

/bettercallclaude:strategy Commercial lease dispute in Zurich, landlord claims CHF 200k damages

/bettercallclaude:draft Employment contract for a software engineer in Geneva, bilingual DE/FR

/bettercallclaude:adversarial Is the non-compete clause in this employment contract enforceable?

/bettercallclaude:workflow litigation-prep Personal injury claim against manufacturer

/bettercallclaude:translate DE->FR Klageschrift for Geneva commercial court

/bettercallclaude:precedent Art. 2 ZGB good faith principle evolution since 2015

/bettercallclaude:doc-analyze @contract.pdf Review this commercial lease agreement

/bettercallclaude:cantonal ZH Commercial court jurisdiction for contract disputes over CHF 30k
```

---

## Skills

Skills are activated automatically when Claude detects relevant legal context in your conversation. You do not need to invoke them manually.

| Skill | Purpose |
|-------|---------|
| `swiss-legal-research` | Precedent analysis methodology, BGE search strategies, source evaluation, and research memorandum structure. |
| `swiss-legal-strategy` | Case assessment frameworks, risk matrices, procedural pathway analysis, and settlement evaluation. |
| `swiss-legal-drafting` | Document generation standards, clause libraries, mandatory law compliance checks, and formatting rules. |
| `swiss-citation-formats` | Citation format tables for DE/FR/IT/EN, BGE/ATF/DTF reference standards, doctrine citation rules, and cross-language conversion. |
| `swiss-jurisdictions` | Federal vs. cantonal jurisdiction routing, competence analysis, court system hierarchies for all 26 cantons, and conflict-of-law rules. |
| `privacy-routing` | Anwaltsgeheimnis detection patterns, privacy classification, and local processing triggers for privileged content. |
| `adversarial-analysis` | Three-agent adversarial methodology (advocate/adversary/judicial), argument scoring, objectivity validation, and Erwagung synthesis structure. |
| `compliance-frameworks` | FINMA supervision, GwG/AMLA anti-money laundering, FIDLEG/FINIG financial institution licensing, banking secrecy, and cross-border compliance. |
| `data-protection-law` | nDSG/FADP framework, GDPR adequacy, cantonal data protection laws (IDG/KDSG/LIPAD), DPIA methodology, and cross-border data transfers. |

---

## Agents

The plugin includes 17 specialized subagents that handle complex multi-step legal workflows.

### Core Agents

| Agent | Description |
|-------|-------------|
| **Researcher** | Six-step research workflow: parse question, search BGE/ATF/DTF, search cantonal courts, evaluate sources, identify doctrine, compile memorandum with verified citations. |
| **Strategist** | Five-step strategy workflow: analyze facts, assess claim strength, map procedural pathways, evaluate settlement value, produce strategy memorandum. |
| **Drafter** | Six-step drafting workflow: determine document type, select template, draft with proper terminology, insert citations, run compliance checks, produce final document. |

### Domain Specialist Agents

| Agent | Description |
|-------|-------------|
| **Citation Specialist** | Citation verification and cross-language conversion (BGE/ATF/DTF), format validation, overruling detection. |
| **Compliance Officer** | FINMA regulatory compliance, GwG/AMLA AML/KYC, FIDLEG/FINIG licensing, banking secrecy analysis. |
| **Data Protection Specialist** | nDSG/FADP analysis, GDPR adequacy, cantonal data protection laws, DPIA methodology, cross-border transfers. |
| **Risk Analyst** | Risk matrices, probability assessment, cost-benefit analysis, exposure quantification, scenario modeling. |
| **Procedure Specialist** | ZPO/CPC civil procedure, StPO/CPP criminal procedure, SchKG/LP debt collection, forum selection, appeal pathways. |
| **Fiscal Law Expert** | Federal/cantonal tax (DBG/LIFD, StHG/LHID, MWSTG/LTVA), tax treaties, transfer pricing, tax planning. |
| **Corporate & Commercial Law Expert** | AG/SA and GmbH/Sarl formation, M&A, corporate governance, restructuring, commercial contracts. |
| **Real Estate Law Expert** | Grundbuch/RF, lex Koller, tenancy law (OR 253ff), construction law, KKBB, real estate transactions. |
| **Legal Translator** | Legal translation DE/FR/IT/EN, terminology consistency, official Swiss term registers, bilingual document production. |
| **Cantonal Law Expert** | All 26 cantons, cantonal constitutions, intercantonal concordats, cantonal court systems, cantonal procedural specifics. |

### Orchestration and Adversarial Agents

| Agent | Description |
|-------|-------------|
| **Workflow Orchestrator** | Multi-agent pipeline coordination, workflow templates (due diligence, litigation prep, contract lifecycle, real estate closing), agent routing. |
| **Advocate** | Builds the strongest possible case in favor of a legal position with supporting BGE precedents and doctrine. |
| **Adversary** | Challenges a legal position by finding weaknesses, counter-precedents, and opposing arguments. |
| **Judicial Analyst** | Neutral synthesis of advocate and adversary positions using Swiss Erwagung (consideration) structure with risk probabilities. |

### Adversarial Analysis Workflow

The adversarial analysis workflow uses three agents in sequence to provide balanced legal assessment:

1. **Advocate** builds the strongest case for the position, identifying supporting precedents, statutory provisions, and doctrinal authority.
2. **Adversary** challenges the position systematically, finding counter-precedents, doctrinal criticism, factual weaknesses, and procedural obstacles.
3. **Judicial Analyst** synthesizes both positions using Swiss Erwagung methodology, assigning probability scores to each legal issue and recommending a course of action.

Invoke with `/bettercallclaude:adversarial` followed by the legal question.

### Multi-Agent Workflows

The workflow orchestrator supports predefined pipelines:

| Workflow | Pipeline | Description |
|----------|----------|-------------|
| `due-diligence` | Researcher -> Compliance -> Corporate -> Risk | Corporate due diligence with regulatory and risk assessment. |
| `litigation-prep` | Researcher -> Strategist -> Adversarial -> Drafter | Full litigation preparation with adversarial stress-testing. |
| `contract-lifecycle` | Drafter -> Compliance -> Citation -> Translator | Contract creation with compliance review and translation. |
| `real-estate-closing` | Real Estate -> Compliance -> Fiscal -> Drafter | Real estate transaction with regulatory and tax analysis. |

Invoke with `/bettercallclaude:workflow` followed by the workflow name and case description.

---

## Language Support

BetterCallClaude supports all four Swiss national languages plus English for legal analysis:

| Language | Code | Legal Context |
|----------|------|---------------|
| German | DE | Primary language for federal statutes (ZGB, OR, StGB). Used in ZH, BE, BS, and German-speaking cantons. |
| French | FR | Official text for CO, CC, CP. Used in GE, VD, and French-speaking cantons. Bern is bilingual (DE/FR). |
| Italian | IT | Official text for CO, CC, CP. Used in TI and Italian-speaking regions. |
| English | EN | Supported as working language with Swiss legal context. Terms are mapped to their official Swiss equivalents. |

Language detection is automatic. When you write in German, the plugin responds with German legal terminology and citation formats (BGE, Art., Abs., E.). When you write in French, it switches to ATF, art., al., and consid. formats. You can also request a specific language explicitly.

---

## Jurisdictions

### Federal Law

Federal law is the default jurisdiction when no canton is specified. The plugin covers all major federal codes:

- BV / Cst. / Cost. (Federal Constitution)
- ZGB / CC (Civil Code)
- OR / CO (Code of Obligations)
- StGB / CP (Criminal Code)
- ZPO / CPC (Civil Procedure)
- StPO / CPP (Criminal Procedure)
- SchKG / LP (Debt Collection and Bankruptcy)
- UWG / LCD (Unfair Competition Act)
- DSG / LPD (Data Protection Act)
- DBG / LIFD (Federal Direct Tax Act)
- StHG / LHID (Tax Harmonization Act)
- MWSTG / LTVA (Value Added Tax Act)
- GwG / LBA (Anti-Money Laundering Act)
- FIDLEG / LSFin (Financial Services Act)
- FINIG / LEFin (Financial Institutions Act)
- BankG / LB (Banking Act)

### Cantonal Law

All 26 Swiss cantons are fully configured with court system details, citation formats, and MCP search capability via entscheidsuche.ch:

| Canton | Code | Language | Key Characteristics |
|--------|------|----------|---------------------|
| **German-speaking** | | | |
| Aargau | AG | DE | Third largest by population. Industrial center, energy sector. |
| Appenzell I.Rh. | AI | DE | Smallest canton. Landsgemeinde tradition. |
| Appenzell A.Rh. | AR | DE | Rural canton. Textile heritage. |
| Basel-Landschaft | BL | DE | Suburban to Basel. Pharmaceutical industry. |
| Basel-Stadt | BS | DE | Pharmaceutical and life sciences center. Cross-border commerce. |
| Glarus | GL | DE | Landsgemeinde tradition. Industrial heritage. |
| Luzern | LU | DE | Central Switzerland hub. Tourism center. |
| Nidwalden | NW | DE | Business-friendly. Low tax canton. |
| Obwalden | OW | DE | Low tax canton. Private banking. |
| Schaffhausen | SH | DE | Northernmost canton. Cross-border with Germany. |
| Schwyz | SZ | DE | Origin of Swiss name. No inheritance tax. |
| Solothurn | SO | DE | Watch industry center (Jura arc). |
| St. Gallen | SG | DE | Eastern Switzerland center. University (HSG). Handelsgericht. |
| Thurgau | TG | DE | Lake Constance. Agriculture and food industry. |
| Uri | UR | DE | Gotthard corridor. Founding canton. |
| Zug | ZG | DE | Crypto/commodity hub. Very low taxes. |
| Zurich | ZH | DE | Largest canton. Major commercial center. Handelsgericht. |
| **French-speaking** | | | |
| Geneva | GE | FR | International arbitration hub. Banking and private wealth. |
| Jura | JU | FR | Newest canton (1979). Watchmaking. |
| Neuchatel | NE | FR | Watchmaking capital. Innovation hub. |
| Vaud | VD | FR | Home to Federal Supreme Court in Lausanne. |
| **Italian-speaking** | | | |
| Ticino | TI | IT | Only Italian-speaking canton. Cross-border with Italy. |
| **Bilingual DE/FR** | | | |
| Bern | BE | DE/FR | Federal capital. Strong administrative law. |
| Fribourg | FR | DE/FR | University city. Bridge between language regions. |
| Valais/Wallis | VS | DE/FR | Major tourism. Wine region. Alpine economy. |
| **Trilingual** | | | |
| Graubuenden | GR | DE/IT/RM | Largest by area. Major tourism (St. Moritz, Davos). |

Jurisdiction routing is automatic. Mentioning a canton code, canton name, or cantonal court triggers the appropriate cantonal law mode. Cross-cantonal issues default to federal law analysis.

---

## MCP Servers

The plugin includes five pre-compiled MCP servers that provide direct integration with Swiss legal databases. See [CONNECTORS.md](CONNECTORS.md) for detailed API documentation.

| Server | Purpose |
|--------|---------|
| `bge-search` | Search and retrieve decisions from the BGE (Federal Supreme Court) database. Supports keyword search, article reference filtering, date ranges, and section filtering. |
| `entscheidsuche` | Search across multiple Swiss court databases including federal and cantonal courts. Supports language filtering and court-specific queries. |
| `legal-citations` | Validate citation format and existence, convert citations between DE/FR/IT/EN formats. |
| `fedlex-sparql` | Look up Swiss federal legislation via the Fedlex SPARQL endpoint. Retrieve statutes by SR number, search legislation, find related acts, get article text. |
| `onlinekommentar` | Search and retrieve Swiss legal commentaries (Kommentare). Find scholarly analysis by article reference, keyword, or legislative act. |

### Requirements

- Node.js >= 18

MCP servers are pre-compiled and included in the plugin. No build step is required for end users. All server paths are configured in `.mcp.json` using the `${CLAUDE_PLUGIN_ROOT}` variable for portability.

---

## Privacy Protection

BetterCallClaude includes built-in Anwaltsgeheimnis (attorney-client privilege) compliance.

A `PreToolUse` hook monitors outgoing tool calls for patterns that indicate privileged content. The hook scans for privilege indicators in German (Anwaltsgeheimnis, Mandantengeheimnis, vertraulich), French (secret professionnel, confidentiel, privilegie), and Italian (segreto professionale, confidenziale, privilegio).

When privileged content is detected, the hook returns an `ask` decision that prompts the user for confirmation before the tool call proceeds. This prevents accidental disclosure of attorney-client privileged material through external API calls.

The privacy system supports three modes:

| Mode | Behavior |
|------|----------|
| `strict` | All external calls require confirmation. Local processing preferred via Ollama. |
| `balanced` | Privileged content triggers confirmation. Non-privileged content processed normally. |
| `cloud` | Standard cloud processing with privacy hook active for explicit privilege markers only. |

---

## Requirements

- Cowork or Claude Code (latest version)
- Node.js >= 18 (for MCP servers)

---

## Author

Federico Cesconi

GitHub: [fedec65/BetterCallClaude_Marketplace](https://github.com/fedec65/BetterCallClaude_Marketplace)

---

## License

AGPL-3.0 -- See [LICENSE](../LICENSE) for full terms.

---

## Professional Disclaimer

BetterCallClaude is a legal research and analysis tool. All outputs produced by this plugin:

- Require professional lawyer review and validation before use.
- Do not constitute legal advice.
- May contain errors, omissions, or outdated information.
- Must be verified against official sources (admin.ch, court databases, official gazettes).
- Must be adapted to the specific circumstances of each case.

Lawyers maintain full professional responsibility for all legal work products. This tool assists legal professionals but does not replace professional judgment, independent verification, or the duty of care owed to clients.
