DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='stock_movements') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='qty') THEN
      ALTER TABLE "stock_movements" ADD COLUMN "qty" numeric;
      -- Backfill from existing 'quantity' column if present
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='quantity') THEN
        EXECUTE 'UPDATE "stock_movements" SET "qty" = "quantity" WHERE "qty" IS NULL';
      END IF;
    END IF;
  END IF;
END $$;

