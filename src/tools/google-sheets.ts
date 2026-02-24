import type { Tool } from "./types";

interface GoogleSheetsInput {
  action: string;
  spreadsheet_id?: string;
  range?: string;
  values?: unknown[][];
}

export const googleSheetsTool: Tool<GoogleSheetsInput> = {
  name: "google_sheets",
  description:
    "Read or write Google Sheets (e.g. for reports, pipelines). Use for structured data. Requires a Google Sheets MCP server or write_file to export CSV.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", description: "read or write" },
      spreadsheet_id: { type: "string", description: "Sheet ID from URL" },
      range: { type: "string", description: "A1 notation, e.g. Sheet1!A1:D10" },
      values: { type: "object", description: "For write: 2D array of values" },
    },
    required: ["action"],
  },
  async execute() {
    return {
      content:
        "Google Sheets: connect a Google Sheets MCP server (see MCP_SERVERS) for read/write. To export data, use write_file with a CSV path (e.g. reports/pipeline.csv) and comma-separated rows.",
      error: true,
    };
  },
};
