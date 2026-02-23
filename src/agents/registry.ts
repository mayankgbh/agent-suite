import type { AgentType, AgentTypeDefinition } from "./types";
import { marketingAgentDefinition } from "./marketing/definition";

const registry: Partial<Record<AgentType, AgentTypeDefinition>> = {
  marketing: marketingAgentDefinition,
};

export function getAgentDefinition(type: AgentType): AgentTypeDefinition {
  const def = registry[type];
  if (!def) throw new Error(`Unknown agent type: ${type}`);
  return def;
}

export function listAgentTypes(): AgentTypeDefinition[] {
  return [marketingAgentDefinition];
}

export function getAgentType(type: string): AgentType | null {
  if (registry[type as AgentType]) return type as AgentType;
  return null;
}
