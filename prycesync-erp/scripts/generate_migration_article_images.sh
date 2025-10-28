#!/bin/sh
set -e

MIGRATION_DIR="prisma/migrations/20251025_article_images"
mkdir -p "$MIGRATION_DIR"

# Generate SQL migration from current DB to Prisma schema
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > "$MIGRATION_DIR/migration.sql"

echo "Created migration at: $MIGRATION_DIR/migration.sql"