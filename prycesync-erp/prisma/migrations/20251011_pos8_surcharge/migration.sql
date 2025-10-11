-- POS-8: Recargo final en ventas y facturas

-- Crear enum SurchargeType si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'SurchargeType'
  ) THEN
    CREATE TYPE "SurchargeType" AS ENUM ('PERCENT', 'ABS');
  END IF;
END
$$;

-- Agregar columnas de recargo a invoices (core_billing)
ALTER TABLE "invoices"
  ADD COLUMN IF NOT EXISTS "surcharge_type" "SurchargeType",
  ADD COLUMN IF NOT EXISTS "surcharge_value" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "surcharge_amount" NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Agregar columnas de recargo a sales_orders (core_sales)
ALTER TABLE "sales_orders"
  ADD COLUMN IF NOT EXISTS "surcharge_type" "DiscountType",
  ADD COLUMN IF NOT EXISTS "surcharge_value" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "surcharge_amount" NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Notas:
-- - Las columnas con DEFAULT permiten compatibilidad hacia atrás.
-- - El tipo "DiscountType" existe por migraciones previas; se reutiliza para ventas.
-- - En facturas se usa "SurchargeType" dedicado para auditoría.