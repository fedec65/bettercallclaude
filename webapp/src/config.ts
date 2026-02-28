/**
 * BetterCallM Webapp Configuration
 * All settings configurable via environment variables with sensible defaults.
 */

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

    agentsDir: process.env.AGENTS_DIR || new URL('../../agents', import.meta.url).pathname,

    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
