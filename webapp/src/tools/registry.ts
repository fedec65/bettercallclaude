/**
 * Tool Registry
 * Maps tool names to their implementations with JSON Schema parameter definitions.
 */

export interface ToolParameterSchema {
  type: string;
  properties?: Record<string, {
    type: string;
    description?: string;
    enum?: string[];
    items?: { type: string; enum?: string[] };
    default?: unknown;
  }>;
  required?: string[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  list(): Array<{ name: string; description: string }> {
    return this.getAll().map((t) => ({ name: t.name, description: t.description }));
  }
}
