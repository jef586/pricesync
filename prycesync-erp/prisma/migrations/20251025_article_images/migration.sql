-- Article Images: create table and link to articles.image_id
-- PostgreSQL

-- 1) Create table for article_images
CREATE TABLE IF NOT EXISTS "article_images" (
  "id" text PRIMARY KEY,
  "article_id" text NOT NULL,
  "image_url" text NOT NULL,
  "thumbnail_url" text,
  "mime_type" text,
  "size_bytes" integer,
  "width" integer,
  "height" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "article_images_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
);

-- Index for fast lookup by article
CREATE INDEX IF NOT EXISTS "idx_article_images_article" ON "article_images" ("article_id");

-- 2) Add image_id to articles and link to article_images.id
ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "image_id" text;

-- Unique constraint on image_id (one primary image per article)
DO $$
BEGIN
  BEGIN
    ALTER TABLE "articles" ADD CONSTRAINT "uniq_articles_image_id" UNIQUE ("image_id");
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;

-- Optional index for queries
CREATE INDEX IF NOT EXISTS "idx_articles_image" ON "articles" ("image_id");

-- Foreign key linking articles.image_id → article_images.id with SET NULL on delete
DO $$
BEGIN
  BEGIN
    ALTER TABLE "articles" ADD CONSTRAINT "articles_image_id_fkey"
      FOREIGN KEY ("image_id") REFERENCES "article_images"("id") ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END$$;