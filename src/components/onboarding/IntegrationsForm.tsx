"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const KINDS = ["crm", "calendar", "billing", "sheets"] as const;
const LABELS: Record<string, string> = {
  crm: "CRM",
  calendar: "Calendar",
  billing: "Billing",
  sheets: "Spreadsheets",
};
const PROVIDERS: Record<string, Array<{ value: string; label: string }>> = {
  crm: [
    { value: "none", label: "None" },
    { value: "hubspot", label: "HubSpot" },
    { value: "airtable", label: "Airtable" },
  ],
  calendar: [
    { value: "none", label: "None" },
    { value: "calendly", label: "Calendly" },
    { value: "google_calendar", label: "Google Calendar" },
  ],
  billing: [
    { value: "none", label: "None" },
    { value: "stripe", label: "Stripe" },
  ],
  sheets: [
    { value: "none", label: "None" },
    { value: "google_sheets", label: "Google Sheets" },
  ],
};

type IntegrationsState = Record<string, { provider: string; connected: boolean }>;

export function IntegrationsForm({
  orgId,
  onSkip,
  onContinue,
}: {
  orgId: string;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<IntegrationsState | null>(null);
  const [providersByKind, setProvidersByKind] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/v1/orgs/${orgId}/integrations`);
        if (!res.ok) return;
        const data = await res.json();
        setIntegrations(data.integrations ?? {});
        setProvidersByKind(data.providersByKind ?? {});
        const sel: Record<string, string> = {};
        for (const k of KINDS) {
          const i = data.integrations?.[k];
          sel[k] = i?.connected ? i.provider : "none";
        }
        setSelected(sel);
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      for (const kind of KINDS) {
        const provider = selected[kind] ?? "none";
        if (provider === "none") {
          await fetch(`/api/v1/orgs/${orgId}/integrations`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind, provider: "none" }),
          });
          continue;
        }
        const cred = credentials[kind]?.trim();
        const config =
          kind === "sheets"
            ? (cred ? { service_account_json: cred } : null)
            : (cred ? { api_key: cred } : null);
        const res = await fetch(`/api/v1/orgs/${orgId}/integrations`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, provider, config }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "Failed to save");
        }
      }
      await onContinue();
      router.push("/agents");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    await onSkip();
    router.push("/agents");
    router.refresh();
  }

  if (loading || !integrations) {
    return (
      <div className="w-full max-w-md">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect your tools (optional)</CardTitle>
        <CardDescription>
          Give your agents access to your CRM, calendar, billing, and spreadsheets. You can change these anytime in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {KINDS.map((kind) => (
          <div key={kind} className="space-y-2">
            <Label>{LABELS[kind]}</Label>
            <Select
              value={selected[kind] ?? "none"}
              onValueChange={(v) => setSelected((s) => ({ ...s, [kind]: v }))}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(PROVIDERS[kind] ?? [{ value: "none", label: "None" }]).map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected[kind] && selected[kind] !== "none" && (
              <div className="pl-2">
                {kind === "sheets" ? (
                  <Textarea
                    placeholder="Paste Google service account JSON (or leave blank to use env)"
                    value={credentials[kind] ?? ""}
                    onChange={(e) =>
                      setCredentials((c) => ({ ...c, [kind]: e.target.value }))
                    }
                    rows={3}
                    className="font-mono text-xs"
                    disabled={saving}
                  />
                ) : (
                  <Input
                    type="password"
                    placeholder="API key (or leave blank to use env)"
                    value={credentials[kind] ?? ""}
                    onChange={(e) =>
                      setCredentials((c) => ({ ...c, [kind]: e.target.value }))
                    }
                    disabled={saving}
                  />
                )}
              </div>
            )}
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleSkip} disabled={saving}>
            Skip for now
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save and continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
