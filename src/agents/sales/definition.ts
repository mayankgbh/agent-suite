import type { AgentTypeDefinition } from "../types";

export const salesAgentDefinition: AgentTypeDefinition = {
  type: "sales",
  displayName: "Sales Agent",
  description:
    "Handles outbound pipeline, demos, follow-ups, and closing. Focuses on qualified demos and pipeline velocity.",
  icon: "target",
  onboardingQuestions: [
    {
      id: "sales_motion",
      question: "What is your primary sales motion?",
      type: "single_select",
      options: ["Inbound only", "Outbound only", "Hybrid", "Product-led"],
    },
    {
      id: "deal_stages",
      question: "What are your main pipeline stages? (e.g. Lead → Qualified → Demo → Proposal → Closed)",
      type: "text",
    },
    {
      id: "avg_deal_size",
      question: "What is your average deal size (ACV or one-time)?",
      type: "text",
    },
    {
      id: "sales_tools",
      question: "What tools do you use? (CRM, email, calendar, etc.)",
      type: "text",
    },
    {
      id: "biggest_challenge",
      question: "What's your single biggest sales challenge right now?",
      type: "text",
    },
    {
      id: "demo_target",
      question: "How many qualified demos do you aim to book per week/month?",
      type: "text",
    },
  ],
  systemPromptTemplate: `You are the Sales Agent for {{companyName}}. You are an expert sales professional.

Company context:
{{companyContext}}

Onboarding answers (what the user has told you so far):
{{onboardingAnswers}}

Your current context snapshot (stored knowledge):
{{contextSnapshot}}

Your role: outbound pipeline, demos, follow-ups, and closing. You focus on qualified demos and pipeline velocity. You ask clarifying questions during onboarding (one at a time), then execute on agreed OKRs. You push back on unrealistic goals and report progress clearly. You may use tools when needed: web_scraper to research prospects, content_generator for outreach drafts. Reply in a direct, results-oriented tone.`,
  allowedTools: [
    "web_scraper",
    "web_search",
    "content_generator",
    "email_sender",
    "slack_notifier",
    "google_sheets",
    "analytics_reader",
    "memory_store",
    "memory_get",
    "read_file",
    "write_file",
    "metrics_record",
    "calendar",
    "crm_lookup",
    "post_coordination_message",
  ],
  okrTemplates: [
    {
      objective: "Book more qualified demos",
      keyResults: [
        {
          description: "Book {{n}} qualified demos per week",
          metric: "demos_booked",
          unit: "demos/week",
        },
        {
          description: "Maintain pipeline value of ${{target}}",
          metric: "pipeline_value",
          unit: "USD",
        },
        {
          description: "Follow up with {{n}} warm leads per week",
          metric: "follow_ups",
          unit: "leads/week",
        },
      ],
    },
    {
      objective: "Improve conversion through pipeline",
      keyResults: [
        {
          description: "Increase demo-to-opportunity conversion to {{target}}%",
          metric: "demo_to_opp",
          unit: "%",
        },
        {
          description: "Reduce average sales cycle to {{n}} days",
          metric: "sales_cycle_days",
          unit: "days",
        },
      ],
    },
  ],
  executionStrategies: [
    {
      name: "outbound_cadence",
      description: "Research prospects → Personalize outreach → Send sequence → Book demos → Follow up",
      triggers: ["outbound or demo-related OKRs"],
      steps: [
        "prospect_research",
        "outreach_drafts",
        "sequence_sending",
        "demo_booking",
        "follow_up",
      ],
    },
    {
      name: "pipeline_management",
      description: "Review pipeline → Identify at-risk deals → Recommend next steps → Report",
      triggers: ["pipeline or conversion OKRs"],
      steps: ["pipeline_review", "at_risk_identification", "next_steps", "reporting"],
    },
  ],
};
