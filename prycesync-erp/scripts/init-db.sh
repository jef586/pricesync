#!/bin/bash

# Script para inicializar la base de datos con Prisma
# Este script debe ejecutarse dentro del contenedor Docker

echo "🚀 Iniciando configuración de base de datos..."

# Esperar a que PostgreSQL esté disponible
echo "⏳ Esperando a que PostgreSQL esté disponible..."
until pg_isready -h db -p 5432 -U postgres; do
  echo "PostgreSQL no está listo - esperando..."
  sleep 2
done

echo "✅ PostgreSQL está disponible!"

# Generar el cliente de Prisma
echo "📦 Generando cliente de Prisma..."
npx prisma generate

# Ejecutar migraciones (crear las tablas)
echo "🔄 Ejecutando migraciones de base de datos..."
npx prisma db push

# Verificar el estado de la base de datos
echo "🔍 Verificando estado de la base de datos..."
npx prisma db seed --preview-feature || echo "⚠️  No hay archivo de seed configurado"

echo "🎉 ¡Base de datos configurada exitosamente!"
echo ""
echo "📊 Para abrir Prisma Studio, ejecuta:"
echo "   docker-compose exec app npm run db:studio"
echo ""
echo "🔗 URLs disponibles:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend: http://localhost:3001"
echo "   - Prisma Studio: http://localhost:5555"