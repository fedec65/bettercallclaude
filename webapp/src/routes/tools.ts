/**
 * Tools API Route
 * POST /api/tools/:name — invoke a legal tool directly
 * GET /api/tools — list available tools
 */

import { Router, type Request, type Response } from 'express';
import type { ToolRegistry } from '../tools/registry.js';

export function createToolsRouter(toolRegistry: ToolRegistry): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json({ tools: toolRegistry.list() });
  });

  router.post('/:name', async (req: Request, res: Response) => {
    const tool = toolRegistry.get(req.params.name);
    if (!tool) {
      res.status(404).json({ error: `Unknown tool: ${req.params.name}` });
      return;
    }

    try {
      const result = await tool.execute(req.body || {});
      res.json({ result });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
