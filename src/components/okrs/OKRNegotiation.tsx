"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}

interface CounterProposal {
  objective: string;
  key_results: KeyResult[];
  time_horizon?: string;
  due_date?: string;
}

export function OKRNegotiation({
  okr,
  orgId,
  agentId,
  onAccepted,
}: {
  okr: OKR;
  orgId: string;
  agentId: string;
  onAccepted: () => void;
}) {
  const [useCounter, setUseCounter] = useState(false);
  const [counterProposal, setCounterProposal] = useState<CounterProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/orgs/${orgId}/agents/${agentId}/okrs/${okr.id}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            useCounterProposal: useCounter && !!counterProposal,
            counterProposal: useCounter ? counterProposal : undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to accept");
      onAccepted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent feedback</CardTitle>
        {okr.feasibility_score != null && (
          <p className="text-sm text-muted-foreground">
            Feasibility score: {(okr.feasibility_score * 100).toFixed(0)}%
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {okr.agent_feedback && (
          <p className="rounded-md border bg-muted/50 p-3 text-sm">{okr.agent_feedback}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAccept} disabled={loading}>
            {loading ? "Accepting…" : "Accept as-is"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
