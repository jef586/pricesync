-- UH-ART-19 Bulk Pricing: versión PostgreSQL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BulkPricingMode') THEN
    CREATE TYPE "BulkPricingMode" AS ENUM ('UNIT_PRICE','PERCENT_OFF');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "article_bulk_pricing" (
  "id"           text PRIMARY KEY,
  "article_id"   text NOT NULL,
  "uom_code"     "UoM" NOT NULL,
  "min_qty"      numeric(12,3) NOT NULL,
  "mode"         "BulkPricingMode" NOT NULL,
  "unit_price"   numeric(12,2),
  "percent_off"  numeric(5,2),
  "priority"     integer NOT NULL DEFAULT 0,
  "active"       boolean NOT NULL DEFAULT TRUE,
  "valid_from"   timestamptz,
  "valid_to"     timestamptz,
  "created_at"   timestamptz NOT NULL DEFAULT now(),
  "updated_at"   timestamptz NOT NULL DEFAULT now(),
  "deleted_at"   timestamptz,
  CONSTRAINT "fk_abp_article" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_article_bulk_pricing_rule"
ON "article_bulk_pricing" ("article_id", "uom_code", "min_qty" DESC, "priority" DESC);