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

echo "Verificando dependencias npm..."
# Cuando se monta el volumen .:/app, el directorio node_modules suele quedar vacío.
# Instalamos dependencias si no existen para evitar errores de resolución en Vite/Node.
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  if [ -f package-lock.json ]; then
    echo "node_modules vacío: ejecutando npm ci"
    npm ci
  else
    echo "node_modules vacío: ejecutando npm install"
    npm install
  fi
else
  echo "node_modules presente, no se reinstala"
fi

echo "Iniciando aplicación en modo desarrollo dentro del contenedor..."
npm run dev