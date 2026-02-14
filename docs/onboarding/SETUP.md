# BetterCallClaude v2.0 - Development Setup Guide

## Prerequisites

### Required Software
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher (LTS recommended)
- **Git**: Latest version
- **Claude Code CLI**: Latest version

### Recommended Tools
- **VS Code** or **PyCharm** (IDE)
- **Postman** or **HTTPie** (API testing)
- **Docker** (optional, for containerized development)

---

## Quick Start (10 minutes)

### 1. Clone Repository
```bash
cd ~/Dev
git clone https://github.com/your-org/bettercallclaude.git
cd bettercallclaude
```

### 2. Setup Python Backend
```bash
# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install pre-commit hooks
pre-commit install

# Run tests to verify setup
pytest
```

### 3. Setup TypeScript MCP Servers
```bash
cd mcp-servers
npm install
npm run build
npm test

cd ..
```

### 4. Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# REQUIRED:
#   - CLAUDE_API_KEY (from anthropic.com)
#   - DATABASE_URL (default: sqlite:///./bettercallclaude.db)
# OPTIONAL:
#   - BGE_RATE_LIMIT (default: 10 requests/minute)
#   - LOG_LEVEL (default: INFO)
```

### 5. Verify Setup
```bash
# Backend health check
python src/main.py --version

# MCP servers health check
cd mcp-servers
npm run dev  # Should start all MCP servers

# Run full test suite
pytest
cd mcp-servers && npm test
```

---

## Project Structure

```
bettercallclaude/
├── src/                          # Python backend
│   ├── core/                     # Core framework
│   │   ├── commands/             # Command system
│   │   │   ├── base.py          # BaseCommand abstract class
│   │   │   ├── registry.py      # CommandRegistry
│   │   │   └── legal_research.py
│   │   ├── cache/                # Caching layer
│   │   │   └── citation_cache.py
│   │   ├── mcp/                  # MCP integration
│   │   │   └── connection_manager.py
│   │   ├── personas/             # Persona system
│   │   │   └── activator.py
│   │   └── config/               # Configuration
│   ├── utils/                    # Utilities
│   └── tests/                    # Tests
│       ├── unit/
│       ├── integration/
│       └── fixtures/
├── mcp-servers/                  # TypeScript MCP servers
│   ├── bge-search/               # BGE Search MCP
│   ├── entscheidsuche/           # Entscheidsuche MCP
│   ├── cantonal-courts/          # Cantonal Courts MCP
│   └── ...
├── docs/                         # Documentation
│   ├── onboarding/               # Developer onboarding
│   ├── architecture/             # Architecture docs
│   └── api/                      # API documentation
├── .github/                      # GitHub Actions
│   └── workflows/
│       └── ci.yml
├── requirements.txt              # Python dependencies
├── pyproject.toml                # Python tooling config
└── README.md                     # Project overview
```

---

## Development Workflow

### Daily Development
```bash
# 1. Pull latest changes
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes, run tests frequently
pytest src/tests/unit/  # Fast unit tests
black src/              # Auto-format code
ruff check src/         # Lint code

# 4. Commit with meaningful messages
git add .
git commit -m "feat: add /legal:research command

- Implement basic query parsing
- Add integration with BGE Search MCP
- Add unit tests (85% coverage)"

# 5. Push and create PR
git push origin feature/your-feature-name
# Create PR via GitHub UI
```

### Pre-Commit Checks
Pre-commit hooks run automatically on `git commit`:
- **Black**: Code formatting
- **Ruff**: Linting
- **MyPy**: Type checking
- **Tests**: Fast unit tests

To run manually:
```bash
pre-commit run --all-files
```

### Running Tests
```bash
# Unit tests (fast)
pytest src/tests/unit/ -v

# Integration tests (slower)
pytest src/tests/integration/ -v

# Specific test file
pytest src/tests/unit/test_command_registry.py -v

# With coverage
pytest --cov=src --cov-report=html
open htmlcov/index.html  # View coverage report
```

---

## Common Tasks

### Adding a New Command
```bash
# 1. Create command file
touch src/core/commands/my_command.py

