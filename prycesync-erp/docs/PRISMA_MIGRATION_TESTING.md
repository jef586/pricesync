# Prisma: Migraciones y Testeo (Docker Compose)

Este documento resume los comandos necesarios para aplicar migraciones de Prisma y verificar el correcto funcionamiento de la API dentro del entorno Docker Compose del proyecto.

## Prerrequisitos
- Docker y Docker Compose instalados.
- Servicios definidos en `docker-compose.yml` (especialmente el servicio de la aplicación, ej. `app`) corriendo o disponibles.
- Variables de entorno configuradas (ver `.env.docker` / `.env.example`).

## Levantar servicios
```bash
# Arrancar servicios en segundo plano
docker compose up -d

# Ver logs de la app (útil para chequear errores)
docker compose logs -f --no-log-prefix app
```

## Aplicar migraciones Prisma
```bash
# Ejecutar migraciones dentro del contenedor de la app
# Reemplaza `app` si tu servicio se llama distinto

docker compose exec app npx prisma migrate deploy

# (Opcional) Generar el Prisma Client después de cambios en el esquema

docker compose exec app npx prisma generate
```

Si los servicios aún no están corriendo y prefieres un contenedor efímero:
```bash
# Ejecuta migraciones en un contenedor temporal

docker compose run --rm app npx prisma migrate deploy
```

## Smoke test básico de API
```bash
# Endpoints generales
curl -sS http://localhost:3002/api/health
curl -sS http://localhost:3002/api/invoices?page=1&limit=5

# Crear factura mínima (usa un customerId válido)
# Ajusta el body según tus datos reales
curl -sS -X POST http://localhost:3002/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "c123456789012345678901234",
    "type": "B",
    "items": [
      { "description": "Servicio", "quantity": 1, "unitPrice": 1000, "taxRate": 21 }
    ]
  }'
```

## Testeo local (fuera de Docker)
Si prefieres ejecutar migraciones y tests en tu host:
```bash
# Desde el directorio del proyecto de la app
cd prycesync-erp

# Migraciones y generación del cliente
npx prisma migrate deploy
npx prisma generate

# Pruebas disponibles
npm run test:unit           # unit tests
node test-invoice-endpoints.js   # scripts de pruebas API (según disponibilidad)
node test-invoice-creation.js
```

## Consejos de resolución de problemas
- Revisa `prisma/schema.prisma` y la salida del comando de migración para detectar errores de esquema.
- Asegúrate de que las variables de entorno (DB URL, JWT, etc.) estén presentes en el contenedor.
- Usa `docker compose logs -f --no-log-prefix app` para ver errores en tiempo real.
- Si cambias el nombre del servicio de la app, reemplaza `app` en los comandos anteriores.