-- Índices para acelerar lookup de artículos
CREATE INDEX IF NOT EXISTS idx_articles_barcode ON articles(barcode);
CREATE INDEX IF NOT EXISTS idx_articles_sku ON articles(sku);
CREATE INDEX IF NOT EXISTS idx_article_barcodes_code ON article_barcodes(code);
CREATE INDEX IF NOT EXISTS idx_article_suppliers_supplierSku ON article_suppliers(supplier_sku);

-- Unicidad por empresa en barcode (si no hay duplicados)
DO $$
DECLARE
  dup_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT company_id, barcode
    FROM articles
    WHERE barcode IS NOT NULL
    GROUP BY company_id, barcode
    HAVING COUNT(*) > 1
  ) AS d;

  IF dup_count = 0 THEN
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_articles_company_barcode ON articles(company_id, barcode) WHERE barcode IS NOT NULL;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'No se pudo crear índice único uniq_articles_company_barcode';
    END;
  ELSE
    RAISE NOTICE 'Se detectaron % duplicados de (company_id, barcode); se omite índice único', dup_count;
  END IF;
END$$;

