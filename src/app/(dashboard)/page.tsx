import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Megaphone, Target, Zap, BarChart3 } from "lucide-react";

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  marketing: Megaphone,
  sales: Target,
  engineering: Zap,
  finance: BarChart3,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  let orgId: string;
  let userName: string;
  try {
    const data = await getOrCreateCurrentUser();
    orgId = data.org.id;
    userName = data.user.name ?? data.user.email?.split("@")[0] ?? "there";
  } catch {
    redirect("/sign-in");
  }

  const [agents, tasks, reports, okrCount] = await Promise.all([
    prisma.agent.findMany({
      where: { org_id: orgId },
      select: { id: true, display_name: true, agent_type: true, status: true },
    }),
    prisma.task.findMany({
      where: { agent: { org_id: orgId } },
      select: { id: true, status: true, created_at: true },
    }),
    prisma.dailyReport.findMany({
      where: { org_id: orgId },
      orderBy: { report_date: "desc" },
      take: 100,
      include: { agent: { select: { id: true, display_name: true, agent_type: true } } },
    }),
    prisma.oKR.count({ where: { org_id: orgId, status: "in_progress" } }),
  ]);

  const activeCount = agents.filter((a) => a.status === "active" || a.status === "onboarding").length;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const tasksThisWeek = tasks.filter((t) => new Date(t.created_at) >= weekStart);
  const completedThisWeek = tasksThisWeek.filter((t) => t.status === "completed");
  const taskProgress = tasksThisWeek.length > 0
    ? Math.round((completedThisWeek.length / tasksThisWeek.length) * 100)
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const reportsByAgent = new Map<string | null, (typeof reports)[0]>();
  for (const r of reports) {
    const key = r.agent_id;
    const reportDate = r.report_date instanceof Date ? r.report_date.toISOString().slice(0, 10) : String(r.report_date).slice(0, 10);
    if (reportDate === today) {
      if (!reportsByAgent.has(key)) reportsByAgent.set(key, r);
    }
  }
  for (const r of reports) {
    const key = r.agent_id;
    if (!reportsByAgent.has(key)) reportsByAgent.set(key, r);
  }
  const reportsTodayCount = reports.filter((r) => {
    const d = r.report_date instanceof Date ? r.report_date.toISOString().slice(0, 10) : String(r.report_date).slice(0, 10);
    return d === today;
  }).length;

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        {getGreeting()}, {userName}
      </h1>
      <p className="mt-1 text-muted-foreground">Here&apos;s what your team accomplished today.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">All executing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Tasks This Week</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {completedThisWeek.length}/{tasksThisWeek.length}
            </p>
            <p className="text-xs text-muted-foreground">{taskProgress}% complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">OKRs in progress</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{okrCount}</p>
            <p className="text-xs text-muted-foreground">Active goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Reports today</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reportsTodayCount}</p>
            <p className="text-xs text-muted-foreground">Agent standups</p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">AGENT STANDUP — TODAY</h2>
        <div className="space-y-4">
          {agents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No agents yet. <Link href="/agents" className="text-primary underline">Hire an agent</Link> to see standups here.
              </CardContent>
            </Card>
          ) : (
            agents.map((agent) => {
              const report = reportsByAgent.get(agent.id);
              const Icon = agentIcons[agent.agent_type] ?? Megaphone;
              return (
                <Card key={agent.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <Link href={`/agents/${agent.id}`} className="font-semibold hover:underline">
                          {agent.display_name}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">
                          {agent.agent_type.replace("_", " ")} Agent
                        </p>
                      </div>
                      {report && (
                        <span className="text-xs text-muted-foreground">
                          Report {formatReportTime(report.created_at)}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {report ? (
                      <>
                        <p className="text-sm text-muted-foreground">{report.summary}</p>
                        {report.okr_progress &&
                          Array.isArray(report.okr_progress) &&
                          (report.okr_progress as Array<{ okr_id?: string; progress_delta?: string; notes?: string }>).length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {(report.okr_progress as Array<{ progress_delta?: string; notes?: string }>).map((p, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <span className="size-2 rounded-full bg-green-500" />
                                  {p.progress_delta ?? p.notes ?? "Progress"}
                                </li>
                              ))}
                            </ul>
                          )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No report yet today.{" "}
                        <Link href={`/agents/${agent.id}/reports`} className="text-primary underline">
                          Generate report
                        </Link>
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
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
