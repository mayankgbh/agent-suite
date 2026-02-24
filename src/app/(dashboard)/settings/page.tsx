import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth/clerk";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug } from "lucide-react";

export default async function SettingsPage() {
  let orgId: string;
  try {
    const { org } = await getOrCreateCurrentUser();
    orgId = org.id;
  } catch {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your workspace and connected tools.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Plug className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect CRM, calendar, billing, and spreadsheets so your agents can use them.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/settings/integrations">Manage integrations</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
