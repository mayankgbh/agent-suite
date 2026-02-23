"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  output: unknown;
  tools_used: string[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  okr: { id: string; objective: string } | null;
}

const statusColors: Record<string, string> = {
  planned: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  blocked: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function TaskList({
  agentId: _agentId,
  orgId: _orgId,
  initialTasks,
}: {
  agentId: string;
  orgId: string;
  initialTasks: TaskItem[];
}) {
  if (initialTasks.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No tasks yet. Tasks are created by the agent when it works on accepted OKRs.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {initialTasks.map((task) => {
        const statusClass = statusColors[task.status] ?? "bg-muted text-muted-foreground";
        return (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{task.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>
              {task.okr && (
                <p className="text-xs text-muted-foreground">OKR: {task.okr.objective}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              {task.tools_used.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Tools: {task.tools_used.join(", ")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
