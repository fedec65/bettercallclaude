# workflows-ch (Custom Workflows MCP Server) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple workflow *data* (user-defined, persisted, reusable pipelines) from the workflow *engine* (fixed, versioned in the plugin) by adding a Postgres-backed MCP server `workflows-ch` plus a `/bettercallclaude:create-workflow` command, per spec `~/Desktop/bcc-workflows-mcp-CH.md` (BCC-SPEC-WORKFLOWS-CH-001).

**Architecture:** New `mcp-servers/workflows` package in the **BetterCallClaudeMCP** monorepo (`/Users/federicocesconi/Dev/BetterCallClaudeMCP`), following the `legal-persona` package layout (zod schemas, pure tool functions, vitest). It is wired into the deployed Express aggregator `mcp-servers-http` as `POST /workflows-ch/mcp` (stateless StreamableHTTP, same as all other servers). Plugin side (this repo, `/Users/federicocesconi/Dev/BetterCallClaude`): `.mcp.json` gains the server, `commands/workflow.md` lists saved custom workflows next to the 5 fixed templates, new `commands/create-workflow.md` interviews/validates/saves. No change to the execution engine.

**Tech Stack:** TypeScript (ES2022, ESM), `@modelcontextprotocol/sdk` ^1.27.x (low-level `Server` + `setRequestHandler`), `pg` ^8 (Pool via `DATABASE_URL`), zod ^3.22, vitest, esbuild bundle, Railway (Docker + managed Postgres).

**Spec deviations (agreed with user during planning):**
1. `agents_manifest` contains the **16 chainable stage agents** that `workflow.md` pipelines actually execute (researcher, strategist, risk, drafter, compliance, corporate, realestate, citation, fiscal, advocate, adversary, judicial, translator, cantonal, procedure, data-protection) — NOT the 12 skill names from the spec. Excluded: `orchestrator` (is the engine), `summarizer` (auto-appended post-processor), `briefing` (pre-execution), `prompt-engineer` (meta), `chronology-builder` (internal worker of legal-chronology).
2. `user_id` is a plain tool parameter (the spec's tools already declare it). Its value comes from a new plugin `userConfig.user_id` setting interpolated into command bodies as `${user_config.user_id}`, with a documented fallback to `default`. **No** `X-BCC-User` header plumbing is built (no such mechanism exists in the gateway today; the spec's claim was inaccurate).
3. URL path is `/workflows-ch/mcp` (every existing server uses its full name in the path; the spec's `/workflows/mcp` would break the convention).
4. The spec's "SKILL.md of /bettercallclaude:workflow" does not exist — the target file is `bettercallclaude/commands/workflow.md`.
5. MCP tool prefix is `mcp__plugin_bettercallclaude_workflows-ch__*` (server name `workflows-ch` in `.mcp.json`), not the spec's `..._workflows__*`.

## Global Constraints

- MCP server repo: `/Users/federicocesconi/Dev/BetterCallClaudeMCP`, branch `main`, npm workspaces, Node >= 22.
- Plugin repo: `/Users/federicocesconi/Dev/BetterCallClaude`, branch `main`.
- Handlers return `{ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }`; errors return the same shape with `isError: true`.
- Validation errors use codes `unknown_agent`, `incompatible_chaining`, `non_sequential_steps` and shape `{ valid: boolean, errors: [{ code, step?, message }] }`.
- DB access: `pg` Pool from `DATABASE_URL` env var only (Railway injects it); SSL `{ rejectUnauthorized: false }`; pool `max: 5`.
- Schema + seed are idempotent and run automatically on cold start (`ensureSchema()`), so no separate migration runner is needed.
- `save_workflow` upserts on `(user_id, slug)` and increments `version`; `delete_workflow` is owner-only (row must match `user_id`).
- Server is public/unauthenticated by explicit publisher decision (same as the Italia gateway); `user_id` is self-asserted. Document that users should pick a non-trivial `user_id` value.
- Plugin version bump: 4.10.1 → **4.11.0** (additive, non-breaking minor).
- YAML frontmatter convention for commands: only `description` + `tools` keys (no `name:`), tools fully qualified as `mcp__plugin_bettercallclaude_<server>__<tool>`.
- Commit after every task. Conventional commits (`feat:`, `chore:`, `docs:`).

## File Structure

**BetterCallClaudeMCP repo:**

- `mcp-servers/workflows/package.json` — new workspace `@bettercallclaude/workflows-mcp` (deps: `pg`, `zod`, `@modelcontextprotocol/sdk`; devDeps: `@types/pg`, `typescript`, `vitest`)
- `mcp-servers/workflows/tsconfig.json` — extends `../tsconfig.json`
- `mcp-servers/workflows/vitest.config.ts` — `{ globals: true, environment: 'node' }`
- `mcp-servers/workflows/src/types.ts` — zod input schemas for all 7 tools + `PipelineStep`
- `mcp-servers/workflows/src/manifest.ts` — `AGENTS_MANIFEST: AgentManifestEntry[]` (16 agents; single source of truth for seed AND validation tests)
- `mcp-servers/workflows/src/validate.ts` — pure `validatePipeline()` + `AgentManifestEntry`/`ValidationResult` types
- `mcp-servers/workflows/src/sql.ts` — `SCHEMA_SQL` string constant (3 tables; embedded so the esbuild bundle has no fs dependency)
- `mcp-servers/workflows/src/db.ts` — `getPool()`, `ensureSchema()`, `closePool()`
- `mcp-servers/workflows/src/tools.ts` — `listAgents`, `validatePipelineTool`, `saveWorkflow`, `listWorkflows`, `getWorkflow`, `deleteWorkflow`, `logRun` (all take `Pool` as first arg)
- `mcp-servers/workflows/src/__tests__/validate.test.ts`, `types.test.ts`, `tools.test.ts`
- `mcp-servers-http/src/servers/workflows-ch.ts` — `createWorkflowsChServer(): Server` (MCP wiring, mirrors `servers/legal-persona.ts`)
- `mcp-servers-http/src/servers/__tests__/workflows-ch.test.ts` — tools-list smoke test via `InMemoryTransport`
- Modify: root `package.json` (workspaces), root `package-lock.json` (via `npm install`), `mcp-servers-http/src/index.ts` (import + `SERVER_NAMES` + `routes`), `mcp-servers-http/esbuild.config.mjs` (alias), `mcp-servers-http/Dockerfile` (COPY line)

**BetterCallClaude repo (plugin):**

- Modify: `bettercallclaude/.mcp.json` — add `workflows-ch` server
- Modify: `bettercallclaude/.claude-plugin/plugin.json` — version 4.11.0 + `userConfig.user_id`
- Create: `bettercallclaude/commands/create-workflow.md`
- Modify: `bettercallclaude/commands/workflow.md` — frontmatter tools + "Your Workflows" section
- Modify: `CHANGELOG.md`, `README.md`, `bettercallclaude/README.md`, `bettercallclaude/commands/help.md`, `bettercallclaude/commands/version.md`, `package.json`, `.claude-plugin/marketplace.json`, `AGENTS.md` (version/release docs)

---

# Part 1 — MCP server (repo: /Users/federicocesconi/Dev/BetterCallClaudeMCP)

### Task 1: Scaffold the `workflows` package and register the workspace

**Files:**
- Create: `mcp-servers/workflows/package.json`
- Create: `mcp-servers/workflows/tsconfig.json`
- Create: `mcp-servers/workflows/vitest.config.ts`
- Create: `mcp-servers/workflows/src/index.ts`
- Modify: `package.json` (root, workspaces array)
- Modify: `package-lock.json` (regenerated)

**Interfaces:**
- Produces: workspace name `@bettercallclaude/workflows-mcp` used by later tasks and the Dockerfile.

- [ ] **Step 1: Create the package files**

`mcp-servers/workflows/package.json`:

```json
{
  "name": "@bettercallclaude/workflows-mcp",
  "version": "1.0.0",
  "description": "MCP server for custom reusable legal workflows (workflows-ch): pipeline validation, workflow persistence, run logging",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "clean": "rm -rf dist"
  },
  "license": "AGPL-3.0-or-later",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "pg": "^8.11.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/pg": "^8.10.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

`mcp-servers/workflows/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "ES2022",
    "moduleResolution": "node"
  },
  "include": ["src/**/*"]
}
```

`mcp-servers/workflows/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  }
});
```

`mcp-servers/workflows/src/index.ts`:

```ts
export * from './types.js';
export * from './validate.js';
export * from './manifest.js';
export * from './db.js';
export * from './tools.js';
```

Root `package.json` — add `"mcp-servers/workflows"` to the `workspaces` array (keep alphabetical-ish order, after `"mcp-servers/tas-jurisprudence"`).

- [ ] **Step 2: Update the lockfile and typecheck**

```bash
cd /Users/federicocesconi/Dev/BetterCallClaudeMCP
npm install
npm run typecheck --workspace=@bettercallclaude/workflows-mcp
```

Expected: `npm install` adds the workspace and updates `package-lock.json`; typecheck fails only on missing `./validate.js` etc. — that is fine at this point (later tasks add the files). If the missing-module errors block CI habits, temporarily comment the barrel's not-yet-created re-exports and uncomment them in the task that creates each file.

- [ ] **Step 3: Commit**

```bash
git add mcp-servers/workflows package.json package-lock.json
git commit -m "feat(workflows): scaffold @bettercallclaude/workflows-mcp package"
```

### Task 2: Zod input schemas (`types.ts`)

**Files:**
- Create: `mcp-servers/workflows/src/types.ts`
- Test: `mcp-servers/workflows/src/__tests__/types.test.ts`

**Interfaces:**
- Produces: `PipelineStepSchema`, `PipelineSchema`, `VisibilitySchema`, `UserIdSchema`, `SlugSchema`, `SaveWorkflowInputSchema`, `ListWorkflowsInputSchema`, `GetWorkflowInputSchema`, `DeleteWorkflowInputSchema`, `LogRunInputSchema`, `ValidatePipelineInputSchema` and their `z.infer` types. Consumed by Task 5 (tools) and Task 6 (server wrapper).

- [ ] **Step 1: Write the failing test**

`mcp-servers/workflows/src/__tests__/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  SaveWorkflowInputSchema,
  ListWorkflowsInputSchema,
  SlugSchema,
  UserIdSchema,
  PipelineSchema
} from '../types.js';

