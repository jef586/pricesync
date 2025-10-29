-- UH-ART-20 | Estimador de Días de Stock (DoS) + Reposición
-- Prisma migration: create demand cache and settings tables

-- Enum for settings scope
DO $$ BEGIN
  CREATE TYPE "StockEstimatorScope" AS ENUM ('GLOBAL', 'SUPPLIER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Cache table for article demand stats
CREATE TABLE IF NOT EXISTS "article_demand_stats" (
  "article_id" TEXT PRIMARY KEY REFERENCES "articles"("id") ON DELETE CASCADE,
  "avg7" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "avg30" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "avg90" DECIMAL(12,4) NOT NULL DEFAULT 0,
  "last_sale_at" TIMESTAMP NULL,
  "volatility_index" DECIMAL(8,4) NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Settings table (per company, with scope and optional scope_id)
CREATE TABLE IF NOT EXISTS "stock_estimator_settings" (
  "id" TEXT PRIMARY KEY,
  "company_id" TEXT NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "scope" "StockEstimatorScope" NOT NULL,
  "scope_id" TEXT NULL,
  "lead_time_days" INTEGER NOT NULL DEFAULT 5,
  "safety_stock_days" INTEGER NOT NULL DEFAULT 3,
  "coverage_days" INTEGER NOT NULL DEFAULT 14,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Unique scope per company
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_stock_estimator_settings_scope"
  ON "stock_estimator_settings" ("company_id", "scope", "scope_id");