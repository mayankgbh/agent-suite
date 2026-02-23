import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/client";
import { UserRole } from "@prisma/client";

export { auth };

export type AuthUser = {
  id: string;
  orgId: string;
  email: string;
  name: string | null;
  role: UserRole;
};

/**
 * Get current Clerk auth. Use in server components and API routes.
 */
export async function getAuth() {
  return auth();
}

/**
 * Get Clerk org id from session (if user is in an org).
 */
export async function getOrgIdFromSession(): Promise<string | null> {
  const { orgId } = await auth();
  return orgId ?? null;
}

/**
 * Require org id for the request. Throws if not signed in or no org selected.
 * Use in API routes and server actions that need org scope.
 */
export async function requireOrgId(): Promise<string> {
  const { userId, orgId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (!orgId) {
    throw new Error("No organization selected. Please create or select an organization.");
  }
  return orgId;
}

/**
 * Sync Clerk user and org to our DB. Call after auth when you need the DB user/org.
 * - Finds or creates Organization by Clerk org id (clerk_org_id).
 * - Finds or creates User by Clerk user id (auth_provider_id), linked to org.
 * Returns our DB user and org; throws if not signed in or no Clerk org.
 */
export async function getOrCreateCurrentUser(): Promise<{
  user: { id: string; org_id: string; email: string; name: string | null; role: UserRole };
  org: { id: string; name: string; slug: string; clerk_org_id: string | null; onboarding_status: string };
}> {
  const { userId, orgId, orgSlug } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (!orgId) {
    throw new Error("No organization selected. Please create or select an organization in Clerk.");
  }

  const clerkUser = await currentUser();
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  const name = clerkUser?.firstName || clerkUser?.lastName
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ")
    : clerkUser?.fullName ?? null;

  // Find or create our Organization by Clerk org id
  let org = await prisma.organization.findUnique({
    where: { clerk_org_id: orgId },
  });
  if (!org) {
    const slug = (orgSlug ?? orgId.replace("org_", "")).slice(0, 63);
    org = await prisma.organization.create({
      data: {
        clerk_org_id: orgId,
        name: "My Organization",
        slug,
        onboarding_status: "pending",
      },
    });
  }

  // Find or create User by Clerk user id (per org: one user row per org membership)
  let user = await prisma.user.findFirst({
    where: { auth_provider_id: userId, org_id: org.id },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        org_id: org.id,
        auth_provider_id: userId,
        email: primaryEmail ?? `user-${userId}@placeholder.local`,
        name,
        role: "owner",
      },
    });
  } else if (primaryEmail || name !== undefined) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(primaryEmail && { email: primaryEmail }),
        ...(name !== undefined && { name }),
      },
    });
  }

  return {
    user: {
      id: user.id,
      org_id: user.org_id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      clerk_org_id: org.clerk_org_id,
      onboarding_status: org.onboarding_status,
    },
  };
}

/**
 * Get our DB org id from Clerk org id. Use when you already have Clerk auth and need our org id for queries.
 */
export async function getDbOrgIdFromClerk(clerkOrgId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({
    where: { clerk_org_id: clerkOrgId },
    select: { id: true },
  });
  return org?.id ?? null;
}

/**
 * Require auth and return our DB org id. Use in API routes that must be org-scoped.
 * Calls getOrCreateCurrentUser() so org and user exist in DB, then returns org.id.
 */
export async function requireDbOrgId(): Promise<string> {
  const { org } = await getOrCreateCurrentUser();
  return org.id;
}
