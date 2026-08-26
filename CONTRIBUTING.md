# Contributing to BetterCallClaude

Thanks for taking the time. This is a small, opinionated project; please read
this document once before opening a non-trivial PR.

## Where the code lives

As of v4.4.0 the Swiss-legal MCP server source code and HTTP aggregator have
been split out into a separate repo:

- **This repo (`fedec65/bettercallclaude`)** — the Cowork Desktop / Claude
  Code plugin: agents, commands, skills, hooks, and `.mcp.json`. Pointers
  only — the remote MCPs it talks to are HTTPS URLs on
  `mcp.bettercallclaude.ch`. One server (`ollama`) is bundled locally as a
  STDIO subprocess because it talks to the user's own Ollama daemon.
- **[`fedec65/BetterCallClaudeMCP`](https://github.com/fedec65/BetterCallClaudeMCP)** —
  source code for every MCP server (bge-search, entscheidsuche, fedlex-sparql,
  legal-citations, onlinekommentar, legal-persona, tas-jurisprudence, shared
  lib, integration tests) and the Express aggregator at `mcp-servers-http/`
  that Railway deploys to `mcp.bettercallclaude.ch`. To change what an MCP
  **does**, open a PR there.

## What lives where (this repo)

```
bettercallclaude/           The Cowork Desktop / Claude Code plugin itself.
├── .claude-plugin/         plugin.json + marketplace.json. Schema-validated in CI.
├── .mcp.json               MCP server declarations. Remote URLs + ollama stdio.
├── agents/                 20 subagent prompts. YAML frontmatter: name, description, model, tools.
├── commands/               26 slash commands.
├── skills/                 13 skills (SKILL.md per directory).
├── hooks/                  Cowork Desktop hooks. Entrypoint for privacy protection.
├── scripts/                privacy-check.js and its test file.
└── mcp-servers/ollama/     Bundled local STDIO MCP server (dist/ committed).

packages/                   Supplementary agents shared across the plugin.
scripts/                    Repo-level scripts: fetch-onlinekommentar-data.js,
                            package-plugin.sh.
docs/                       Design docs, reviews, specs.
.github/workflows/          CI (validate-plugin) and Release (tag → zip → GH release).
```

## Prerequisites

- Node.js 20 or 22.
- For privacy-hook work: nothing extra — `privacy-check.js` uses only the
  Node standard library.
- For Ollama server work: a local Ollama daemon if you want to run the STDIO
  server end-to-end.
- For MCP **behaviour** changes: clone
  [`fedec65/BetterCallClaudeMCP`](https://github.com/fedec65/BetterCallClaudeMCP)
  and work there instead of this repo.

## Setup

```bash
git clone https://github.com/fedec65/bettercallclaude.git
cd bettercallclaude

# Package the plugin into a distributable zip (exercises the same path CI
# and Release take).
npm run package
```

There is no TypeScript to compile in this repo anymore — the only runtime
code is `scripts/privacy-check.js` (vanilla Node) and the pre-built
`bettercallclaude/mcp-servers/ollama/dist/`.

## Branching

All changes go to branches off `main`. Name convention:

- `fix/<short-name>` — bug fix
- `feat/<short-name>` — new capability
- `docs/<short-name>` — documentation only
- `chore/<short-name>` — dependency bumps, tooling, scaffolding
- `quality/<short-name>` — reviews and audit documents (no code changes)

Do not open PRs against `quality/*` branches; those are review sinks.

## Commit message style

Conventional-ish, but oriented at explaining *why* in the body:

```
fix(privacy-hook): cover MultiEdit tool and gate weak markers

The hook's matcher was "Write|Edit|Bash" so MultiEdit slipped through, and
its pattern list fired on the bare word "vertraulich" (matches every
German-language document footer). This adds ...
```

- First line ≤ 72 chars, `<type>(<scope>): imperative verb`.
- Body explains the motivation, not just the diff. Assume the reader is a
  future contributor with the review context only in their browser history.
- Always link back to `docs/reviews/` or an issue number when applicable.

## Pull request checklist

Before marking a PR ready for review:

- [ ] `npm run package` succeeds locally (builds the distributable zip).
- [ ] `node bettercallclaude/scripts/privacy-check.test.js` is green if you
      touched the privacy hook.
- [ ] CI is green on GitHub.
- [ ] PR description uses the template in `.github/` if present, and has a
      concrete testing section.
- [ ] No secrets, `.env`, or `settings.json` committed.

## Version bump checklist

Every release — including patch releases — must bump the version in **all**
of these places, or they drift (4.11.1–4.11.3 forgot the plugin README and
`help.md` until 4.11.3 shipped):

- [ ] `package.json` — `"version"`
- [ ] `.claude-plugin/marketplace.json` — `"version"`
- [ ] `bettercallclaude/.claude-plugin/plugin.json` — `"version"`
- [ ] `bettercallclaude/README.md` — `**Version**: X.Y.Z -- …` header line
      (this is the README Cowork displays for the installed plugin)
- [ ] `bettercallclaude/commands/help.md` — `**BetterCallClaude vX.Y.Z …` line
- [ ] `bettercallclaude/commands/version.md` — `Version:      X.Y.Z` line
- [ ] `README.md` — version badge line 1 (and refresh "What's New" on
      minor releases)
- [ ] `CHANGELOG.md` — new entry at the top

Verify with:

```bash
grep -rn "<old version>" --include="*.json" --include="*.md" . \
  | grep -v node_modules | grep -v CHANGELOG | grep -v dist/ \
  | grep -v htmlcov | grep -v marketing/ | grep -v legal-briefing-workspace \
  | grep -v .superpowers | grep -v docs/project-management
```

Expected: no output. Historical mentions in CHANGELOG, marketing, docs, and
"What's New" history entries stay on purpose.

## Style notes specific to this repo

- **Agents must declare `model:`.** Inheriting the caller's model gives
  non-deterministic cost and latency. Use `opus` for coordination,
  `haiku` for mechanical formatting, `sonnet` for everything else.
- **Agents that spawn subagents must list `Task` as a tool.** The prompt
  alone is not enough; the subagent-runtime checks the tool list.
- **Do not use `${user_config.*}` inside `url:` fields in `.mcp.json`.**
  Cowork's server-side plugin validator rejects URL templating before the
  user is prompted for `userConfig` values (see anthropic/claude-code#39455).
  Hardcode the gateway URLs (`https://mcp.bettercallclaude.ch/...`,
  `https://mcp.opencaselaw.ch`) and keep `${user_config.*}` substitution for
  `env:`, `args:`, and `headers:` only. Self-hosters fork and edit
  `.mcp.json` directly.
- **Do not hardcode privacy patterns in the hook's strong list without
  word boundaries.** Weak markers (bare `confidential`, `vertraulich`,
  etc.) must be gated on a discriminator — see
  `bettercallclaude/scripts/privacy-check.js` and its test file.

## Testing changes to the privacy hook

```bash
cd bettercallclaude
node scripts/privacy-check.test.js    # 26 cases
echo '{"tool_name":"Write","tool_input":{"file_path":"/tmp/x","content":"Anwaltsgeheimnis"}}' \
  | node scripts/privacy-check.js
# → emits hookSpecificOutput JSON with permissionDecision: "ask"
```

## Code review expectations

- Behaviour-neutral refactors (renames, reshuffles) are welcome but must be
  isolated from behaviour changes; do not mix.
- Any change to `plugin.json` or `.mcp.json` requires a corresponding note
  in the PR body about user-visible impact (re-prompt on next enable, etc.).

## Questions

Open a discussion on GitHub or email the maintainer. For security issues
specifically see [`SECURITY.md`](./SECURITY.md).
