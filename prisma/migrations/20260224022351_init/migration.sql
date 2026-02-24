-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('pending', 'in_progress', 'complete');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('marketing', 'sales', 'engineering', 'finance');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('onboarding', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "OKRStatus" AS ENUM ('proposed', 'negotiating', 'accepted', 'in_progress', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "TimeHorizon" AS ENUM ('weekly', 'monthly', 'quarterly');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('planned', 'in_progress', 'blocked', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('agent', 'user', 'system');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('onboarding_question', 'okr_negotiation', 'status_update', 'daily_report', 'question', 'answer', 'deliverable');

-- CreateEnum
CREATE TYPE "ToolType" AS ENUM ('slack', 'github', 'google_workspace', 'hubspot', 'stripe', 'web_scraper', 'email_sender', 'seo_analyzer', 'content_generator', 'social_poster', 'analytics_reader', 'google_sheets', 'slack_notifier');

-- CreateEnum
CREATE TYPE "ToolIntegrationStatus" AS ENUM ('connected', 'disconnected', 'error');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "clerk_org_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website_url" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "icp_description" TEXT,
    "business_context" JSONB,
    "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "auth_provider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "agent_type" "AgentType" NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'onboarding',
    "personality_config" JSONB,
    "context_snapshot" JSONB,
    "system_prompt_override" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OKR" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "key_results" JSONB NOT NULL,
    "status" "OKRStatus" NOT NULL DEFAULT 'proposed',
    "agent_feedback" TEXT,
    "feasibility_score" DOUBLE PRECISION,
    "time_horizon" "TimeHorizon",
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OKR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "okr_id" TEXT,
    "parent_task_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'planned',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "output" JSONB,
    "tools_used" TEXT[],
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'question',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "report_date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "okr_progress" JSONB,
    "tasks_completed" TEXT[],
    "tasks_in_progress" TEXT[],
    "blockers" JSONB,
    "recommendations" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolIntegration" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "tool_type" "ToolType" NOT NULL,
    "credentials_encrypted" BYTEA,
    "config" JSONB,
    "status" "ToolIntegrationStatus" NOT NULL DEFAULT 'connected',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_clerk_org_id_key" ON "Organization"("clerk_org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "User_org_id_idx" ON "User"("org_id");

-- CreateIndex
CREATE INDEX "User_auth_provider_id_idx" ON "User"("auth_provider_id");

-- CreateIndex
CREATE INDEX "Agent_org_id_idx" ON "Agent"("org_id");

-- CreateIndex
CREATE INDEX "Agent_org_id_status_idx" ON "Agent"("org_id", "status");

-- CreateIndex
CREATE INDEX "OKR_agent_id_idx" ON "OKR"("agent_id");

-- CreateIndex
CREATE INDEX "OKR_org_id_idx" ON "OKR"("org_id");

-- CreateIndex
CREATE INDEX "Task_agent_id_idx" ON "Task"("agent_id");

-- CreateIndex
CREATE INDEX "Task_okr_id_idx" ON "Task"("okr_id");

-- CreateIndex
CREATE INDEX "Task_created_at_idx" ON "Task"("created_at");

-- CreateIndex
CREATE INDEX "AgentMessage_agent_id_idx" ON "AgentMessage"("agent_id");

-- CreateIndex
CREATE INDEX "AgentMessage_org_id_idx" ON "AgentMessage"("org_id");

-- CreateIndex
CREATE INDEX "AgentMessage_agent_id_created_at_idx" ON "AgentMessage"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "DailyReport_agent_id_idx" ON "DailyReport"("agent_id");

-- CreateIndex
CREATE INDEX "DailyReport_org_id_idx" ON "DailyReport"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_agent_id_report_date_key" ON "DailyReport"("agent_id", "report_date");

-- CreateIndex
CREATE INDEX "ToolIntegration_org_id_idx" ON "ToolIntegration"("org_id");

-- CreateIndex
CREATE INDEX "Event_org_id_idx" ON "Event"("org_id");

-- CreateIndex
CREATE INDEX "Event_agent_id_idx" ON "Event"("agent_id");

-- CreateIndex
CREATE INDEX "Event_created_at_idx" ON "Event"("created_at");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKR" ADD CONSTRAINT "OKR_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OKR" ADD CONSTRAINT "OKR_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_okr_id_fkey" FOREIGN KEY ("okr_id") REFERENCES "OKR"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolIntegration" ADD CONSTRAINT "ToolIntegration_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
