-- Add hierarchical fields and constraints to categories table for rubros implementation
-- This migration adds the fields required for the RUB-1 implementation

-- Add new columns to categories table
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS path TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS margin_rate DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP(3);

-- Ensure foreign key constraint for parent_id (should already exist from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'categories'
      AND tc.constraint_name = 'fk_categories_parent'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT fk_categories_parent
      FOREIGN KEY (parent_id)
      REFERENCES public.categories(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create unique index for company_id, name, parent_id to prevent duplicates at same level
CREATE UNIQUE INDEX IF NOT EXISTS uniq_categories_company_name_parent
  ON public.categories(company_id, name, parent_id)
  WHERE deleted_at IS NULL;

-- Create index for parent_id queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON public.categories(parent_id)
  WHERE deleted_at IS NULL;

-- Create index for path queries (materialized path)
CREATE INDEX IF NOT EXISTS idx_categories_path
  ON public.categories(path)
  WHERE deleted_at IS NULL;

-- Create index for active status filtering
CREATE INDEX IF NOT EXISTS idx_categories_is_active
  ON public.categories(is_active)
  WHERE deleted_at IS NULL;

-- Create composite index for company and active status
CREATE INDEX IF NOT EXISTS idx_categories_company_active
  ON public.categories(company_id, is_active)
  WHERE deleted_at IS NULL;