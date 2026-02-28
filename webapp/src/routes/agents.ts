/**
 * Agents API Route
 * GET /api/agents — list available legal agents
 */

import { Router, type Request, type Response } from 'express';
import type { AgentDefinition } from '../agents/agent-loader.js';

export function createAgentsRouter(agents: Map<string, AgentDefinition>): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    const agentList = Array.from(agents.values()).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
    }));

    res.json({ agents: agentList });
  });

  router.get('/:id', (req: Request, res: Response) => {
    const agent = agents.get(req.params.id);
    if (!agent) {
      res.status(404).json({ error: `Agent not found: ${req.params.id}` });
      return;
    }
    res.json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      tools: agent.tools,
    });
  });

  return router;
}
