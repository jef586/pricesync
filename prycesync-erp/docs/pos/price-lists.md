# POS — Listas de Precios (UH-POS-17)

## Resumen
- Selector de lista en POS: `L1`, `L2`, `L3` y `L4 Promo`.
- Los precios se calculan en memoria a partir de `priceLists` devueltos por backend.
- No se re‑consulta al cambiar de lista; se actualizan filas no manuales.

## Backend
- `GET /api/articles/lookup?barcode=...` y `GET /api/articles/search?...` devuelven:
  - `pricePublic`
  - `priceLists`: `{ L1, L2, L3, L4: { price, minQty } }`
  - `tax`: `{ ivaPct, internalTaxType, internalTaxValue }`
  - `missingPriceLists`: `string[]` con listas sin precio.

## Frontend (POS)
- Al agregar ítems se usa el precio según la lista activa.
- `L4` aplica si `qty >= minQty`; caso contrario se usa la última lista no promo (`L1/L2/L3`) o `Público` como fallback.
- Al cambiar de lista:
  - Confirmación: “¿Actualizar precios de X ítems a la lista Y?”
  - Conserva descuentos y precios manuales (icono 🔒).
  - Muestra chip de lista usada y badge de fallback cuando corresponde.
- Cambio de cantidad con `L4`: alterna automáticamente entre promo y no promo, mostrando un toast.

## Persistencia
- Cada línea incluye `priceListUsed` para auditoría del origen de precio.

## Casos límite
- Falta de una lista: usa Público y muestra advertencia.
- Ítems manuales: nunca se modifican al cambiar de lista.
- Redondeo: 2 decimales, HALF_UP, respetado por cálculo existente.

## Rendimiento
- Escaneo rápido: no hay refetch; el cálculo usa datos del artículo ya cargados.

## Flag
- `posPriceLists=true` habilita este flujo.
