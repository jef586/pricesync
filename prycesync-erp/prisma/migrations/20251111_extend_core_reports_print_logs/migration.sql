-- Extend core_reports.print_logs with company/user/branch/attempts and status check
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'core_reports' AND table_name = 'print_logs'
  ) THEN
    -- Add missing columns if they don't exist
    ALTER TABLE "core_reports"."print_logs"
      ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS user_id   TEXT,
      ADD COLUMN IF NOT EXISTS company_id TEXT,
      ADD COLUMN IF NOT EXISTS branch_id  TEXT;

    -- Normalize existing status values to lowercase
    UPDATE "core_reports"."print_logs"
      SET status = LOWER(status)
      WHERE status IS NOT NULL;

    -- Add status CHECK constraint (success|error|pending)
    DO $$ BEGIN
      ALTER TABLE "core_reports"."print_logs"
        ADD CONSTRAINT print_logs_status_check
        CHECK (status IN ('success','error','pending'));
    EXCEPTION WHEN duplicate_object THEN
      -- Constraint already exists, ignore
    END $$;

    -- Create suggested indexes
    CREATE INDEX IF NOT EXISTS idx_print_logs_company_printed_at
      ON "core_reports"."print_logs" (company_id, printed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_print_logs_status_printed_at
      ON "core_reports"."print_logs" (status, printed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_print_logs_invoice
      ON "core_reports"."print_logs" (invoice_id);
  END IF;
END $$;

-- Note: id default stays gen_random_uuid() at DB level; Prisma uses cuid() client-side.