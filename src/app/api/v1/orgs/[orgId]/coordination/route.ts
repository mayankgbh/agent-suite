import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import {
  getRecentCoordination,
  postCoordination,
} from "@/lib/coordination";
import { z } from "zod";

const postBodySchema = z.object({
  from_agent_id: z.string().uuid(),
  to_agent_ids: z.array(z.string().uuid()).nullable().optional(),
  content: z.string().min(1).max(5000),
  intent: z.string().max(64).nullable().optional(),
});

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const url = new URL(req.url);
    const excludeFromAgentId = url.searchParams.get("exclude_from_agent_id") ?? undefined;
    const forAgentId = url.searchParams.get("for_agent_id") ?? undefined;
    const limit = url.searchParams.get("limit");
    const rows = await getRecentCoordination(prisma, orgId, {
      excludeFromAgentId,
      forAgentId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return NextResponse.json(rows);
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const raw = await req.json();
    const body = postBodySchema.parse(raw);
    const row = await postCoordination(prisma, {
      org_id: orgId,
      from_agent_id: body.from_agent_id,
      to_agent_ids: body.to_agent_ids ?? null,
      content: body.content,
      intent: body.intent ?? null,
    });
    return NextResponse.json(row);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const zodError = e && typeof e === "object" && "flatten" in e;
    return NextResponse.json(
      {
        error: zodError
          ? "Validation failed"
          : e instanceof Error
            ? e.message
            : "Bad request",
      },
      { status: 400 }
    );
  }
}
