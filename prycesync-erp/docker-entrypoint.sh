#!/bin/sh

echo "Esperando a que la base de datos esté lista..."
while ! pg_isready -h db -p 5432 -U postgres; do
  echo "Esperando conexión a la base de datos..."
  sleep 2
done

echo "Base de datos conectada, desplegando migraciones (migrate deploy)..."
npx prisma migrate deploy

echo "Generando cliente de Prisma..."
npx prisma generate

echo "Iniciando aplicación en modo desarrollo dentro del contenedor..."
npm run dev