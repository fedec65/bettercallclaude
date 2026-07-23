# BetterCallClaude — Local Playbook Pattern

Il playbook locale (`bettercallclaude.local.md`) consente a ogni studio o servizio giuridico di personalizzare il comportamento di BetterCallClaude: posizioni contrattuali standard, soglie di rischio, lingua di output, formato citazioni e regole di escalation.

Das lokale Playbook (`bettercallclaude.local.md`) ermöglicht es jeder Kanzlei oder Rechtsabteilung, das Verhalten von BetterCallClaude anzupassen: vertragliche Standardpositionen, Risikoschwellen, Ausgabesprache, Zitierformat und Eskalationsregeln.

The local playbook (`bettercallclaude.local.md`) lets each law firm or legal department customize BetterCallClaude's behavior: standard contractual positions, risk thresholds, output language, citation format, and escalation rules.

---

## File Location (Precedence Order)

BetterCallClaude searches for the playbook in the following order. The **first file found** is used:

| Priority | Path | Environment |
|----------|------|-------------|
| 1 | `.claude/bettercallclaude.local.md` | Claude Code (per-project) |
| 2 | `bettercallclaude.local.md` in any shared folder | Cowork Desktop |
| 3 | `.claude/legal.local.md` | Compatibility with Anthropic Legal plugin |
| 4 | *(no file)* | Swiss defaults + suggestion to create one |

When **no playbook is found**, BetterCallClaude applies reasonable Swiss defaults (Swiss law, balanced mode, BGE citation format) and informs the user that a playbook can be created for personalized behavior.

When a `legal.local.md` (Anthropic format) is found at priority 3 and no `bettercallclaude.local.md` exists, BetterCallClaude reads compatible sections, ignores US-centric positions (e.g. Delaware governing law, NY jurisdiction), and suggests converting to the `bettercallclaude.local.md` format.

---

## Cowork Desktop: Playbook Not Found Across Sessions

**Problem**: In Cowork Desktop, the playbook is only visible when the current session's shared folder contains it. If the playbook is in Folder A but you open a session with Folder B, BetterCallClaude cannot see it.

**Why**: Cowork restricts plugin file access to the currently selected shared folder for security. There is no Cowork-global config directory equivalent to Claude Code's `~/.claude/`.

**Recommended setup — designate one legal-work folder:**

1. Create a folder like `~/Documents/Legal-Work/` (or `~/OneDrive/Legal-Work/`).
2. Place `bettercallclaude.local.md` in its root, or in `.claude/bettercallclaude.local.md` inside it.
3. Use this folder for all BetterCallClaude sessions (NDA triage, contract review, research, drafting).
4. The playbook will be found reliably every time.

**Alternative — copy to every folder you use:**

If you must work across multiple folders, copy `bettercallclaude.local.md` into the root of each shared folder you use for legal sessions. Keep the copies in sync manually when you update the playbook.

---

## Schema

The playbook uses Markdown with the following sections. All four language templates (DE/FR/IT/EN) use the **same section structure** — skills parse a single schema regardless of language.

### Profil Kanzlei / Firm Profile
Firm name, seat, main cantons, working languages, default output language, type (law firm / in-house / fiduciary).

### Vertragliche Standardpositionen / Standard Contractual Positions
Governing law, jurisdiction, liability caps, Konventionalstrafe thresholds, term/termination preferences, NDA parameters.

### Risikoschwellen und Eskalation / Risk Thresholds and Escalation
Value thresholds for mandatory human review, clauses that always trigger escalation (unlimited warranties, waiver of mandatory rights, Art. 100 OR derogations), escalation recipient role.

### Datenschutz / Data Protection
Typical data protection role (controller/processor), recurring cross-border transfers, standard DPA template.

### Stil und Format / Style and Format
Citation format (BGE/ATF/DTF), output format (memo/redline/table), citation language.

---

## Templates

Four example templates are provided in `templates/`:

- `bettercallclaude.local.md.example.de` — German
- `bettercallclaude.local.md.example.fr` — French
- `bettercallclaude.local.md.example.it` — Italian
- `bettercallclaude.local.md.example.en` — English

Copy the one in your preferred language to `.claude/bettercallclaude.local.md` and fill in the values.

---

## Mandatory Law Override (zwingendes Recht)

The playbook customizes preferences and thresholds, but it **cannot override mandatory Swiss law**. If a playbook position conflicts with zwingendes Recht, the skill flags it explicitly instead of silently applying it.

Examples of positions that would be flagged:
- Accepting a clause that excludes liability for intent or gross negligence (Art. 100 OR)
- Accepting a pre-emptive waiver of mandatory rights
- Setting a Konventionalstrafe threshold that would be unconscionable (Art. 163 Abs. 3 OR)

---

## How Skills Use the Playbook

Skills that consume the playbook:

| Skill | Usage |
|-------|-------|
| `swiss-document-analysis` | Contract review compares clauses against playbook positions; NDA triage uses playbook thresholds for GREEN/YELLOW/RED classification |
| `swiss-legal-drafting` | Drafting applies playbook preferences for governing law, jurisdiction, liability, and citation format |
| `swiss-legal-strategy` | Risk assessment uses playbook escalation thresholds |

At activation, these skills:
1. Search for the playbook file in precedence order
2. Parse the Markdown sections
3. Load the values as context for the current analysis
4. If no playbook is found, apply Swiss defaults and suggest creating one

---

## Compatibility with Anthropic Legal Plugin

If the Anthropic Legal plugin (`anthropics/knowledge-work-plugins`) is also installed, the two plugins coexist:

- For **Swiss law** matters, BetterCallClaude takes precedence
- For **US law** matters, the Anthropic Legal plugin applies
- A `legal.local.md` in Anthropic format is read in compatibility mode — US-centric sections are noted but not applied

See [MIGRATION-FROM-ANTHROPIC-LEGAL.md](MIGRATION-FROM-ANTHROPIC-LEGAL.md) for the full migration guide.
