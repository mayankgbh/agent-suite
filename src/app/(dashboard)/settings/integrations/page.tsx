import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { IntegrationsFormStandalone } from "./IntegrationsFormStandalone";

export default async function SettingsIntegrationsPage() {
  let orgId: string;
  try {
    const { org } = await getOrCreateCurrentUser();
    orgId = org.id;
  } catch {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 md:p-8 max-w-md">
      <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
        ← Settings
      </Link>
      <h1 className="mt-4 text-xl font-semibold">Integrations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect the tools your agents use. You can change these anytime.
      </p>
      <div className="mt-6">
        <IntegrationsFormStandalone orgId={orgId} />
      </div>
    </div>
  );
}
