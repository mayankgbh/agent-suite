import { redirect, notFound } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { AgentChat } from "@/components/agents/AgentChat";

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  let orgId: string;
  try {
    const { org } = await getOrCreateCurrentUser();
    orgId = org.id;
  } catch {
    redirect("/sign-in");
  }

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, org_id: orgId },
    select: { id: true, display_name: true, status: true, agent_type: true },
  });

  if (!agent) notFound();

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col px-6 py-4">
      <AgentChat agentId={agentId} orgId={orgId} displayName={agent.display_name} agentType={agent.agent_type} />
    </div>
  );
}
