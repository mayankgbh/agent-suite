import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { Megaphone, Target, Zap, BarChart3 } from "lucide-react";
import { AgentDetailTabs } from "./AgentDetailTabs";

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  marketing: Megaphone,
  sales: Target,
  engineering: Zap,
  finance: BarChart3,
};

function formatHired(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatReportTime(createdAt: Date): string {
  const d = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 60) return `${diffMins}m ago`;
  return `${diffHours}h ago`;
}

export default async function AgentDetailLayout({
  params,
  children,
}: {
  params: Promise<{ agentId: string }>;
  children: React.ReactNode;
}) {
  const { agentId } = await params;
  let orgId: string;
  try {
    const { org } = await getOrCreateCurrentUser();
    orgId = org.id;
  } catch {
    redirect("/sign-in");
  }

  const [agent, lastReport] = await Promise.all([
    prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
      select: { id: true, display_name: true, agent_type: true, status: true, created_at: true },
    }),
    prisma.dailyReport.findFirst({
      where: { agent_id: agentId },
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    }),
  ]);

  if (!agent) notFound();

  const Icon = agentIcons[agent.agent_type] ?? Megaphone;
  const typeLabel = agent.agent_type.replace("_", " ");
  const statusLabel = agent.status === "active" ? "Executing" : agent.status === "onboarding" ? "Onboarding" : agent.status;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{agent.display_name}</h1>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {statusLabel}
                </span>
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {typeLabel} Agent · Hired {formatHired(agent.created_at)}
                {lastReport ? ` · Last report ${formatReportTime(lastReport.created_at)}` : ""}
              </p>
            </div>
          </div>
        </div>
        <AgentDetailTabs agentId={agentId} />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
