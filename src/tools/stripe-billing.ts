import type { Tool } from "./types";
import Stripe from "stripe";

interface StripeBillingInput {
  action: "summary" | "list_subscriptions";
  limit?: number;
}

export const stripeBillingTool: Tool<StripeBillingInput> = {
  name: "stripe_billing",
  description:
    "Read high-level billing metrics from Stripe. Use to answer questions about MRR, active subscriptions, and recent revenue. Requires STRIPE_SECRET_KEY.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "summary or list_subscriptions",
      },
      limit: {
        type: "number",
        description: "For list_subscriptions: max number of subscriptions (default 20, max 100)",
      },
    },
    required: ["action"],
  },
  async execute(input, context) {
    const { getToolCredential } = await import("@/lib/integrations");
    const key =
      (await getToolCredential(context.orgId, "billing", "STRIPE_SECRET_KEY")) ||
      process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return {
        content:
          "Billing not connected. Connect Stripe in Settings → Integrations or set STRIPE_SECRET_KEY.",
        error: true,
      };
    }
    try {
      const stripe = new Stripe(key, {
        apiVersion: "2026-01-28.clover",
      });
      if (input.action === "list_subscriptions") {
        const limit = Math.min(input.limit ?? 20, 100);
        const subs = await stripe.subscriptions.list({
          status: "all",
          limit,
        });
        if (!subs.data.length) {
          return { content: "No subscriptions found in Stripe." };
        }
        const lines = subs.data.map((s) => {
          const status = s.status;
          const amount =
            s.items.data[0]?.price?.unit_amount != null
              ? (s.items.data[0].price.unit_amount / 100).toFixed(2)
              : "0.00";
          const currency = s.items.data[0]?.price?.currency?.toUpperCase() ?? "";
          return `sub_${s.id} — ${status} — ${amount} ${currency}`;
        });
        return { content: lines.join("\n") };
      }
      if (input.action === "summary") {
        const subs = await stripe.subscriptions.list({
          status: "active",
          limit: 100,
        });
        let mrrCents = 0;
        for (const s of subs.data) {
          for (const item of s.items.data) {
            const price = item.price;
            if (!price.recurring || price.unit_amount == null) continue;
            const interval = price.recurring.interval;
            const amount = price.unit_amount * (item.quantity ?? 1);
            if (interval === "month") {
              mrrCents += amount;
            } else if (interval === "year") {
              mrrCents += amount / 12;
            }
          }
        }
        const activeCount = subs.data.length;
        const mrr = (mrrCents / 100).toFixed(2);
        return {
          content: `Approximate MRR from active subscriptions: $${mrr} (USD-equivalent, first 100 subs). Active subscriptions: ${activeCount}.`,
        };
      }
      return {
        content: "Unsupported action. Use action = summary or list_subscriptions.",
        error: true,
      };
    } catch (e) {
      return {
        content: `Stripe billing error: ${e instanceof Error ? e.message : "Unknown error"}`,
        error: true,
      };
    }
  },
};

