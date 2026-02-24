import { redirect } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/client";
import { OnboardingGuard } from "@/components/auth/OnboardingGuard";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let org;
  let userDisplayName = "User";
  try {
    const data = await getOrCreateCurrentUser();
    org = data.org;
    userDisplayName = data.user.name ?? data.user.email ?? "User";
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("No organization selected")) {
      redirect("/create-organization");
    }
    if (message.includes("Unauthorized")) {
      redirect("/sign-in");
    }
    redirect("/error?reason=setup");
  }

  const onboardingComplete = org.onboarding_status === "complete";

  const agents = await prisma.agent.findMany({
    where: { org_id: org.id },
    orderBy: { created_at: "asc" },
    select: { id: true, display_name: true, agent_type: true, status: true },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        agents={agents}
        userDisplayName={userDisplayName}
      />
      <main className="flex-1 overflow-y-auto">
        <OnboardingGuard onboardingComplete={onboardingComplete}>
          {children}
        </OnboardingGuard>
      </main>
    </div>
  );
}
