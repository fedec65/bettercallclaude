# ollama connector on Cowork Desktop — user_config drop (v4.11.5 retro)

**Date:** 2026-08-30 · **Release:** v4.11.5 (PR #67, merge e0d4ae7, tag v4.11.5)

**Symptom:** On Cowork Desktop the ollama MCP server never appeared; /doctor reported
it missing since v4.3.0. v4.11.4's in-server host fallback changed nothing.

**Root cause:** Cowork's desktop host bridge drops an entire server when ANY field of
its .mcp.json entry references `${user_config.*}` — not just `url:` as CONTRIBUTING
believed. Log (`~/Library/Logs/Claude/main.log`, hourly):
`config references plugin user configuration (ollama_host) — user_config is not
supported on the desktop host bridge; dropping server`

**Fix:** Removed `env: { OLLAMA_HOST: "${user_config.ollama_host}" }` from
`bettercallclaude/.mcp.json` and the dead `ollama_host` userConfig key from plugin.json.
Server always starts against `http://localhost:11434`; the v4.11.4 client.ts fallback
still honours an explicit host for CLI/self-hosters. Docs updated (README ×2, PRIVACY,
CONNECTORS); CONTRIBUTING now bans user_config in any field.

**Verification:** /doctor 10/10 active; `ollama_check_status` → online, v0.32.15,
22 local models. VM networking is NOT a problem: loopback from the plugin VM reaches
the host Mac's daemon.

**Lessons:** (1) A server-level "config references user_config" log line means the
server was dropped at load — no in-server fix can help. (2) grep the host logs before
trusting a shipped fix. (3) Plugin host logs: `~/Library/Logs/Claude/main.log`.
