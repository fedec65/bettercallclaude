# Contributing to BetterCallClaude

Thanks for taking the time. This is a small, opinionated project; please read
this document once before opening a non-trivial PR.

## What lives where

```
bettercallclaude/           The Cowork Desktop plugin itself.
├── .claude-plugin/         plugin.json + marketplace.json. Schema-validated in CI.
├── .mcp.json               MCP server declarations. ${user_config.*} interpolation.
├── agents/                 20 subagent prompts. YAML frontmatter: name, description, model, tools.
├── commands/               19 slash commands.
├── skills/                 14 skills (SKILL.md per directory).
├── hooks/                  Cowork Desktop hooks. Entrypoint for privacy protection.
├── scripts/                privacy-check.js and its test file.
└── mcp-servers/ollama/     Bundled local MCP server (dist/ committed, only Node STDIO server).

mcp-servers-src/            Source of the MCP servers, npm workspaces layout.
├── shared/                 DB layer + common types. TypeORM entities live here.
├── bge-search/             BGE/ATF/DTF precedent search.
├── entscheidsuche/         Full-text search over entscheidsuche.ch.
├── fedlex-sparql/          SPARQL queries against fedlex.admin.ch.
├── legal-citations/        Citation parser and validator.
├── onlinekommentar/        Online commentary lookup.
├── ollama/                 Local summariser/translator via Ollama.
└── integration-tests/      Cross-workspace tests.

mcp-servers-http/           The Express 5 gateway deployed at mcp.bettercallclaude.ch.
                            Wraps the HTTP MCP servers in a single Node process.

docs/                       Design docs, reviews, specs.
.github/workflows/          CI. Three jobs: test-mcp-servers (matrix 20,22),
                            test-http-server (22), validate-plugin (20).
```

## Prerequisites

- Node.js 20 or 22. (Root / `mcp-servers-src` require `>=20`;
  `mcp-servers-http` requires `>=22`.)
- npm 9+.
- For privacy-hook work: nothing extra — `privacy-check.js` uses only the
  Node standard library.
- For Ollama server work: a local Ollama daemon if you want to run the STDIO
  server end-to-end.

## Setup

```bash
git clone https://github.com/fedec65/bettercallclaude.git
cd bettercallclaude

cd mcp-servers-src
npm ci
npm run build
npm test          # 666 tests, ~30 s

cd ../mcp-servers-http
npm ci
npm run typecheck
npm run build
```

The root directory has a convenience `npm run build` / `npm test` that wraps
`mcp-servers-src`.

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

- [ ] `npm run lint`, `npm run build`, `npm test` all green in `mcp-servers-src`.
- [ ] `npm run typecheck` + `npm run build` green in `mcp-servers-http` if you
      touched any file it transitively includes (it reaches into
      `mcp-servers-src/{legal-citations,fedlex-sparql,onlinekommentar}/src`).
- [ ] CI is green on GitHub.
- [ ] PR description uses the template in `.github/` if present, and has a
      concrete testing section.
- [ ] No new `continue-on-error` in CI.
- [ ] No secrets, `.env`, or `settings.json` committed.

## Style notes specific to this repo

- **Agents must declare `model:`.** Inheriting the caller's model gives
  non-deterministic cost and latency. Use `opus` for coordination,
  `haiku` for mechanical formatting, `sonnet` for everything else.
- **Agents that spawn subagents must list `Task` as a tool.** The prompt
  alone is not enough; the subagent-runtime checks the tool list.
- **Repository classes in `mcp-servers-src/shared/src/database/repositories/`
  are PascalCase.** The raw-SQL variant is `SqliteCacheRepository`; the
  TypeORM variant is `CacheRepository`. Do not reintroduce a class named
  `CacheRepository` outside the TypeORM universe.
- **Do not hardcode URLs in `.mcp.json`.** Use `${user_config.mcp_base_url}`
  and declare new keys in `plugin.json` under `userConfig`.
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
- Bumping a dependency in `package.json` should run `npm install` and commit
  the `package-lock.json` diff in the same PR.
- Any change to `plugin.json` or `.mcp.json` requires a corresponding note
  in the PR body about user-visible impact (re-prompt on next enable, etc.).

## Questions

Open a discussion on GitHub or email the maintainer. For security issues
specifically see [`SECURITY.md`](./SECURITY.md).
