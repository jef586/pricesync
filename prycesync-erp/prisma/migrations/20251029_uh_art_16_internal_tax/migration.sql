-- AlterEnum
-- Ensure dependent view is dropped before type changes
DROP VIEW IF EXISTS "products";

BEGIN;
CREATE TYPE "InternalTaxType_new" AS ENUM ('NONE', 'FIXED', 'PERCENT');
-- Map old enum values FIX→FIXED, PCT→PERCENT, NULL→NONE during type change
ALTER TABLE "articles" ALTER COLUMN "internal_tax_type" TYPE "InternalTaxType_new" USING (
  CASE
    WHEN "internal_tax_type"::text = 'FIX' THEN 'FIXED'
    WHEN "internal_tax_type"::text = 'PCT' THEN 'PERCENT'
    WHEN "internal_tax_type" IS NULL THEN 'NONE'
    ELSE "internal_tax_type"::text
  END
)::"InternalTaxType_new";
ALTER TABLE "invoice_items" ALTER COLUMN "internal_tax_type" TYPE "InternalTaxType_new" USING (
  CASE
    WHEN "internal_tax_type"::text = 'FIX' THEN 'FIXED'
    WHEN "internal_tax_type"::text = 'PCT' THEN 'PERCENT'
    WHEN "internal_tax_type" IS NULL THEN 'NONE'
    ELSE "internal_tax_type"::text
  END
)::"InternalTaxType_new";
ALTER TYPE "InternalTaxType" RENAME TO "InternalTaxType_old";
ALTER TYPE "InternalTaxType_new" RENAME TO "InternalTaxType";
DROP TYPE "InternalTaxType_old";
COMMIT;

-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "internal_tax_type" SET NOT NULL,
ALTER COLUMN "internal_tax_type" SET DEFAULT 'NONE',
ALTER COLUMN "internal_tax_value" SET NOT NULL,
ALTER COLUMN "internal_tax_value" SET DEFAULT 0,
ALTER COLUMN "internal_tax_value" SET DATA TYPE DECIMAL(12,4);

-- Recreate compatibility view
CREATE VIEW "products" AS SELECT * FROM "articles";

