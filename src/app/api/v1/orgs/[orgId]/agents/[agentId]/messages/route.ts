import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";

const PAGE_SIZE = 50;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; agentId: string }> }
) {
  try {
    const { orgId, agentId } = await params;
    const { org } = await getOrCreateCurrentUser();
    if (org.id !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const messages = await prisma.agentMessage.findMany({
      where: { agent_id: agentId, org_id: orgId },
      orderBy: { created_at: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        role: true,
        content: true,
        message_type: true,
        created_at: true,
      },
    });
    const nextCursor = messages.length > PAGE_SIZE ? messages[PAGE_SIZE - 1]?.id : null;
    const list = messages.slice(0, PAGE_SIZE).reverse();
    return NextResponse.json({
      messages: list,
      nextCursor: nextCursor ?? undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