describe('PipelineSchema', () => {
  it('accepts a valid pipeline and defaults checkpoint to false', () => {
    const r = PipelineSchema.safeParse([
      { step: 1, agent_id: 'researcher', purpose: 'Recherche' },
      { step: 2, agent_id: 'drafter', purpose: 'Entwurf', checkpoint: true }
    ]);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data[0].checkpoint).toBe(false);
      expect(r.data[1].checkpoint).toBe(true);
    }
  });

  it('rejects an empty pipeline', () => {
    expect(PipelineSchema.safeParse([]).success).toBe(false);
  });

  it('rejects a step without agent_id', () => {
    expect(
      PipelineSchema.safeParse([{ step: 1, purpose: 'x' }]).success
    ).toBe(false);
  });
});

describe('SlugSchema', () => {
  it('accepts kebab-case', () => {
    expect(SlugSchema.safeParse('my-workflow-2').success).toBe(true);
  });
  it('rejects spaces, uppercase and leading dash', () => {
    expect(SlugSchema.safeParse('My Workflow').success).toBe(false);
    expect(SlugSchema.safeParse('-bad').success).toBe(false);
  });
});

describe('UserIdSchema', () => {
  it('accepts emails and tokens', () => {
    expect(UserIdSchema.safeParse('joe@firm.ch').success).toBe(true);
    expect(UserIdSchema.safeParse('firm-zh-7f3a9c').success).toBe(true);
  });
  it('rejects empty and whitespace', () => {
    expect(UserIdSchema.safeParse('').success).toBe(false);
    expect(UserIdSchema.safeParse('a b').success).toBe(false);
  });
});

describe('SaveWorkflowInputSchema', () => {
  const base = {
    user_id: 'joe@firm.ch',
    slug: 'pip-devis',
    name: 'PIP Devis',
    description: 'Recherche puis redaction',
    pipeline: [{ step: 1, agent_id: 'researcher', purpose: 'Recherche BGE' }],
    output_spec: 'Memo juridique avec citations BGE'
  };
  it('applies visibility default private', () => {
    const r = SaveWorkflowInputSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.visibility).toBe('private');
  });
  it('rejects bad visibility', () => {
    expect(
      SaveWorkflowInputSchema.safeParse({ ...base, visibility: 'world' }).success
    ).toBe(false);
  });
});

