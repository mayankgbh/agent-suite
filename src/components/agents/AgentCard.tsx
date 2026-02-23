import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AgentStatus = "onboarding" | "active" | "paused" | "archived";
type AgentType = "marketing" | "sales" | "engineering" | "finance";

export function AgentCard({
  id,
  displayName,
  agentType,
  status,
}: {
  id: string;
  displayName: string;
  agentType: AgentType;
  status: AgentStatus;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium capitalize">{agentType}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : status === "onboarding"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-lg font-semibold">{displayName}</p>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/agents/${id}`}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
