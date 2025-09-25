# Configuración Estable de Docker - PryceSync ERP

## ✅ Estado Actual del Entorno
**Fecha de configuración estable**: 25 de septiembre de 2025
**Estado**: FUNCIONANDO CORRECTAMENTE

## 🐳 Configuración Docker Actual

### Puertos Configurados
- **Frontend (Vite)**: `5174:5173` - http://localhost:5174/
- **API Backend**: `3010:3000` - http://localhost:3010/
- **API Adicional**: `3011:3001` - http://localhost:3011/
- **API Extra**: `3012:3002` - http://localhost:3012/
- **Base de Datos**: `5433:5432` - localhost:5433

### Servicios Activos
- ✅ **PostgreSQL 15**: Base de datos `prycesync_erp`
- ✅ **Node.js 20**: Aplicación principal
- ✅ **Vite Dev Server**: Frontend Vue.js
- ✅ **Express API**: Backend con Prisma ORM

## 📦 Dependencias Críticas Instaladas
- `express-validator@^7.0.1` - Validación de datos
- `@prisma/client@^5.20.0` - ORM para base de datos
- `express@^4.18.2` - Framework web
- `vue@^3.5.18` - Framework frontend
- `bcryptjs@^3.0.2` - Encriptación
- `jsonwebtoken@^9.0.2` - Autenticación JWT

## 🔧 Comandos para Mantener el Entorno

### Iniciar el entorno (RECOMENDADO)
```bash
docker-compose up
```

### Solo si hay cambios en Dockerfile o package.json
```bash
docker-compose up --build
```

### Instalar nueva dependencia sin rebuild
```bash
docker exec prycesync-erp-app-1 npm install [paquete]
docker restart prycesync-erp-app-1
```

### Verificar estado de servicios
```bash
docker-compose ps
docker logs prycesync-erp-app-1 --tail=20
```

## ⚠️ IMPORTANTE - NO MODIFICAR

### Archivos críticos que NO deben cambiarse:
- `docker-compose.yml` - Configuración de servicios y puertos
- `Dockerfile` - Imagen base y configuración del contenedor
- `docker-entrypoint.sh` - Script de inicialización
- `.dockerignore` - Archivos excluidos del contexto

### Variables de entorno configuradas:
- `CHOKIDAR_USEPOLLING=true` - Hot reload
- `WATCHPACK_POLLING=true` - Detección de cambios
- `DATABASE_URL` - Conexión a PostgreSQL
- `NODE_ENV=development` - Modo desarrollo

## 🎯 Flujo de Trabajo Recomendado

1. **Iniciar entorno**: `docker-compose up`
2. **Desarrollar**: Los cambios se reflejan automáticamente
3. **Nueva dependencia**: Usar `docker exec` + `docker restart`
4. **Detener**: `Ctrl+C` en la terminal de docker-compose

## 🚨 Troubleshooting

### Si el contenedor no inicia:
```bash
docker-compose down -v
docker-compose up
```

### Si hay conflictos de puertos:
- Verificar que no haya otros servicios en los puertos configurados
- Los puertos están configurados para evitar conflictos con SIIS

### Si falta una dependencia:
```bash
# Agregar al package.json
# Luego ejecutar:
docker exec prycesync-erp-app-1 npm install
docker restart prycesync-erp-app-1
```

---
**NOTA**: Esta configuración ha sido probada y está funcionando correctamente. Mantener esta configuración para desarrollo estable.