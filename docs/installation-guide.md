# BetterCallClaude Installation Guide

**Version 2.2.1** | Complete step-by-step installation for Windows and macOS

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [macOS Installation](#macos-installation)
3. [Windows Installation](#windows-installation)
4. [Verifying Your Installation](#verifying-your-installation)
5. [Upgrading](#upgrading)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing BetterCallClaude, you need the following software installed on your computer:

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| **Git** | 2.30+ | Version control and downloading the framework |
| **Node.js** | 18+ | Running MCP servers |
| **Python** | 3.9+ | Running Python agents |
| **Claude Code CLI** or **Claude Desktop** | Latest | The AI interface |

### How to Check If You Have the Prerequisites

**On macOS** (open Terminal first - see instructions below):
```
git --version
node --version
python3 --version
```

**On Windows** (open PowerShell first - see instructions below):
```
git --version
node --version
python --version
```

If any command returns "command not found" or an error, you need to install that software first.

---

## macOS Installation

### Step 1: Open Terminal

**Option A - Using Spotlight:**
1. Press `Cmd + Space` on your keyboard
2. Type `Terminal`
3. Press `Enter` or click on the Terminal app

**Option B - Using Finder:**
1. Open **Finder**
2. Go to **Applications** → **Utilities**
3. Double-click on **Terminal**

You should see a window with a command prompt (usually ending with `$` or `%`).

### Step 2: Install Prerequisites (if needed)

**Install Homebrew** (macOS package manager):
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Install Git, Node.js, and Python**:
```
brew install git node python
```

### Step 3: Install BetterCallClaude

Copy and paste this command into Terminal, then press `Enter`:

```
curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh | bash
```

**What happens:**
- The installer downloads the framework to `~/.claude/bettercallclaude/`
- MCP servers are configured automatically
- Command files are linked to your Claude configuration
- Dependencies are installed

### Step 4: Wait for Installation

The installation takes 2-5 minutes. You'll see progress messages. When complete, you'll see:

```
✅ BetterCallClaude installed successfully!
```

### Step 5: Restart Claude

Close and reopen Claude Code CLI or Claude Desktop to load the new configuration.

---

## Windows Installation

### Step 1: Open PowerShell as Administrator

**Option A - Using Search:**
1. Click the **Windows Start button** (or press `Windows` key)
2. Type `PowerShell`
3. Right-click on **Windows PowerShell**
4. Select **Run as administrator**
5. Click **Yes** when asked to allow changes

**Option B - Using Windows Terminal:**
1. Right-click the **Windows Start button**
2. Select **Terminal (Admin)** or **Windows PowerShell (Admin)**
3. Click **Yes** when asked to allow changes

You should see a blue window with a prompt like `PS C:\Users\YourName>`.

### Step 2: Install Prerequisites (if needed)

**Install Chocolatey** (Windows package manager):
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Close and reopen PowerShell as Administrator**, then install dependencies:
```powershell
choco install git nodejs python -y
```

### Step 3: Install BetterCallClaude

Copy and paste this command into PowerShell, then press `Enter`:

```powershell
irm https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.ps1 | iex
```

**What happens:**
- The installer downloads the framework to `%USERPROFILE%\.claude\bettercallclaude\`
- MCP servers are configured automatically
- CLI wrapper (`bettercallclaude.cmd`) is created in your PATH
- Dependencies are installed

### Step 4: Wait for Installation

The installation takes 2-5 minutes. You'll see progress messages. When complete, you'll see:

```
✅ BetterCallClaude installed successfully!
```

### Step 5: Restart Claude

Close and reopen Claude Code CLI or Claude Desktop to load the new configuration.

---

## Verifying Your Installation

### Run the Health Check

**macOS (Terminal):**
```
bettercallclaude doctor
```

**Windows (PowerShell):**
```powershell
bettercallclaude doctor
```

**Expected output:**
```
🔍 BetterCallClaude Health Check
================================
✅ Installation directory found
✅ MCP servers configured
✅ Command files linked
✅ Dependencies installed
✅ Version: 2.2.1

All checks passed!
```

### Check the Version

```
bettercallclaude version
```

**Expected output:**
```
BetterCallClaude v2.2.1
```

### Test a Command in Claude

Open Claude Code CLI or Claude Desktop and try:

```
/legal-help
```

If you see the help information for BetterCallClaude commands, the installation is working correctly.

---

## Upgrading

### Upgrade to Latest Version

**macOS (Terminal):**
```
bettercallclaude update
```

**Windows (PowerShell):**
```powershell
bettercallclaude update
```

### Check Current Version

```
bettercallclaude version
```

---

## Troubleshooting

### Common Issues

#### "Command not found: bettercallclaude"

**macOS:**
1. Close and reopen Terminal
2. Check if the CLI is in your PATH:
   ```
   echo $PATH | grep bettercallclaude
   ```
3. If not found, add it manually:
   ```
   export PATH="$HOME/.claude/bettercallclaude/bin:$PATH"
   ```
   Add this line to your `~/.zshrc` or `~/.bashrc` file.

**Windows:**
1. Close and reopen PowerShell
2. Check if the CLI wrapper exists:
   ```powershell
   Test-Path "$env:LOCALAPPDATA\Microsoft\WindowsApps\bettercallclaude.cmd"
   ```

#### "Permission denied" on macOS

Run the installer with explicit bash:
```
bash -c "$(curl -fsSL https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.sh)"
```

#### "Execution policy" error on Windows

Run this command first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then retry the installation.

#### MCP Servers Not Loading

1. Check if MCP servers are built:
   ```
   # macOS
   ls ~/.bettercallclaude/mcp-servers/*/dist/

   # Windows
   dir %USERPROFILE%\.bettercallclaude\mcp-servers\*\dist\
   ```

2. Rebuild MCP servers manually:
   ```
   # macOS
   cd ~/.bettercallclaude/mcp-servers/entscheidsuche && npm install && npm run build

   # Windows
   cd %USERPROFILE%\.bettercallclaude\mcp-servers\entscheidsuche
   npm install
   npm run build
   ```

#### Commands Not Working in Claude

1. Restart Claude Code CLI or Claude Desktop completely
2. Check that command files exist:
   ```
   # macOS
   ls ~/.claude/commands/

   # Windows
   dir %USERPROFILE%\.claude\commands\
   ```
3. Run the health check:
   ```
   bettercallclaude doctor
   ```

### Getting Help

- **GitHub Issues**: [https://github.com/fedec65/BetterCallClaude/issues](https://github.com/fedec65/BetterCallClaude/issues)
- **Documentation**: `/docs/` folder in the installation directory
- **Cheatsheet**: `bettercallclaude_cheatsheet.md`

---

## Uninstalling

### macOS

```
bettercallclaude uninstall
```

Or manually:
```
rm -rf ~/.claude/bettercallclaude
rm -rf ~/.bettercallclaude
```

### Windows

**In PowerShell as Administrator:**
```powershell
# Download and run uninstaller
irm https://raw.githubusercontent.com/fedec65/BetterCallClaude/main/install.ps1 -OutFile install.ps1
.\install.ps1 -Uninstall
```

Or manually delete:
```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\bettercallclaude"
Remove-Item -Recurse -Force "$env:USERPROFILE\.bettercallclaude"
```

---

## Next Steps

After installation, try these commands in Claude:

1. **Get help**: `/legal-help`
2. **Search precedents**: `/legal-research "contract liability"`
3. **Check version**: `/legal-version`

For a complete command reference, see the [Cheatsheet](../bettercallclaude_cheatsheet.md).

---

**BetterCallClaude v2.2.1** — Built for Swiss Legal Professionals
