"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AgentDetailTabs({ agentId }: { agentId: string }) {
  const pathname = usePathname();
  const base = `/agents/${agentId}`;

  const tabs = [
    { href: `${base}/chat`, label: "Chat" },
    { href: `${base}/okrs`, label: "OKRs" },
    { href: `${base}/tasks`, label: "Tasks" },
    { href: `${base}/reports`, label: "Reports" },
    { href: `${base}/settings`, label: "Settings" },
  ];

  return (
    <nav className="mt-3 flex gap-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href !== `${base}/chat` && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
