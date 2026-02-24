import type { Tool } from "./types";

interface GoogleSheetsInput {
  action: "read" | "write";
  spreadsheet_id: string;
  range: string;
  values?: unknown[][];
}

async function getSheetsClient() {
  const json = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error(
      "GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON is not set. Provide a Google service account JSON (with Sheets scope)."
    );
  }
  const { google } = await import("googleapis");
  const credentials = JSON.parse(json) as {
    client_email: string;
    private_key: string;
  };
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

export const googleSheetsTool: Tool<GoogleSheetsInput> = {
  name: "google_sheets",
  description:
    "Read or write Google Sheets using a service account. Use for structured data (reports, pipelines, models).",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", description: "read or write" },
      spreadsheet_id: { type: "string", description: "Sheet ID from the Sheet URL" },
      range: { type: "string", description: "A1 notation, e.g. Sheet1!A1:D10" },
      values: {
        type: "array",
        description: "For write: 2D array of values (rows), e.g. [[\"Name\",\"MRR\"],[\"Acme\",1000]]",
      },
    },
    required: ["action", "spreadsheet_id", "range"],
  },
  async execute(input) {
    try {
      const sheets = await getSheetsClient();
      if (input.action === "read") {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: input.spreadsheet_id,
          range: input.range,
        });
        const values = (res.data.values ?? []) as unknown[][];
        if (!values.length) {
          return { content: "No data found in that range." };
        }
        const lines = values.map((row) => row.map((v) => String(v ?? "")).join(" | "));
        return { content: lines.join("\n") };
      }
      if (input.action === "write") {
        if (!Array.isArray(input.values)) {
          return {
            content:
              "For write, provide `values` as a 2D array, e.g. [[\"Name\",\"MRR\"],[\"Acme\",1000]].",
            error: true,
          };
        }
        await sheets.spreadsheets.values.update({
          spreadsheetId: input.spreadsheet_id,
          range: input.range,
          valueInputOption: "RAW",
          requestBody: { values: input.values },
        });
        return { content: "Wrote values to Google Sheets." };
      }
      return {
        content: "Unsupported action. Use action = read or write.",
        error: true,
      };
    } catch (e) {
      return {
        content: `Google Sheets error: ${e instanceof Error ? e.message : "Unknown error"}`,
        error: true,
      };
    }
  },
};
