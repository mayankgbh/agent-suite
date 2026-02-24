import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type IntegrationKind = "crm" | "calendar" | "billing" | "sheets" | "analytics";
export type IntegrationConfig = Record<string, unknown>; // api_key, service_account_json, etc.

export interface OrgIntegrationRow {
  kind: string;
  provider: string;
  config: IntegrationConfig | null;
}

export async function getOrgIntegration(
  prisma: PrismaClient,
  orgId: string,
  kind: IntegrationKind
): Promise<{ provider: string; config: IntegrationConfig } | null> {
  const row = await prisma.orgIntegration.findUnique({
    where: { org_id_kind: { org_id: orgId, kind } },
    select: { provider: true, config: true },
  });
  if (!row || !row.config || typeof row.config !== "object") return null;
  return { provider: row.provider, config: row.config as IntegrationConfig };
}

export async function listOrgIntegrations(
  prisma: PrismaClient,
  orgId: string
): Promise<OrgIntegrationRow[]> {
  const rows = await prisma.orgIntegration.findMany({
    where: { org_id: orgId },
    select: { kind: true, provider: true, config: true },
  });
  return rows.map((r) => ({
    kind: r.kind,
    provider: r.provider,
    config: r.config as IntegrationConfig | null,
  }));
}

export async function setOrgIntegration(
  prisma: PrismaClient,
  orgId: string,
  kind: IntegrationKind,
  provider: string,
  config: IntegrationConfig | null
): Promise<void> {
  const jsonConfig = config != null ? (config as Prisma.InputJsonValue) : undefined;
  await prisma.orgIntegration.upsert({
    where: { org_id_kind: { org_id: orgId, kind } },
    create: { org_id: orgId, kind, provider, ...(jsonConfig != null && { config: jsonConfig }) },
    update: { provider, ...(jsonConfig != null && { config: jsonConfig }), updated_at: new Date() },
  });
}

/** Resolve API key (or similar) for a tool: org integration first, then env fallback. */
export function resolveCredential(
  orgConfig: IntegrationConfig | null,
  envKey: string
): string | undefined {
  if (orgConfig?.api_key && typeof orgConfig.api_key === "string")
    return orgConfig.api_key;
  return process.env[envKey];
}

/** Resolve Google Sheets service account JSON: org integration first, then env. */
export function resolveSheetsCredentials(orgConfig: IntegrationConfig | null): string | undefined {
  const fromConfig = orgConfig?.service_account_json ?? orgConfig?.api_key;
  if (typeof fromConfig === "string") return fromConfig;
  return process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
}

/** Get credential for a tool: from org integration (if orgId and kind match) or env. */
export async function getToolCredential(
  orgId: string | undefined,
  kind: IntegrationKind,
  envKey: string
): Promise<string | undefined> {
  if (!orgId) return process.env[envKey];
  const { prisma } = await import("@/lib/db/client");
  const integration = await getOrgIntegration(prisma, orgId, kind);
  return resolveCredential(integration?.config ?? null, envKey);
}

export async function getToolSheetsCredentials(orgId: string | undefined): Promise<string | undefined> {
  if (!orgId) return process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
  const { prisma } = await import("@/lib/db/client");
  const integration = await getOrgIntegration(prisma, orgId, "sheets");
  return resolveSheetsCredentials(integration?.config ?? null);
}