# 2. Implement using BaseCommand
# See src/core/commands/legal_research.py for example

# 3. Add tests
touch src/tests/unit/test_my_command.py

# 4. Register command (auto-discovered by CommandRegistry)

# 5. Run tests
pytest src/tests/unit/test_my_command.py -v
```

### Adding a New MCP Server
```bash
# 1. Create MCP server directory
mkdir -p mcp-servers/my-server/src
cd mcp-servers/my-server

# 2. Initialize package.json
npm init -y

# 3. Install MCP SDK (when available)
# npm install @anthropic/mcp-sdk

# 4. Implement server (see bge-search for example)

# 5. Add to workspace
# Edit mcp-servers/package.json → add "my-server" to workspaces

# 6. Run tests
npm test
```

### Debugging
```bash
# Python backend
python -m pdb src/main.py  # Python debugger

# Or use VS Code debugger (see .vscode/launch.json)

# MCP servers
cd mcp-servers/bge-search
npm run dev  # Runs with debugging enabled
```

---

## Swiss Legal System Primer (30-minute crash course)

### Key Concepts
1. **Federal-Cantonal Structure**
   - **Federal law**: Applies nationwide (e.g., Code of Obligations, Criminal Code)
   - **Cantonal law**: 26 cantons have own laws (e.g., tax, education, police)
   - **Precedence**: Federal law > Cantonal law

2. **BGE (Bundesgerichtsentscheid)**
   - **Definition**: Swiss Federal Supreme Court decisions
   - **Citation format**: `BGE [Volume] [Chamber] [Page]`
   - **Example**: `BGE 147 V 321` = Volume 147, Social Law Chamber (V), Page 321
   - **Authority**: Highest legal authority in Switzerland

3. **Court Hierarchy**
   - **Federal Supreme Court** (Bundesgericht): Highest court
   - **Cantonal Supreme Courts**: Canton-level final appeal
   - **District Courts**: Regional courts
   - **Municipal Courts**: Local courts

4. **Multi-Lingual Legal System**
   - **Official languages**: German (DE), French (FR), Italian (IT), Romansh (RM)
   - **Legal reasoning**: Must work across all language regions
   - **Citations**: Can appear in any official language

### Resources
- **BGE Database**: https://www.bger.ch (Federal Supreme Court)
- **Entscheidsuche**: https://www.entscheidsuche.ch (Federal court search)
- **SR (Systematic Collection)**: https://www.admin.ch/gov/de/start/bundesrecht.html

---

## Troubleshooting

### Python Issues
**Problem**: `ModuleNotFoundError: No module named 'X'`
```bash
# Solution: Ensure virtual environment is activated
source .venv/bin/activate
pip install -r requirements.txt
```

**Problem**: `mypy` type errors
```bash
# Solution: Add type stubs or ignore
pip install types-all
# Or add # type: ignore comment
```

### MCP Server Issues
**Problem**: `Cannot find module '@anthropic/mcp-sdk'`
```bash
# Solution: Install dependencies
cd mcp-servers
npm install
```

**Problem**: TypeScript compilation errors
```bash
# Solution: Clean and rebuild
rm -rf dist/
npm run build
```

### Git Pre-Commit Hook Failures
**Problem**: Pre-commit hooks fail
```bash
# Solution 1: Auto-fix issues
black src/
ruff check src/ --fix

# Solution 2: Skip hooks (NOT RECOMMENDED)
git commit --no-verify
```

---

## Next Steps

1. **Read Architecture Docs**: See `docs/architecture/OVERVIEW.md`
2. **Review v1.0 Specs**: See `.claude/` directory for persona and mode specs
3. **Join Team Channels**: Slack #bettercallclaude-dev
4. **Pair Programming**: Schedule session with senior developer
5. **Pick First Story**: Check Sprint 1 backlog in Jira/Linear

**Questions?** Contact @dev-lead or post in #bettercallclaude-dev

---

**Document Version**: 1.0
**Last Updated**: 2025-01-17
**Estimated Setup Time**: 10-15 minutes
