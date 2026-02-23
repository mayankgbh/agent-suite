"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function OnboardingGuard({
  children,
  onboardingComplete,
}: {
  children: React.ReactNode;
  onboardingComplete: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (onboardingComplete) return;
    if (pathname?.startsWith("/onboarding")) return;
    window.location.href = "/onboarding";
  }, [onboardingComplete, pathname]);

  return <>{children}</>;
}
