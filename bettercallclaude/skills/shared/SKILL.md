---
name: output-conventions
description: Shared deliverable-as-file output conventions for all BetterCallClaude commands. Defines the bcc-output folder structure, file naming, and chat summary template.
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__bettercallclaude-http-swiss-caselaw__cite
---

# BetterCallClaude Output Conventions

This document defines the standard output behavior for all BetterCallClaude commands that produce deliverables longer than approximately one page (~500 words).

## Rule

Every command that produces a long output (memo, research, strategy, analysis, triage batch, translation, draft) **MUST**:

1. Write the full result as a file in the working folder.
2. Give in chat only a **summary of 3–5 lines** plus the path to the written file.

Short outputs (cite, validate, refine, version, help, privacy status, summarize with `--short`) may remain in chat.

## Folder Structure

```
<working folder>/bcc-output/
  └── YYYY-MM-DD-<slug>/
      ├── 01-intake.md
      ├── 02-research-memo.md
      ├── 03-strategy.md
      ├── 04-adversarial-review.md
      ├── 05-draft-<document>.md   (or .docx for redline)
      └── sources.md
```

- **`bcc-output`** is the default folder name. The user can override it in the `bettercallclaude.local.md` playbook under "Stile e formato" → output folder preference.
- The **date-slug subfolder** uses `YYYY-MM-DD-<short-description>` format (e.g., `2026-06-10-nda-review-meier`).
- The **numbering** follows the `/legal-5step` phases. Commands run individually write only the relevant file(s) into the same structure.
- **`sources.md`** is always present when MCP servers were used: it lists every source consulted with verification date — this is the paper trail for due diligence.

## File Formats

- **Default**: `.md` (Markdown).
- **Redline / documents for counterparties**: `.docx` (tracked changes where applicable).
- **On explicit user request**: any format.
- The playbook can set a preferred default format in the "Stile e formato" section.

## Environment Behavior

- **Cowork**: the working folder is the shared folder selected by the user. Files appear directly in the user's file browser.
- **Claude Code**: the working folder is the project root. Same structure, different base path.

## Chat Summary Template

When writing a file, display in chat:

```
**[Title of deliverable]** written to `bcc-output/YYYY-MM-DD-slug/filename.md`

[3-5 line summary of key findings / conclusions]

Full document: `bcc-output/YYYY-MM-DD-slug/filename.md`
Sources: `bcc-output/YYYY-MM-DD-slug/sources.md`
```

## Applicability

Commands that produce file output under this convention:

| Command | Output File(s) |
|---------|---------------|
| `legal` (multi-agent) | varies by workflow |
| `research` | `02-research-memo.md` |
| `strategy` | `03-strategy.md` |
| `draft` | `05-draft-<doc>.md` or `.docx` |
| `adversarial` | `04-adversarial-review.md` |
| `workflow` | all pipeline files |
| `translate` | `translation-<doc>.md` |
| `doc-analyze` | `analysis-<doc>.md` |
| `nda-triage` | `nda-triage-<doc>.md` (batch: summary + individual) |
| `precedent` | `precedent-chain-<topic>.md` |
| `legal-5step` | all 5 files + `sources.md` |
| `briefing` | `briefing-plan.md` |

Commands that stay in chat: `cite`, `validate`, `refine`, `summarize --short`, `version`, `help`, `privacy`, `start`, `doctor`, `federal` (short), `cantonal` (short).
