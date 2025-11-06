-- UH-ART-25 | Promociones por cantidad por artículo (tiers)
-- Crea tablas: article_quantity_promotions y article_quantity_promo_tiers

-- Tabla principal de promoción por artículo
CREATE TABLE IF NOT EXISTS "article_quantity_promotions" (
  "id" TEXT PRIMARY KEY,
  "article_id" TEXT NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "exclusive" BOOLEAN NOT NULL DEFAULT FALSE,
  "price_list_ids" JSONB NOT NULL DEFAULT '[]',
  "starts_at" TIMESTAMP NULL,
  "ends_at" TIMESTAMP NULL,
  "created_by" TEXT NULL,
  "updated_by" TEXT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para filtros comunes
CREATE INDEX IF NOT EXISTS "idx_article_quantity_promotions_article" ON "article_quantity_promotions" ("article_id");
CREATE INDEX IF NOT EXISTS "idx_article_quantity_promotions_active" ON "article_quantity_promotions" ("active");
CREATE INDEX IF NOT EXISTS "idx_article_quantity_promotions_validity" ON "article_quantity_promotions" ("starts_at", "ends_at");

-- Tiers de promoción
CREATE TABLE IF NOT EXISTS "article_quantity_promo_tiers" (
  "id" TEXT PRIMARY KEY,
  "promotion_id" TEXT NOT NULL REFERENCES "article_quantity_promotions"("id") ON DELETE CASCADE,
  "min_qty_un" NUMERIC(12,3) NOT NULL,
  "price_per_unit" NUMERIC(12,2) NULL,
  "percent_off" NUMERIC(6,3) NULL,
  "sort" INTEGER NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_article_quantity_promo_tiers_mode" CHECK (
    ("price_per_unit" IS NOT NULL AND "percent_off" IS NULL) OR
    ("price_per_unit" IS NULL AND "percent_off" IS NOT NULL)
  ),
  CONSTRAINT "chk_article_quantity_promo_tiers_min_qty" CHECK ("min_qty_un" > 0)
);

-- Unicidad de orden por promoción
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_article_quantity_promo_tiers_sort" ON "article_quantity_promo_tiers" ("promotion_id", "sort");