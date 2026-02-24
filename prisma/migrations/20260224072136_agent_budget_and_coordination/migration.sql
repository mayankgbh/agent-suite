-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "monthly_budget_cents" INTEGER,
ADD COLUMN     "token_usage_current_month" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "token_usage_reset_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CoordinationMessage" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "from_agent_id" TEXT NOT NULL,
    "to_agent_ids" TEXT,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoordinationMessage_org_id_idx" ON "CoordinationMessage"("org_id");

-- CreateIndex
CREATE INDEX "CoordinationMessage_from_agent_id_idx" ON "CoordinationMessage"("from_agent_id");

-- CreateIndex
CREATE INDEX "CoordinationMessage_created_at_idx" ON "CoordinationMessage"("created_at");

-- AddForeignKey
ALTER TABLE "CoordinationMessage" ADD CONSTRAINT "CoordinationMessage_from_agent_id_fkey" FOREIGN KEY ("from_agent_id") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinationMessage" ADD CONSTRAINT "CoordinationMessage_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
