import type { Tool } from "./types";

interface CurrencyConvertInput {
  from: string;
  to: string;
  amount: number;
}

export const currencyConvertTool: Tool<CurrencyConvertInput> = {
  name: "currency_convert",
  description:
    "Convert an amount from one currency to another (e.g. USD to EUR). Use for deal sizing or reporting. Requires EXCHANGE_RATE_API_KEY or uses free tier.",
  inputSchema: {
    type: "object",
    properties: {
      from: { type: "string", description: "Source currency code (e.g. USD)" },
      to: { type: "string", description: "Target currency code (e.g. EUR)" },
      amount: { type: "number", description: "Amount to convert" },
    },
    required: ["from", "to", "amount"],
  },
  async execute(input) {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      return {
        content: `Set EXCHANGE_RATE_API_KEY (exchangerate-api.com free tier) for live conversion. Approximate: 1 ${input.from} ≈ 0.9–1.1 ${input.to} (check xe.com for exact).`,
        error: true,
      };
    }
    try {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${input.from.toUpperCase()}/${input.to.toUpperCase()}/${input.amount}`
      );
      if (!res.ok) {
        const t = await res.text();
        return { content: `API error: ${res.status}. ${t}`, error: true };
      }
      const data = (await res.json()) as {
        result?: number;
        conversion_result?: number;
      };
      const result = data.conversion_result ?? data.result ?? 0;
      return {
        content: `${input.amount} ${input.from} = ${result.toFixed(2)} ${input.to}`,
      };
    } catch (e) {
      return {
        content: `Error: ${e instanceof Error ? e.message : "Conversion failed"}.`,
        error: true,
      };
    }
  },
};
