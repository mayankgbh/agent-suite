"use client";

import { useState } from "react";
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

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const INDUSTRIES = [
  "Technology",
  "SaaS",
  "E-commerce",
  "Finance",
  "Healthcare",
  "Education",
  "Other",
];

export function ContextForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial: {
    industry?: string | null;
    company_size?: string | null;
    icp_description?: string | null;
  };
}) {
  const router = useRouter();
  const [industry, setIndustry] = useState(initial.industry ?? "");
  const [companySize, setCompanySize] = useState(initial.company_size ?? "");
  const [icpDescription, setIcpDescription] = useState(initial.icp_description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: industry || null,
          company_size: companySize || null,
          icp_description: icpDescription || null,
          onboarding_status: "complete",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      router.push("/agents");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>About your company</CardTitle>
        <CardDescription>
          Help your agents understand your ideal customer and context.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select value={industry} onValueChange={setIndustry} disabled={loading}>
              <SelectTrigger id="industry" className="w-full">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_size">Company size</Label>
            <Select value={companySize} onValueChange={setCompanySize} disabled={loading}>
              <SelectTrigger id="company_size" className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="icp_description">Ideal customer (ICP)</Label>
            <Textarea
              id="icp_description"
              placeholder="Who is your ideal customer? (e.g. B2B SaaS, SMBs, specific roles…)"
              value={icpDescription}
              onChange={(e) => setIcpDescription(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Finish and select agents"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
