-- UH-ART-1: Migración de DB - products → articles
-- NOTA: Entorno PostgreSQL (según configuración actual de Docker)

-- 1) Renombrar tabla products → articles
ALTER TABLE IF EXISTS "products" RENAME TO "articles";

-- 2) Ajustar columnas principales y nuevas propiedades del modelo Article
-- Mapear code → sku; status → active; cost_price/sale_price → cost/price_public; min_stock → stock_min
DO $$
BEGIN
  -- code → sku (si existe)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='code'
  ) THEN
    ALTER TABLE "articles" RENAME COLUMN "code" TO "sku";
  END IF;

  -- status → active (boolean)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='active'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "active" boolean NOT NULL DEFAULT true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='status'
  ) THEN
    UPDATE "articles" SET "active" = ("status"::text = 'active');
    -- drop legacy status column
    ALTER TABLE "articles" DROP COLUMN "status";
  END IF;

  -- Tipos: ProductType → ArticleType
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ArticleType'
  ) THEN
    CREATE TYPE "ArticleType" AS ENUM ('PRODUCT','SERVICE');
  END IF;
  -- Crear columna temporal y migrar valores product/service → PRODUCT/SERVICE
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='type'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "type_new" "ArticleType" NOT NULL DEFAULT 'PRODUCT';
    UPDATE "articles" SET "type_new" = CASE WHEN "type"::text = 'product' THEN 'PRODUCT'::"ArticleType" ELSE 'SERVICE'::"ArticleType" END;
    ALTER TABLE "articles" DROP COLUMN "type";
    ALTER TABLE "articles" RENAME COLUMN "type_new" TO "type";
  ELSE
    ALTER TABLE "articles" ADD COLUMN "type" "ArticleType" NOT NULL DEFAULT 'PRODUCT';
  END IF;

  -- cost_price/sale_price → cost/price_public
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='cost'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "cost" numeric(12,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='price_public'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "price_public" numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='cost_price'
  ) THEN
    UPDATE "articles" SET "cost" = "cost_price";
    ALTER TABLE "articles" DROP COLUMN "cost_price";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='sale_price'
  ) THEN
    UPDATE "articles" SET "price_public" = "sale_price";
    ALTER TABLE "articles" DROP COLUMN "sale_price";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='min_price'
  ) THEN
    ALTER TABLE "articles" DROP COLUMN "min_price";
  END IF;

  -- min_stock → stock_min
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='min_stock'
  ) THEN
    ALTER TABLE "articles" RENAME COLUMN "min_stock" TO "stock_min";
  END IF;
  -- max_stock ya no se utiliza
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='articles' AND column_name='max_stock'
  ) THEN
    ALTER TABLE "articles" DROP COLUMN "max_stock";
  END IF;

  -- Nuevas columnas del modelo Article
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='barcode'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "barcode" text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'BarcodeType'
  ) THEN
    CREATE TYPE "BarcodeType" AS ENUM ('EAN13','EAN8','UPCA','CODE128','PLU','CUSTOM');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='barcode_type'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "barcode_type" "BarcodeType";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='gain_pct'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "gain_pct" numeric(7,3);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='image_url'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "image_url" text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'InternalTaxType'
  ) THEN
    CREATE TYPE "InternalTaxType" AS ENUM ('FIX','PCT');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='internal_tax_type'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "internal_tax_type" "InternalTaxType";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='internal_tax_value'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "internal_tax_value" numeric(12,2);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='subject_iibb'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "subject_iibb" boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='subject_ganancias'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "subject_ganancias" boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='subject_perc_iva'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "subject_perc_iva" boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='points_per_unit'
  ) THEN
    ALTER TABLE "articles" ADD COLUMN "points_per_unit" integer;
  END IF;

  -- Unicidad por (company_id, sku)
  BEGIN
    ALTER TABLE "articles" ADD CONSTRAINT "uniq_articles_company_sku" UNIQUE ("company_id","sku");
  EXCEPTION WHEN duplicate_object THEN
    -- ignorar si ya existe
    NULL;
  END;
END$$;

