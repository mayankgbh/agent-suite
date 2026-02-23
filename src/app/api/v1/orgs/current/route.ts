import { NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";

export async function GET() {
  try {
    const { user, org } = await getOrCreateCurrentUser();
    return NextResponse.json({
      orgId: org.id,
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        onboarding_status: org.onboarding_status,
      },
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
