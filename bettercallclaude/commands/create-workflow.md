---
description: "Create a reusable custom workflow by combining BetterCallClaude agents. Interview-based: pick agents, order them, define the output. Saved for future use with /bettercallclaude:workflow."
tools:
  - Read
  - Bash
  - mcp__plugin_bettercallclaude_workflows-ch__claim_user_id
  - mcp__workflows-ch__claim_user_id
  - mcp__plugin_bettercallclaude_workflows-ch__list_agents
  - mcp__workflows-ch__list_agents
  - mcp__plugin_bettercallclaude_workflows-ch__validate_pipeline
  - mcp__workflows-ch__validate_pipeline
  - mcp__plugin_bettercallclaude_workflows-ch__save_workflow
  - mcp__workflows-ch__save_workflow
---

# Create Custom Workflow

You guide the user through designing a reusable multi-agent workflow, validate it against the Swiss plugin's agent manifest, and save it for later execution with `/bettercallclaude:workflow <slug>`.

## Resolve the user ID

Every workflows-ch tool call takes a `user_id`. Resolve it in this order:

1. **Plugin setting**: if `${user_config.user_id}` resolved to a non-empty value (i.e. the placeholder does not appear literally), use it.
2. **Custom instructions** (Cowork Desktop): if the session's custom instructions contain a line of the form `BetterCallClaude workflow user ID: <id>`, use that ID. This is the durable source on Cowork — instructions are stored by the app and survive restarts, unlike the sandbox filesystem.
3. **Local config**: read `~/.betterask/config.yaml` if it exists. If it contains a `user_id:` line, use that value. (Convenience cache only — Cowork wipes the sandbox home directory on restart.)
4. **Generate once, claim, then persist**: generate 8 random bytes of hex (e.g. `openssl rand -hex 8`) and build the candidate ID `bcc-<hex>`. Claim it server-side by calling `claim_user_id`; if it returns `claimed: false` (collision), generate a new candidate and retry, up to 3 attempts. If all 3 attempts collide (practically impossible with 64-bit random IDs), ask the user to choose an ID themselves and provide it via the custom-instructions line (Cowork) or the plugin setting (CLI), and stop. Persist the claimed ID by **appending** the line `user_id: bcc-<hex>` to `~/.betterask/config.yaml` (run `mkdir -p ~/.betterask` first; append only — the file may already hold the user's privacy mode). Then tell the user once, briefly: "No User ID was set, so I generated a personal one (`bcc-…`) and saved it to `~/.betterask/config.yaml`. Your workflows are stored under this ID — keep it private: anyone who knows it can read your workflows. Cowork wipes this file on restart, so to keep the ID permanently, add this line under Settings → General → Instructions for Claude: `BetterCallClaude workflow user ID: bcc-…`."
5. If the file cannot be written, tell the user the generated ID and ask them to add the line `BetterCallClaude workflow user ID: <id>` under Settings → General → Instructions for Claude (Cowork) or set the **User ID for custom workflows** plugin setting (CLI), then stop. **Never** fall back to a shared `default` ID.

**Claim pre-existing IDs**: for an ID from the plugin setting (step 1), the custom instructions (step 2), or the config file (step 3), call `claim_user_id` once before the first workflow operation. On `claimed: false` the ID is already registered on the server — show a one-time note: "This User ID is already registered on the server. If it's yours from another machine, ignore this; otherwise set a different User ID." Then continue normally (ownership cannot be verified server-side; whoever holds the ID can access its workflows).

## Procedure

1. **List available agents.** Call `list_agents()` and present the result as a compact table: `agent_id`, display name, what it accepts (`input_types`), what it produces (`output_types`). These are already scoped to the Swiss plugin — no other agents can be used.

2. **Interview the user.** Ask, one question at a time:
   - What is the workflow for? (purpose, typical input)
   - Which agents should run, in which order? Suggest a sequence based on the type compatibility shown in step 1.
   - After which steps should execution pause for confirmation? (`checkpoint: true`)
   - What should the final output look like? (this becomes `output_spec`)
   - A short kebab-case `slug` (propose one from the purpose) and a human-readable `name` + one-line `description`.

3. **Validate.** Call `validate_pipeline` with the assembled pipeline. On errors, explain in plain language and propose a concrete fix:
   - `unknown_agent` → the agent is not part of this plugin; show the valid alternatives.
   - `incompatible_chaining` → explain which data types the previous step produces vs. what the next accepts, and suggest an intermediate agent or a reorder.
   - `non_sequential_steps` → renumber.
   Never surface raw JSON errors to the user. Re-validate after each fix until `valid: true`.

4. **Confirm.** Show the final pipeline as a numbered list (agent — purpose — checkpoint yes/no), the output spec, and the slug. Ask for explicit confirmation before saving.

5. **Save.** Call `save_workflow` with `user_id`, `slug`, `name`, `description`, `pipeline`, `output_spec`. Do not set `visibility` unless the user explicitly asks to share the workflow (`team` / `public`).

6. **Confirm success.** Tell the user: "Saved. Run it with `/bettercallclaude:workflow <slug>`." If the server reported validation errors at save time (it re-validates), go back to step 3 with those errors.

## Rules

- Plugin scope is enforced by the server-side manifest — do not add your own agent filtering.
- Never invent agent_ids; only use values returned by `list_agents()` in this session.
- Keep the interview short: at most the questions listed above.

## User Query

$ARGUMENTS
