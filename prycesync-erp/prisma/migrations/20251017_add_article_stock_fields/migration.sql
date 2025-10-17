-- UH-ART-2: Agregar campos de stock a articles
-- Entorno PostgreSQL

ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "stock_max" integer,
  ADD COLUMN IF NOT EXISTS "control_stock" boolean NOT NULL DEFAULT false;

-- Índices opcionales para consultas por control de stock
CREATE INDEX IF NOT EXISTS "idx_articles_control_stock" ON "articles" ("control_stock");