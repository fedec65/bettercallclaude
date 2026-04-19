# Privacy Notes for BetterCallClaude

BetterCallClaude is a legal-work tool. Attorneys using it will inevitably put
privileged material into prompts. This document describes **what the plugin
does with that material**, and equally important, **what it does not do**.

Nothing here is legal advice. The controlling obligation for Swiss counsel is
Art. 321 StGB (Berufsgeheimnis) and its cantonal equivalents; this document
describes only the plugin's technical behaviour so you can decide whether that
behaviour is compatible with your ethical duties.

---

## 1. Data flow by component

BetterCallClaude is a plugin running inside Cowork Desktop. It does not host
its own LLM. When you type a prompt, Cowork Desktop sends it to the Anthropic
API. The plugin's role is narrower:

### 1.1 Agents, commands, skills

Text files. Read by Cowork Desktop at launch. They do not call out to any
network. The text of an agent prompt ships with the plugin; none of your
conversation content ever reaches the plugin author.

### 1.2 MCP servers

Seven MCP servers are declared in
[`bettercallclaude/.mcp.json`](../bettercallclaude/.mcp.json).

Six run **remotely** at `mcp.bettercallclaude.ch` (HTTP) or
`mcp.opencaselaw.ch` (SSE). Exact list:

| Server            | Transport | Default endpoint                                   |
| ----------------- | --------- | -------------------------------------------------- |
| `entscheidsuche`  | HTTP      | `https://mcp.bettercallclaude.ch/entscheidsuche/mcp` |
| `bge-search`      | HTTP      | `https://mcp.bettercallclaude.ch/bge-search/mcp`   |
| `legal-citations` | HTTP      | `https://mcp.bettercallclaude.ch/legal-citations/mcp` |
| `fedlex-sparql`   | HTTP      | `https://mcp.bettercallclaude.ch/fedlex-sparql/mcp` |
| `onlinekommentar` | HTTP      | `https://mcp.bettercallclaude.ch/onlinekommentar/mcp` |
| `swiss-caselaw`   | SSE       | `https://mcp.opencaselaw.ch`                       |

When one of these is invoked, the **arguments** passed to the tool (usually a
search query, a BGE reference, or a citation string) are sent to the endpoint
over HTTPS. The endpoint queries public Swiss legal sources
(entscheidsuche.ch, fedlex.admin.ch, BGer, etc.) and returns results.

What this means for privilege:

- If you search for `"Art. 321 StGB"` or `"BGE 149 III 289"`, only that
  string leaves your machine. It is not privileged content.
- If you paste a client's draft motion into the prompt and then the agent
  autonomously calls `entscheidsuche.search("confidential facts from the
  motion")`, that string *does* leave your machine. The `pre-tool-use` hook
  (see §2) is intended to stop this.

One server runs **locally**:

| Server   | Transport | Command                                          |
| -------- | --------- | ------------------------------------------------ |
| `ollama` | STDIO     | `node ${CLAUDE_PLUGIN_ROOT}/mcp-servers/ollama/dist/index.js` |

The Ollama subserver talks to a local Ollama daemon you operate (default
`http://localhost:11434`, overridable via the `ollama_host`
[userConfig](../bettercallclaude/.claude-plugin/plugin.json) key). It does not
send data to the plugin author or to `bettercallclaude.ch`. It does send data
to wherever you point `ollama_host`; if you change it to a remote host, the
privacy properties of that host are your responsibility.

### 1.3 Anthropic

