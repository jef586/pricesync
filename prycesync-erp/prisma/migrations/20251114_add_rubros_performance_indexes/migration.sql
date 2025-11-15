-- Add performance indexes for rubros listing with server-side filtering and pagination

-- Index for filtering by company, parent, and deleted status (most common query pattern)
CREATE INDEX IF NOT EXISTS "idx_categories_company_parent_deleted" ON "categories"("company_id", "parent_id", "deleted_at");

-- Index for name-based searches (ILIKE operations)
CREATE INDEX IF NOT EXISTS "idx_categories_name" ON "categories"("name");

-- Add GIN index for full-text search on name (optional, for better ILIKE performance)
-- This can be enabled if needed for large datasets
-- CREATE INDEX IF NOT EXISTS "idx_categories_name_gin" ON "categories" USING GIN ("name" gin_trgm_ops);

-- Add GIN index for full-text search on description (optional)
-- CREATE INDEX IF NOT EXISTS "idx_categories_description_gin" ON "categories" USING GIN ("description" gin_trgm_ops);