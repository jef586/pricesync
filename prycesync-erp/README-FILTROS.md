# Gestión de Artículos — Filtros compactos

- Atajos: `/` enfoca búsqueda, `Esc` limpia búsqueda, `Enter` ejecuta al instante.
- Barra compacta sticky ≤72px con búsqueda rápida, estado y stock.
- Panel "Avanzados" colapsable con grid responsive.
- Chips removibles de filtros activos y botón "Limpiar todos".
- Presets: "Solo activos", "Bajo stock", "Sin precios".
- Persistencia en `localStorage`: filtros y estado de "Avanzados".
 

## Ejecutar y probar en Docker

- Levantar stack sin reconstruir imágenes: `docker compose -f docker-compose.stable.yml up -d --no-build`
- Ejecutar pruebas unitarias dentro del contenedor: `docker exec prycesync-erp-app-dev npm run test:unit`
- Acceso UI: `http://localhost:5173/articles`