describe('ListWorkflowsInputSchema', () => {
  it('defaults include flags to false', () => {
    const r = ListWorkflowsInputSchema.safeParse({ user_id: 'u1' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.include_team).toBe(false);
      expect(r.data.include_public).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/federicocesconi/Dev/BetterCallClaudeMCP/mcp-servers/workflows
npx vitest run src/__tests__/types.test.ts
```

Expected: FAIL — `Cannot find module '../types.js'`.

- [ ] **Step 3: Implement `types.ts`**

```ts
import { z } from 'zod';

export const PipelineStepSchema = z.object({
  step: z.number().int().positive(),
  agent_id: z.string().min(1),
  purpose: z.string().min(1).max(500),
  checkpoint: z.boolean().default(false)
});
export type PipelineStep = z.infer<typeof PipelineStepSchema>;

export const PipelineSchema = z.array(PipelineStepSchema).min(1);

export const VisibilitySchema = z.enum(['private', 'team', 'public']);
export type Visibility = z.infer<typeof VisibilitySchema>;

export const UserIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._@-]+$/, 'user_id may contain letters, digits, dot, underscore, dash and @');

export const SlugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'slug must be kebab-case (lowercase letters, digits, dashes)');

export const ValidatePipelineInputSchema = z.object({
  pipeline: PipelineSchema
});
export type ValidatePipelineInput = z.infer<typeof ValidatePipelineInputSchema>;

export const SaveWorkflowInputSchema = z.object({
  user_id: UserIdSchema,
  slug: SlugSchema,
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  pipeline: PipelineSchema,
  output_spec: z.string().min(1).max(2000),
  visibility: VisibilitySchema.default('private')
});
export type SaveWorkflowInput = z.infer<typeof SaveWorkflowInputSchema>;

export const ListWorkflowsInputSchema = z.object({
  user_id: UserIdSchema,
  include_team: z.boolean().default(false),
  include_public: z.boolean().default(false)
});
export type ListWorkflowsInput = z.infer<typeof ListWorkflowsInputSchema>;

export const GetWorkflowInputSchema = z.object({
  user_id: UserIdSchema,
  slug: SlugSchema
});
export type GetWorkflowInput = z.infer<typeof GetWorkflowInputSchema>;

export const DeleteWorkflowInputSchema = GetWorkflowInputSchema;
export type DeleteWorkflowInput = GetWorkflowInput;

export const LogRunInputSchema = z.object({
  workflow_id: z.string().uuid(),
  user_id: UserIdSchema,
  status: z.enum(['running', 'completed', 'failed', 'abandoned']),
  output_summary: z.string().max(4000).optional()
});
export type LogRunInput = z.infer<typeof LogRunInputSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/types.test.ts
```

Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add mcp-servers/workflows/src/types.ts mcp-servers/workflows/src/__tests__/types.test.ts mcp-servers/workflows/src/index.ts
git commit -m "feat(workflows): zod input schemas for the 7 tools"
```

### Task 3: Pipeline validation (`validate.ts`) + agents manifest

**Files:**
- Create: `mcp-servers/workflows/src/validate.ts`
- Create: `mcp-servers/workflows/src/manifest.ts`
- Test: `mcp-servers/workflows/src/__tests__/validate.test.ts`

**Interfaces:**
- Produces: `AgentManifestEntry { agent_id: string; display_name: string; input_types: string[]; output_types: string[]; mcp_servers: string[]; is_terminal: boolean }`, `ValidationError { code: 'unknown_agent' | 'incompatible_chaining' | 'non_sequential_steps'; step?: number; message: string }`, `ValidationResult { valid: boolean; errors: ValidationError[] }`, `validatePipeline(pipeline: PipelineStep[], manifest: AgentManifestEntry[]): ValidationResult`, `AGENTS_MANIFEST: AgentManifestEntry[]` (16 entries). Consumed by Task 4 (seed) and Task 5 (validate_pipeline / save_workflow tools).

- [ ] **Step 1: Write the failing test**

`mcp-servers/workflows/src/__tests__/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validatePipeline } from '../validate.js';
import { AGENTS_MANIFEST } from '../manifest.js';
import type { PipelineStep } from '../types.js';

const step = (n: number, agent_id: string): PipelineStep => ({
  step: n,
  agent_id,
  purpose: 'test',
  checkpoint: false
});

describe('validatePipeline', () => {
  it('accepts all 5 fixed plugin templates (regression: manifest must support them)', () => {
    const templates: string[][] = [
      ['researcher', 'strategist', 'risk', 'drafter'],            // litigation-prep
      ['researcher', 'compliance', 'corporate', 'risk', 'drafter'], // due-diligence
      ['researcher', 'drafter', 'compliance', 'citation'],        // contract-lifecycle
      ['researcher', 'realestate', 'compliance', 'drafter'],      // real-estate-closing
      ['advocate', 'adversary', 'judicial']                       // adversarial-review
    ];
    for (const t of templates) {
      const r = validatePipeline(t.map((a, i) => step(i + 1, a)), AGENTS_MANIFEST);
      expect(r.errors, `template ${t.join('->')} must validate`).toEqual([]);
      expect(r.valid).toBe(true);
    }
  });

  it('flags unknown_agent', () => {
    const r = validatePipeline([step(1, 'not-an-agent')], AGENTS_MANIFEST);
    expect(r.valid).toBe(false);
    expect(r.errors[0].code).toBe('unknown_agent');
  });

  it('flags incompatible_chaining when output/input types do not intersect', () => {
    // judicial expects arguments_for/arguments_against; researcher outputs neither
    const r = validatePipeline(
      [step(1, 'researcher'), step(2, 'judicial')],
      AGENTS_MANIFEST
    );
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.code === 'incompatible_chaining')).toBe(true);
  });

  it('flags non_sequential_steps', () => {
    const r = validatePipeline([step(1, 'researcher'), step(7, 'drafter')], AGENTS_MANIFEST);
    expect(r.errors.some(e => e.code === 'non_sequential_steps' && e.step === 7)).toBe(true);
  });

  it('skips chaining check when a neighbor is unknown', () => {
    const r = validatePipeline([step(1, 'ghost'), step(2, 'judicial')], AGENTS_MANIFEST);
    expect(r.errors.filter(e => e.code === 'incompatible_chaining')).toEqual([]);
  });

  it('manifest covers exactly the 16 chainable stage agents', () => {
    expect(AGENTS_MANIFEST.map(a => a.agent_id).sort()).toEqual(
      [
        'advocate', 'adversary', 'cantonal', 'citation', 'compliance',
        'corporate', 'data-protection', 'drafter', 'fiscal', 'judicial',
        'procedure', 'realestate', 'researcher', 'risk', 'strategist',
        'translator'
      ].sort()
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/validate.test.ts
```

Expected: FAIL — `Cannot find module '../validate.js'`.

- [ ] **Step 3: Implement `validate.ts`**

```ts
import type { PipelineStep } from './types.js';

export interface AgentManifestEntry {
  agent_id: string;
  display_name: string;
  input_types: string[];
  output_types: string[];
  mcp_servers: string[];
  is_terminal: boolean;
}

export type ValidationErrorCode =
  | 'unknown_agent'
  | 'incompatible_chaining'
  | 'non_sequential_steps';

export interface ValidationError {
  code: ValidationErrorCode;
  step?: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validatePipeline(
  pipeline: PipelineStep[],
  manifest: AgentManifestEntry[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const byId = new Map(manifest.map(a => [a.agent_id, a]));

  pipeline.forEach((s, i) => {
    if (s.step !== i + 1) {
      errors.push({
        code: 'non_sequential_steps',
        step: s.step,
        message: `Steps must be numbered sequentially: expected step ${i + 1}, got ${s.step}`
      });
    }
    if (!byId.has(s.agent_id)) {
      errors.push({
        code: 'unknown_agent',
        step: s.step,
        message: `Unknown agent '${s.agent_id}' — not in the Swiss plugin agents manifest`
      });
    }
  });

  for (let i = 0; i < pipeline.length - 1; i++) {
    const from = byId.get(pipeline[i].agent_id);
    const to = byId.get(pipeline[i + 1].agent_id);
    if (!from || !to) continue; // unknown_agent already reported
    const compatible = from.output_types.some(t => to.input_types.includes(t));
    if (!compatible) {
      errors.push({
        code: 'incompatible_chaining',
        step: pipeline[i + 1].step,
        message:
          `'${from.agent_id}' produces [${from.output_types.join(', ')}], ` +
          `none of which '${to.agent_id}' accepts [${to.input_types.join(', ')}]`
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Implement `manifest.ts` (single source of truth for the seed)**

The type sets below are calibrated so the 5 fixed plugin templates validate (verified by the regression test in Step 1).

```ts
import type { AgentManifestEntry } from './validate.js';

/**
 * The 16 chainable stage agents of the Swiss plugin (bettercallclaude/agents/*.md).
 * Excluded by design: orchestrator (the workflow engine itself), summarizer
 * (auto-appended post-processor), briefing (pre-execution), prompt-engineer (meta),
 * chronology-builder (internal worker of the legal-chronology skill).
 */
export const AGENTS_MANIFEST: AgentManifestEntry[] = [
  {
    agent_id: 'researcher',
    display_name: 'Swiss Legal Researcher',
    input_types: ['raw_query', 'case_facts'],
    output_types: ['research_memo', 'citations'],
    mcp_servers: ['bge-search', 'entscheidsuche', 'fedlex-sparql'],
    is_terminal: false
  },
  {
    agent_id: 'strategist',
    display_name: 'Swiss Case Strategist',
    input_types: ['research_memo', 'case_facts'],
    output_types: ['strategy_memo', 'risk_assessment'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  },
  {
    agent_id: 'risk',
    display_name: 'Risk Analyst',
    input_types: [
      'research_memo', 'strategy_memo', 'case_facts',
      'corporate_analysis', 'realestate_analysis', 'fiscal_analysis',
      'compliance_report'
    ],
    output_types: ['risk_assessment'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  },
  {
    agent_id: 'drafter',
    display_name: 'Swiss Legal Drafter',
    input_types: [
      'research_memo', 'strategy_memo', 'risk_assessment', 'compliance_report',
      'case_facts', 'judicial_synthesis', 'corporate_analysis',
      'realestate_analysis', 'citations'
    ],
    output_types: ['draft_document'],
    mcp_servers: ['legal-citations'],
    is_terminal: true
  },
  {
    agent_id: 'compliance',
    display_name: 'Compliance Officer',
    input_types: [
      'case_facts', 'document_set', 'research_memo', 'draft_document',
      'corporate_analysis', 'realestate_analysis', 'fiscal_analysis'
    ],
    output_types: ['compliance_report', 'draft_document'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  },
  {
    agent_id: 'corporate',
    display_name: 'Corporate Law Agent',
    input_types: ['case_facts', 'research_memo', 'compliance_report'],
    output_types: ['corporate_analysis'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  },
  {
    agent_id: 'realestate',
    display_name: 'Real Estate Law Agent',
    input_types: ['case_facts', 'research_memo'],
    output_types: ['realestate_analysis'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  },
  {
    agent_id: 'citation',
    display_name: 'Citation Specialist',
    input_types: ['draft_document', 'citations', 'research_memo'],
    output_types: ['citations', 'draft_document'],
    mcp_servers: ['legal-citations'],
    is_terminal: false
  },
  {
    agent_id: 'fiscal',
    display_name: 'Fiscal Legal Expert',
    input_types: ['case_facts', 'research_memo'],
    output_types: ['fiscal_analysis'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  },
  {
    agent_id: 'advocate',
    display_name: 'Swiss Legal Advocate',
    input_types: ['case_facts', 'research_memo'],
    output_types: ['arguments_for'],
    mcp_servers: ['bge-search'],
    is_terminal: false
  },
  {
    agent_id: 'adversary',
    display_name: 'Swiss Legal Adversary',
    input_types: ['case_facts', 'research_memo', 'arguments_for'],
    output_types: ['arguments_against'],
    mcp_servers: ['bge-search'],
    is_terminal: false
  },
  {
    agent_id: 'judicial',
    display_name: 'Swiss Judicial Analyst',
    input_types: ['arguments_for', 'arguments_against'],
    output_types: ['judicial_synthesis', 'risk_assessment'],
    mcp_servers: ['bge-search'],
    is_terminal: true
  },
  {
    agent_id: 'translator',
    display_name: 'Legal Translator',
    input_types: ['draft_document', 'research_memo', 'citations'],
    output_types: ['translation'],
    mcp_servers: ['fedlex-sparql'],
    is_terminal: true
  },
  {
    agent_id: 'cantonal',
    display_name: 'Cantonal Law Expert',
    input_types: ['raw_query', 'case_facts', 'research_memo'],
    output_types: ['cantonal_analysis'],
    mcp_servers: ['bge-search'],
    is_terminal: false
  },
  {
    agent_id: 'procedure',
    display_name: 'Procedure Specialist',
    input_types: ['case_facts', 'research_memo', 'strategy_memo'],
    output_types: ['procedure_analysis'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  },
  {
    agent_id: 'data-protection',
    display_name: 'Data Protection Specialist',
    input_types: ['case_facts', 'document_set', 'research_memo'],
    output_types: ['dataprotection_analysis'],
    mcp_servers: ['entscheidsuche'],
    is_terminal: false
  }
];
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/validate.test.ts
```

Expected: PASS (6 tests). If the 5-templates regression test fails, the manifest type sets are wrong — fix the manifest, never the templates.

- [ ] **Step 6: Commit**

```bash
git add mcp-servers/workflows/src/validate.ts mcp-servers/workflows/src/manifest.ts mcp-servers/workflows/src/__tests__/validate.test.ts mcp-servers/workflows/src/index.ts
git commit -m "feat(workflows): pipeline validation + 16-agent Swiss manifest"
```

### Task 4: Database layer (`sql.ts` + `db.ts`)

**Files:**
- Create: `mcp-servers/workflows/src/sql.ts`
- Create: `mcp-servers/workflows/src/db.ts`
- Test: `mcp-servers/workflows/src/__tests__/db.test.ts`

**Interfaces:**
- Consumes: `AGENTS_MANIFEST` from Task 3.
- Produces: `SCHEMA_SQL: string`, `getPool(connectionString?: string): Pool`, `ensureSchema(pool?: Pool): Promise<void>` (idempotent: creates tables if missing + seeds manifest with `ON CONFLICT DO NOTHING`, memoized per process), `closePool(): Promise<void>` (test teardown). Consumed by Task 5 tools and Task 6 wrapper.
- Test DB convention: integration tests run only when env var `WORKFLOWS_TEST_DATABASE_URL` is set (e.g. `postgres://postgres:postgres@localhost:5432/workflows_test`); otherwise they skip. This matches the repo having no DB-backed tests today.

- [ ] **Step 1: Write the failing test**

`mcp-servers/workflows/src/__tests__/db.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPool, ensureSchema, closePool } from '../db.js';

const url = process.env.WORKFLOWS_TEST_DATABASE_URL;
const run = !!url;

describe.skipIf(!run)('db (integration, needs WORKFLOWS_TEST_DATABASE_URL)', () => {
  beforeAll(async () => {
    await ensureSchema(getPool(url));
  });
  afterAll(async () => {
    const pool = getPool(url);
    await pool.query('DROP TABLE IF EXISTS workflow_runs, workflows, agents_manifest');
    await closePool();
  });

  it('creates the three tables and seeds the 16-agent manifest', async () => {
    const pool = getPool(url);
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    expect(tables.rows.map(r => r.table_name)).toEqual(
      expect.arrayContaining(['agents_manifest', 'workflows', 'workflow_runs'])
    );
    const agents = await pool.query('SELECT count(*)::int AS n FROM agents_manifest');
    expect(agents.rows[0].n).toBe(16);
  });

  it('ensureSchema is idempotent (second run keeps seed, no error)', async () => {
    await ensureSchema(getPool(url));
    const agents = await getPool(url).query('SELECT count(*)::int AS n FROM agents_manifest');
    expect(agents.rows[0].n).toBe(16);
  });
});

describe('getPool (unit)', () => {
  it('throws a clear error when DATABASE_URL is missing', async () => {
    await closePool();
    const saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(() => getPool()).toThrow('DATABASE_URL');
    if (saved) process.env.DATABASE_URL = saved;
  });
});
```

Note: the integration part needs `ensureSchema` to be re-runnable after `closePool()` (singletons reset). If you run the file against a real DB, run it alone (`npx vitest run src/__tests__/db.test.ts`) to avoid singleton cross-talk with `tools.test.ts`; in CI both run against the same ephemeral DB sequentially.

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/db.test.ts
```

Expected: integration block SKIPPED, unit test FAIL — `Cannot find module '../db.js'`.

- [ ] **Step 3: Implement `sql.ts`**

```ts
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS agents_manifest (
    id              SERIAL PRIMARY KEY,
    agent_id        TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    input_types     TEXT[] NOT NULL,
    output_types    TEXT[] NOT NULL,
    mcp_servers     TEXT[] NOT NULL,
    is_terminal     BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS workflows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,
    slug            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    pipeline        JSONB NOT NULL,
    output_spec     TEXT NOT NULL,
    visibility      TEXT NOT NULL DEFAULT 'private'
                        CHECK (visibility IN ('private','team','public')),
    status          TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('draft','active','archived')),
    version         INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, slug)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID REFERENCES workflows(id),
    user_id         TEXT NOT NULL,
    started_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    status          TEXT CHECK (status IN ('running','completed','failed','abandoned')),
    output_summary  TEXT
);
`;
```

- [ ] **Step 4: Implement `db.ts`**

```ts
import { Pool } from 'pg';
import { SCHEMA_SQL } from './sql.js';
import { AGENTS_MANIFEST } from './manifest.js';

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function getPool(connectionString?: string): Pool {
  if (!pool) {
    const cs = connectionString ?? process.env.DATABASE_URL;
    if (!cs) {
      throw new Error(
        'DATABASE_URL environment variable is not set — workflows-ch needs a Postgres connection string'
      );
    }
    pool = new Pool({
      connectionString: cs,
      max: 5,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

/**
 * Idempotent schema + manifest seed. Memoized: runs once per process
 * (cold start), which fits the stateless per-request server model of
 * mcp-servers-http. Safe to call concurrently.
 */
export function ensureSchema(p: Pool = getPool()): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await p.query(SCHEMA_SQL);
      for (const a of AGENTS_MANIFEST) {
        await p.query(
          `INSERT INTO agents_manifest
             (agent_id, display_name, input_types, output_types, mcp_servers, is_terminal)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (agent_id) DO NOTHING`,
          [a.agent_id, a.display_name, a.input_types, a.output_types, a.mcp_servers, a.is_terminal]
        );
      }
    })();
    schemaReady.catch(() => {
      schemaReady = null; // allow retry on next request if the DB was briefly unavailable
    });
  }
  return schemaReady;
}

/** Test teardown / hot reload: closes the pool and resets singletons. */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    schemaReady = null;
  }
}
```

- [ ] **Step 5: Run tests**

Without a database:

```bash
npx vitest run src/__tests__/db.test.ts
```

Expected: integration block SKIPPED, unit test PASS.

With a database (optional, if Docker is available):

```bash
docker run -d --name workflows-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
WORKFLOWS_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npx vitest run src/__tests__/db.test.ts
docker rm -f workflows-pg
```

Expected: all tests PASS, including the 16-row seed assertion.

- [ ] **Step 6: Commit**

```bash
git add mcp-servers/workflows/src/sql.ts mcp-servers/workflows/src/db.ts mcp-servers/workflows/src/__tests__/db.test.ts mcp-servers/workflows/src/index.ts
git commit -m "feat(workflows): pg pool, idempotent schema + manifest seed"
```

### Task 5: Tool functions (`tools.ts`)

**Files:**
- Create: `mcp-servers/workflows/src/tools.ts`
- Test: `mcp-servers/workflows/src/__tests__/tools.test.ts`

**Interfaces:**
- Consumes: `getPool`/`ensureSchema` (Task 4), `validatePipeline` (Task 3), input types (Task 2).
- Produces (all `async`, first arg `pool: Pool`):
  - `listAgents(pool): Promise<AgentManifestEntry[]>`
  - `validatePipelineTool(pool, input: ValidatePipelineInput): Promise<ValidationResult>`
  - `saveWorkflow(pool, input: SaveWorkflowInput): Promise<{ saved: true; workflow: WorkflowRow }>` — throws `WorkflowValidationError` (carrying `.errors: ValidationError[]`) when the pipeline is invalid
  - `listWorkflows(pool, input: ListWorkflowsInput): Promise<Array<{ slug, name, description, visibility, version, updated_at }>>`
  - `getWorkflow(pool, input: GetWorkflowInput): Promise<WorkflowRow | null>` — returns own rows plus `team`/`public` rows of others
  - `deleteWorkflow(pool, input: DeleteWorkflowInput): Promise<{ deleted: boolean }>` — owner-only
  - `logRun(pool, input: LogRunInput): Promise<{ run_id: string }>`
  - `WorkflowRow` = `{ id: string; user_id: string; slug: string; name: string; description: string; pipeline: PipelineStep[]; output_spec: string; visibility: Visibility; status: string; version: number; created_at: string; updated_at: string }`

- [ ] **Step 1: Write the failing test**

`mcp-servers/workflows/src/__tests__/tools.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPool, ensureSchema, closePool } from '../db.js';
import {
  listAgents, validatePipelineTool, saveWorkflow, listWorkflows,
  getWorkflow, deleteWorkflow, logRun, WorkflowValidationError
} from '../tools.js';

const url = process.env.WORKFLOWS_TEST_DATABASE_URL;

describe.skipIf(!url)('tools (integration, needs WORKFLOWS_TEST_DATABASE_URL)', () => {
  const pool = () => getPool(url);
  const U = 'test-user-1';
  const base = {
    user_id: U,
    slug: 'it-workflow',
    name: 'IT Workflow',
    description: 'test workflow',
    pipeline: [
      { step: 1, agent_id: 'researcher', purpose: 'Recherche', checkpoint: false },
      { step: 2, agent_id: 'drafter', purpose: 'Redazione', checkpoint: true }
    ],
    output_spec: 'memo'
  };

  beforeAll(async () => { await ensureSchema(pool()); });
  afterAll(async () => {
    await pool().query('DELETE FROM workflow_runs');
    await pool().query('DELETE FROM workflows');
    await closePool();
  });

  it('listAgents returns the 16-entry manifest with types', async () => {
    const agents = await listAgents(pool());
    expect(agents).toHaveLength(16);
    const r = agents.find(a => a.agent_id === 'researcher');
    expect(r?.output_types).toContain('research_memo');
  });

  it('validatePipelineTool delegates to the pure validator', async () => {
    const ok = await validatePipelineTool(pool(), { pipeline: base.pipeline });
    expect(ok.valid).toBe(true);
    const bad = await validatePipelineTool(pool(), {
      pipeline: [{ step: 1, agent_id: 'ghost', purpose: 'x', checkpoint: false }]
    });
    expect(bad.valid).toBe(false);
    expect(bad.errors[0].code).toBe('unknown_agent');
  });

  it('saveWorkflow inserts, then upserts with version increment', async () => {
    const first = await saveWorkflow(pool(), base);
    expect(first.workflow.version).toBe(1);
    const second = await saveWorkflow(pool(), { ...base, description: 'v2', visibility: 'public' });
    expect(second.workflow.version).toBe(2);
    expect(second.workflow.description).toBe('v2');
    expect(second.workflow.id).toBe(first.workflow.id); // upsert, not new row
  });

  it('saveWorkflow rejects an invalid pipeline with WorkflowValidationError', async () => {
    await expect(
      saveWorkflow(pool(), {
        ...base, slug: 'bad-pipe',
        pipeline: [{ step: 1, agent_id: 'ghost', purpose: 'x', checkpoint: false }]
      })
    ).rejects.toBeInstanceOf(WorkflowValidationError);
  });

  it('listWorkflows scopes by user and visibility flags', async () => {
    await saveWorkflow(pool(), { ...base, slug: 'other-public', user_id: 'someone-else', visibility: 'public' });
    const mine = await listWorkflows(pool(), { user_id: U, include_team: false, include_public: false });
    expect(mine.map(w => w.slug).sort()).toEqual(['it-workflow']);
    const withPublic = await listWorkflows(pool(), { user_id: U, include_team: false, include_public: true });
    expect(withPublic.map(w => w.slug).sort()).toEqual(['it-workflow', 'other-public']);
  });

  it('getWorkflow returns own row and others public rows, not others private rows', async () => {
    await saveWorkflow(pool(), { ...base, slug: 'other-private', user_id: 'someone-else', visibility: 'private' });
    expect((await getWorkflow(pool(), { user_id: U, slug: 'it-workflow' }))?.name).toBe('IT Workflow');
    expect((await getWorkflow(pool(), { user_id: U, slug: 'other-public' }))?.visibility).toBe('public');
    expect(await getWorkflow(pool(), { user_id: U, slug: 'other-private' })).toBeNull();
  });

  it('deleteWorkflow is owner-only', async () => {
    expect((await deleteWorkflow(pool(), { user_id: 'intruder', slug: 'it-workflow' })).deleted).toBe(false);
    expect((await deleteWorkflow(pool(), { user_id: U, slug: 'it-workflow' })).deleted).toBe(true);
  });

  it('logRun inserts a run row linked to the workflow', async () => {
    const w = await saveWorkflow(pool(), base); // re-save after deletion test
    const run = await logRun(pool(), {
      workflow_id: w.workflow.id, user_id: U, status: 'completed', output_summary: 'done'
    });
    expect(run.run_id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
WORKFLOWS_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npx vitest run src/__tests__/tools.test.ts
```

(Start the throwaway Postgres container first, same command as Task 4 Step 5.)

Expected: FAIL — `Cannot find module '../tools.js'`. Without the env var the whole file skips; that is expected locally but make sure to run it against a real DB at least once before committing.

- [ ] **Step 3: Implement `tools.ts`**

```ts
import type { Pool } from 'pg';
import { validatePipeline } from './validate.js';
import type { AgentManifestEntry, ValidationError, ValidationResult } from './validate.js';
import type {
  PipelineStep, Visibility,
  ValidatePipelineInput, SaveWorkflowInput, ListWorkflowsInput,
  GetWorkflowInput, DeleteWorkflowInput, LogRunInput
} from './types.js';

export interface WorkflowRow {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  description: string;
  pipeline: PipelineStep[];
  output_spec: string;
  visibility: Visibility;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export class WorkflowValidationError extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super(`Pipeline validation failed: ${errors.map(e => e.message).join('; ')}`);
    this.name = 'WorkflowValidationError';
  }
}

export async function listAgents(pool: Pool): Promise<AgentManifestEntry[]> {
  const { rows } = await pool.query(
    `SELECT agent_id, display_name, input_types, output_types, mcp_servers, is_terminal
     FROM agents_manifest ORDER BY agent_id`
  );
  return rows;
}

export async function validatePipelineTool(
  pool: Pool,
  input: ValidatePipelineInput
): Promise<ValidationResult> {
  const manifest = await listAgents(pool);
  return validatePipeline(input.pipeline, manifest);
}

export async function saveWorkflow(
  pool: Pool,
  input: SaveWorkflowInput
): Promise<{ saved: true; workflow: WorkflowRow }> {
  const validation = await validatePipelineTool(pool, { pipeline: input.pipeline });
  if (!validation.valid) throw new WorkflowValidationError(validation.errors);
  const { rows } = await pool.query(
    `INSERT INTO workflows (user_id, slug, name, description, pipeline, output_spec, visibility)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, slug) DO UPDATE SET
       name        = EXCLUDED.name,
       description = EXCLUDED.description,
       pipeline    = EXCLUDED.pipeline,
       output_spec = EXCLUDED.output_spec,
       visibility  = EXCLUDED.visibility,
       version     = workflows.version + 1,
       updated_at  = now()
     RETURNING *`,
    [
      input.user_id, input.slug, input.name, input.description,
      JSON.stringify(input.pipeline), input.output_spec, input.visibility
    ]
  );
  return { saved: true, workflow: rows[0] };
}

export async function listWorkflows(
  pool: Pool,
  input: ListWorkflowsInput
): Promise<Array<Pick<WorkflowRow, 'slug' | 'name' | 'description' | 'visibility' | 'version' | 'updated_at'>>> {
  const { rows } = await pool.query(
    `SELECT slug, name, description, visibility, version, updated_at
     FROM workflows
     WHERE status = 'active'
       AND (user_id = $1
            OR (visibility = 'team'   AND $2)
            OR (visibility = 'public' AND $3))
     ORDER BY updated_at DESC`,
    [input.user_id, input.include_team, input.include_public]
  );
  return rows;
}

export async function getWorkflow(
  pool: Pool,
  input: GetWorkflowInput
): Promise<WorkflowRow | null> {
  const { rows } = await pool.query(
    `SELECT * FROM workflows
     WHERE slug = $1 AND status != 'archived'
       AND (user_id = $2 OR visibility IN ('team', 'public'))`,
    [input.slug, input.user_id]
  );
  return rows[0] ?? null;
}

export async function deleteWorkflow(
  pool: Pool,
  input: DeleteWorkflowInput
): Promise<{ deleted: boolean }> {
  const { rowCount } = await pool.query(
    `DELETE FROM workflows WHERE user_id = $1 AND slug = $2`,
    [input.user_id, input.slug]
  );
  return { deleted: (rowCount ?? 0) > 0 };
}

export async function logRun(
  pool: Pool,
  input: LogRunInput
): Promise<{ run_id: string }> {
  const { rows } = await pool.query(
    `INSERT INTO workflow_runs (workflow_id, user_id, status, output_summary, completed_at)
     VALUES ($1, $2, $3, $4, CASE WHEN $3 = 'running' THEN NULL ELSE now() END)
     RETURNING id`,
    [input.workflow_id, input.user_id, input.status, input.output_summary ?? null]
  );
  return { run_id: rows[0].id };
}
```

- [ ] **Step 4: Run tests against a real Postgres**

```bash
docker run -d --name workflows-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
WORKFLOWS_TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npx vitest run src/__tests__/
docker rm -f workflows-pg
```

Expected: all suites PASS (types 7, validate 6, db 2+1, tools 8). Fix ordering hazards: `tools.test.ts` runs after `db.test.ts` dropped tables — `ensureSchema` in `beforeAll` recreates them; both files call `ensureSchema` first, so order is safe.

- [ ] **Step 5: Commit**

```bash
git add mcp-servers/workflows/src/tools.ts mcp-servers/workflows/src/__tests__/tools.test.ts mcp-servers/workflows/src/index.ts
git commit -m "feat(workflows): CRUD + validation tool functions"
```

### Task 6: MCP server wrapper (`mcp-servers-http/src/servers/workflows-ch.ts`)

**Files:**
- Create: `mcp-servers-http/src/servers/workflows-ch.ts`
- Test: `mcp-servers-http/src/servers/__tests__/workflows-ch.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–5 via the esbuild alias `@workflows` (added in Task 7 — create the file now, wire the alias next).
- Produces: `createWorkflowsChServer(): Server` — registered as `['/workflows-ch/mcp', createWorkflowsChServer]` in Task 7.

- [ ] **Step 1: Write the failing smoke test**

`mcp-servers-http/src/servers/__tests__/workflows-ch.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createWorkflowsChServer } from '../workflows-ch.js';

describe('workflows-ch server', () => {
  it('lists exactly the 7 workflow tools', async () => {
    const server = createWorkflowsChServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'smoke-test', version: '0.0.1' });
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    const { tools } = await client.listTools();
    expect(tools.map(t => t.name).sort()).toEqual([
      'delete_workflow', 'get_workflow', 'list_agents', 'list_workflows',
      'log_run', 'save_workflow', 'validate_pipeline'
    ]);

    await client.close();
    await server.close();
  });

  it('returns isError with a zod message on invalid save_workflow input', async () => {
    const server = createWorkflowsChServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'smoke-test', version: '0.0.1' });
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

    const res = await client.callTool({
      name: 'save_workflow',
      arguments: { user_id: 'u', slug: 'BAD SLUG', name: '', description: '', pipeline: [], output_spec: '' }
    });
    expect(res.isError).toBe(true);

    await client.close();
    await server.close();
  });
});
```

The second test proves input validation happens **before** any DB access (no `DATABASE_URL` is set when it runs).

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/federicocesconi/Dev/BetterCallClaudeMCP/mcp-servers-http
npx vitest run src/servers/__tests__/workflows-ch.test.ts
```

Expected: FAIL — cannot resolve `../workflows-ch.js` (and the `@workflows` alias does not exist until Task 7; that is fine, the file is written now and compiles after Task 7).

- [ ] **Step 3: Implement `workflows-ch.ts`**

```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  getPool, ensureSchema,
  listAgents, validatePipelineTool, saveWorkflow, listWorkflows,
  getWorkflow, deleteWorkflow, logRun, WorkflowValidationError,
  SaveWorkflowInputSchema, ListWorkflowsInputSchema, GetWorkflowInputSchema,
  DeleteWorkflowInputSchema, LogRunInputSchema, ValidatePipelineInputSchema
} from '@workflows/index.js';

const PIPELINE_STEP = {
  type: 'object',
  properties: {
    step: { type: 'integer', minimum: 1 },
    agent_id: { type: 'string', description: 'One of the agent_ids returned by list_agents' },
    purpose: { type: 'string' },
    checkpoint: { type: 'boolean', description: 'Pause for user confirmation after this step' }
  },
  required: ['step', 'agent_id', 'purpose']
} as const;

const USER_ID = {
  type: 'string',
  description: 'Stable caller identifier (plugin user_id setting; self-asserted)'
} as const;

export function createWorkflowsChServer(): Server {
  const server = new Server(
    { name: 'workflows-ch', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_agents',
        description:
          'List the Swiss plugin agents available for custom workflow pipelines, with the data types each accepts as input and produces as output.',
        annotations: { readOnlyHint: true, destructiveHint: false },
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'validate_pipeline',
        description:
          'Validate a workflow pipeline without saving it: checks that every agent exists in the Swiss manifest and that consecutive steps have compatible output/input types. Returns {valid, errors}.',
        annotations: { readOnlyHint: true, destructiveHint: false },
        inputSchema: {
          type: 'object',
          properties: { pipeline: { type: 'array', items: PIPELINE_STEP, minItems: 1 } },
          required: ['pipeline']
        }
      },
      {
        name: 'save_workflow',
        description:
          'Validate and save (upsert on user_id+slug) a reusable custom workflow. Fails with validation errors if the pipeline is invalid.',
        annotations: { readOnlyHint: false, destructiveHint: false },
        inputSchema: {
          type: 'object',
          properties: {
            user_id: USER_ID,
            slug: { type: 'string', description: 'kebab-case identifier, unique per user' },
            name: { type: 'string' },
            description: { type: 'string' },
            pipeline: { type: 'array', items: PIPELINE_STEP, minItems: 1 },
            output_spec: { type: 'string', description: 'What the final step should produce' },
            visibility: { type: 'string', enum: ['private', 'team', 'public'], default: 'private' }
          },
          required: ['user_id', 'slug', 'name', 'description', 'pipeline', 'output_spec']
        }
      },
      {
        name: 'list_workflows',
        description:
          'List the caller\'s saved custom workflows (optionally including team/public ones).',
        annotations: { readOnlyHint: true, destructiveHint: false },
        inputSchema: {
          type: 'object',
          properties: {
            user_id: USER_ID,
            include_team: { type: 'boolean', default: false },
            include_public: { type: 'boolean', default: false }
          },
          required: ['user_id']
        }
      },
      {
        name: 'get_workflow',
        description: 'Fetch the full definition of one saved workflow (own, team or public).',
        annotations: { readOnlyHint: true, destructiveHint: false },
        inputSchema: {
          type: 'object',
          properties: { user_id: USER_ID, slug: { type: 'string' } },
          required: ['user_id', 'slug']
        }
      },
      {
        name: 'delete_workflow',
        description: 'Delete one of the caller\'s own workflows (owner-only).',
        annotations: { readOnlyHint: false, destructiveHint: true },
        inputSchema: {
          type: 'object',
          properties: { user_id: USER_ID, slug: { type: 'string' } },
          required: ['user_id', 'slug']
        }
      },
      {
        name: 'log_run',
        description: 'Record a workflow execution in the audit trail (workflow_runs).',
        annotations: { readOnlyHint: false, destructiveHint: false },
        inputSchema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string', format: 'uuid' },
            user_id: USER_ID,
            status: { type: 'string', enum: ['running', 'completed', 'failed', 'abandoned'] },
            output_summary: { type: 'string' }
          },
          required: ['workflow_id', 'user_id', 'status']
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name !== 'list_agents') await ensureSchema();
      const pool = getPool();

      switch (name) {
        case 'list_agents':
          return json(await listAgents(pool));
        case 'validate_pipeline':
          return json(await validatePipelineTool(pool, ValidatePipelineInputSchema.parse(args)));
        case 'save_workflow':
          return json(await saveWorkflow(pool, SaveWorkflowInputSchema.parse(args)));
        case 'list_workflows':
          return json(await listWorkflows(pool, ListWorkflowsInputSchema.parse(args)));
        case 'get_workflow': {
          const row = await getWorkflow(pool, GetWorkflowInputSchema.parse(args));
          if (!row) throw new Error('Workflow not found (or not visible to this user_id)');
          return json(row);
        }
        case 'delete_workflow':
          return json(await deleteWorkflow(pool, DeleteWorkflowInputSchema.parse(args)));
        case 'log_run':
          return json(await logRun(pool, LogRunInputSchema.parse(args)));
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const payload =
        error instanceof WorkflowValidationError
          ? { valid: false, errors: error.errors }
          : error instanceof z.ZodError
            ? { error: 'invalid_input', issues: error.issues }
            : { error: error instanceof Error ? error.message : String(error) };
      return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], isError: true };
    }
  });

  return server;
}

function json(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}
```

- [ ] **Step 4: Commit (test still red until Task 7 wires the alias — expected)**

```bash
git add mcp-servers-http/src/servers/workflows-ch.ts mcp-servers-http/src/servers/__tests__/workflows-ch.test.ts
git commit -m "feat(workflows): MCP wrapper for workflows-ch (7 tools)"
```

### Task 7: Wire the server into the aggregator (routes, esbuild, Dockerfile)

**Files:**
- Modify: `mcp-servers-http/src/index.ts` (import ~line 30, `SERVER_NAMES` at line 64, `routes` at line 140)
- Modify: `mcp-servers-http/esbuild.config.mjs` (alias block at line 64)
- Modify: `mcp-servers-http/Dockerfile` (COPY list at lines 17–24)
- Modify: `package-lock.json` (root, via `npm install`)

- [ ] **Step 1: esbuild alias**

In `mcp-servers-http/esbuild.config.mjs`, add to the `alias` object (after the `'@tas-jurisprudence'` line):

```js
    '@workflows': '../mcp-servers/workflows/src',
```

- [ ] **Step 2: Aggregator registration**

In `mcp-servers-http/src/index.ts`:

Add the import next to the other server imports (~line 30):

```ts
import { createWorkflowsChServer } from './servers/workflows-ch.js';
```

Add `'workflows-ch'` to the `SERVER_NAMES` array (line 64).

Add to the `routes` array (line 140, after the legal-persona entry):

```ts
  ['/workflows-ch/mcp', createWorkflowsChServer],
```

- [ ] **Step 3: Dockerfile**

In `mcp-servers-http/Dockerfile`, add after line 23 (`COPY mcp-servers/tas-jurisprudence/package.json ...`):

```dockerfile
COPY mcp-servers/workflows/package.json ./mcp-servers/workflows/
```

- [ ] **Step 4: Lockfile + full verification**

```bash
cd /Users/federicocesconi/Dev/BetterCallClaudeMCP
npm install               # lockfile picks up pg/@types/pg for the new workspace
npm run typecheck         # all workspaces
npm test                  # all workspaces, including the new smoke test
npm run build --workspace=bettercallclaude-mcp-http
node -e "const s=require('./mcp-servers-http/dist/index.js')" 2>/dev/null || true  # bundle exists
ls -la mcp-servers-http/dist/index.js
```

Expected: typecheck clean; all tests PASS (`workflows-ch.test.ts` smoke tests now green); esbuild bundle builds with the workflows server included. Grep the bundle as a sanity check:

```bash
grep -c "workflows-ch/mcp" mcp-servers-http/dist/index.js   # expected: >= 1
```

- [ ] **Step 5: Commit**

```bash
git add mcp-servers-http/src/index.ts mcp-servers-http/esbuild.config.mjs mcp-servers-http/Dockerfile package-lock.json
git commit -m "feat(workflows): register workflows-ch route, esbuild alias, docker build"
```

### Task 8: Deploy to Railway + production smoke test

This is the first BCC-CH server that needs Postgres — the Railway project currently has no database.

- [ ] **Step 1: Add Postgres to the Railway project**

In the Railway dashboard for the project serving `mcp.bettercallclaude.ch`:

1. Add a **Postgres** service (Railway plugin).
2. In the `mcp-servers-http` service variables, add a reference: `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
3. Optionally set `JURISDICTION=ch` (logging metadata only, per spec).

- [ ] **Step 2: Deploy**

```bash
cd /Users/federicocesconi/Dev/BetterCallClaudeMCP
git push origin main
```

Railway rebuilds from `main` (dockerfile `mcp-servers-http/Dockerfile`, healthcheck `/health`).

- [ ] **Step 3: Verify health and schema bootstrap**

```bash
curl -s https://mcp.bettercallclaude.ch/health | python3 -m json.tool
```

Expected: `serverNames` includes `workflows-ch`.

Then initialize the MCP session and list tools (stateless StreamableHTTP — single POST with the initialize+list sequence requires the accept header below):

```bash
curl -s -X POST https://mcp.bettercallclaude.ch/workflows-ch/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Expected: the 7 tool names. First call also runs `ensureSchema()` (creates tables + seeds 16 agents) — expect a slightly slower first response.

Then a real validation round-trip:

```bash
curl -s -X POST https://mcp.bettercallclaude.ch/workflows-ch/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"validate_pipeline","arguments":{"pipeline":[{"step":1,"agent_id":"researcher","purpose":"x"},{"step":2,"agent_id":"judicial","purpose":"y"}]}}}'
```

Expected: `{"valid":false,"errors":[{"code":"incompatible_chaining",...}]}`.

- [ ] **Step 4: Commit any deploy fixes**

Only if something needed changing; otherwise no commit (deploy config lives in Railway, not the repo — same as existing servers).

---

# Part 2 — Plugin (repo: /Users/federicocesconi/Dev/BetterCallClaude)

### Task 9: `.mcp.json` — register the server

**Files:**
- Modify: `bettercallclaude/.mcp.json`

- [ ] **Step 1: Add the server entry**

In `bettercallclaude/.mcp.json`, inside `mcpServers`, after the `"tas-jurisprudence"` entry (keeping the existing one-line style and 2-space indent):

```json
    "workflows-ch": {
      "type": "http",
      "url": "https://mcp.bettercallclaude.ch/workflows-ch/mcp"
    },
```

- [ ] **Step 2: Validate JSON**

```bash
python3 -m json.tool bettercallclaude/.mcp.json > /dev/null && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add bettercallclaude/.mcp.json
git commit -m "feat(mcp): register workflows-ch server"
```

### Task 10: `plugin.json` — version bump + `user_id` setting

**Files:**
- Modify: `bettercallclaude/.claude-plugin/plugin.json`

- [ ] **Step 1: Edit**

Change `"version": "4.10.1"` → `"version": "4.11.0"`.

Add to `userConfig`, after the `output_language` block (before `api_token`):

```json
    "user_id": {
      "type": "string",
      "title": "User ID for custom workflows",
      "description": "Stable identifier that owns your saved custom workflows (workflows-ch server). Pick something non-trivial (e.g. firm acronym + random suffix) — saved workflows are visible to anyone who knows the ID. Leave blank to use 'default'.",
      "default": "",
      "sensitive": false
    },
```

- [ ] **Step 2: Validate JSON**

```bash
python3 -m json.tool bettercallclaude/.claude-plugin/plugin.json > /dev/null && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add bettercallclaude/.claude-plugin/plugin.json
git commit -m "feat(plugin): v4.11.0 + user_id setting for custom workflows"
```

### Task 11: New command `commands/create-workflow.md`

**Files:**
- Create: `bettercallclaude/commands/create-workflow.md`

- [ ] **Step 1: Write the command**

Full file content:

```markdown
---
description: "Create a reusable custom workflow by combining BetterCallClaude agents. Interview-based: pick agents, order them, define the output. Saved for future use with /bettercallclaude:workflow."
tools:
  - Read
  - mcp__plugin_bettercallclaude_workflows-ch__list_agents
  - mcp__plugin_bettercallclaude_workflows-ch__validate_pipeline
  - mcp__plugin_bettercallclaude_workflows-ch__save_workflow
---

# Create Custom Workflow

You guide the user through designing a reusable multi-agent workflow, validate it against the Swiss plugin's agent manifest, and save it for later execution with `/bettercallclaude:workflow <slug>`.

## Current user

Use `${user_config.user_id}` as the `user_id` argument in every workflows-ch tool call. If that placeholder did not resolve (it appears literally) or resolved to an empty string, use `default` instead, and mention once — briefly — that the user can set a persistent **User ID for custom workflows** in the plugin settings to keep workflows private under their own ID.

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
```

- [ ] **Step 2: Validate frontmatter**

```bash
python3 -c "
import re, sys
content = open('bettercallclaude/commands/create-workflow.md').read()
m = re.match(r'^---\n(.*?)\n---\n', content, re.S)
assert m, 'frontmatter missing'
try:
    import yaml
except ImportError:
    sys.exit('pyyaml not available — check manually')
fm = yaml.safe_load(m.group(1))
assert 'description' in fm and 'tools' in fm, fm.keys()
print('frontmatter OK:', list(fm.keys()))
"
```

Expected: `frontmatter OK: ['description', 'tools']`. (If pyyaml is missing, use the repo venv: `.venv/bin/python -c ...`.)

- [ ] **Step 3: Commit**

```bash
git add bettercallclaude/commands/create-workflow.md
git commit -m "feat(commands): /bettercallclaude:create-workflow — interview, validate, save"
```

### Task 12: `commands/workflow.md` — list saved workflows alongside fixed templates

**Files:**
- Modify: `bettercallclaude/commands/workflow.md` (frontmatter lines 1–10; "Available Templates" section ends at the `#### 6. custom` block ~line 91–93)

- [ ] **Step 1: Frontmatter — add the two MCP tools**

Change the frontmatter `tools:` list to:

```yaml
---
description: "Define and execute multi-agent legal workflows -- due diligence, litigation prep, contract lifecycle, real estate closing"
tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
  - mcp__plugin_bettercallclaude_workflows-ch__list_workflows
  - mcp__plugin_bettercallclaude_workflows-ch__get_workflow
---
```

- [ ] **Step 2: Body — add "Your Workflows" subsection**

Immediately after the `#### 6. custom` block (before the `## Execute the Workflow` heading), insert:

```markdown
#### Your Saved Workflows

Before presenting the template list, call `list_workflows` with:

- `user_id`: the value of `${user_config.user_id}`; if that placeholder did not resolve or is empty, use `default`.
- `include_public`: `true`

Present any returned workflows in the same numbered format as the fixed templates above (slug, name, description), numbered continuing after the fixed ones. If the call returns an empty list or fails (e.g. server unreachable), omit this subsection entirely without commenting on it.

When the user selects a saved workflow, call `get_workflow` with the same `user_id` and the chosen `slug`, then execute the returned `pipeline` with the stage-execution logic below — identical to a fixed template. Each pipeline step's `agent_id` names a plugin agent, `purpose` describes its task, and `checkpoint: true` means pause for user confirmation after that stage.
```

- [ ] **Step 3: Validate frontmatter and structure**

```bash
python3 -c "
import re
content = open('bettercallclaude/commands/workflow.md').read()
m = re.match(r'^---\n(.*?)\n---\n', content, re.S)
assert m, 'frontmatter missing'
import yaml
fm = yaml.safe_load(m.group(1))
tools = fm['tools']
assert 'mcp__plugin_bettercallclaude_workflows-ch__list_workflows' in tools
assert 'mcp__plugin_bettercallclaude_workflows-ch__get_workflow' in tools
assert '#### Your Saved Workflows' in content
assert content.index('#### Your Saved Workflows') < content.index('## Execute the Workflow')
print('workflow.md OK')
"
```

Expected: `workflow.md OK`.

- [ ] **Step 4: Commit**

```bash
git add bettercallclaude/commands/workflow.md
git commit -m "feat(workflow): list and run saved custom workflows next to fixed templates"
```

### Task 13: Release metadata — version sweep, CHANGELOG, READMEs, AGENTS.md

**Files:**
- Modify: `CHANGELOG.md` (new entry at top)
- Modify: `README.md` (badge line 1, "What's New" section line 28–30)
- Modify: `bettercallclaude/README.md` (version line 9)
- Modify: `bettercallclaude/commands/help.md` (version line 225 + add create-workflow to the command list)
- Modify: `bettercallclaude/commands/version.md` (version line 25)
- Modify: `package.json` (version line 3)
- Modify: `.claude-plugin/marketplace.json` (version line 11)
- Modify: `AGENTS.md` (version line 3; commands count 29→30; MCP server count/table + `workflows-ch` row)

- [ ] **Step 1: CHANGELOG entry**

Insert at the top of `CHANGELOG.md` (after the header block, before `## [4.10.1]`):

```markdown
## [4.11.0] - 2026-08-26

### Added
- **Custom workflows (BCC-SPEC-WORKFLOWS-CH-001)** — create, save, and reuse your own multi-agent pipelines. New `workflows-ch` MCP server (Postgres-backed) with pipeline validation against the Swiss agents manifest (agent existence + output/input type chaining). New `/bettercallclaude:create-workflow` command (interview → validate → save); `/bettercallclaude:workflow` now lists your saved workflows next to the 5 fixed templates and executes them with the unchanged engine.
- New optional plugin setting **User ID for custom workflows** (`user_id`) that owns your saved workflows; defaults to `default`.

---
```

- [ ] **Step 2: Version sweep**

Edit each file:

| File | Change |
|---|---|
| `package.json:3` | `"version": "4.10.1"` → `"4.11.0"` |
| `.claude-plugin/marketplace.json:11` | `"version": "4.10.1"` → `"4.11.0"` |
| `AGENTS.md:3` | `> **Version**: 4.10.1` → `4.11.0` |
| `bettercallclaude/README.md:9` | `**Version**: 4.10.1 -- 21 agents, 29 commands, 17 skills, 9 MCP servers.` → `**Version**: 4.11.0 -- 21 agents, 30 commands, 17 skills, 10 MCP servers.` |
| `bettercallclaude/commands/version.md:25` | `Version:      4.10.1` → `Version:      4.11.0` |
| `bettercallclaude/commands/help.md:225` | `**BetterCallClaude v4.10.1 -- Swiss Legal Intelligence for Cowork Desktop**` → `v4.11.0`; also add `create-workflow` to the command listing in that file |
| `README.md:1` | badge `version-4.10.1-blue` → `version-4.11.0-blue` |
| `README.md:28–30` | Replace the `## What's New in v4.10.1` section with: |

```markdown
## What's New in v4.11.0

**v4.11.0 — Custom workflows.** Build your own multi-agent pipelines once and reuse them: `/bettercallclaude:create-workflow` interviews you, validates the agent chain server-side (compatible hand-offs only), and saves it; `/bettercallclaude:workflow` then lists your saved workflows next to the built-in templates and runs them with the same engine. Backed by the new `workflows-ch` MCP server (30 commands, 10 MCP servers total).
```

`AGENTS.md` additionally: in the "MCP Servers" table add the row

```markdown
| `workflows-ch` | HTTP | Custom workflow definitions: validation, persistence, run logging |
```

and update the counts mentioned in the Project Structure section (`commands/` 29 → 30) and the structure tree if it enumerates servers.

Do NOT touch `marketing/*.md` (historical documents for past releases).

- [ ] **Step 3: Verify the sweep**

```bash
grep -rn "4\.10\.1" --include="*.json" --include="*.md" . | grep -v node_modules | grep -v CHANGELOG | grep -v dist/ | grep -v htmlcov | grep -v marketing/ | grep -v legal-briefing-workspace
```

Expected: no output (all live references bumped). CHANGELOG and marketing keep historical mentions on purpose.

- [ ] **Step 4: Run the repo's CI-equivalent checks**

```bash
npm test 2>/dev/null; bash scripts/build-servers.sh 2>/dev/null || true
python3 -m json.tool bettercallclaude/.mcp.json > /dev/null && python3 -m json.tool bettercallclaude/.claude-plugin/plugin.json > /dev/null && python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo "JSON OK"
```

Expected: `JSON OK`; no test regressions (this change adds no TS code to this repo).

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md README.md bettercallclaude/README.md bettercallclaude/commands/help.md bettercallclaude/commands/version.md package.json .claude-plugin/marketplace.json AGENTS.md
git commit -m "chore(release): v4.11.0 — custom workflows (workflows-ch)"
```

### Task 14: End-to-end verification (requires Task 8 deployed)

- [ ] **Step 1: Reload the plugin in Claude Code / Cowork and check the tool list**

Confirm the tools appear as `mcp__plugin_bettercallclaude_workflows-ch__list_agents` etc.

- [ ] **Step 2: Create a workflow through the real command**

Run `/bettercallclaude:create-workflow` and build e.g. `researcher → procedure → drafter`. Expected: interview, validation passes, save confirms with the slug.

- [ ] **Step 3: Run it**

`/bettercallclaude:workflow` — expected: the saved workflow appears in "Your Saved Workflows"; selecting it executes the pipeline with the existing engine and honors checkpoints.

- [ ] **Step 4: Negative check**

Try to save `researcher → judicial` via create-workflow. Expected: plain-language explanation of `incompatible_chaining` plus a concrete fix suggestion; nothing is saved.

---

## Self-Review Notes (completed during planning)

- **Spec coverage:** §1 engine/data decoupling → Tasks 11–12 (engine untouched). §2 deploy → Task 8. §3 schema → Task 4 (`sql.ts` verbatim from spec). §4 tools → Tasks 5–6 (all 7, incl. optional `log_run`). §5 auth → Task 10 + command bodies (userConfig instead of header — agreed deviation). §6 manifest → Task 3 (16 chainable agents — agreed deviation; `cantonal`/`federal` mismatch in spec resolved: `cantonal` agent included, `federal` is command-only and excluded). §7 plugin changes → Tasks 9–13 (plugin.json servers are auto-discovered via `.mcp.json`, so no server registration there — only version + userConfig). §8 flow → Task 14.
- **Placeholders:** none — every code step contains complete code.
- **Type consistency:** `AgentManifestEntry`/`ValidationResult` (Task 3) reused verbatim in Tasks 4–6; tool function names in Task 6 match Task 5 exports; zod schema names in Task 6 match Task 2.
- **Known follow-ups (out of scope):** `team` visibility is coarse (no team membership model — `include_team` returns all team-visible rows); `user_id` is self-asserted (public gateway by design); `--custom` in `workflow.md` could call `validate_pipeline` in a future iteration (spec marks it "reusable", not required).
