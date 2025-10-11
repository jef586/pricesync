-- Item discounts and minimum price migration (backward compatible & idempotent)

-- Create enum only if it doesn't exist (PostgreSQL lacks IF NOT EXISTS for enums)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'DiscountType'
  ) THEN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'ABS');
  END IF;
END
$$;

-- Add discount columns to sales_order_items if missing
ALTER TABLE "sales_order_items"
  ADD COLUMN IF NOT EXISTS "discount_type" "DiscountType",
  ADD COLUMN IF NOT EXISTS "discount_value" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discount_total" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_discountable" BOOLEAN NOT NULL DEFAULT TRUE;

-- Add minimum price to products if missing
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "min_price" NUMERIC(10,2);

-- Notes:
-- - Defaults ensure existing records behave as "sin descuento".
-- - min_price is nullable; validations will ignore when NULL.