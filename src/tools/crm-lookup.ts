import type { Tool } from "./types";

interface CrmLookupInput {
  type: "contact" | "company" | "deal";
  query: string;
}

export const crmLookupTool: Tool<CrmLookupInput> = {
  name: "crm_lookup",
  description:
    "Look up a contact, company, or deal in the CRM. Use before outreach or to check pipeline. Requires HubSpot/Salesforce MCP or CRM_API_KEY.",
  inputSchema: {
    type: "object",
    properties: {
      type: { type: "string", description: "contact, company, or deal" },
      query: { type: "string", description: "Name, email, or domain to search" },
    },
    required: ["type", "query"],
  },
  async execute() {
    const hasCrm = Boolean(
      process.env.HUBSPOT_API_KEY || process.env.CRM_API_KEY
    );
    if (!hasCrm) {
      return {
        content:
          "CRM not connected. Add a HubSpot or Salesforce MCP server, or set HUBSPOT_API_KEY / CRM_API_KEY. Use web_search to find company info and memory_store to track leads.",
        error: true,
      };
    }
    return {
      content:
        "CRM integration requires MCP (HubSpot/Salesforce) or custom API. Use web_search and memory_store for now.",
      error: true,
    };
  },
};
