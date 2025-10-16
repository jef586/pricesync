#!/bin/sh

# Crea un snapshot binario de la DB para rollback

set -e

PGHOST=${PGHOST:-db}
PGPORT=${PGPORT:-5432}
PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-password}
PGDATABASE=${PGDATABASE:-pricesync}

SNAP_DIR=${SNAP_DIR:-/app/snapshots}
SNAP_FILE=${SNAP_FILE:-${SNAP_DIR}/pricesync_$(date +%Y%m%d_%H%M%S).dump}

mkdir -p "${SNAP_DIR}"
export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

echo "🗄️  Creando snapshot en ${SNAP_FILE}"
pg_dump -Fc -f "${SNAP_FILE}" "${PGDATABASE}"
echo "✅ Snapshot creado"