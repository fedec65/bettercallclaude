/**
 * Agent Loader
 * Reads agent definition markdown files from the /agents directory and
 * converts them into system prompts for Ollama/DeepSeek.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface AgentDefinition {
  id: string;           // filename without extension (e.g., "researcher")
  name: string;         // from YAML frontmatter
  description: string;  // from YAML frontmatter
  tools: string[];      // tool names the agent can use
  systemPrompt: string; // full markdown body as system prompt
}

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns { frontmatter, body } where body is everything after the frontmatter.
 */
function parseFrontmatter(content: string): { meta: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: content };
  }

  const yamlStr = match[1];
  const body = match[2].trim();

  // Simple YAML parser for flat key-value and arrays
  const meta: Record<string, unknown> = {};
  let currentKey = '';
  let arrayValues: string[] | null = null;

  for (const line of yamlStr.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*"?([^"]*)"?\s*$/);
    if (kvMatch) {
      // Flush previous array
      if (arrayValues && currentKey) {
        meta[currentKey] = arrayValues;
        arrayValues = null;
      }
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value) {
        meta[currentKey] = value;
      }
      continue;
    }

    const arrayMatch = line.match(/^\s+-\s+(.+)$/);
    if (arrayMatch && currentKey) {
      if (!arrayValues) arrayValues = [];
      arrayValues.push(arrayMatch[1].trim());
      continue;
    }
  }

  // Flush final array
  if (arrayValues && currentKey) {
    meta[currentKey] = arrayValues;
  }

  return { meta, body };
}

/**
 * Load all agent definitions from the agents directory.
 */
export async function loadAgents(agentsDir: string): Promise<Map<string, AgentDefinition>> {
  const agents = new Map<string, AgentDefinition>();

  try {
    const files = await readdir(agentsDir);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      try {
        const content = await readFile(join(agentsDir, file), 'utf-8');
        const { meta, body } = parseFrontmatter(content);
        const id = file.replace(/\.md$/, '');

        agents.set(id, {
          id,
          name: (meta.name as string) || id,
          description: (meta.description as string) || '',
          tools: (meta.tools as string[]) || [],
          systemPrompt: body,
        });
      } catch (err) {
        console.error(`Failed to load agent ${file}:`, err);
      }
    }
  } catch (err) {
    console.error(`Failed to read agents directory ${agentsDir}:`, err);
  }

  console.log(`Loaded ${agents.size} agents: ${Array.from(agents.keys()).join(', ')}`);
  return agents;
}

/**
 * Get the default agent (researcher) or fallback to the first available agent.
 */
export function getDefaultAgent(agents: Map<string, AgentDefinition>): AgentDefinition | undefined {
  return agents.get('researcher') || agents.values().next().value;
}
