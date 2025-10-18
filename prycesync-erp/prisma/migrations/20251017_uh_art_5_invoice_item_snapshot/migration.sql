-- UH-ART-5 | Facturación: invoice_items usa article_id y guarda snapshot
-- Base de datos: PostgreSQL

DO $$
BEGIN
  -- Agregar columna internal_tax_value a articles si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='internal_tax_value'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "internal_tax_value" numeric(12,2);
  END IF;

  -- Agregar columna article_id a invoice_items si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='article_id'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "article_id" text;
    ALTER TABLE "invoice_items" ADD CONSTRAINT "fk_invoice_items_article" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL;
  END IF;

  -- Campos de snapshot
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='article_name'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "article_name" text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='sku'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "sku" text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='barcode'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "barcode" text;
  END IF;

  -- UoM y cantidades
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'UoM'
  ) THEN
    CREATE TYPE "UoM" AS ENUM ('UN','BU','KG','LT');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='uom'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "uom" "UoM";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='uom_factor'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "uom_factor" numeric(12,6);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='qty'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "qty" numeric(12,3);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='qty_un'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "qty_un" numeric(12,3);
  END IF;

  -- Precios unitarios
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='unit_price_net'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "unit_price_net" numeric(10,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='unit_price_gross'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "unit_price_gross" numeric(10,2);
  END IF;

  -- Impuesto interno
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'InternalTaxType'
  ) THEN
    CREATE TYPE "InternalTaxType" AS ENUM ('FIX','PCT');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='internal_tax_type'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "internal_tax_type" "InternalTaxType";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='internal_tax_value'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "internal_tax_value" numeric(12,2);
  END IF;

  -- IVA
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='vat_rate'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "vat_rate" numeric(5,2);
  END IF;

  -- Descuentos
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'DiscountType'
  ) THEN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENT','ABS');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='discount_type'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "discount_type" "DiscountType";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='discount_value'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "discount_value" numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='discount_total'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "discount_total" numeric(10,2) NOT NULL DEFAULT 0;
  END IF;

  -- Totales de línea
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='subtotal_net'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "subtotal_net" numeric(10,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='tax_total'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "tax_total" numeric(10,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='line_total_gross'
  ) THEN
    ALTER TABLE "invoice_items" ADD COLUMN "line_total_gross" numeric(10,2);
  END IF;

  -- Índices
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'invoice_items' AND indexname = 'idx_invoice_items_invoice'
  ) THEN
    CREATE INDEX "idx_invoice_items_invoice" ON "invoice_items"("invoice_id");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'invoice_items' AND indexname = 'idx_invoice_items_article'
  ) THEN
    CREATE INDEX "idx_invoice_items_article" ON "invoice_items"("article_id");
  END IF;
END;$$;