Your prompts, tool call arguments, tool call results, and model outputs all
pass through the Cowork Desktop → Anthropic API connection. The plugin does
not change that connection or add to it. Refer to
[Anthropic's privacy policy](https://www.anthropic.com/legal/privacy) for how
that data is handled upstream. If you require that prompts not be used for
model training, ensure your Anthropic account is configured accordingly.

### 1.4 `bettercallclaude.ch` operator

The hosted gateway at `mcp.bettercallclaude.ch` is operated by the plugin
author. Queries arriving there may be logged for operational purposes. If
that is unacceptable for a given matter:

- Set [`mcp_base_url`](../bettercallclaude/.claude-plugin/plugin.json) to a
  self-hosted deployment.
- Or disable the plugin for that matter and use only Cowork Desktop +
  the local `ollama` subserver.

The gateway source is in
[`mcp-servers-http/`](../mcp-servers-http/) and
[`mcp-servers-src/`](../mcp-servers-src/) — you can audit it.

---

## 2. The `pre-tool-use` privacy hook

See [`bettercallclaude/hooks/hooks.json`](../bettercallclaude/hooks/hooks.json)
and [`bettercallclaude/scripts/privacy-check.js`](../bettercallclaude/scripts/privacy-check.js).

When the model is about to call `Write`, `Edit`, `MultiEdit`, `WebFetch`, or
any `mcp__*` tool, the hook scans the tool arguments for markers of
privileged content. Categories:

- **Strong markers** — always trigger a user confirmation:
  - `Anwaltsgeheimnis`, `secret professionnel`, `segreto professionale`
  - `Art. 321 StGB`, `Art. 321 CPS`, `Art. 321 CP`
  - `BGE`, `ATF`, `DTF`, `BGer`, `TF`
- **Weak markers** — trigger only when at least one corroborating signal is
  also present (e.g. "confidential" + client file path, or "vertraulich" +
  a file name starting with `client_` / `case_` / `mandat_`).

The hook outputs `permissionDecision: "ask"` to Cowork Desktop, which then
prompts you before the tool call proceeds. You choose **allow** or **deny**.

Limits of the hook:

- It is pattern-matching, not classification. A determined adversary (or a
  sufficiently creative model) can phrase privileged content in terms that
  don't match any pattern. The hook **reduces** accidental exfiltration; it
  does not prevent it.
- It scans the *arguments* that the model has constructed. If the model has
  already summarised or paraphrased privileged facts into an innocuous query,
  the hook will not see the underlying facts.
- It does not inspect results flowing back from tools, only outbound calls.

For critical matters, disable the hosted MCP servers in your
[`.mcp.json`](../bettercallclaude/.mcp.json) (or set `mcp_base_url` to a
self-hosted instance) and rely on the local `ollama` subserver plus your own
research.

---

## 3. Local files and the seed database

`data/bettercallclaude.db` is a SQLite file committed to this repository. It
contains seed data for the citation databases (BGE references, legal article
indexes). It does **not** contain user conversation state, API keys, or
personally identifying information, but review `data/` before assuming
anything committed to a repository is safe to distribute.

The plugin does not create additional persistent files on disk for
conversation state — that is managed entirely by Cowork Desktop in its own
profile directory.

---

## 4. User-configurable values

Values declared in [`plugin.json` under `userConfig`](../bettercallclaude/.claude-plugin/plugin.json):

| Key                    | Stored where                                    |
| ---------------------- | ----------------------------------------------- |
| `mcp_base_url`         | `settings.json` (plaintext)                     |
| `caselaw_base_url`     | `settings.json` (plaintext)                     |
| `ollama_host`          | `settings.json` (plaintext)                     |
| `default_jurisdiction` | `settings.json` (plaintext)                     |
| `output_language`      | `settings.json` (plaintext)                     |
| `api_token`            | OS keychain (macOS Keychain / Windows Credential Manager / libsecret) |

Only `api_token` is marked sensitive. Cowork Desktop routes sensitive values
to the platform keychain; non-sensitive values are in plaintext in
`settings.json`. Do not commit `settings.json`.

---

## 5. What to do before a privileged matter

1. Decide whether the hosted `mcp.bettercallclaude.ch` gateway is acceptable.
   If not, set `mcp_base_url` to a self-hosted instance or disable the
   hosted servers.
2. Decide whether sending prompts to Anthropic is acceptable under your
   cantonal rules and client engagement.
3. Confirm the `pre-tool-use` hook is present and the agent frontmatter is
   intact. If you have edited agents to remove tools, double-check the
   agent cannot be forced to call tools it should not.
4. Prefer using named references (BGE citations, statute articles) rather
   than pasting verbatim client facts into the research phase.

---

## 6. Reporting a concern

If you believe the plugin has sent privileged content to a destination it
should not have, open an issue marked `privacy` on
[github.com/fedec65/bettercallclaude](https://github.com/fedec65/bettercallclaude/issues)
and include the prompt, the hook output, and the network transcript if
available. See [`SECURITY.md`](../SECURITY.md) for the coordinated-disclosure
path when the issue is a vulnerability rather than a behaviour concern.
