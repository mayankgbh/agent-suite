"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface KeyResultInput {
  description: string;
  metric?: string;
  target?: string;
  unit?: string;
}

export interface OKRFormValues {
  objective: string;
  key_results: KeyResultInput[];
  time_horizon?: "weekly" | "monthly" | "quarterly";
  due_date?: string;
}

const defaultKr: KeyResultInput = { description: "", metric: "", target: "", unit: "" };

export function OKRForm({
  orgId,
  agentId,
  onSuccess,
}: {
  orgId: string;
  agentId: string;
  onSuccess: (data: { okr: unknown; evaluation: unknown }) => void;
}) {
  const [objective, setObjective] = useState("");
  const [keyResults, setKeyResults] = useState<KeyResultInput[]>([{ ...defaultKr }]);
  const [timeHorizon, setTimeHorizon] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addKr() {
    setKeyResults((prev) => [...prev, { ...defaultKr }]);
  }

  function updateKr(i: number, field: keyof KeyResultInput, value: string) {
    setKeyResults((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function removeKr(i: number) {
    if (keyResults.length <= 1) return;
    setKeyResults((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const krs = keyResults.filter((kr) => kr.description.trim());
    if (!objective.trim() || krs.length === 0) {
      setError("Objective and at least one key result are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/orgs/${orgId}/agents/${agentId}/okrs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: objective.trim(),
          key_results: krs.map((kr) => ({
            description: kr.description.trim(),
            metric: kr.metric?.trim() || undefined,
            target: kr.target?.trim() || undefined,
            unit: kr.unit?.trim() || undefined,
          })),
          time_horizon: timeHorizon || undefined,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to propose OKR");
      onSuccess(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propose OKR</CardTitle>
        <CardDescription>
          Set an objective and key results. The agent will evaluate and may suggest changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="objective">Objective</Label>
            <Textarea
              id="objective"
              placeholder="e.g. Increase qualified leads by 3x"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Key results</Label>
            {keyResults.map((kr, i) => (
              <div key={i} className="flex flex-col gap-2 rounded border p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Key result description"
                    value={kr.description}
                    onChange={(e) => updateKr(i, "description", e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKr(i)}
                    disabled={keyResults.length <= 1 || loading}
                  >
                    ×
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <Input
                    placeholder="Metric"
                    value={kr.metric ?? ""}
                    onChange={(e) => updateKr(i, "metric", e.target.value)}
                    disabled={loading}
                  />
                  <Input
                    placeholder="Target"
                    value={kr.target ?? ""}
                    onChange={(e) => updateKr(i, "target", e.target.value)}
                    disabled={loading}
                  />
                  <Input
                    placeholder="Unit"
                    value={kr.unit ?? ""}
                    onChange={(e) => updateKr(i, "unit", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addKr} disabled={loading}>
              + Add key result
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Time horizon</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon} disabled={loading}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                className="w-[160px]"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Proposing…" : "Propose OKR"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
