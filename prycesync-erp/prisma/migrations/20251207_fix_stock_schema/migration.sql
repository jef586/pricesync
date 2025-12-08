-- Fix stock schema: add missing columns in stock_movements, create stock_balances and warehouses if absent

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockDirection') THEN
    CREATE TYPE "StockDirection" AS ENUM ('IN','OUT');
  END IF;
END $$;

-- Add columns to stock_movements if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_movements') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='warehouse_id') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "warehouse_id" text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='qty_un') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "qty_un" numeric(12,3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='direction') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "direction" "StockDirection";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='document_id') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "document_id" text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='document_type') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "document_type" text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='comment') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "comment" text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='override') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "override" boolean NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='client_operation_id') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "client_operation_id" text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='created_by') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "created_by" text;
    END IF;
    -- Indexes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_stock_movements_article_wh_created'
    ) THEN
      CREATE INDEX "idx_stock_movements_article_wh_created" ON "stock_movements"("article_id","warehouse_id","created_at");
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_stock_movements_client_op'
    ) THEN
      CREATE UNIQUE INDEX "uniq_stock_movements_client_op" ON "stock_movements"("company_id","client_operation_id");
    END IF;
  END IF;
END $$;

-- Create warehouses table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='warehouses') THEN
    CREATE TABLE "warehouses" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "code" text UNIQUE,
      "company_id" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Create stock_balances table if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_balances') THEN
    CREATE TABLE "stock_balances" (
      "id" text PRIMARY KEY,
      "company_id" text NOT NULL,
      "article_id" text NOT NULL,
      "warehouse_id" text,
      "on_hand_un" numeric(14,3) NOT NULL DEFAULT 0,
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX "uniq_stock_balances_company_article_wh" ON "stock_balances"("company_id","article_id","warehouse_id");
    CREATE INDEX "idx_stock_balances_wh_article" ON "stock_balances"("warehouse_id","article_id");
  END IF;
END $$;

