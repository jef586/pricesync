-- Create schema core_reports if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'core_reports'
  ) THEN
    CREATE SCHEMA "core_reports";
  END IF;
END $$;

-- Create table core_reports.print_logs if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'core_reports'
      AND table_name = 'print_logs'
  ) THEN
    CREATE TABLE "core_reports"."print_logs" (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id    TEXT NOT NULL,
      printer_name  TEXT,
      status        TEXT NOT NULL,
      message       TEXT,
      printed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_print_logs_invoice ON "core_reports"."print_logs" (invoice_id);
    CREATE INDEX IF NOT EXISTS idx_print_logs_status  ON "core_reports"."print_logs" (status);
  END IF;
END $$;