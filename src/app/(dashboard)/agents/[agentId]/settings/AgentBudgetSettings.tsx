"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Preset {
  value: number;
  label: string;
  sublabel: string;
}

interface AgentBudgetSettingsProps {
  orgId: string;
  agentId: string;
  initialBudgetCents: number;
  initialUsage: number;
  tierLabel: string;
  tierMaxTokens: number;
  presets: Preset[];
}

export function AgentBudgetSettings({
  orgId,
  agentId,
  initialBudgetCents,
  initialUsage,
  tierLabel,
  tierMaxTokens,
  presets,
}: AgentBudgetSettingsProps) {
  const router = useRouter();
  const [budgetCents, setBudgetCents] = useState(initialBudgetCents);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveBudget(cents: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orgs/${orgId}/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly_budget_cents: cents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setBudgetCents(cents);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const usagePct = tierMaxTokens > 0 ? Math.min(100, (initialUsage / tierMaxTokens) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground mb-1">Current tier</p>
        <p className="text-lg font-semibold">{tierLabel}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Usage this month: {initialUsage.toLocaleString()} / {tierMaxTokens.toLocaleString()} tokens
        </p>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Select plan</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {presets.map((preset) => {
            const isActive = budgetCents === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                disabled={saving}
                onClick={() => saveBudget(preset.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:bg-muted/50"
                } ${saving ? "opacity-70 pointer-events-none" : ""}`}
              >
                <span className="font-medium">{preset.label}</span>
                <p className="text-xs text-muted-foreground mt-1">{preset.sublabel}</p>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
