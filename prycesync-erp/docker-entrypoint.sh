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
# Primero instalamos si falta, y si existe verificamos paquetes críticos y reparamos si faltan.

ensure_deps() {
  FALTAN=0
  for pkg in \
    express \
    cors \
    jsonwebtoken \
    bcryptjs \
    multer \
    sharp \
    xml2js \
    ioredis \
    axios \
    express-validator; do
    if ! node -e "require.resolve('$pkg')" >/dev/null 2>&1; then
      echo "[entrypoint] Falta dependencia: $pkg"
      FALTAN=1
    fi
  done

  if [ "$FALTAN" = "1" ]; then
    echo "[entrypoint] Faltan dependencias. Reinstalando..."
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
    # Rebuild de sharp para evitar incompatibilidades binarias
    if node -e "require.resolve('sharp')" >/dev/null 2>&1; then
      npm rebuild sharp || true
    fi
  else
    echo "[entrypoint] Dependencias críticas presentes."
  fi
}

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  if [ -f package-lock.json ]; then
    echo "node_modules vacío: ejecutando npm ci"
    npm ci
  else
    echo "node_modules vacío: ejecutando npm install"
    npm install
  fi
else
  echo "node_modules presente: verificando dependencias críticas"
  ensure_deps
fi

echo "Iniciando aplicación en modo desarrollo dentro del contenedor..."
npm run dev