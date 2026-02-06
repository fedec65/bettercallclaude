# BetterCallClaude Marketplace

**Swiss Legal Intelligence Plugin for Cowork and Claude Code**

BetterCallClaude is a plugin built for legal professionals. It transforms legal research, case strategy, and document drafting for Swiss lawyers working in Cowork or Claude Code. The plugin provides multi-lingual analysis across German, French, Italian, and English, direct integration with Swiss legal databases, and built-in Anwaltsgeheimnis (attorney-client privilege) compliance.

**v2.0.0** -- 17 agents, 15 commands, 9 skills, 5 MCP servers.

---

## Quick Install

From within Cowork or Claude Code, run:

```
/plugin marketplace add fedec65/BetterCallClaude_Marketplace
/plugin install bettercallclaude@fedec65-bettercallclaude-marketplace
```

Or clone and install manually:

```bash
git clone https://github.com/fedec65/BetterCallClaude_Marketplace.git
cd BetterCallClaude_Marketplace
claude --plugin-dir ./bettercallclaude-plugin
```

---

## What It Does

| Capability | Details |
|---|---|
| **Precedent Research** | Search BGE/ATF/DTF (Federal Supreme Court) and cantonal court decisions via dedicated MCP servers |
| **Case Strategy** | Risk assessment, cost-benefit analysis, procedural pathway evaluation, settlement valuation |
| **Legal Drafting** | Contracts, court briefs, legal opinions, memoranda with jurisdiction-aware templates |
| **Adversarial Analysis** | Three-agent debate (advocate / adversary / judicial analyst) using Swiss Erwagung methodology |
| **Citation Verification** | Format validation and cross-language conversion across DE/FR/IT/EN |
| **Compliance** | FINMA, GwG/AMLA, FIDLEG/FINIG, banking secrecy, nDSG/FADP data protection |
| **Multi-Agent Workflows** | Due diligence, litigation prep, contract lifecycle, real estate closing pipelines |
| **All 26 Cantons** | Jurisdiction routing, cantonal court systems, intercantonal concordats |
| **Privacy Protection** | Automatic detection of privileged content before external API calls (Art. 321 StGB) |

---

## Key Commands

```
/bettercallclaude:legal      Intelligent gateway -- routes to the right specialist
/bettercallclaude:research   BGE/ATF/DTF precedent search and research memoranda
/bettercallclaude:strategy   Litigation strategy with risk assessment
/bettercallclaude:draft      Swiss legal document drafting
/bettercallclaude:adversarial Three-agent adversarial analysis
/bettercallclaude:workflow   Multi-agent workflow pipelines
/bettercallclaude:cite       Citation verification and formatting
/bettercallclaude:cantonal   Cantonal law analysis (specify canton)
/bettercallclaude:federal    Federal law analysis
/bettercallclaude:translate  Legal translation between DE/FR/IT/EN
```

See the full [plugin documentation](bettercallclaude-plugin/README.md) for all 15 commands, 17 agents, 9 skills, and MCP server details.

---

## Languages

| Language | Legal Context |
|---|---|
| German (DE) | Federal statutes (ZGB, OR, StGB), BGE citations, ZH/BE/BS cantons |
| French (FR) | CO/CC/CP texts, ATF citations, GE/VD cantons, Bern bilingual |
| Italian (IT) | CO/CC/CP texts, DTF citations, Ticino |
| English (EN) | Working language with Swiss legal term mapping |

Language detection is automatic. Write in any supported language and the plugin responds with the matching legal terminology and citation format.

---

## Repository Structure

```
BetterCallClaude_Marketplace/
+-- .claude-plugin/
|   +-- marketplace.json          # Self-hosted marketplace definition
+-- bettercallclaude-plugin/      # The plugin
    +-- .claude-plugin/
    |   +-- plugin.json           # Plugin manifest
    +-- .mcp.json                 # MCP server configuration
    +-- commands/                 # 15 slash commands
    +-- skills/                   # 9 auto-activated skills
    +-- agents/                   # 17 specialized agents
    +-- hooks/                    # Privacy detection hook
    +-- scripts/                  # Anwaltsgeheimnis pattern detection
    +-- mcp-servers/              # 5 pre-compiled MCP servers
    +-- CONNECTORS.md             # MCP server API documentation
    +-- README.md                 # Full plugin documentation
```

---

## Compatibility

| Platform | Support |
|---|---|
| **Cowork** | Full support. Designed for legal professionals using Cowork as their daily workspace. |
| **Claude Code** | Full support. Same plugin format, same commands, same agents. |

The plugin uses Anthropic's shared plugin format and works identically in both environments. No configuration changes needed.

### Requirements

- Cowork or Claude Code (latest version)
- Node.js >= 18 (for MCP servers)

---

## Related

- [BetterCallClaude Framework](https://github.com/fedec65/BetterCallClaude) -- The original configuration framework this plugin is based on.

---

## Author

Federico Cesconi

---

## License

See the repository for license terms.

---

## Disclaimer

BetterCallClaude is a legal research and analysis tool. All outputs require professional lawyer review and validation. This tool does not constitute legal advice. Lawyers maintain full professional responsibility for all legal work products.
