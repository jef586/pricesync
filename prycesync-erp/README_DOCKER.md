# PryceSync ERP - Configuración Docker

## Inicio Rápido

### 1. Preparación
```bash
# Asegurar que los archivos necesarios existen
# - Dockerfile
# - docker-compose.yml  
# - docker-entrypoint.sh
# - .env.docker
```

### 2. Ejecutar la aplicación
```bash
# Construir y ejecutar (primera vez)
docker-compose build --no-cache
docker-compose up

# Solo ejecutar (ejecuciones posteriores)
docker-compose up
```

### 3. Acceder a la aplicación
- **Frontend**: http://localhost:5173/
- **API**: http://localhost:3002/
- **Base de datos**: localhost:5432

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir solo la app
docker-compose build --no-cache app

# Limpiar todo (cuidado: elimina datos)
docker-compose down -v
```

## Archivos Críticos

1. **docker-entrypoint.sh** - Script que:
   - Espera la base de datos
   - Ejecuta migraciones Prisma
   - Inicia la aplicación

2. **.env.docker** - Variables de entorno para Docker

3. **Dockerfile** - Configuración de la imagen

4. **docker-compose.yml** - Orquestación de servicios

## Solución de Problemas

### Error de middleware de autenticación
Si ves: `SyntaxError: The requested module '../middleware/auth.js' does not provide an export named 'authenticateToken'`

**Solución**: Verificar que en `src/backend/routes/invoices.js` se use:
```javascript
import { authenticate } from '../middleware/auth.js';
```

### Base de datos no conecta
- Verificar que Docker Desktop esté ejecutándose
- Asegurar que los puertos 5432, 3002, 5173 estén libres
- Revisar logs: `docker-compose logs db`

### La aplicación no inicia
- Verificar permisos de `docker-entrypoint.sh`: `chmod +x docker-entrypoint.sh`
- Reconstruir imagen: `docker-compose build --no-cache`
- Revisar logs: `docker-compose logs app`

## Estado Actual Verificado ✅

- ✅ Base de datos PostgreSQL funcionando
- ✅ Migraciones Prisma ejecutándose automáticamente
- ✅ Frontend Vue disponible en puerto 5173
- ✅ Script de entrada Docker configurado correctamente
- ⚠️ Backend API requiere corrección de importación de middleware

Para documentación completa, ver: `docs/DOCKER_SETUP.md`