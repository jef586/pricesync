-- UH-ART-7: Import Jobs & Supplier Presets

-- Enum for ImportJob status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportJobStatus') THEN
        CREATE TYPE "ImportJobStatus" AS ENUM ('pending','processing','completed','failed');
    END IF;
END$$;

-- Supplier Presets
CREATE TABLE IF NOT EXISTS "supplier_presets" (
    "id"            TEXT PRIMARY KEY,
    "name"          TEXT NOT NULL,
    "description"   TEXT,
    "is_active"     BOOLEAN NOT NULL DEFAULT TRUE,
    "supplier_id"   TEXT,
    "mapping"       JSONB NOT NULL DEFAULT '{}',
    "defaults"      JSONB NOT NULL DEFAULT '{}',
    "created_by"    TEXT NOT NULL,
    "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
    "company_id"    TEXT NOT NULL,
    CONSTRAINT "fk_supplier_presets_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL,
    CONSTRAINT "fk_supplier_presets_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_supplier_presets_company_supplier_name"
    ON "supplier_presets" ("company_id", "supplier_id", "name");

-- Import Jobs
CREATE TABLE IF NOT EXISTS "import_jobs" (
    "id"             TEXT PRIMARY KEY,
    "status"         "ImportJobStatus" NOT NULL DEFAULT 'pending',
    "file_name"      TEXT NOT NULL,
    "file_hash"      TEXT,
    "preset_id"      TEXT,
    "supplier_id"    TEXT,
    "company_id"     TEXT NOT NULL,
    "started_by"     TEXT NOT NULL,
    "is_dry_run"     BOOLEAN NOT NULL DEFAULT TRUE,
    "chunk_size"     INTEGER NOT NULL DEFAULT 500,

    "total_rows"     INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "created_count"  INTEGER NOT NULL DEFAULT 0,
    "updated_count"  INTEGER NOT NULL DEFAULT 0,
    "skipped_count"  INTEGER NOT NULL DEFAULT 0,
    "error_count"    INTEGER NOT NULL DEFAULT 0,
    "warning_count"  INTEGER NOT NULL DEFAULT 0,

    "preview_json"   JSONB,
    "log_csv_path"   TEXT,

    "started_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
    "finished_at"    TIMESTAMP,
    "created_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT "fk_import_jobs_preset"   FOREIGN KEY ("preset_id")   REFERENCES "supplier_presets"("id") ON DELETE SET NULL,
    CONSTRAINT "fk_import_jobs_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL,
    CONSTRAINT "fk_import_jobs_company"  FOREIGN KEY ("company_id")  REFERENCES "companies"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_import_jobs_company_status"
    ON "import_jobs" ("company_id", "status");