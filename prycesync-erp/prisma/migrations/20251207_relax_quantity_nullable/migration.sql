DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stock_movements' AND column_name='quantity') THEN
    -- Backfill qty from quantity if qty is null
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='qty') THEN
      EXECUTE 'UPDATE "stock_movements" SET "qty" = COALESCE("qty","quantity")';
    END IF;
    -- Make legacy column nullable to avoid NOT NULL violations
    EXECUTE 'ALTER TABLE "stock_movements" ALTER COLUMN "quantity" DROP NOT NULL';
  END IF;
END $$;

