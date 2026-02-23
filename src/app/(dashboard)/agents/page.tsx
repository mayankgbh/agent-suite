import { redirect } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { listAgentTypes } from "@/agents/registry";
import { AgentSelector } from "@/components/agents/AgentSelector";
import { AgentCard } from "@/components/agents/AgentCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AgentsPage() {
  let orgId: string;
  try {
    const { org } = await getOrCreateCurrentUser();
    orgId = org.id;
  } catch {
    redirect("/sign-in");
  }

  const [agents, agentTypes] = await Promise.all([
    prisma.agent.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        agent_type: true,
        display_name: true,
        status: true,
      },
    }),
    Promise.resolve(listAgentTypes()),
  ]);

  const existingAgentTypes = agents.map((a) => a.agent_type);

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agents</h1>
      </div>

      {agents.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-medium">Your agents</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                id={agent.id}
                displayName={agent.display_name}
                agentType={agent.agent_type}
                status={agent.status}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-4 text-lg font-medium">Add agents</h2>
      <AgentSelector
        agentTypes={agentTypes}
        orgId={orgId}
        existingAgentTypes={existingAgentTypes}
      />
    </div>
  );
}
