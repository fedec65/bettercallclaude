/**
 * BetterCallM Webapp Server
 * Self-hosted Swiss Legal Intelligence powered by Ollama + DeepSeek.
 *
 * Usage:
 *   npm run dev       — development with hot reload
 *   npm start         — production
 *
 * Environment:
 *   OLLAMA_URL    — Ollama API URL (default: http://localhost:11434)
 *   OLLAMA_MODEL  — Model name (default: deepseek-r1:8b)
 *   WEBAPP_PORT   — Server port (default: 3000)
 */

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getWebappConfig } from './config.js';
import { corsMiddleware } from './middleware/cors.js';
import { loadAgents } from './agents/agent-loader.js';
import { ToolRegistry } from './tools/registry.js';
import { searchBgeTool, searchDecisionsTool, validateCitationTool as validateBgeCitationTool } from './tools/bge-search.js';
import { lookupStatuteTool, getArticleTool, searchLegislationTool } from './tools/fedlex.js';
import { validateCitationTool, extractCitationsTool } from './tools/citations.js';
import { createChatRouter } from './routes/chat.js';
import { createAgentsRouter } from './routes/agents.js';
import { createToolsRouter } from './routes/tools.js';
import { checkOllamaHealth } from './llm/ollama.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const config = getWebappConfig();
  const app = express();

  // Middleware
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));

  // Serve static frontend files
  const publicDir = join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  // Load agents from markdown files
  const agents = await loadAgents(config.agentsDir);

  // Register tools
  const toolRegistry = new ToolRegistry();
  toolRegistry.register(searchBgeTool);
  toolRegistry.register(searchDecisionsTool);
  toolRegistry.register(validateBgeCitationTool);
  toolRegistry.register(lookupStatuteTool);
  toolRegistry.register(getArticleTool);
  toolRegistry.register(searchLegislationTool);
  toolRegistry.register(validateCitationTool);
  toolRegistry.register(extractCitationsTool);

  console.log(`Registered ${toolRegistry.getAll().length} tools: ${toolRegistry.list().map(t => t.name).join(', ')}`);

  // API routes
  app.use('/api/chat', createChatRouter(agents, toolRegistry, config.ollama.url, config.ollama.model));
  app.use('/api/agents', createAgentsRouter(agents));
  app.use('/api/tools', createToolsRouter(toolRegistry));

  // Health check
  app.get('/api/health', async (_req, res) => {
    const health = await checkOllamaHealth(config.ollama.url, config.ollama.model);
    res.json({
      status: health.connected ? 'ok' : 'degraded',
      ollama: health,
      model: config.ollama.model,
      agents: agents.size,
      tools: toolRegistry.getAll().length,
    });
  });

  // SPA fallback — serve index.html for non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(join(publicDir, 'index.html'));
  });

  // Start server
  app.listen(config.port, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  BetterCallM — Swiss Legal Intelligence Webapp');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  URL:     http://localhost:${config.port}`);
    console.log(`  Ollama:  ${config.ollama.url}`);
    console.log(`  Model:   ${config.ollama.model}`);
    console.log(`  Agents:  ${agents.size} loaded`);
    console.log(`  Tools:   ${toolRegistry.getAll().length} registered`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
