# Getting Started with BetterCallClaude

Welcome to BetterCallClaude - your AI-powered legal intelligence assistant for Swiss law.

This guide will help you get started in just a few minutes, whether you're using Claude Desktop or Claude Code CLI.

---

## What is BetterCallClaude?

BetterCallClaude is a legal intelligence framework designed specifically for Swiss lawyers. It provides:

- **Smart Legal Research** - Search through federal court decisions (BGE) and cantonal court decisions
- **Multi-Language Support** - Works in German, French, Italian, and English
- **All 26 Swiss Cantons** - Access cantonal court decisions from any canton
- **Legal Citation Parsing** - Automatically understands and formats Swiss legal citations
- **Specialized Legal Agents** - Expert AI assistants for research, drafting, compliance, and more

---

## Installation (2 minutes)

### Step 1: Run the Installer

Open your terminal and paste this command:

```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash
```

That's it! The installer will:
- Download all necessary components
- Configure the MCP servers
- Set up Claude Desktop integration automatically

### Step 2: Restart Claude Desktop

After installation, **completely restart Claude Desktop** (quit and reopen) to load the new MCP servers.

---

## Using BetterCallClaude

### Option A: With Claude Desktop (Recommended for beginners)

1. **Open Claude Desktop**
2. **Start a new conversation**
3. **Try your first legal query:**

   Simply ask in natural language:
   ```
   Find recent BGE decisions about contract termination
   ```

   Or use a specific command:
   ```
   /legal:research employment law dismissal protection
   ```

### Option B: With Claude Code CLI

1. **Open your terminal**
2. **Start Claude Code:**
   ```bash
   claude
   ```
3. **Use legal commands:**
   ```
   /legal:help
   ```

---

## Your First Commands

Here are some commands to try right away:

### Get Help
```
/legal:help
```
Shows all available legal commands and their descriptions.

### Legal Research
```
/legal:research [your topic]
```
Example: `/legal:research tenant rights Switzerland`

### Find Federal Court Decisions
```
/legal:bge [citation or topic]
```
Example: `/legal:bge BGE 147 III 226`

### Cantonal Court Search
```
/legal:cantonal [canton] [topic]
```
Example: `/legal:cantonal ZH rental disputes`

### Case Strategy
```
/legal:strategy [describe your case]
```
Get strategic analysis and recommendations for your case.

### Draft Legal Documents
```
/legal:draft [document type] [details]
```
Example: `/legal:draft contract termination notice`

---

## Using Legal Agents

BetterCallClaude includes specialized AI agents for different tasks. Call them with `@`:

| Agent | Purpose |
|-------|---------|
| `@researcher` | Deep legal research and analysis |
| `@strategist` | Case strategy and recommendations |
| `@drafter` | Legal document drafting |
| `@compliance` | Regulatory compliance checks |
| `@risk` | Risk assessment and mitigation |
| `@translator` | Legal translation (DE/FR/IT/EN) |

**Example:**
```
@researcher Find all BGE decisions from 2023 about data protection
```

---

## Supported Cantons

BetterCallClaude supports all 26 Swiss cantons:

**German-speaking:** ZH, BE, LU, UR, SZ, OW, NW, GL, ZG, SO, BS, BL, SH, AR, AI, SG, GR, AG, TG

**French-speaking:** VD, GE, NE, JU

**Italian-speaking:** TI

**Bilingual:** FR (DE/FR), VS (DE/FR)

---

## Language Modes

Switch between languages using:

- **German mode:** `/legal:mode de`
- **French mode:** `/legal:mode fr`
- **Italian mode:** `/legal:mode it`
- **English mode:** `/legal:mode en`

Or simply write your queries in your preferred language - BetterCallClaude will adapt automatically.

---

## Troubleshooting

### MCP servers not loading?

1. Make sure you've restarted Claude Desktop after installation
2. Check if the servers are configured in Claude Desktop settings
3. Run the installer again: `curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash`

### Commands not recognized?

1. Try `/legal:help` to see available commands
2. Make sure you're using the correct syntax (note the colon after `legal`)

### Need more help?

- Check the [full documentation](https://github.com/fedec65/BetterCallClaude)
- Open an issue on [GitHub](https://github.com/fedec65/BetterCallClaude/issues)

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Get help | `/legal:help` |
| Research | `/legal:research [topic]` |
| BGE search | `/legal:bge [citation/topic]` |
| Cantonal search | `/legal:cantonal [canton] [topic]` |
| Case strategy | `/legal:strategy [case details]` |
| Draft document | `/legal:draft [type] [details]` |
| Change language | `/legal:mode [de/fr/it/en]` |

---

**Ready to start?** Open Claude and try: `/legal:help`

---

*BetterCallClaude v1.3.2 - Legal Intelligence Framework for Swiss Lawyers*
