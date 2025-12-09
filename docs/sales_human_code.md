# Códigos humanos de ventas

## Formato

- `VN-YYYY-######` para ventas sin factura (ej.: `VN-2025-000123`).
- `F{Letra}{PtoVta}-{Nro}` cuando la venta está asociada a factura AFIP (ej.: `FA0001-12345678`).

## Reglas

- Secuencia por ámbito: `empresa + sucursal + año`.
- Unicidad garantizada mediante tabla `sales_sequences` con PK compuesta.
- El UUID interno (`id`) se mantiene oculto en UI; sólo para navegación.
- El campo `origin` indica el origen: `POS` (default) o `WEB`.

## Implementación

- Campos en `sales_orders`: `human_code`, `origin`, `branch_id`.
- Tabla `sales_sequences(company_id, branch_id, year, next)`.
- Generación:
  - En creación, se toma/avanza la secuencia en transacción y se asigna `humanCode` formateado.
  - Si hay factura asociada, `displayCode` usa el número fiscal (`F{Letra}{PtoVta}-{Nro}`).

## Backfill

- Endpoint de desarrollo: `POST /api/admin/sales/backfill-human-codes`.
- Recorre ventas sin `humanCode` y asigna según `createdAt` y ámbito.

## Rollback

- Para deshacer la funcionalidad:
  - Remover `human_code`, `origin`, `branch_id` de `sales_orders`.
  - Eliminar `sales_sequences`.
  - Ajustar UI para mostrar `number` o `id` nuevamente.

