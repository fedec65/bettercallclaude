# Windows Installation Guide

**BetterCallClaude v2.2.0** - Native Windows Installation

This guide covers installing BetterCallClaude on Windows using the PowerShell installer. For WSL users, see the [standard installation guide](getting-started.md).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Installation](#quick-installation)
3. [Step-by-Step Installation](#step-by-step-installation)
4. [Installation Options](#installation-options)
5. [Post-Installation Setup](#post-installation-setup)
6. [CLI Commands](#cli-commands)
7. [Troubleshooting](#troubleshooting)
8. [Uninstallation](#uninstallation)
9. [FAQ](#faq)

---

## Prerequisites

Before installing BetterCallClaude, ensure you have the following software installed:

### Required Software

| Software | Minimum Version | Download Link |
|----------|-----------------|---------------|
| **Windows** | Windows 10 (1903+) or Windows 11 | - |
| **PowerShell** | 5.1+ (included in Windows) | [PowerShell](https://docs.microsoft.com/en-us/powershell/) |
| **Git for Windows** | Latest | [git-scm.com](https://git-scm.com/download/win) |
| **Node.js** | 18.0.0+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/windows/) |
| **Claude Code CLI** | Latest | [claude.ai](https://claude.ai/claude-code) |

### Checking Prerequisites

Open PowerShell and run these commands to verify your setup:

```powershell
# Check Git
git --version
# Expected: git version 2.x.x

# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check Python
python --version
# Expected: Python 3.11.x or higher

# Check PowerShell
$PSVersionTable.PSVersion
# Expected: 5.1 or higher
```

### Installing Missing Prerequisites

#### Git for Windows
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer
3. **Important**: Select "Git from the command line and also from 3rd-party software"
4. Accept other defaults or customize as needed

#### Node.js
1. Download LTS version from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Ensure "Add to PATH" is checked
4. Restart your terminal after installation

#### Python
1. Download from [python.org](https://www.python.org/downloads/windows/)
2. Run the installer
3. **Important**: Check "Add Python to PATH" at the bottom of the first screen
4. Click "Install Now" or customize installation

---

## Quick Installation

### One-Line Installation

Open PowerShell **as Administrator** and run:

```powershell
irm https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.ps1 | iex
```

This will:
1. Check all prerequisites
2. Clone the BetterCallClaude repository
3. Build MCP servers
4. Install commands and CLI
5. Create configuration manifest

### Alternative: Download and Run

If you prefer to review the script first:

```powershell
# Download the installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.ps1" -OutFile "install.ps1"

# Review it (optional)
notepad install.ps1

# Run it
.\install.ps1
```

---

## Step-by-Step Installation

### Step 1: Open PowerShell as Administrator

1. Press `Win + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" on the UAC prompt

### Step 2: Set Execution Policy (if needed)

If you've never run PowerShell scripts before:

```powershell
# Check current policy
Get-ExecutionPolicy

# If it says "Restricted", run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 3: Run the Installer

```powershell
irm https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.ps1 | iex
```

### Step 4: Verify Installation

Open a **new** PowerShell window and run:

```powershell
bettercallclaude doctor
```

You should see all checks passing with green checkmarks.

---

## Installation Options

The PowerShell installer supports several options:

### Preview Mode (Dry Run)

See what would be installed without making changes:

```powershell
.\install.ps1 -DryRun
```

### Force Reinstall

Overwrite existing installation:

```powershell
.\install.ps1 -Force
```

### Non-Interactive Mode

Install with defaults (no prompts):

```powershell
.\install.ps1 -NoInteractive
```

### Combining Options

```powershell
# Force reinstall without prompts
.\install.ps1 -Force -NoInteractive
```

---

## Post-Installation Setup

### Directory Structure

After installation, BetterCallClaude creates these directories:

```
C:\Users\<YourUsername>\
├── .claude\
│   ├── bettercallclaude\     # Main installation
│   │   ├── install.ps1       # Installer script
│   │   ├── manifest.json     # Installation manifest
│   │   ├── pyproject.toml    # Version source of truth
│   │   └── ...
│   ├── commands\              # Slash commands
│   │   ├── legal-research.md
│   │   ├── legal-strategy.md
│   │   └── ...
│   └── settings.json          # Claude Code settings
├── .bettercallclaude\
│   └── mcp-servers\           # MCP servers (built)
│       ├── entscheidsuche\
│       ├── bge-search\
│       └── legal-citations\
└── AppData\Local\Microsoft\WindowsApps\
    └── bettercallclaude.cmd   # CLI wrapper
```

### Configure Claude Code

1. Start Claude Code:
   ```powershell
   claude
   ```

2. The framework should load automatically. If not, verify settings:
   ```powershell
   notepad "$env:USERPROFILE\.claude\settings.json"
   ```

### Optional: API Keys

Create a `.env` file for enhanced features:

```powershell
# Create .env file
notepad "$env:USERPROFILE\.claude\bettercallclaude\.env"
```

Add your keys:
```env
# Optional - For enhanced web research
TAVILY_API_KEY=your_tavily_key

# Optional - For local LLM (Ollama)
OLLAMA_HOST=http://localhost:11434
```

---

## CLI Commands

After installation, you have access to the `bettercallclaude` CLI:

### Version Information

```powershell
bettercallclaude version
```

Shows:
- Installed version
- Installation paths
- Update availability

### Health Check

```powershell
bettercallclaude doctor
```

Checks:
- Installation directories
- MCP server builds
- Commands installation
- Prerequisites

### Update

```powershell
bettercallclaude update
```

Updates to the latest version from GitHub.

### Uninstall

```powershell
bettercallclaude uninstall
```

Removes BetterCallClaude completely.

### Help

```powershell
bettercallclaude help
```

Shows all available commands.

---

## Troubleshooting

### Common Issues

#### Issue: "Running scripts is disabled on this system"

**Solution**: Enable script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: "git is not recognized"

**Solution**:
1. Reinstall Git for Windows
2. Select "Git from the command line and also from 3rd-party software"
3. Restart your terminal

#### Issue: "node is not recognized"

**Solution**:
1. Reinstall Node.js
2. Ensure "Add to PATH" is checked
3. Restart your terminal or run:
   ```powershell
   refreshenv
   ```

#### Issue: "python is not recognized"

**Solution**:
1. Reinstall Python
2. Check "Add Python to PATH" during installation
3. Restart your terminal

#### Issue: MCP servers fail to build

**Solution**:
```powershell
# Navigate to MCP servers
cd "$env:USERPROFILE\.bettercallclaude\mcp-servers"

# Clear and reinstall
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

#### Issue: CLI command not found after installation

**Solution**:
1. Open a **new** terminal window (PATH isn't refreshed in the current one)
2. If still not working, verify the CLI exists:
   ```powershell
   Test-Path "$env:LOCALAPPDATA\Microsoft\WindowsApps\bettercallclaude.cmd"
   ```

#### Issue: "Access denied" errors

**Solution**: Run PowerShell as Administrator:
1. Right-click PowerShell
2. Select "Run as administrator"
3. Run the installer again with `-Force`

### Diagnostic Commands

Run these to diagnose issues:

```powershell
# Full diagnostic
bettercallclaude doctor

# Check paths
$env:PATH -split ';' | Where-Object { $_ -like "*WindowsApps*" }

# Check installation
Get-Content "$env:USERPROFILE\.claude\bettercallclaude\manifest.json" | ConvertFrom-Json

# Check MCP servers
Get-ChildItem "$env:USERPROFILE\.bettercallclaude\mcp-servers" -Directory |
    ForEach-Object {
        $built = Test-Path (Join-Path $_.FullName "dist\index.js")
        [PSCustomObject]@{
            Server = $_.Name
            Built = $built
        }
    } | Format-Table
```

### Getting Help

If you're still having issues:

1. Run the diagnostic and save output:
   ```powershell
   bettercallclaude doctor > diagnostic.txt
   ```

2. Create an issue at: [GitHub Issues](https://github.com/fedec65/BetterCallClaude/issues)

3. Include:
   - Windows version (`winver`)
   - PowerShell version (`$PSVersionTable.PSVersion`)
   - Diagnostic output
   - Steps to reproduce

---

## Uninstallation

### Using CLI

```powershell
bettercallclaude uninstall
```

### Using Installer

```powershell
.\install.ps1 -Uninstall
```

### Manual Uninstallation

If the CLI doesn't work:

```powershell
# Remove installation directory
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\bettercallclaude"

# Remove MCP servers
Remove-Item -Recurse -Force "$env:USERPROFILE\.bettercallclaude"

# Remove commands (be careful not to delete other commands)
Get-ChildItem "$env:USERPROFILE\.claude\commands" -Filter "legal-*.md" | Remove-Item
Get-ChildItem "$env:USERPROFILE\.claude\commands" -Filter "agent-*.md" | Remove-Item

# Remove CLI
Remove-Item -Force "$env:LOCALAPPDATA\Microsoft\WindowsApps\bettercallclaude.cmd"
```

---

## FAQ

### Q: Can I use WSL instead?

**A**: Yes! If you have WSL installed, you can use the bash installer:
```bash
curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash
```
This may provide better performance for some operations.

### Q: Do I need Administrator privileges?

**A**: Not strictly required, but recommended for:
- Setting execution policy
- Installing to system-wide locations
- Modifying PATH

### Q: Can I install to a different location?

**A**: Currently, the installer uses fixed paths. Custom paths will be supported in a future version.

### Q: How do I update?

**A**: Simply run:
```powershell
bettercallclaude update
```

### Q: Is my data sent anywhere?

**A**: BetterCallClaude respects privacy:
- Legal research queries go to public Swiss court databases
- Claude Code handles AI processing through Anthropic
- For maximum privacy, use Ollama for local LLM inference
- No telemetry is collected

### Q: Which antivirus exceptions do I need?

**A**: Most antivirus software works fine. If you experience issues:
1. Add an exception for `%USERPROFILE%\.claude\bettercallclaude`
2. Add an exception for `%USERPROFILE%\.bettercallclaude`

### Q: How do I contribute?

**A**: See our [Contributing Guide](../CONTRIBUTING.md) for details on:
- Reporting issues
- Submitting pull requests
- Development setup

---

## Next Steps

After installation:

1. **Start Claude Code**: Open a terminal and run `claude`
2. **Try a command**: Type `/legal:help` to see available commands
3. **Search BGE**: Try `/legal:research Art. 97 OR`
4. **Read the docs**: Check out the [Getting Started Guide](getting-started.md)

---

## Support

- **Documentation**: [docs/](.)
- **GitHub Issues**: [Report bugs](https://github.com/fedec65/BetterCallClaude/issues)
- **Discussions**: [Ask questions](https://github.com/fedec65/BetterCallClaude/discussions)

---

**BetterCallClaude v2.2.0** - Built for Swiss Legal Professionals

*Windows installation documentation - Last updated: January 2026*
