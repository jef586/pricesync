#!/bin/sh

# Job: db-smoke — verifica rowcounts, FKs y latencias clave
# Requiere: cliente psql dentro del contenedor (instalado en Dockerfile)

set -e

PGHOST=${PGHOST:-db}
PGPORT=${PGPORT:-5432}
PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-password}
PGDATABASE=${PGDATABASE:-pricesync}

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

echo "🔎 db-smoke: inicio contra ${PGHOST}:${PGPORT}/${PGDATABASE}"

psql -v ON_ERROR_STOP=1 <<'SQL'
\timing on

-- Rowcounts básicos
SELECT 'articles' AS table, COUNT(*) AS rows FROM articles;
SELECT 'invoice_items (article_id not null)' AS table, COUNT(*) AS rows FROM invoice_items WHERE article_id IS NOT NULL;
SELECT 'sales_order_items (article_id not null)' AS table, COUNT(*) AS rows FROM sales_order_items WHERE article_id IS NOT NULL;

-- Validación de FKs
SELECT conname AS fk_name, confrelid::regclass AS references_table
FROM pg_constraint 
WHERE contype='f' AND conrelid::regclass IN ('invoice_items'::regclass,'sales_order_items'::regclass,'stock_movements'::regclass);

-- Índices sobre claves críticas
SELECT i.relname AS index_name, t.relname AS table_name, am.amname AS method
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_am am ON i.relam = am.oid
WHERE t.relname IN ('articles','invoice_items','sales_order_items','article_barcodes','article_suppliers','stock_movements');

-- Latencia: búsqueda por barcode secundario
EXPLAIN ANALYZE
SELECT a.id, a.name
FROM article_barcodes b
JOIN articles a ON a.id = b.article_id
WHERE b.code = (SELECT code FROM article_barcodes ORDER BY created_at DESC LIMIT 1);

-- Latencia: equivalencia supplierSku
EXPLAIN ANALYZE
SELECT a.id, a.name
FROM article_suppliers s
JOIN articles a ON a.id = s.article_id
ORDER BY s.created_at DESC LIMIT 10;

SQL

echo "✅ db-smoke: OK"