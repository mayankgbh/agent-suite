import type { AgentTypeDefinition } from "../types";

export const engineeringAgentDefinition: AgentTypeDefinition = {
  type: "engineering",
  displayName: "Engineering Agent",
  description:
    "Handles technical roadmap, API design, reliability, and shipping. Focuses on velocity and quality.",
  icon: "zap",
  onboardingQuestions: [
    {
      id: "stack",
      question: "What is your primary tech stack? (languages, frameworks, infra)",
      type: "text",
    },
    {
      id: "deploy_frequency",
      question: "How often do you deploy? (e.g. daily, weekly, on-release)",
      type: "text",
    },
    {
      id: "biggest_challenge",
      question: "What's your single biggest engineering challenge right now?",
      type: "text",
    },
    {
      id: "key_projects",
      question: "What are 1–2 key initiatives or projects for this quarter?",
      type: "text",
    },
    {
      id: "reliability_goals",
      question: "Any specific reliability or performance targets? (uptime, latency, etc.)",
      type: "text",
    },
  ],
  systemPromptTemplate: `You are the Engineering Agent for {{companyName}}. You are an expert engineering professional.

Company context:
{{companyContext}}

Onboarding answers (what the user has told you so far):
{{onboardingAnswers}}

Your current context snapshot (stored knowledge):
{{contextSnapshot}}

Your role: technical roadmap, API design, reliability, and shipping. You focus on velocity and quality. You ask clarifying questions during onboarding (one at a time), then execute on agreed OKRs. You push back on unrealistic scope or timelines and report progress clearly. You may use tools when needed: web_scraper to pull docs or specs, content_generator for RFCs or runbooks. Reply in a clear, technical tone.`,
  allowedTools: [
    "web_scraper",
    "web_search",
    "content_generator",
    "slack_notifier",
    "google_sheets",
    "analytics_reader",
    "memory_store",
    "memory_get",
    "read_file",
    "write_file",
    "metrics_record",
    "github_list_issues",
    "github_create_issue",
    "post_coordination_message",
  ],
  okrTemplates: [
    {
      objective: "Ship key product milestones",
      keyResults: [
        {
          description: "Ship {{n}} major features or releases by {{date}}",
          metric: "features_shipped",
          unit: "releases",
        },
        {
          description: "Reduce critical bugs to {{n}} or fewer open",
          metric: "critical_bugs_open",
          unit: "bugs",
        },
        {
          description: "Complete API or docs milestone: {{description}}",
          metric: "api_docs_milestone",
          unit: "milestone",
        },
      ],
    },
    {
      objective: "Improve reliability and performance",
      keyResults: [
        {
          description: "Achieve {{target}}% uptime (or P99 latency under {{n}}ms)",
          metric: "uptime_or_latency",
          unit: "% or ms",
        },
        {
          description: "Zero P0/P1 incidents for {{n}} days",
          metric: "incident_free_days",
          unit: "days",
        },
      ],
    },
  ],
  executionStrategies: [
    {
      name: "feature_ship",
      description: "Scope → Design → Implement → Review → Test → Deploy → Monitor",
      triggers: ["feature or release OKRs"],
      steps: [
        "scoping",
        "design",
        "implementation",
        "review",
        "testing",
        "deploy",
        "monitoring",
      ],
    },
    {
      name: "reliability",
      description: "Define SLOs → Instrument → Alert → On-call → Postmortem",
      triggers: ["reliability or incident OKRs"],
      steps: ["slo_definition", "instrumentation", "alerting", "oncall", "postmortem"],
    },
  ],
};
