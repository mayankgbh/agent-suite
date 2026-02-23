import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const acceptBodySchema = z.object({
  useCounterProposal: z.boolean().optional().default(false),
  counterProposal: z
    .object({
      objective: z.string(),
      key_results: z.array(
        z.object({
          description: z.string(),
          metric: z.string().optional(),
          target: z.union([z.string(), z.number()]).optional(),
          current: z.union([z.string(), z.number()]).optional(),
          unit: z.string().optional(),
        })
      ),
      time_horizon: z.enum(["weekly", "monthly", "quarterly"]).optional(),
      due_date: z.string().optional(),
    })
    .optional(),
});

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string; okrId: string }> }
) {
  try {
    const { orgId, agentId, okrId } = await params;
    await requireOrgAccess(orgId);

    const existing = await prisma.oKR.findFirst({
      where: { id: okrId, agent_id: agentId, org_id: orgId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const raw = await req.json().catch(() => ({}));
    const body = acceptBodySchema.parse(raw);

    const data: {
      status: "accepted";
      objective?: string;
      key_results?: object[];
      time_horizon?: "weekly" | "monthly" | "quarterly" | null;
      due_date?: Date | null;
    } = { status: "accepted" };
    if (body.useCounterProposal && body.counterProposal) {
      data.objective = body.counterProposal.objective;
      data.key_results = body.counterProposal.key_results as object[];
      data.time_horizon =
        body.counterProposal.time_horizon && ["weekly", "monthly", "quarterly"].includes(body.counterProposal.time_horizon)
          ? body.counterProposal.time_horizon
          : null;
      data.due_date = body.counterProposal.due_date ? new Date(body.counterProposal.due_date) : null;
    }

    const okr = await prisma.oKR.update({
      where: { id: okrId },
      data: data as Parameters<typeof prisma.oKR.update>[0]["data"],
    });
    return NextResponse.json(okr);
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
