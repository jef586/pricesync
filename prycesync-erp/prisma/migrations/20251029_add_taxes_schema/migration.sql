-- Prisma SQL migration for Taxes schema (retenciones/percepciones)
-- Safe guards to avoid failures on repeated runs

DO $$
BEGIN
  -- Create enums if not exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaxType') THEN
    CREATE TYPE "TaxType" AS ENUM ('IIBB_RET','IIBB_PERC','GAN_RET','VAT_PERC');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CounterpartyRole') THEN
    CREATE TYPE "CounterpartyRole" AS ENUM ('SUPPLIER','CUSTOMER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BaseMethod') THEN
    CREATE TYPE "BaseMethod" AS ENUM ('NET','NET_PLUS_II');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoundingMethod') THEN
    CREATE TYPE "RoundingMethod" AS ENUM ('HALF_UP','DOWN','UP');
  END IF;
END$$;

-- Create tax_rules table
CREATE TABLE IF NOT EXISTS "tax_rules" (
  "id"            TEXT PRIMARY KEY,
  "company_id"    TEXT NOT NULL,
  "province_code" TEXT NOT NULL,
  "tax_type"      "TaxType" NOT NULL,
  "activity_code" TEXT,
  "counterparty_role" "CounterpartyRole" NOT NULL,
  "rate"          NUMERIC(6,4) NOT NULL,
  "base_method"   "BaseMethod" NOT NULL,
  "min_amount"    NUMERIC(12,2),
  "rounding"      "RoundingMethod" NOT NULL DEFAULT 'HALF_UP',
  "valid_from"    TIMESTAMP NOT NULL,
  "valid_to"      TIMESTAMP,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_tax_rules_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
);

-- Index for tax rules
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tax_rules_company_province_type'
  ) THEN
    CREATE INDEX "idx_tax_rules_company_province_type" ON "tax_rules"("company_id","province_code","tax_type");
  END IF;
END $$;

-- Create tax_period_totals table
CREATE TABLE IF NOT EXISTS "tax_period_totals" (
  "id"            TEXT PRIMARY KEY,
  "company_id"    TEXT NOT NULL,
  "period"        TEXT NOT NULL,
  "province_code" TEXT NOT NULL,
  "tax_type"      "TaxType" NOT NULL,
  "amount_total"  NUMERIC(14,2) NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_tax_period_totals_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT
);

-- Unique constraint for period totals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_tax_period_totals'
  ) THEN
    CREATE UNIQUE INDEX "uniq_tax_period_totals" ON "tax_period_totals"("company_id","period","province_code","tax_type");
  END IF;
END $$;

-- Create document_tax_lines table
CREATE TABLE IF NOT EXISTS "document_tax_lines" (
  "id"              TEXT PRIMARY KEY,
  "company_id"      TEXT NOT NULL,
  "invoice_id"      TEXT,
  "sales_order_id"  TEXT,
  "item_id"         TEXT,
  "tax_type"        "TaxType" NOT NULL,
  "province_code"   TEXT NOT NULL,
  "activity_code"   TEXT,
  "counterparty_role" "CounterpartyRole" NOT NULL,
  "rate"            NUMERIC(6,4) NOT NULL,
  "base_amount"     NUMERIC(12,2) NOT NULL,
  "amount"          NUMERIC(12,2) NOT NULL,
  "rounding"        "RoundingMethod" NOT NULL DEFAULT 'HALF_UP',
  "rule_id"         TEXT,
  "created_at"      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_doc_tax_lines_company"     FOREIGN KEY ("company_id")     REFERENCES "companies"("id")   ON DELETE RESTRICT,
  CONSTRAINT "fk_doc_tax_lines_invoice"     FOREIGN KEY ("invoice_id")     REFERENCES "invoices"("id")    ON DELETE CASCADE,
  CONSTRAINT "fk_doc_tax_lines_sales_order" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_doc_tax_lines_rule"        FOREIGN KEY ("rule_id")        REFERENCES "tax_rules"("id")   ON DELETE SET NULL
);

-- Indexes for document_tax_lines
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_doc_tax_lines_invoice'
  ) THEN
    CREATE INDEX "idx_doc_tax_lines_invoice" ON "document_tax_lines"("invoice_id");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_doc_tax_lines_sales'
  ) THEN
    CREATE INDEX "idx_doc_tax_lines_sales" ON "document_tax_lines"("sales_order_id");
  END IF;
END $$;