# UH-ART-1 – Migración Artículos (products → articles)

Objetivo: Renombrar `core_inventory.products` a `core_inventory.articles`, agregar `article_id` a `invoice_items` y `sales_order_items`, crear view de compatibilidad, y preparar subrecursos de Artículos.

## Pre-requisitos
- Docker Desktop activo
- Servicios levantados con Compose
- Base PostgreSQL (según actual `docker-compose.yml`)

## Pasos (solo Docker/Compose)

1) Levantar servicios
```bash
docker compose up -d
```

2) Snapshot previo (rollback seguro)
```bash
docker compose exec app sh ./scripts/db-snapshot.sh
```

3) Desplegar migraciones Prisma
```bash
docker compose exec app npx prisma migrate deploy
```

4) Smoke test de base (rowcounts, FKs, latencias)
```bash
docker compose exec app sh ./scripts/db-smoke.sh
```

5) Comandos útiles
```bash
# Ver estado
docker compose logs -f app

# Ejecutar nuevamente migrate deploy
docker compose exec app npx prisma migrate deploy
```

## Qué hace la migración
- Renombra `products` → `articles`
- Mapea `code`→`sku`, `status`→`active`, `cost_price`/`sale_price`→`cost`/`price_public`, `min_stock`→`stock_min`
- Cambia `ProductType(product|service)` → `ArticleType(PRODUCT|SERVICE)`
- Agrega nuevas columnas: `barcode`, `barcode_type`, `gain_pct`, `image_url`, `internal_tax_type`, `internal_tax_value`, flags fiscales e `points_per_unit`
- Agrega `article_id` y nuevas FKs en `invoice_items` y `sales_order_items`
- Crea view compat: `products AS SELECT * FROM articles`
- Crea subrecursos: `article_barcodes`, `article_suppliers`, `article_bundle_components`, `article_uoms`, `article_wholesale_tiers`
- Crea `stock_movements` con UoM

## Rollback
1) Restaurar desde snapshot (recomendado)
```bash
# ejemplo (ajustar nombre del archivo generado en snapshots/)
docker compose exec app sh -c "pg_restore -h db -U postgres -d pricesync /app/snapshots/pricesync_YYYYMMDD_HHMMSS.dump"
```

2) Rollback SQL inverso
```bash
docker compose exec app sh -c "psql -h db -U postgres -d pricesync -f prisma/migrations/20251016_uh_art_1_articles_refactor/rollback.sql"
```

## Notas
- Este flujo evita ejecutar servidores locales; todo es `docker compose` + `exec app ...`
- Si tu entorno fuera MySQL, ajustar types y comandos (`mysql`/`mysqldump`); el proyecto actual usa PostgreSQL.
- El entrypoint ya usa `prisma migrate deploy` y genera el cliente Prisma en el contenedor.

### Compatibilidad Frontend (Vite)
- Variables expuestas al FE: `VITE_API_URL` y `VITE_FEATURE_PRODUCTS_ALIAS`.
- `VITE_FEATURE_PRODUCTS_ALIAS=false` mantiene un alias temporal en `src/renderer/src/types/product.ts` que reexporta `types/article` (DEPRECATED).
- Para detectar y erradicar usos residuales de `types/product`, setear `VITE_FEATURE_PRODUCTS_ALIAS=true` (rompe en runtime si alguien importa el alias).
- Nuevo servicio FE: `src/renderer/src/services/articles.ts` (`/api/articles`) y store `src/renderer/src/stores/articles.ts`.
- Pruebas unitarias del store: `src/renderer/src/stores/__tests__/articles.store.spec.ts` (incluidas en `vitest.config.ts`).