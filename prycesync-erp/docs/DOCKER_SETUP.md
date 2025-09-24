# Configuración de Docker para PryceSync ERP

## Archivos de Configuración

### 1. Dockerfile
```dockerfile
FROM node:20-alpine

# Instalar OpenSSL para Prisma y otras dependencias necesarias
RUN apk add --no-cache openssl postgresql-client

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Copiar el script de entrada
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 5173

ENTRYPOINT ["/app/docker-entrypoint.sh"]
```

### 2. docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
      - "3002:3002"
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules
    working_dir: /app
    env_file:
      - .env.docker
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pricesync
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. docker-entrypoint.sh
```bash
#!/bin/sh

echo "Esperando a que la base de datos esté lista..."
while ! pg_isready -h db -p 5432 -U postgres; do
  echo "Esperando conexión a la base de datos..."
  sleep 2
done

echo "Base de datos conectada, ejecutando migraciones..."
npx prisma db push

echo "Iniciando aplicación..."
npm run dev
```

### 4. .env.docker
```env
# Configuración de la base de datos para Docker
DATABASE_URL="postgresql://postgres:password@db:5432/pricesync"

# Configuración de PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=pricesync

# Configuración JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Configuración del servidor
NODE_ENV=development
PORT=3002
API_PORT=3002
FRONTEND_PORT=5173

# URLs de conexión
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3002

# Configuración de CORS
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Configuración de logs
LOG_LEVEL=debug
```

## Comandos para Ejecutar

### Construcción y Ejecución
```bash
# Construir la imagen (sin cache para asegurar cambios)
docker-compose build --no-cache

# Ejecutar los servicios
docker-compose up

# Ejecutar en segundo plano
docker-compose up -d
```

### Comandos de Mantenimiento
```bash
# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f app
docker-compose logs -f db

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir solo la aplicación
docker-compose build --no-cache app
```

## Servicios Disponibles

- **Frontend Vue**: http://localhost:5173/
- **API Backend**: http://localhost:3002/
- **Base de datos PostgreSQL**: localhost:5432
- **Prisma Studio** (si se habilita): http://localhost:5555/

## Solución de Problemas Comunes

### 1. Error de importación de middleware
**Problema**: `SyntaxError: The requested module '../middleware/auth.js' does not provide an export named 'authenticateToken'`

**Solución**: Verificar que las importaciones en `src/backend/routes/invoices.js` usen:
```javascript
import { authenticate } from '../middleware/auth.js';
```
En lugar de:
```javascript
import { authenticateToken } from '../middleware/auth.js';
```

### 2. Base de datos no conecta
**Problema**: La aplicación no puede conectar a la base de datos

**Solución**: 
- Verificar que el servicio `db` tenga `healthcheck` configurado
- Asegurar que la aplicación use `depends_on` con `condition: service_healthy`
- Verificar que `DATABASE_URL` apunte a `db:5432` (nombre del servicio Docker)

### 3. Migraciones no se ejecutan
**Problema**: Las tablas no se crean en la base de datos

**Solución**:
- El script `docker-entrypoint.sh` ejecuta `npx prisma db push` automáticamente
- Verificar que el archivo `prisma/schema.prisma` esté presente
- Asegurar que `npx prisma generate` se ejecute durante la construcción

### 4. Puertos no disponibles
**Problema**: Error de puertos ya en uso

**Solución**:
```bash
# Verificar puertos en uso
netstat -an | findstr :5173
netstat -an | findstr :3002
netstat -an | findstr :5432

# Detener servicios conflictivos
docker-compose down
```

## Notas Importantes

1. **Volúmenes**: El código se monta como volumen para desarrollo, permitiendo hot-reload
2. **Healthcheck**: La base de datos tiene healthcheck para asegurar que esté lista antes de iniciar la app
3. **Migraciones**: Se ejecutan automáticamente al iniciar el contenedor
4. **Logs**: Usar `docker-compose logs -f` para monitorear el estado
5. **Reconstrucción**: Usar `--no-cache` cuando se cambien dependencias o configuraciones

## Estructura de Archivos Críticos

```
prycesync-erp/
├── Dockerfile                 # Configuración de la imagen
├── docker-compose.yml         # Orquestación de servicios
├── docker-entrypoint.sh       # Script de inicio
├── .env.docker               # Variables de entorno para Docker
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   └── init.sql              # Script de inicialización
└── src/backend/
    ├── middleware/auth.js    # Middleware de autenticación
    └── routes/invoices.js    # Rutas de facturación
```