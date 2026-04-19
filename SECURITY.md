# Security Policy

## Supported versions

Security fixes are applied to the current minor release on `main`. Older
minors are not maintained.

| Version | Status      |
| ------- | ----------- |
| 4.2.x   | Supported   |
| < 4.2   | Unsupported |

## Reporting a vulnerability

Please do **not** open a public GitHub issue for a suspected vulnerability.

Use one of:

1. GitHub Security Advisories — [private report form](https://github.com/fedec65/bettercallclaude/security/advisories/new).
2. Email the maintainer: `federico.cesconi@sandsiv.com`, subject prefixed
   `[bettercallclaude security]`.

Please include, as available:

- Which component (plugin manifest, privacy hook, an MCP server — which one,
  HTTP vs STDIO, `mcp-servers-src/` or `mcp-servers-http/`).
- The commit or release version you tested against.
- Reproduction steps: prompt, tool call, inputs, network transcript.
- Observed impact: data that left the machine, confirmation bypassed, agent
  coerced into a tool it does not list, etc.
- Your assessment of severity and blast radius.

## Triage SLA (best effort)

| Severity | First response | Fix target                |
| -------- | -------------- | ------------------------- |
| Critical | 48 h           | 7 days (patch release)    |
| High     | 5 days         | 30 days                   |
| Medium   | 10 days        | Next minor                |
| Low      | 15 days        | Batched                   |

"Critical" here means privileged content exfiltration (the whole
`Anwaltsgeheimnis` protection promise), remote code execution in any MCP
server, or authentication bypass on the hosted gateway.

## Scope

In scope:

- The plugin manifest, hooks, agents, commands, skills in
  [`bettercallclaude/`](../bettercallclaude/).
- The five HTTP MCP servers and the local `ollama` STDIO server in
  [`mcp-servers-src/`](../mcp-servers-src/).
- The HTTP ingress gateway in [`mcp-servers-http/`](../mcp-servers-http/)
  that serves `mcp.bettercallclaude.ch`.

Out of scope:

- Cowork Desktop itself — report to [Anthropic](https://www.anthropic.com/security).
- The Anthropic API — report to [Anthropic](https://www.anthropic.com/security).
- Public Swiss legal sources the plugin queries (`entscheidsuche.ch`,
  `fedlex.admin.ch`, etc.).
- Anything hosted on the swiss-caselaw SSE endpoint (see that project's
  security policy).

## Coordinated disclosure

We prefer coordinated disclosure. By default, the maintainer will keep a
report private until a fix is released, then publish a GitHub Security
Advisory and credit the reporter (unless anonymity is requested).

## Hall of fame

When the project accumulates meaningful reports, reporters who want public
credit will be listed here.

## Known non-issues

These items look like bugs but are intentional:

- **Lint warnings in the MCP servers.** `@typescript-eslint/no-explicit-any`
  and unused-var warnings are tracked separately and do not fail CI. They
  are not security issues.
- **The `pre-tool-use` hook uses regex, not ML.** This is a design choice
  explained in [`docs/PRIVACY.md`](./docs/PRIVACY.md) §2. The hook reduces
  accidental leakage; it is not a guarantee.
- **Seed data at `data/bettercallclaude.db`.** Public legal references, no
  PII. See [`docs/PRIVACY.md`](./docs/PRIVACY.md) §3.
