-- CreateTable
CREATE TABLE "OrgIntegration" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgIntegration_org_id_idx" ON "OrgIntegration"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "OrgIntegration_org_id_kind_key" ON "OrgIntegration"("org_id", "kind");

-- AddForeignKey
ALTER TABLE "OrgIntegration" ADD CONSTRAINT "OrgIntegration_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
