"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface KeyResult {
  description: string;
  metric?: string;
  target?: string | number;
  current?: string | number;
  unit?: string;
}

interface OKR {
  id: string;
  objective: string;
  key_results: KeyResult[];
  status: string;
  agent_feedback: string | null;
  feasibility_score: number | null;
  time_horizon: string | null;
  due_date: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  proposed: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  negotiating: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  accepted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function OKRProgress({ okr }: { okr: OKR }) {
  const statusClass = statusColors[okr.status] ?? "bg-muted text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium leading-tight">{okr.objective}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusClass}`}>
            {okr.status.replace("_", " ")}
          </span>
        </div>
        {(okr.time_horizon || okr.due_date) && (
          <p className="text-xs text-muted-foreground">
            {okr.time_horizon ?? ""}
            {okr.time_horizon && okr.due_date ? " · " : ""}
            {okr.due_date ? new Date(okr.due_date).toLocaleDateString() : ""}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1 text-sm">
          {Array.isArray(okr.key_results) &&
            okr.key_results.map((kr, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{kr.description}</span>
                {kr.target != null && (
                  <span className="text-muted-foreground">
                    → {String(kr.target)} {kr.unit ?? ""}
                  </span>
                )}
              </li>
            ))}
        </ul>
        {okr.agent_feedback && okr.status === "negotiating" && (
          <p className="mt-3 border-t pt-3 text-xs text-muted-foreground line-clamp-2">
            {okr.agent_feedback}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
