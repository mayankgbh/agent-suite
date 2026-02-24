import type { AgentTypeDefinition } from "../types";

export const financeAgentDefinition: AgentTypeDefinition = {
  type: "finance",
  displayName: "Finance Agent",
  description:
    "Handles MRR, burn, runway, and investor reporting. Focuses on metrics and data room readiness.",
  icon: "bar_chart",
  onboardingQuestions: [
    {
      id: "stage",
      question: "What stage is the company? (pre-seed, seed, Series A, etc.)",
      type: "text",
    },
    {
      id: "revenue_model",
      question: "What is your primary revenue model? (subscription, usage, one-time, etc.)",
      type: "text",
    },
    {
      id: "key_metrics",
      question: "What are your top 3 financial metrics you track? (MRR, burn, runway, etc.)",
      type: "text",
    },
    {
      id: "biggest_challenge",
      question: "What's your single biggest finance or ops challenge right now?",
      type: "text",
    },
    {
      id: "reporting_audience",
      question: "Who do you report to? (board, investors, internal only)",
      type: "text",
    },
  ],
  systemPromptTemplate: `You are the Finance Agent for {{companyName}}. You are an expert finance and ops professional.

Company context:
{{companyContext}}

Onboarding answers (what the user has told you so far):
{{onboardingAnswers}}

Your current context snapshot (stored knowledge):
{{contextSnapshot}}

Your role: MRR, burn, runway, and investor reporting. You focus on metrics and data room readiness. You ask clarifying questions during onboarding (one at a time), then execute on agreed OKRs. You push back on unrealistic targets and report progress clearly. You may use tools when needed: web_scraper for market data, content_generator for report drafts, google_sheets for data. Reply in a precise, data-driven tone.`,
  allowedTools: [
    "web_scraper",
    "web_search",
    "content_generator",
    "google_sheets",
    "analytics_reader",
    "slack_notifier",
    "memory_store",
    "memory_get",
    "read_file",
    "write_file",
    "metrics_record",
    "currency_convert",
    "post_coordination_message",
  ],
  okrTemplates: [
    {
      objective: "Improve unit economics and visibility",
      keyResults: [
        {
          description: "Grow MRR to ${{target}} (or {{target}}% MoM growth)",
          metric: "mrr",
          unit: "USD or %",
        },
        {
          description: "Maintain runway above {{n}} months",
          metric: "runway_months",
          unit: "months",
        },
        {
          description: "Reduce burn to ${{target}}/month (or keep stable)",
          metric: "burn_rate",
          unit: "USD/month",
        },
      ],
    },
    {
      objective: "Investor and board readiness",
      keyResults: [
        {
          description: "Complete data room (or key sections) by {{date}}",
          metric: "data_room_complete",
          unit: "sections or %",
        },
        {
          description: "Deliver {{n}} board or investor updates on time",
          metric: "updates_delivered",
          unit: "updates",
        },
      ],
    },
  ],
  executionStrategies: [
    {
      name: "metrics_reporting",
      description: "Gather data → Validate → Summarize → Report → Recommend",
      triggers: ["MRR, burn, or reporting OKRs"],
      steps: ["data_gathering", "validation", "summarization", "reporting", "recommendations"],
    },
    {
      name: "data_room",
      description: "Outline sections → Collect materials → Draft narratives → Review",
      triggers: ["fundraising or data room OKRs"],
      steps: ["outline", "collection", "drafting", "review"],
    },
  ],
};
