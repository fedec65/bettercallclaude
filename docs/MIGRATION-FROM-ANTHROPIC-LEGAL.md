# Migration from Anthropic Legal Plugin to BetterCallClaude Swiss

This guide is for users who already have the Anthropic Legal plugin (`anthropics/knowledge-work-plugins`) installed and want to use BetterCallClaude for Swiss law matters. The two plugins **can coexist** — there is no need to uninstall one to use the other.

---

## Principle

Anthropic has built the Legal plugin for US law (Delaware, New York, California defaults). BetterCallClaude covers Swiss law (federal + 26 cantons, DE/FR/IT/EN). For Swiss-law matters, BetterCallClaude takes precedence; for US-law matters, the Anthropic Legal plugin applies.

---

## Command/Skill Mapping

| Anthropic Legal Plugin | BetterCallClaude Equivalent | Notes |
|------------------------|-----------------------------|-------|
| NDA triage (GREEN/YELLOW/RED) | `/bettercallclaude:nda-triage` | Swiss criteria (Art. 160 ff. OR, Lugano, zwingendes Recht) |
| Contract review | `/bettercallclaude:doc-analyze` + `swiss-document-analysis` skill | Playbook-aware with deviation analysis |
| Compliance workflows | `/bettercallclaude:legal` → `compliance-frameworks` + `data-protection-law` skills | Swiss regulatory: FINMA, nDSG/FADP, AML/GwG |
| `legal.local.md` playbook | `bettercallclaude.local.md` playbook | Swiss-specific schema (see below) |

---

## Playbook Migration

### Anthropic format: `legal.local.md`

The Anthropic Legal plugin uses a `legal.local.md` file in `.claude/` or a shared folder. It typically contains US-centric defaults:
- Governing law: Delaware, New York, California
- Jurisdiction: US courts
- Citation style: US case reporters (e.g. *Westlaw*, *Lexis*)

### BetterCallClaude format: `bettercallclaude.local.md`

BetterCallClaude uses `bettercallclaude.local.md` with Swiss-specific sections:
- Governing law: Swiss law (CISG exclusion option)
- Jurisdiction: Swiss fora (cantonal courts, Swiss Rules arbitration)
- Citation style: BGE/ATF/DTF formats
- Konventionalstrafe thresholds (Art. 160 ff. OR)
- Mandatory law compliance (zwingendes Recht)

### Compatibility Behavior

If BetterCallClaude finds a `legal.local.md` and **no** `bettercallclaude.local.md`:

1. It reads the compatible sections (firm name, general risk thresholds, escalation rules, output preferences)
2. It **ignores** US-centric sections (Delaware/NY/CA governing law, US jurisdiction, US citation formats) and notes which sections were skipped
3. It suggests converting to `bettercallclaude.local.md` format

This compatibility is **permanent** — there is no deprecation planned.

### How to Convert

1. Copy the template for your preferred language from `bettercallclaude/templates/`:
   ```
   cp bettercallclaude/templates/bettercallclaude.local.md.example.de .claude/bettercallclaude.local.md
   ```
2. Transfer any applicable values from your `legal.local.md` (firm name, risk thresholds, escalation roles)
3. Fill in the Swiss-specific sections (governing law, Gerichtsstand, Konventionalstrafe, citation format)

You can keep both files — `legal.local.md` for US matters (Anthropic plugin) and `bettercallclaude.local.md` for Swiss matters (BCC).

---

## Coexistence

Both plugins can be installed simultaneously. They do not conflict:

| Scenario | Which Plugin Handles It |
|----------|------------------------|
| NDA governed by Swiss law | BetterCallClaude (`/bettercallclaude:nda-triage`) |
| NDA governed by US law | Anthropic Legal plugin |
| Contract review with Swiss parties | BetterCallClaude (`/bettercallclaude:doc-analyze`) |
| Contract review under Delaware law | Anthropic Legal plugin |
| Swiss regulatory compliance (FINMA, nDSG) | BetterCallClaude |
| US regulatory compliance (SEC, CCPA) | Anthropic Legal plugin |
| Citation verification (BGE/ATF/DTF) | BetterCallClaude (9 MCP servers with Swiss sources) |
| Citation verification (US reporters) | Anthropic Legal plugin |

The BetterCallClaude skills explicitly state: *"If the Anthropic Legal plugin is also installed, this plugin has precedence for documents governed by Swiss law or involving Swiss parties."*

---

## Key Differentiators

| Feature | Anthropic Legal | BetterCallClaude Swiss |
|---------|----------------|----------------------|
| Jurisdiction | US (DE/NY/CA default) | Switzerland (federal + 26 cantons) |
| Primary sources | Model knowledge | 8+ MCP servers (BGE, Fedlex, entscheidsuche, ...) |
| Languages | EN | DE/FR/IT/EN |
| Citations | US case reporters | BGE/ATF/DTF verified via MCP |
| Attorney-client privilege | Not addressed | Privacy-routing hook (Art. 321 StGB) |
| Adversarial analysis | Not available | 3-agent advocate/adversary/judge |
| Playbook | `legal.local.md` | `bettercallclaude.local.md` (+ compat) |
