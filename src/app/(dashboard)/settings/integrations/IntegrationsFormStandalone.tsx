"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export function IntegrationsFormStandalone({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/v1/orgs/${orgId}/integrations`);
        if (!res.ok) return;
        const data = await res.json();
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
    setSaved(false);
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
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
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
        {saved && <p className="text-sm text-green-600">Saved.</p>}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
