import type { Tool } from "./types";

interface CrmLookupInput {
  type: "contact" | "company" | "deal";
  query: string;
  limit?: number;
}

async function hubspotSearch(
  objectType: "contacts" | "companies" | "deals",
  query: string,
  limit: number
): Promise<string> {
  const token = process.env.HUBSPOT_API_KEY || process.env.CRM_API_KEY;
  if (!token) {
    return "CRM not connected. Set HUBSPOT_API_KEY or CRM_API_KEY (HubSpot private app token).";
  }
  const url = `https://api.hubapi.com/crm/v3/objects/${objectType}/search`;
  const body = {
    query,
    limit,
    properties: ["firstname", "lastname", "email", "domain", "company", "dealname", "amount"],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    return `HubSpot search failed (${res.status}): ${text}`;
  }
  const data = (await res.json()) as {
    results?: Array<{ id: string; properties?: Record<string, string | null> }>;
  };
  const rows = data.results ?? [];
  if (!rows.length) return "No matching records found in CRM.";
  const lines = rows.map((r) => {
    const p = r.properties ?? {};
    if (objectType === "contacts") {
      const name = [p.firstname, p.lastname].filter(Boolean).join(" ");
      return `Contact ${name || "(no name)"} <${p.email ?? "no-email"}> (id=${r.id})`;
    }
    if (objectType === "companies") {
      const domain = p.domain ?? "";
      const name = p.name ?? domain ?? "(no name)";
      return `Company ${name} (domain=${domain}, id=${r.id})`;
    }
    const amount = p.amount ?? "";
    const name = p.dealname ?? "(no name)";
    return `Deal ${name} (amount=${amount}, id=${r.id})`;
  });
  return lines.join("\n");
}

export const crmLookupTool: Tool<CrmLookupInput> = {
  name: "crm_lookup",
  description:
    "Look up a contact, company, or deal in HubSpot CRM. Use before outreach or to check pipeline. Requires HUBSPOT_API_KEY / CRM_API_KEY (HubSpot private app token).",
  inputSchema: {
    type: "object",
    properties: {
      type: { type: "string", description: "contact, company, or deal" },
      query: { type: "string", description: "Name, email, or domain to search" },
      limit: { type: "number", description: "Max records to return (default 5)" },
    },
    required: ["type", "query"],
  },
  async execute(input) {
    try {
      const limit = Math.min(input.limit ?? 5, 20);
      if (input.type === "contact") {
        const content = await hubspotSearch("contacts", input.query, limit);
        return { content, error: content.startsWith("CRM not connected") };
      }
      if (input.type === "company") {
        const content = await hubspotSearch("companies", input.query, limit);
        return { content, error: content.startsWith("CRM not connected") };
      }
      if (input.type === "deal") {
        const content = await hubspotSearch("deals", input.query, limit);
        return { content, error: content.startsWith("CRM not connected") };
      }
      return {
        content: "Unsupported type. Use contact, company, or deal.",
        error: true,
      };
    } catch (e) {
      return {
        content: `CRM lookup error: ${e instanceof Error ? e.message : "Unknown error"}`,
        error: true,
      };
    }
  },
};
