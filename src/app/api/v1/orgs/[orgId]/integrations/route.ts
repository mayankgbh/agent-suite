import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { listOrgIntegrations, setOrgIntegration } from "@/lib/integrations";
import type { IntegrationKind } from "@/lib/integrations";
import { z } from "zod";

const KINDS: IntegrationKind[] = ["crm", "calendar", "billing", "sheets", "analytics"];
const PROVIDERS_BY_KIND: Record<IntegrationKind, string[]> = {
  crm: ["hubspot", "airtable", "none"],
  calendar: ["calendly", "google_calendar", "none"],
  billing: ["stripe", "none"],
  sheets: ["google_sheets", "none"],
  analytics: ["ga4", "none"],
};

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const list = await listOrgIntegrations(prisma, orgId);
    const byKind = Object.fromEntries(
      KINDS.map((k) => [k, { provider: "none" as string, connected: false }])
    );
    for (const row of list) {
      if (row.kind in byKind && row.provider !== "none") {
        byKind[row.kind as IntegrationKind] = { provider: row.provider, connected: true };
      }
    }
    return NextResponse.json({
      integrations: byKind,
      providersByKind: PROVIDERS_BY_KIND,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      { status: 401 }
    );
  }
}

const setBodySchema = z.object({
  kind: z.enum(KINDS as unknown as [string, ...string[]]),
  provider: z.string().min(1),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const raw = await req.json();
    const body = setBodySchema.parse(raw);
    if (body.provider === "none") {
      await prisma.orgIntegration.deleteMany({
        where: { org_id: orgId, kind: body.kind },
      });
      return NextResponse.json({ ok: true });
    }
    const config = body.config ?? (body.provider ? { api_key: "" } : null);
    await setOrgIntegration(
      prisma,
      orgId,
      body.kind as IntegrationKind,
      body.provider,
      config
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const zodError = e && typeof e === "object" && "flatten" in e;
    return NextResponse.json(
      { error: zodError ? "Validation failed" : (e instanceof Error ? e.message : "Bad request") },
      { status: 400 }
    );
  }
}
