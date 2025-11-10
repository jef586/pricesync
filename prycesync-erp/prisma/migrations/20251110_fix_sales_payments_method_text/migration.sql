-- Fix column type for sales_payments.method to TEXT
-- Some environments may have an enum or domain causing casts like m.e_method(),
-- which breaks Prisma inserts. We normalize to TEXT to match schema.prisma.

BEGIN;

ALTER TABLE "sales_payments"
  ALTER COLUMN "method" TYPE TEXT USING "method"::TEXT;

COMMIT;