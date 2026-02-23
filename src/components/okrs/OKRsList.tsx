"use client";

import { useCallback, useEffect, useState } from "react";
import { OKRProgress } from "./OKRProgress";
import { OKRNegotiation } from "./OKRNegotiation";

interface KeyResult {
  description: string;
  metric?: string;
  target?: string | number;
  current?: string | number;
  unit?: string;
}

export interface OKRItem {
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

export function OKRsList({
  orgId,
  agentId,
  initialOkrs,
}: {
  orgId: string;
  agentId: string;
  initialOkrs: OKRItem[];
}) {
  const [okrs, setOkrs] = useState<OKRItem[]>(initialOkrs);

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/v1/orgs/${orgId}/agents/${agentId}/okrs`);
    if (!res.ok) return;
    const data = await res.json();
    setOkrs(data);
  }, [orgId, agentId]);

  useEffect(() => {
    setOkrs(initialOkrs);
  }, [initialOkrs]);

  if (okrs.length === 0) {
    return <p className="text-muted-foreground text-sm">No OKRs yet. Propose one above.</p>;
  }

  return (
    <div className="space-y-4">
      {okrs.map((okr) => (
        <div key={okr.id} className="space-y-2">
          <OKRProgress okr={okr} />
          {okr.status === "negotiating" && (
            <OKRNegotiation
              okr={okr}
              orgId={orgId}
              agentId={agentId}
              onAccepted={refetch}
            />
          )}
        </div>
      ))}
    </div>
  );
}
