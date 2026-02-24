import type { AgentType, AgentTypeDefinition } from "./types";
import { marketingAgentDefinition } from "./marketing/definition";
import { salesAgentDefinition } from "./sales/definition";
import { engineeringAgentDefinition } from "./engineering/definition";
import { financeAgentDefinition } from "./finance/definition";

const registry: Partial<Record<AgentType, AgentTypeDefinition>> = {
  marketing: marketingAgentDefinition,
  sales: salesAgentDefinition,
  engineering: engineeringAgentDefinition,
  finance: financeAgentDefinition,
};

const allDefinitions: AgentTypeDefinition[] = [
  marketingAgentDefinition,
  salesAgentDefinition,
  engineeringAgentDefinition,
  financeAgentDefinition,
];

export function getAgentDefinition(type: AgentType): AgentTypeDefinition {
  const def = registry[type];
  if (!def) throw new Error(`Unknown agent type: ${type}`);
  return def;
}

export function listAgentTypes(): AgentTypeDefinition[] {
  return allDefinitions;
}

export function getAgentType(type: string): AgentType | null {
  if (registry[type as AgentType]) return type as AgentType;
  return null;
}
