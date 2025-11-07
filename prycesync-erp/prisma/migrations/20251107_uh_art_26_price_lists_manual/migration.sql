-- UH-ART-26: Fixed price lists for articles (L1 Minorista, L2 Mayorista1, L3 Mayorista2)
-- Create table article_prices_fixed with unique article_id

CREATE TABLE IF NOT EXISTS "article_prices_fixed" (
  "id"            TEXT PRIMARY KEY,
  "article_id"    TEXT NOT NULL,

  -- L1 (Minorista)
  "l1_margin_pct"   NUMERIC(7,3),
  "l1_final_price"  NUMERIC(12,2),
  "l1_locked"       BOOLEAN NOT NULL DEFAULT FALSE,

  -- L2 (Mayorista 1)
  "l2_margin_pct"   NUMERIC(7,3),
  "l2_final_price"  NUMERIC(12,2),
  "l2_locked"       BOOLEAN NOT NULL DEFAULT FALSE,

  -- L3 (Mayorista 2)
  "l3_margin_pct"   NUMERIC(7,3),
  "l3_final_price"  NUMERIC(12,2),
  "l3_locked"       BOOLEAN NOT NULL DEFAULT FALSE,

  "created_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Unique constraint per article
CREATE UNIQUE INDEX IF NOT EXISTS "ux_article_prices_fixed_article" ON "article_prices_fixed" ("article_id");

-- Foreign key to articles
ALTER TABLE "article_prices_fixed"
  ADD CONSTRAINT "fk_article_prices_fixed_article"
  FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;

-- Trigger to update updated_at on row changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_article_prices_fixed'
  ) THEN
    CREATE OR REPLACE FUNCTION set_timestamp_article_prices_fixed()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_timestamp_article_prices_fixed
    BEFORE UPDATE ON "article_prices_fixed"
    FOR EACH ROW
    EXECUTE FUNCTION set_timestamp_article_prices_fixed();
  END IF;
END $$;