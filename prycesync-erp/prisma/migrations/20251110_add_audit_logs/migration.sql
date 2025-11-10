-- Create audit_logs table to align with Prisma model
BEGIN;

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "targetId" TEXT,
  "targetName" TEXT,
  "actionType" TEXT NOT NULL,
  "payloadDiff" JSONB,
  "companyId" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_audit_company_created"
  ON "audit_logs" ("companyId", "created_at");

CREATE INDEX IF NOT EXISTS "idx_audit_target_created"
  ON "audit_logs" ("targetId", "created_at");

COMMIT;