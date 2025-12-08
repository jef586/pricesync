-- Índices para optimizar listado de ventas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_orders_company_created'
  ) THEN
    CREATE INDEX idx_sales_orders_company_created ON sales_orders (company_id, created_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_orders_company_status'
  ) THEN
    CREATE INDEX idx_sales_orders_company_status ON sales_orders (company_id, status);
  END IF;
END
$$;
