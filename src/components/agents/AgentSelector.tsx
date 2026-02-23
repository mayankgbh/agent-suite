"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { AgentTypeDefinition } from "@/agents/types";

export function AgentSelector({
  agentTypes,
  orgId,
  existingAgentTypes,
}: {
  agentTypes: AgentTypeDefinition[];
  orgId: string;
  existingAgentTypes: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(agentTypes.filter((a) => !existingAgentTypes.includes(a.type)).map((a) => a.type))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (type: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  async function handleConfirm() {
    if (selected.size === 0) {
      setError("Select at least one agent.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const created: { id: string }[] = [];
      for (const type of selected) {
        const res = await fetch(`/api/v1/orgs/${orgId}/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent_type: type }),
        });
        if (!res.ok) throw new Error("Failed to create agent");
        const agent = await res.json();
        created.push(agent);
      }
      if (created.length > 0) {
        router.push(`/agents/${created[0].id}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Select agents</CardTitle>
        <CardDescription>
          Choose which agents to hire for your workspace. You can add more later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {agentTypes.map((def) => {
          const alreadyAdded = existingAgentTypes.includes(def.type);
          return (
            <div
              key={def.type}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <Checkbox
                id={def.type}
                checked={alreadyAdded || selected.has(def.type)}
                disabled={alreadyAdded}
                onCheckedChange={() => !alreadyAdded && toggle(def.type)}
              />
              <label
                htmlFor={def.type}
                className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <div>{def.displayName}</div>
                <div className="mt-1 text-muted-foreground font-normal">
                  {def.description}
                </div>
                {alreadyAdded && (
                  <span className="mt-1 inline-block text-xs text-muted-foreground">
                    Already added
                  </span>
                )}
              </label>
            </div>
          );
        })}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleConfirm} disabled={loading || selected.size === 0}>
          {loading ? "Adding…" : "Add selected agents"}
        </Button>
      </CardContent>
    </Card>
  );
}
