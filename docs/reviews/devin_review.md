# BetterCallClaude — Code Review (Devin)

**Reviewer:** Devin (automated code review)
**Date:** 2025-04-19
**Plugin version reviewed:** `4.2.1`
**Branch:** `quality/devin_review` (no changes to `main`)
**Reference baseline:** Anthropic Claude Code plugin documentation
- [Plugins reference](https://docs.anthropic.com/en/docs/claude-code/plugins-reference)
- [Create plugins](https://docs.anthropic.com/en/docs/claude-code/plugins)
- [Plugin marketplaces](https://docs.anthropic.com/en/docs/claude-code/plugin-marketplaces)
- [Hooks reference](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [Skills](https://docs.anthropic.com/en/docs/claude-code/skills)

> Scope: this is a **review-only** PR. It adds a single document under
> `docs/reviews/` and changes no functional code. Each finding is tagged with
> a priority (`P0`/`P1`/`P2`/`P3`) and the type of fix it implies.

---

## 1. Executive summary

BetterCallClaude is a substantial, well-architected Claude Code plugin: 20
agents, 19 commands, 14 skills, 7 MCP servers (5 HTTP, 1 SSE, 1 local stdio),
plus a privacy hook, a multi-workspace TypeScript MCP backend, packaging
scripts, and CI. The plugin manifest, marketplace catalog, and
`hooks.json` schema all match the shape Anthropic documents, and the v4.2.1
patch notes show real care about Cowork's quirks (dot-prefixed `.mcp.json`,
no root-level `plugin.json`, etc.).

The most impactful improvements fall into four buckets:

1. **Plugin-spec compliance (P0/P1)** — agents are missing `model:`
   selection, the orchestrator agent does not declare the `Task` tool that
   it actually depends on, and the privacy hook misses MCP tools and
   `MultiEdit` (the most likely vectors for privileged content leaving the
   machine).
2. **Privacy hook quality (P0/P1)** — overly broad regex patterns
   (`vertraulich`, `confidentiel`, `riservato` — every confidentiality
   notice triggers), no word boundaries, and a `Bash` matcher that scans
   *every* shell command's textual args. Combined this will produce a flood
   of false positives that will train users to click "approve" by reflex —
   the worst outcome for a compliance feature.
3. **Repo hygiene (P1/P2)** — duplicated repository files (`bge-repository.ts`
   *and* `BgeRepository.ts`), a 180KB SQLite DB committed under `data/`, a
   dead `scripts/privacy-check.sh` shadowing the canonical
   `bettercallclaude/scripts/privacy-check.js`, mixed test runners
   (`vitest` + `jest.config.js`), inconsistent `engines.node` across
   workspaces (`>=18` vs `>=22`), and a `--continue-on-error: true` lint
   step in CI that silently swallows lint failures.
4. **Operational risk (P1)** — every HTTP MCP server points at the single
   origin `https://mcp.bettercallclaude.ch` with a 60 req/min/IP rate
   limit; no failover, no auth tier, and an entire law firm behind one NAT
   shares the bucket. The HTTP service is not exercised by CI.

None of these are blocking for v4.2.1 users today; addressing them
materially improves spec-compliance, privacy guarantees, and maintainability
before the next minor.

---

## 2. Plugin manifest & marketplace catalog

### 2.1 `bettercallclaude/.claude-plugin/plugin.json`

| Finding | Priority |
|---|---|
| Missing optional but high-value fields: `homepage`, `repository`, `license`, `keywords`. The Anthropic schema lists them and `marketplace.json` already has the values — duplicate them in `plugin.json` for users who install via direct path. | **P2** |
| `version` is set both here and in the marketplace plugin entry. Per the [reference](https://docs.anthropic.com/en/docs/claude-code/plugins-reference#metadata-fields), "If also set in the marketplace entry, `plugin.json` takes priority. You only need to set it in one place." Pick one source of truth (recommend `plugin.json`) and drop the other to avoid drift on the next bump. | **P2** |
| `author` is a bare object `{ "name": "Federico Cesconi" }`. Add `email` and `url` — Cowork shows them in the install dialog. | **P3** |

### 2.2 `.claude-plugin/marketplace.json`

| Finding | Priority |
|---|---|
| Top-level `metadata.description` is missing. Cowork uses it in the marketplace browser. | **P2** |
| `category: "legal"` is good; consider adding `tags: ["swiss", "switzerland", "fedlex", "bge", "privacy", "compliance"]` for searchability. | **P3** |
| The `owner.url` field is documented and useful for trust signals — point it at https://bettercallclaude.ch or the GitHub org. | **P3** |

### 2.3 `bettercallclaude/.mcp.json`

The dot-prefix and the absence of a root-level `plugin.json` are correct
per v4.2.1's notes. Two follow-ups:

| Finding | Priority |
|---|---|
| Document the constraint *inside* the file as a JSON comment-equivalent (e.g. a top-level `"_comment"` key) so the next maintainer doesn't accidentally rename or move it. | **P3** |
| The `ollama` server uses `command: "node"` directly; this requires Node ≥18 on the user's PATH. Cowork on Windows often resolves `node.exe` differently. Consider documenting the prerequisite in the plugin description and `setup` command, or detect-and-degrade if missing. | **P2** |

---

## 3. Agents (`bettercallclaude/agents/`, 20 files)

### 3.1 Frontmatter compliance

Per the [plugin reference](https://docs.anthropic.com/en/docs/claude-code/plugins-reference#agents),
plugin agents support:
`name`, `description`, `model`, `effort`, `maxTurns`, `tools`,
`disallowedTools`, `skills`, `memory`, `background`, `isolation`.
Plugin agents **do not** support `hooks`, `mcpServers`, or `permissionMode`.

| Finding | Priority |
|---|---|
| **No agent declares `model:`**. Every subagent invocation will use the session's default. For a 20-agent fleet that includes high-volume, low-stakes agents (`summarizer`, `prompt-engineer`, `translator`) and high-stakes ones (`judicial`, `adversary`, `orchestrator`), pin a model per agent. Recommended starting point: `model: haiku` for `summarizer`, `prompt-engineer`, `translator`, `cantonal`; `model: sonnet` (default) for `researcher`, `drafter`, `strategist`, `compliance`, `risk`, `procedure`, `fiscal`, `corporate`, `realestate`, `data-protection`, `citation`; `model: sonnet` (or `opus` if available in Cowork) for `orchestrator`, `briefing`, `judicial`, `adversary`, `advocate`. | **P1** |
| `agents/orchestrator.md` and `agents/briefing.md` describe orchestrating other subagents but their `tools:` lists do **not** include `Task`. Without `Task` in the allowlist, the agent cannot spawn other subagents — it can only narrate that it would. Either add `Task` (and likely `Agent(researcher, strategist, …)`) or drop the orchestration framing from the prompt. | **P0** |
| Many agents copy-paste an identical `tools:` array (`Read, Grep, Glob, Bash, WebSearch`). If the intent is "inherit everything", omit `tools` entirely (default is full inheritance). If the intent is to restrict, the lists are too permissive (e.g. `summarizer` does not need `Bash`). Tighten per-agent. | **P2** |
| Agent `description:` strings are mostly good but several (e.g. `drafter.md`, `strategist.md`) read as titles rather than triggers. Per Anthropic: "Claude uses each subagent's description to decide when to delegate." Reframe as "Use when … (concrete situation, keywords, language hints)." Researcher's description is a good model. | **P1** |
| Consider `effort:` for cost control (e.g. `effort: low` for the summarizer). | **P3** |
| `isolation: worktree` is appropriate for any agent that runs `Bash` against a copy of a case file directory. None of the agents currently use it — worth considering for `drafter` and `compliance`. | **P3** |

### 3.2 Specific files

- **`agents/researcher.md`** — exemplary structure (UNDERSTAND→PLAN→
  SEARCH→VERIFY→SYNTHESIZE→DELIVER). Use it as the template for the
  others.
- **`agents/briefing.md`** — 300+ lines with a panel selection matrix.
  Strong content, but two practical issues:
  1. The "select 2-5 panel members" loop assumes the agent can launch
     them. Add `Task` to `tools:` and switch to actual sub-agent
     invocation, otherwise the briefing degenerates into a single LLM
     call rehearsing what other agents *would* say.
  2. Persisting state for cross-session recovery is mentioned but no
     storage path is specified. The plugin has access to the
     `${CLAUDE_PLUGIN_DATA_DIR}` persistent data directory documented
     [here](https://docs.anthropic.com/en/docs/claude-code/plugins-reference#persistent-data-directory)
     — use it instead of leaving the location implicit.
- **`agents/summarizer.md`** — should use `model: haiku` and likely
  `effort: low`; this is a fast deterministic transform.

---

## 4. Commands (`bettercallclaude/commands/`, 19 files)

### 4.1 Frontmatter compliance

| Finding | Priority |
|---|---|
| No command declares `argument-hint:`. The [skills frontmatter reference](https://docs.anthropic.com/en/docs/claude-code/skills#frontmatter-reference) supports it and Cowork shows it in the slash-command picker. Add for arg-taking commands: `/cite "<citation>"`, `/research "<question>"`, `/draft "<doc-type>"`, `/cantonal "<canton>"`, `/legal "<query>"`. | **P2** |
| Side-effect commands (`/setup` runs Bash probes against remote MCP servers; `/legal` may launch multi-agent pipelines) should explicitly declare `disable-model-invocation: true` so Claude does not auto-trigger them. | **P2** |
| `commands/cite.md` and several siblings put `$ARGUMENTS` inline at the end of a sentence. This works, but a leading newline before `$ARGUMENTS` makes the prompt easier for the model to parse and avoids accidental concatenation when the argument is empty. | **P3** |
| The 7-line redirect commands (`cite.md`, `draft.md`, `research.md`, `cantonal.md`, `federal.md`) duplicate logic that lives in skills. Consider letting the skill file *be* the slash command (skills already register as `/skill-name`), removing the indirection — unless you need the namespaced `/bettercallclaude:cite` shortcut specifically. | **P2** |

### 4.2 `/setup`

Strong diagnostic UX. Two notes:

- The doc text refers to "checking the server configuration in `mcp.json`"
  but the file is `.mcp.json`. Minor doc inconsistency.
- The status table emits emojis (✅/❌). Cowork on Windows terminals without
  emoji fonts shows boxes. Consider an `--ascii` fallback or text status
  column in addition.

---

## 5. Skills (`bettercallclaude/skills/`, 14 directories)

### 5.1 Frontmatter & behavior

| Finding | Priority |
|---|---|
| Skills look generally well-structured (`SKILL.md` per directory, no spurious nested SKILL files). Verify each `description:` follows the "use when …" pattern from the Anthropic skills doc; this is what drives auto-invocation. Spot-check `skills/privacy-routing/SKILL.md` and `skills/swiss-citation-formats/SKILL.md`. | **P2** |
| `skills/privacy-routing/SKILL.md` instructs routing to Ollama for privileged content but the project README does **not** explain that Ollama must be installed and a model pulled (`ollama serve`, `ollama pull <model>`). Document this as a prerequisite of the privacy guarantee, or have `/setup` detect a missing Ollama and warn loudly. Otherwise the privacy story is "we send privileged content to Ollama, except when Ollama isn't there, in which case it goes to the cloud silently." | **P0** |
| Consider `allowed-tools:` on skills that call specific Bash commands so users aren't permission-prompted mid-flow. | **P3** |
| The plugin defines no `userConfig` block. Several legitimate config knobs (Ollama host, preferred model, default jurisdiction, default output language, output verbosity) would benefit from being prompted at install via `userConfig` instead of relying on env vars or hard-coded defaults. See the [User configuration](https://docs.anthropic.com/en/docs/claude-code/plugins-reference#user-configuration) docs. | **P1** |

---

## 6. Privacy hook (`bettercallclaude/hooks/hooks.json` + `scripts/privacy-check.js`)

This is the most consequential subsystem in the plugin from a regulatory
standpoint. The implementation is real and cross-platform, but it has gaps
that will erode user trust in either direction (false positives or false
negatives).

### 6.1 Coverage gaps

| Finding | Priority |
|---|---|
| **The `matcher` is `Write\|Edit\|Bash`. MCP tools are not matched.** Per the [hooks ref](https://docs.anthropic.com/en/docs/claude-code/hooks#match-mcp-tools), MCP tools are named `mcp__<server>__<tool>` and must be matched explicitly. The most likely vector for privileged content leaving the machine is *an MCP call to a hosted server* (e.g. `mcp__entscheidsuche__search` with the client's name in the query). Add `mcp__.*` to the matcher (or a more targeted `mcp__(entscheidsuche\|bge-search\|fedlex-sparql\|legal-citations\|onlinekommentar\|swiss-caselaw)__.*`). | **P0** |
| **`MultiEdit` is not matched and not parsed.** `MultiEdit` is the canonical multi-file edit tool; the hook's stdin parser reads `tool_input.new_string` but `MultiEdit` payloads are `tool_input.edits[].new_string`. Add `MultiEdit` to the matcher and iterate the array. | **P0** |
| The hook also misses `WebFetch` (privileged content can be exfiltrated by URL parameters or POST bodies). At minimum, scan `tool_input.url` and `tool_input.prompt`. | **P1** |
| `Bash` matching scans *every* shell command's text — `git commit -m "Update vertraulich.txt"` will trigger a permission prompt. Either drop `Bash` from the matcher or scan only specific subcommands' arguments (e.g. `curl`, `scp`, `cat ... | mail`). | **P1** |

### 6.2 Pattern quality

| Finding | Priority |
|---|---|
| Patterns like `vertraulich`, `confidentiel`, `riservato` appear in nearly every legal document footer. With no word boundary and no contextual gating, the false-positive rate is effectively 100% in real practice. Add `\b` word boundaries and require co-occurrence with at least one *strong* discriminator (client name, file path with `klient/`, `mandant/`, `case/`, etc.). | **P0** |
| `geschäftsgeheimnis` and `mandatsgeheimnis` are German-only; their FR/IT equivalents are missing (`secret d'affaires`, `segreto commerciale`, `segreto del mandato`). | **P2** |
| The regex uses unanchored substring matching for legal references (`Art\.\s*321\s*StGB`). Good. Consider adding `Art. 162 StGB` (commercial secrets), `Art. 47 BankG` (banking secrecy), `Art. 35 FINMAG`, `LSCPT`/`BÜPF` keywords. | **P2** |
| The shell variant in `scripts/privacy-check.sh` and the JS variant in `bettercallclaude/scripts/privacy-check.js` have **slightly different pattern lists** — drift will inevitably happen. The shell version is dead code (hooks.json points at the JS); delete it. | **P1** |

### 6.3 Hook plumbing

| Finding | Priority |
|---|---|
| `timeout: 10` (seconds) is reasonable for a Node script that spawns once per tool call but cold-start of `node` on Windows can flirt with that ceiling. Bumping to 15-20s is safer. | **P3** |
| `hooks.json` declares a top-level `description:` field that is not in the documented schema. Harmless (extra keys are ignored) but consider moving the prose into a sibling README. | **P3** |
| The current implementation always exits 0 and writes JSON — correct per the hooks ref. Consider also handling `permissionDecision: "deny"` for an "always-block" mode that an enterprise admin can opt into, and exposing it via `userConfig`. | **P2** |
| When patterns match, `permissionDecisionReason` includes the matched pattern. That's a small content-leak risk if the prompt is later logged centrally. Consider redacting to "category: attorney-client privilege marker (DE/FR/IT)" without the literal pattern. | **P2** |

---

## 7. MCP servers

### 7.1 Architecture

The split between in-process TypeScript servers (`mcp-servers-src/`),
deployed HTTP servers (`mcp-servers-http/`, served from
`mcp.bettercallclaude.ch`), and the local `ollama` stdio server is sound.
The HTTP transport (`StreamableHTTPServerTransport` in stateless mode)
matches Anthropic's documented pattern.

### 7.2 Findings

| Finding | Priority |
|---|---|
| **Single-origin dependency.** All five HTTP servers point at one host. If `mcp.bettercallclaude.ch` is down, the plugin loses ~70% of its capability and the user sees only generic MCP errors. Document failover/self-host steps prominently in the README (the `mcp-servers-http/DEPLOY.md` exists — link it from the top-level README), and consider supporting `userConfig.mcp_base_url` so enterprises can pin to their own deployment. | **P1** |
| **Rate limit 60 req/min per IP.** A law firm behind one NAT shares the bucket. Document this in the plugin description, and consider an authenticated tier with a `userConfig.api_token`. | **P1** |
| **HTTP service is not in CI.** `mcp-servers-http/` has its own `tsconfig`, `esbuild`, and `package.json` but the GitHub Actions workflow only builds `mcp-servers-src/`. Add a job that runs `npm ci && npm run typecheck && npm run build` for `mcp-servers-http/`. | **P1** |
| **Mixed test runners.** `mcp-servers-src/shared/` ships a `jest.config.js` while the rest of the workspace uses `vitest`. Pick one (vitest is already the de-facto winner here) and remove the other. | **P2** |
| **Engines drift.** Root and `mcp-servers-src` declare `node >=18.0.0`; `mcp-servers-http` declares `node >=22.0.0`. A single `npm ci` at the repo root using Node 18 will silently break the HTTP server's build. Pin one minimum (recommend `>=20.0.0`, the active LTS) and mirror it everywhere; or scope the `>=22` requirement to the `engines.node` of just the HTTP build script. | **P2** |
| **TypeScript drift.** `5.3.3` in `shared`, `5.7.2` elsewhere; vitest `4.0.15` (a beta-line). Consolidate. | **P3** |
| **Duplicate repository naming.** `mcp-servers-src/shared/src/database/repositories/` contains both `bge-repository.ts` and `BgeRepository.ts`-style names plus `cache-repository.ts` *and* `CacheRepository.ts` *and* `DecisionRepository.ts`. Pick a single naming convention (PascalCase matches TypeORM's idiom). On a case-insensitive filesystem (macOS default, Windows), some of these collide — they only "work" today because git tracks them as distinct but the runtime sees one. | **P0** |
| **Schema duplication.** `mcp-servers-src/shared/src/database/schema.sqlite.sql` defines tables that TypeORM entities also describe. Use `synchronize` or a single migration source-of-truth. | **P2** |
| **Logger writes everything to stderr** — correct comment, correct behavior for stdio MCP servers (per [SDK guidance](https://github.com/modelcontextprotocol/typescript-sdk)). Worth a brief note in `mcp-servers-http/README.md` that the same shared logger is fine over HTTP because stdout isn't reserved there. | **P3** |
| **Ollama server's error hint** ("Start Ollama with: `ollama serve`") is good. Add a `model` field to the same hint (e.g. recommend `llama3.1:8b-instruct-q4` or `mistral:7b-instruct-q4` for legal text) and surface it from `/setup`. | **P3** |

---

## 8. Build, packaging & CI

### 8.1 `scripts/build-servers.sh`

Solid: bundles via `esbuild`, handles the CJS/ESM split (CJS for servers
that depend on TypeORM, ESM for standalone), copies `sql-wasm.wasm`. Two
small things:

| Finding | Priority |
|---|---|
| The script is bash-only. Windows contributors cannot run it without WSL/Git-Bash. Add an equivalent `node scripts/build-servers.mjs` so it runs anywhere Node runs. (Same applies to `package-plugin.sh`.) | **P2** |
| Failures in step 2 (build shared library) silently propagate to step 3 (`esbuild` succeeds anyway). Add `set -euo pipefail` at the top and check the exit code of each subshell. | **P2** |

### 8.2 GitHub Actions

| Finding | Priority |
|---|---|
| **CI lint step uses `continue-on-error: true`**. This is the worst configuration: the badge stays green and lint warnings/errors land in main unnoticed. Either fix the existing violations and remove `continue-on-error`, or downgrade to `ruleset: warning`-only and accept the noise. | **P1** |
| Test matrix runs Node 20 *and* 22 — but `mcp-servers-http` requires `>=22`. Either drop Node 20 or guard the HTTP build behind `if: matrix.node == '22'`. | **P2** |
| `validate-plugin` checks frontmatter for skills/commands/agents — great. Extend it to also check that every agent declares `model:` (after the change in §3.1) and that every command declares `argument-hint:` when it uses `$ARGUMENTS`. | **P2** |
| The release workflow tags-and-zips. Consider adding a step that publishes the same zip as a Cowork plugin marketplace update (push the new `marketplace.json` SHA so users see the update banner). | **P3** |

---

## 9. Repo hygiene

| Finding | Priority |
|---|---|
| `data/bettercallclaude.db` (180KB SQLite) is committed. If it is read-only seed data, document its purpose in a sibling `data/README.md`; otherwise add it to `.gitignore` and provide a `scripts/build-cache.{sh,mjs}` step. | **P2** |
| `bettercallclaude/mcp-servers/.gitignore` ignores `*/dist/` for the HTTP servers (correct: they run remotely) but the root README mentions "compiled bundles ARE checked in". The truth: only `ollama/dist/index.js` is checked in. Update the README to match reality. | **P2** |
| Dead code: `scripts/privacy-check.sh` (duplicates the JS hook), `install-claude-desktop.sh` (legacy CLI install path superseded by Cowork marketplace). Delete or archive under `legacy/`. | **P2** |
| `.gitignore` has `CLAUDE.md` — meaning a project-wide CLAUDE.md cannot be committed. If you intentionally want every contributor's CLAUDE.md to stay local, leave it; otherwise remove the entry and commit a project CLAUDE.md describing the repo conventions. | **P3** |
| No `CONTRIBUTING.md`. For a 100+ file plugin with non-obvious conventions (CJS vs ESM bundling, dot-prefixed `.mcp.json`, frontmatter quirks), a one-page contributor guide pays for itself fast. | **P2** |
| No issue/PR templates under `.github/`. Add a bug template that asks for OS, Cowork version, plugin version, and the output of `/bettercallclaude:setup`. | **P3** |

---

## 10. Documentation

| Finding | Priority |
|---|---|
| README is comprehensive but front-loads marketing and buries the install steps. Move "Install via Cowork marketplace" above the feature matrix. | **P3** |
| `docs/SUBMISSION_MATERIALS.md` is internal; consider moving it under `docs/internal/` or `.github/` so it doesn't dominate `docs/`. | **P3** |
| The privacy guarantee (Ollama for privileged content, hook detection at write time) deserves its own `docs/PRIVACY.md` clearly stating: what is detected, what is not detected, what happens on detection, what the user must install for the local-Ollama path to work, and the regulatory framing (Art. 321 StGB, Art. 13 BGFA, FADP). | **P1** |
| There is no `SECURITY.md`. For a plugin that handles attorney-client privileged data and ships a remote MCP service, add one with a disclosure email and an SLA. | **P1** |

---

## 11. Suggested fix order (by impact-to-effort)

The following sequencing maximises user-visible quality improvements while
keeping each PR small and reviewable.

1. **PR #1 — Privacy hook coverage** (closes §6.1 + §6.2):
   add `mcp__.*` and `MultiEdit` to the matcher, parse
   `edits[].new_string`, add word boundaries, gate weak words on
   discriminators, delete the dead shell hook. **Highest user-trust
   impact, ~1 day of work.**
2. **PR #2 — Agent `model:` and `Task` tool** (closes §3.1):
   pin a model per agent; add `Task` to `orchestrator` and `briefing`.
   Touches every agent file but each diff is one line.
3. **PR #3 — Repository naming collision** (closes §8.2 row 4):
   pick PascalCase, rename, update imports. Mechanical but affects many
   files.
4. **PR #4 — `userConfig` for `mcp_base_url`, `ollama_host`,
   `default_jurisdiction`, `output_language`, `api_token`** (closes §5
   row 4 + §7 rows 1-2). Unlocks self-hosting and enterprise tiers.
5. **PR #5 — CI cleanup**: remove `continue-on-error: true`, add
   `mcp-servers-http` job, align engines and TS versions, drop the
   committed SQLite DB or document it (§7 + §8.2 + §9).
6. **PR #6 — Privacy & Security docs** (`docs/PRIVACY.md`,
   `SECURITY.md`, `CONTRIBUTING.md`).

---

## 12. What's already great

- **The privacy hook *exists* and is cross-platform Node.** Most plugins
  ship a SKILL.md telling Claude to "be careful." This one wires a
  PreToolUse hook with `permissionDecision: ask`. That's the right shape.
- **The MCP server architecture is mature** — proper separation of stdio
  vs HTTP transports, shared library, esbuild bundling, deployable HTTP
  service with health endpoint, CORS, and rate-limit middleware.
- **The agent fleet is genuinely specialised.** `agents/researcher.md`'s
  6-step workflow is the cleanest example of a Claude Code subagent
  prompt I've seen in a domain plugin.
- **The README is honest about what the plugin is and isn't.** v4.2.1's
  patch notes call out concrete Cowork bugs and how the plugin works
  around them — exactly the level of transparency a marketplace user
  needs.
- **AGPL-3.0 is correctly declared** at the marketplace level — important
  for derivative-plugin authors to know up front.

---

*End of review. This document is the only file added by this PR; no
runtime code is modified.*
