-- RUB-1: Refactor y migración jerárquica de Categorías → Rubros/Subrubros
-- Proyecto: PriceSync ERP (PostgreSQL)
-- Tabla base: core_inventory.categories
-- Objetivo: agregar jerarquía vía parent_id + level + path, índices y backfill

-- ============================================================================
-- PREPARACIÓN
-- ============================================================================
-- Nota de tipos: en esta base los IDs son TEXT/CUID. Se mantiene el tipo TEXT
-- para parent_id para garantizar compatibilidad. Si su instalación usa UUID,
-- adapte el tipo de columna y expresiones id::text según corresponda.

BEGIN;

-- 1) Alterar estructura de tabla
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS path TEXT;

-- Asegurar FK (si no existe)
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

-- 2) Índices y constraints
-- Unicidad por empresa + nombre + padre (evita duplicados en un mismo nivel)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_categories_company_name_parent
  ON public.categories(company_id, name, parent_id);

-- Índice para consultas por padre
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON public.categories(parent_id);

-- Índice para consultas por prefijo de path (árbol materializado)
CREATE INDEX IF NOT EXISTS idx_categories_path
  ON public.categories(path);

COMMIT;

-- ============================================================================
-- 3) BACKFILL (Materialized Path y Level)
-- ============================================================================
-- Recomendación: ejecutar dentro de una transacción controlada. Si la tabla es
-- muy grande, considere desactivar triggers costosos y ejecutar en ventana baja.

BEGIN;

-- Inicializar raíces
UPDATE public.categories c
SET level = 0,
    path  = c.id::text
WHERE c.parent_id IS NULL;

-- Backfill recursivo para hijos
WITH RECURSIVE ct AS (
  SELECT c.id,
         c.parent_id,
         0::int AS level,
         c.id::text AS path
  FROM public.categories c
  WHERE c.parent_id IS NULL

  UNION ALL
  SELECT ch.id,
         ch.parent_id,
         ct.level + 1 AS level,
         (ct.path || '.' || ch.id)::text AS path
  FROM public.categories ch
  JOIN ct ON ch.parent_id = ct.id
)
UPDATE public.categories AS c
SET level = ct.level,
    path  = ct.path
FROM ct
WHERE c.id = ct.id;

COMMIT;

-- ============================================================================
-- 4) VALIDACIONES POST-MIGRACIÓN
-- ============================================================================
-- Todos los registros deben tener level y path poblados
-- Esperado: ambos 0
SELECT count(*) AS missing_level
FROM public.categories
WHERE level IS NULL;

SELECT count(*) AS missing_path
FROM public.categories
WHERE path IS NULL;

-- Duplicados prohibidos en mismo nivel por empresa/padre/nombre
-- Esta consulta debe devolver 0 filas.
SELECT company_id, parent_id, name, COUNT(*) AS dup_count
FROM public.categories
GROUP BY company_id, parent_id, name
HAVING COUNT(*) > 1;

-- Integridad con products.category_id: sólo verificación (no se modifica)
-- Si su instalación usa artículos en otra tabla, adapte el nombre.
SELECT COUNT(*) AS products_or_articles_without_category
FROM (
  SELECT p.id
  FROM public.articles p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.category_id IS NOT NULL AND c.id IS NULL
) q;

-- ============================================================================
-- 5) EJEMPLOS DE CONSULTAS JERÁRQUICAS
-- ============================================================================
-- Subrubros por padre
-- SELECT * FROM public.categories WHERE parent_id = '<parent-id>' ORDER BY name;

-- Descendencia por materialized path (prefijo)
-- SELECT * FROM public.categories WHERE path LIKE '<parent-path>.%' ORDER BY level, name;

-- Árbol por empresa (raíces)
-- SELECT * FROM public.categories WHERE company_id = '<company-id>' AND parent_id IS NULL ORDER BY name;

-- ============================================================================
-- 6) ROLLBACK SEGURO
-- ============================================================================
-- Use bajo su propio riesgo: revertirá columnas agregadas y FK.
-- No borra datos de categorías ni ajusta referencias en productos.

-- BEGIN;
-- ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS fk_categories_parent;
-- ALTER TABLE public.categories DROP COLUMN IF EXISTS path;
-- ALTER TABLE public.categories DROP COLUMN IF EXISTS level;
-- ALTER TABLE public.categories DROP COLUMN IF EXISTS parent_id;
-- DROP INDEX IF EXISTS idx_categories_parent_id;
-- DROP INDEX IF EXISTS uniq_categories_company_name_parent;
-- COMMIT;

-- Fin de migración RUB-1
