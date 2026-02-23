import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { createDailyReport } from "@/engine/reporter";

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) throw new Error("Forbidden");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string; date: string }> }
) {
  try {
    const { orgId, agentId, date: dateStr } = await params;
    await requireOrgAccess(orgId);
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const reportDate = new Date(dateStr);
    if (isNaN(reportDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const report = await prisma.dailyReport.findFirst({
      where: {
        agent_id: agentId,
        report_date: new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate()),
      },
    });
    if (!report) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(report);
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

/**
 * POST: generate (or regenerate) daily report for the given date.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string; date: string }> }
) {
  try {
    const { orgId, agentId, date: dateStr } = await params;
    await requireOrgAccess(orgId);
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, org_id: orgId },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const reportDate = new Date(dateStr);
    if (isNaN(reportDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const result = await createDailyReport(agentId, prisma, reportDate);
    if (!result) {
      return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
    const report = await prisma.dailyReport.findUnique({
      where: { id: result.id },
    });
    return NextResponse.json(report);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad request" },
      { status: 400 }
    );
  }
}
