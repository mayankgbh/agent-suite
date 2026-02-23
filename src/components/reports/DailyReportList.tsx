"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportItem {
  id: string;
  report_date: string;
  summary: string;
  okr_progress: unknown;
  tasks_completed: string[];
  tasks_in_progress: string[];
  blockers: unknown;
  recommendations: unknown;
  created_at: string;
}

export function DailyReportList({
  agentId,
  orgId,
  initialReports,
}: {
  agentId: string;
  orgId: string;
  initialReports: ReportItem[];
}) {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [generating, setGenerating] = useState(false);

  async function generateToday() {
    setGenerating(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(
        `/api/v1/orgs/${orgId}/agents/${agentId}/reports/${today}`,
        { method: "POST" }
      );
      if (res.ok) {
        const report = await res.json();
        setReports((prev) => [report, ...prev.filter((r) => r.report_date !== today)]);
      }
    } finally {
      setGenerating(false);
    }
  }

  if (initialReports.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">No reports yet.</p>
        <Button onClick={generateToday} disabled={generating}>
          {generating ? "Generating…" : "Generate today's report"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={generateToday} disabled={generating} variant="outline" size="sm">
        {generating ? "Generating…" : "Generate today's report"}
      </Button>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="pb-2">
              <p className="font-medium">
                {new Date(report.report_date).toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.summary}</p>
              {Array.isArray(report.blockers) && (report.blockers as Array<{ description: string }>).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground">Blockers</p>
                  <ul className="mt-1 list-inside list-disc text-sm">
                    {(report.blockers as Array<{ description: string }>).map((b, i) => (
                      <li key={i}>{b.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
