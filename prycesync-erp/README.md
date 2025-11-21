# Precios & Listas (4)

## Fórmulas

- Directo:
  - `neto = costo + impInterno`
  - `precioNeto = neto * (1 + margen/100)`
  - `precioFinal = precioNeto * (1 + iva/100)`

- Inverso:
  - `precioNeto = precioFinal / (1 + iva/100)`
  - `neto = costo + impInterno`
  - `margen = ((precioNeto / neto) - 1) * 100`

## Orden de recálculo

1. Cambios en `pricing.base` (costo, impuesto interno monto/% y IVA) disparan recálculo de filas con `locked = false`.
2. En modo directo, editar `Margen %` recalcula `Precio final`.
3. En modo inverso, editar `Precio final` recalcula `Margen %`.
4. Botón "Aplicar a listas desbloqueadas" fuerza recálculo de L1–L3 donde `locked = false`.
5. Redondeo se aplica al final de cada fila según selector (`HALF_UP` por defecto, UP/DOWN disponibles).

## L4 Promoción por cantidad

- L4 es de solo lectura y refleja la promo por cantidad configurada para el artículo.
- El botón "Configurar" abre el modal para administrar escalones (`minQty → pricePerUnit` o `%desc`).
- Vista previa y simulador: si aplica un escalón por umbral, se indica explícitamente.

## Persistencia y Endpoints

- L1–L3: `GET/PUT /api/articles/:id/prices-fixed` (persiste `mode`, `marginPct`, `finalPrice`, `locked`).
- L4: `GET/PUT /api/articles/:id/quantity-promo` y `/tiers`.
- Preview: `GET /api/pricing/preview?articleId=&qty=&priceList=l1|l2|l3`.

## Ejemplo de cálculo

- Base: `costo=100`, `impInterno=10`, `IVA=21%`.
- Directo con `margen=20%`: `neto=(100+10)*1.2=132` → `final=132*1.21=159.72`.
- Inverso con `final=159.72`: `precioNeto=159.72/1.21=132` → `margen=((132/110)-1)*100=20%`.

