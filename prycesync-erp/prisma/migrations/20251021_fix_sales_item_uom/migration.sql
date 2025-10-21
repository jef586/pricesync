-- Add UoM column to sales_order_items to match Prisma schema
-- Safe checks to avoid errors if type/column already exist
DO $$
BEGIN
  -- Ensure UoM enum exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'UoM'
  ) THEN
    CREATE TYPE "UoM" AS ENUM ('UN','BU','KG','LT');
  END IF;

  -- Add uom column if missing
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales_order_items'
      AND column_name = 'uom'
  ) THEN
    ALTER TABLE "sales_order_items" ADD COLUMN "uom" "UoM";
  END IF;
END
$$;