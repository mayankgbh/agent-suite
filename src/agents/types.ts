export type AgentType = "marketing" | "sales" | "engineering" | "finance";

export type OnboardingQuestionType = "text" | "multi_select" | "single_select";

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: OnboardingQuestionType;
  options?: string[];
}

export interface KeyResultTemplate {
  description: string;
  metric: string;
  unit: string;
}

export interface OKRTemplate {
  objective: string;
  keyResults: KeyResultTemplate[];
}

export interface ExecutionStrategy {
  name: string;
  description: string;
  triggers: string[];
  steps: string[];
}

export type ToolType =
  | "web_scraper"
  | "web_search"
  | "email_sender"
  | "seo_analyzer"
  | "content_generator"
  | "social_poster"
  | "analytics_reader"
  | "google_sheets"
  | "slack_notifier"
  | "memory_store"
  | "memory_get"
  | "read_file"
  | "write_file"
  | "metrics_record"
  | "github_list_issues"
  | "github_create_issue"
  | "currency_convert"
  | "calendar"
  | "crm_lookup"
  | "post_coordination_message";

export interface AgentTypeDefinition {
  type: AgentType;
  displayName: string;
  description: string;
  icon: string;
  onboardingQuestions: OnboardingQuestion[];
  systemPromptTemplate: string;
  allowedTools: ToolType[];
  okrTemplates: OKRTemplate[];
  executionStrategies: ExecutionStrategy[];
}
