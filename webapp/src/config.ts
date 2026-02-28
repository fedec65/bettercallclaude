/**
 * BetterCallM Webapp Configuration
 * All settings configurable via environment variables with sensible defaults.
 */

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Find the agents directory by checking multiple candidate paths.
 * Works in dev (tsx from webapp/src/), production (node from webapp/dist/),
 * and any clone directory structure.
 */
function findAgentsDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const candidates = [
    join(__dirname, '..', '..', 'agents'),       // tsx: webapp/src/ → repo root
    join(__dirname, '..', '..', '..', 'agents'), // dist: webapp/dist/ → repo root
    join(process.cwd(), '..', 'agents'),         // CWD=webapp/ → repo root
    join(process.cwd(), 'agents'),               // CWD=repo root
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  console.warn('Could not find agents directory. Searched:', candidates);
  return join(__dirname, '..', '..', 'agents');
}

export interface WebappConfig {
  port: number;
  ollama: {
    url: string;
    model: string;
  };
  entscheidsuche: {
    baseUrl: string;
    rateLimitMs: number;
    timeout: number;
  };
  fedlex: {
    sparqlEndpoint: string;
    timeout: number;
  };
  agentsDir: string;
  logLevel: string;
}

export function getWebappConfig(): WebappConfig {
  return {
    port: parseInt(process.env.WEBAPP_PORT || '3000', 10),

    ollama: {
      url: process.env.OLLAMA_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'deepseek-r1:8b',
    },

    entscheidsuche: {
      baseUrl: process.env.ENTSCHEIDSUCHE_API_URL || 'https://entscheidsuche.ch',
      rateLimitMs: 6000, // ~10 req/min
      timeout: parseInt(process.env.ENTSCHEIDSUCHE_TIMEOUT || '15000', 10),
    },

    fedlex: {
      sparqlEndpoint: process.env.FEDLEX_SPARQL_URL || 'https://fedlex.data.admin.ch/sparqlendpoint',
      timeout: parseInt(process.env.FEDLEX_TIMEOUT || '15000', 10),
    },

    agentsDir: process.env.AGENTS_DIR || findAgentsDir(),

    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
