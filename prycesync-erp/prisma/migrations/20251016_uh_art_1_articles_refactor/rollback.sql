-- Rollback UH-ART-1 (inverso)

-- 1) Eliminar view de compatibilidad
DROP VIEW IF EXISTS "products";

-- 2) Restaurar product_id en invoice_items y sales_order_items
ALTER TABLE IF EXISTS "invoice_items" ADD COLUMN IF NOT EXISTS "product_id" text;
UPDATE "invoice_items" SET "product_id" = "article_id" WHERE "article_id" IS NOT NULL AND "product_id" IS NULL;
ALTER TABLE "invoice_items" DROP CONSTRAINT IF EXISTS "invoice_items_article_id_fkey";
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;
DROP INDEX IF EXISTS "idx_invoice_items_article_id";
ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "article_id";

ALTER TABLE IF EXISTS "sales_order_items" ADD COLUMN IF NOT EXISTS "product_id" text;
UPDATE "sales_order_items" SET "product_id" = "article_id" WHERE "article_id" IS NOT NULL AND "product_id" IS NULL;
ALTER TABLE "sales_order_items" DROP CONSTRAINT IF EXISTS "sales_order_items_article_id_fkey";
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;
DROP INDEX IF EXISTS "idx_sales_order_items_article_id";
ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "article_id";

-- 3) Renombrar tabla articles → products
ALTER TABLE IF EXISTS "articles" RENAME TO "products";

-- 4) Tipos: revertir ArticleType → ProductType, InternalTaxType y BarcodeType pueden permanecer si se desean
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductType') THEN
    CREATE TYPE "ProductType" AS ENUM ('product','service');
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='type') THEN
    ALTER TABLE "products" ADD COLUMN "type_old" "ProductType" DEFAULT 'product';
    UPDATE "products" SET "type_old" = CASE WHEN "type"::text = 'PRODUCT' THEN 'product'::"ProductType" ELSE 'service'::"ProductType" END;
    ALTER TABLE "products" DROP COLUMN "type";
    ALTER TABLE "products" RENAME COLUMN "type_old" TO "type";
  END IF;
END$$;

-- 5) Revertir columnas renombradas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sku') THEN
    ALTER TABLE "products" RENAME COLUMN "sku" TO "code";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_min') THEN
    ALTER TABLE "products" RENAME COLUMN "stock_min" TO "min_stock";
  END IF;
  -- Opcional: recrear columnas legacy (sale_price, cost_price) desde cost/price_public si se requiere completamente reverso
END$$;

-- 6) Drop tablas de subrecursos (si es necesario)
DROP TABLE IF EXISTS "article_wholesale_tiers";
DROP TABLE IF EXISTS "article_uoms";
DROP TABLE IF EXISTS "article_bundle_components";
DROP TABLE IF EXISTS "article_suppliers";
DROP TABLE IF EXISTS "article_barcodes";

-- 7) Drop stock_movements si fue introducida en esta migración
DROP TABLE IF EXISTS "stock_movements";

-- Fin rollback UH-ART-1