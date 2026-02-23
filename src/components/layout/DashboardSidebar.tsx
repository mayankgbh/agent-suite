"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Megaphone, Target, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  marketing: Megaphone,
  sales: Target,
  engineering: Zap,
  finance: BarChart3,
};

export interface SidebarAgent {
  id: string;
  display_name: string;
  agent_type: string;
  status: string;
}

export function DashboardSidebar({
  agents,
  userDisplayName,
}: {
  agents: SidebarAgent[];
  userDisplayName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <div className="size-2 rounded-full bg-primary-foreground/80" />
        </div>
        <span className="font-semibold">Agent Suite</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        <Button variant="ghost" className={`justify-start ${pathname === "/" ? "bg-sidebar-accent" : ""}`} asChild>
          <Link href="/">Dashboard</Link>
        </Button>
        <Button variant="ghost" className={`justify-start ${pathname.startsWith("/agents") ? "bg-sidebar-accent" : ""}`} asChild>
          <Link href="/agents">Agents</Link>
        </Button>
      </nav>
      <div className="flex-1 overflow-y-auto px-3">
        <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">YOUR AGENTS</p>
        <div className="space-y-0.5">
          {agents.map((agent) => {
            const Icon = agentIcons[agent.agent_type] ?? Megaphone;
            const isActive = pathname === `/agents/${agent.id}` || pathname.startsWith(`/agents/${agent.id}/`);
            return (
              <Link key={agent.id} href={`/agents/${agent.id}`}>
                <div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent ${
                    isActive ? "bg-sidebar-accent" : ""
                  }`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-4 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{agent.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground capitalize">
                      {agent.agent_type.replace("_", " ")} Agent
                    </p>
                  </div>
                  {agent.status === "active" && (
                    <div className="size-2 shrink-0 rounded-full bg-green-500" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <Button className="mt-4 w-full" variant="outline" asChild>
          <Link href="/agents">+ Hire Agent</Link>
        </Button>
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <UserButton afterSignOutUrl="/" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userDisplayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {agents.length} agent{agents.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
