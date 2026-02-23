import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { updateOrgBodySchema } from "@/lib/org/validate";
import { scrapeWebsite } from "@/lib/scraper/simple";

async function requireOrgAccess(orgId: string) {
  const { org } = await getOrCreateCurrentUser();
  if (org.id !== orgId) {
    throw new Error("Forbidden");
  }
  return org.id;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        website_url: true,
        industry: true,
        company_size: true,
        icp_description: true,
        business_context: true,
        onboarding_status: true,
      },
    });
    return NextResponse.json(org);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Not found" },
      { status: e instanceof Error && e.message === "Unauthorized" ? 401 : 404 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrgAccess(orgId);
    const raw = await req.json();
    const body = updateOrgBodySchema.parse(raw);

    const data: Parameters<typeof prisma.organization.update>[0]["data"] = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.website_url !== undefined) data.website_url = body.website_url;
    if (body.industry !== undefined) data.industry = body.industry;
    if (body.company_size !== undefined) data.company_size = body.company_size;
    if (body.icp_description !== undefined) data.icp_description = body.icp_description;
    if (body.business_context !== undefined) data.business_context = body.business_context as object;
    if (body.onboarding_status !== undefined) data.onboarding_status = body.onboarding_status;

    if (body.website_url && typeof body.website_url === "string") {
      data.onboarding_status = "in_progress";
      try {
        const { content, title } = await scrapeWebsite(body.website_url);
        data.business_context = {
          ...((data.business_context as object) ?? {}),
          scraped_at: new Date().toISOString(),
          scraped_title: title,
          scraped_content: content.slice(0, 30000),
        };
      } catch {
        data.business_context = {
          ...((data.business_context as object) ?? {}),
          scraped_at: null,
          scrape_error: "Failed to fetch URL",
        };
      }
    }

    const org = await prisma.organization.update({
      where: { id: orgId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        website_url: true,
        industry: true,
        company_size: true,
        icp_description: true,
        business_context: true,
        onboarding_status: true,
      },
    });
    return NextResponse.json(org);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const zodError = e && typeof e === "object" && "flatten" in e;
    return NextResponse.json(
      { error: zodError ? "Validation failed" : (e instanceof Error ? e.message : "Bad request") },
      { status: 400 }
    );
  }
}
