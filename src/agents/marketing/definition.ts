import type { AgentTypeDefinition } from "../types";

export const marketingAgentDefinition: AgentTypeDefinition = {
  type: "marketing",
  displayName: "Marketing Agent",
  description:
    "Handles content strategy, SEO, email campaigns, social media, and growth experiments.",
  icon: "megaphone",
  onboardingQuestions: [
    {
      id: "current_channels",
      question: "What marketing channels are you currently active on?",
      type: "multi_select",
      options: ["SEO", "Paid Ads", "Email", "Social", "Content", "Events", "Partnerships"],
    },
    {
      id: "monthly_budget",
      question: "What's your approximate monthly marketing budget?",
      type: "text",
    },
    {
      id: "biggest_challenge",
      question: "What's your single biggest marketing challenge right now?",
      type: "text",
    },
    {
      id: "target_personas",
      question: "Describe your top 1-2 buyer personas.",
      type: "text",
    },
    {
      id: "current_metrics",
      question:
        "What are your current key metrics? (MQLs/month, website traffic, conversion rate, etc.)",
      type: "text",
    },
    {
      id: "competitors",
      question: "Who are your top 3 competitors?",
      type: "text",
    },
    {
      id: "brand_voice",
      question:
        "How would you describe your brand voice? (casual, professional, technical, etc.)",
      type: "text",
    },
  ],
  systemPromptTemplate: `You are the Marketing Agent for {{companyName}}. You are an expert marketing professional.

Company context:
{{companyContext}}

Onboarding answers (what the user has told you so far):
{{onboardingAnswers}}

Your current context snapshot (stored knowledge):
{{contextSnapshot}}

Your role: content strategy, SEO, email campaigns, social media, and growth experiments. You ask clarifying questions during onboarding (one at a time, from the list in your onboarding flow), then execute on agreed OKRs. You push back on unrealistic goals and report progress clearly. You may use tools when needed: content_generator for drafts/outlines, web_scraper to fetch URLs. Reply in a helpful, professional tone.`,
  allowedTools: [
    "web_scraper",
    "email_sender",
    "seo_analyzer",
    "content_generator",
    "social_poster",
    "analytics_reader",
    "google_sheets",
    "slack_notifier",
  ],
  okrTemplates: [
    {
      objective: "Increase organic website traffic",
      keyResults: [
        {
          description: "Publish {{n}} SEO-optimized blog posts per week",
          metric: "posts_published",
          unit: "posts/week",
        },
        {
          description: "Grow organic sessions to {{target}}",
          metric: "organic_sessions",
          unit: "sessions/month",
        },
        {
          description: "Improve average position for {{n}} target keywords",
          metric: "keyword_positions",
          unit: "keywords",
        },
      ],
    },
    {
      objective: "Generate qualified leads",
      keyResults: [
        {
          description: "Increase MQLs to {{target}} per month",
          metric: "mqls",
          unit: "MQLs/month",
        },
        {
          description: "Launch {{n}} email nurture sequences",
          metric: "sequences_launched",
          unit: "sequences",
        },
      ],
    },
  ],
  executionStrategies: [
    {
      name: "content_engine",
      description:
        "Research topics → Create content calendar → Write posts → Optimize for SEO → Schedule publication → Track performance",
      triggers: ["content-related OKRs"],
      steps: [
        "topic_research",
        "calendar_creation",
        "content_writing",
        "seo_optimization",
        "scheduling",
        "performance_tracking",
      ],
    },
    {
      name: "outbound_campaigns",
      description: "Build prospect lists → Write sequences → A/B test → Optimize → Report",
      triggers: ["lead-generation OKRs"],
      steps: ["list_building", "sequence_writing", "ab_testing", "optimization", "reporting"],
    },
  ],
};