-- 3) En invoice_items y sales_order_items: agregar article_id, backfill y nuevas FKs; luego dropear product_id
ALTER TABLE IF EXISTS "invoice_items" ADD COLUMN IF NOT EXISTS "article_id" text;
UPDATE "invoice_items" SET "article_id" = "product_id" WHERE "article_id" IS NULL;
ALTER TABLE "invoice_items" DROP CONSTRAINT IF EXISTS "invoice_items_product_id_fkey";
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_invoice_items_article_id" ON "invoice_items" ("article_id");
ALTER TABLE "invoice_items" DROP COLUMN IF EXISTS "product_id";

ALTER TABLE IF EXISTS "sales_order_items" ADD COLUMN IF NOT EXISTS "article_id" text;
UPDATE "sales_order_items" SET "article_id" = "product_id" WHERE "article_id" IS NULL;
ALTER TABLE "sales_order_items" DROP CONSTRAINT IF EXISTS "sales_order_items_product_id_fkey";
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_sales_order_items_article_id" ON "sales_order_items" ("article_id");
ALTER TABLE "sales_order_items" DROP COLUMN IF EXISTS "product_id";

-- 4) View de compatibilidad: products → SELECT * FROM articles
DROP VIEW IF EXISTS "products";
CREATE VIEW "products" AS SELECT * FROM "articles";

-- 5) Subrecursos: crear tablas si no existen
CREATE TABLE IF NOT EXISTS "article_barcodes" (
  "id" text PRIMARY KEY,
  "article_id" text NOT NULL,
  "code" text UNIQUE NOT NULL,
  "type" "BarcodeType" NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "article_barcodes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "article_suppliers" (
  "id" text PRIMARY KEY,
  "article_id" text NOT NULL,
  "supplier_id" text NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "supplier_sku" text NOT NULL,
  CONSTRAINT "article_suppliers_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE,
  CONSTRAINT "article_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE,
  CONSTRAINT "uniq_article_supplier" UNIQUE ("article_id","supplier_id"),
  CONSTRAINT "uniq_supplier_supplier_sku" UNIQUE ("supplier_id","supplier_sku")
);

CREATE TABLE IF NOT EXISTS "article_bundle_components" (
  "id" text PRIMARY KEY,
  "article_id" text NOT NULL,
  "component_article_id" text NOT NULL,
  "qty" numeric(12,3) NOT NULL,
  CONSTRAINT "bundle_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE,
  CONSTRAINT "bundle_component_article_id_fkey" FOREIGN KEY ("component_article_id") REFERENCES "articles"("id") ON DELETE CASCADE,
  CONSTRAINT "uniq_bundle_component" UNIQUE ("article_id","component_article_id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UoM') THEN
    CREATE TYPE "UoM" AS ENUM ('UN','BU','KG','LT');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "article_uoms" (
  "id" text PRIMARY KEY,
  "article_id" text NOT NULL,
  "uom" "UoM" NOT NULL,
  "factor" numeric(12,6) NOT NULL,
  "price_override" numeric(12,2),
  CONSTRAINT "article_uoms_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE,
  CONSTRAINT "uniq_article_uom" UNIQUE ("article_id","uom")
);

CREATE TABLE IF NOT EXISTS "article_wholesale_tiers" (
  "id" text PRIMARY KEY,
  "article_id" text NOT NULL,
  "uom" "UoM" NOT NULL,
  "min_qty" numeric(12,3) NOT NULL,
  "price" numeric(12,2),
  "discount_pct" numeric(7,3),
  "active" boolean NOT NULL DEFAULT true,
  "valid_from" timestamp,
  "valid_to" timestamp,
  CONSTRAINT "wholesale_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
);

-- 6) Movimientos de stock
CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" text PRIMARY KEY,
  "company_id" text NOT NULL,
  "article_id" text NOT NULL,
  "quantity" numeric(12,3) NOT NULL,
  "uom" "UoM" NOT NULL,
  "reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "stock_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "stock_movements_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
);

-- 7) Limpieza de tipos legacy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductType') THEN
    DROP TYPE "ProductType";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatus') THEN
    DROP TYPE "ProductStatus";
  END IF;
END$$;

-- Fin UH-ART-1