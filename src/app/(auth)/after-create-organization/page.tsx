"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * After Clerk CreateOrganization, the session may not have orgId set immediately.
 * This page gives the session a moment to update, then redirects to onboarding.
 */
export default function AfterCreateOrganizationPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/onboarding");
    }, 800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Taking you to onboarding…</p>
    </div>
  );
}
