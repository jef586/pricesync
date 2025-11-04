-- UH-ART-18 Loyalty: points_per_unit DECIMAL(10,3) default 0 and loyalty tables

-- [REPARACIÓN] dropear vista que bloquea el cambio de tipo
DROP VIEW IF EXISTS "products" CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'points_per_unit'
  ) THEN
    ALTER TABLE "articles"
      ALTER COLUMN "points_per_unit" TYPE numeric(10,3) USING ("points_per_unit"::numeric),
      ALTER COLUMN "points_per_unit" SET DEFAULT 0;
  ELSE
    ALTER TABLE "articles" ADD COLUMN "points_per_unit" numeric(10,3) DEFAULT 0;
  END IF;
END $$;

-- 2) Loyalty movement type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoyaltyMovementType') THEN
    CREATE TYPE "LoyaltyMovementType" AS ENUM ('EARN','REVERSE');
  END IF;
END $$;

-- 3) Loyalty accounts table
CREATE TABLE IF NOT EXISTS "loyalty_accounts" (
  "id"           text PRIMARY KEY,
  "customer_id"  text NOT NULL,
  "points_balance" numeric(12,3) NOT NULL DEFAULT 0,
  "updated_at"   timestamptz NOT NULL DEFAULT now()
);

-- Unique one account per customer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'loyalty_accounts' AND indexname = 'uniq_loyalty_accounts_customer' 
  ) THEN
    CREATE UNIQUE INDEX "uniq_loyalty_accounts_customer" ON "loyalty_accounts" ("customer_id");
  END IF;
END $$;

-- FK to customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_loyalty_accounts_customer' AND table_name = 'loyalty_accounts'
  ) THEN
    ALTER TABLE "loyalty_accounts"
      ADD CONSTRAINT "fk_loyalty_accounts_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- 4) Loyalty movements table
CREATE TABLE IF NOT EXISTS "loyalty_movements" (
  "id"           text PRIMARY KEY,
  "customer_id"  text NOT NULL,
  "sale_id"      text NULL,
  "type"         "LoyaltyMovementType" NOT NULL,
  "points"       numeric(12,3) NOT NULL,
  "reason"       text NULL,
  "created_at"   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'loyalty_movements' AND indexname = 'idx_loyalty_movements_customer' 
  ) THEN
    CREATE INDEX "idx_loyalty_movements_customer" ON "loyalty_movements" ("customer_id");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'loyalty_movements' AND indexname = 'idx_loyalty_movements_sale' 
  ) THEN
    CREATE INDEX "idx_loyalty_movements_sale" ON "loyalty_movements" ("sale_id");
  END IF;
END $$;

-- FKs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_loyalty_movements_customer' AND table_name = 'loyalty_movements'
  ) THEN
    ALTER TABLE "loyalty_movements"
      ADD CONSTRAINT "fk_loyalty_movements_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_loyalty_movements_sale' AND table_name = 'loyalty_movements'
  ) THEN
    ALTER TABLE "loyalty_movements"
      ADD CONSTRAINT "fk_loyalty_movements_sale" FOREIGN KEY ("sale_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- [REPARACIÓN] recrear vista después del cambio de tipo
CREATE VIEW "products" AS SELECT * FROM "articles";