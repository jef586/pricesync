# POS > Barcode

- Módulo: `core_system`
- Clave: `pos.barcode`
- Tipo: JSON

## Campos y defaults (actualizado)

- `enabled`: boolean (default `true`)
- `windowMsMin`: number (default `50`) — mínimo Δt entre keydowns para considerar ráfaga HID
- `interKeyTimeout`: number (default `200`) — máximo Δt entre keydowns para considerar ráfaga HID y, si `suffix = 'none'`, pausa que dispara el escaneo
- `minLength`: number (default `6`) — mínimo de caracteres antes del terminador o pausa
- `suffix`: `'Enter' | 'Tab' | 'none'` (default `'Enter'`) — terminador; usar `'none'` para lectores que no envían Enter/Tab
- `preventInInputs`: boolean (default `true`) — evita interferir en inputs durante una ráfaga
- `forceFocus`: boolean (default `true`) — fuerza el foco al input de búsqueda del POS al escanear
- `autoSelectSingle`: boolean (default `true`) — si hay un único producto, lo agrega directamente al carrito

## Ejemplo

```json
{
  "enabled": true,
  "windowMsMin": 50,
  "interKeyTimeout": 200,
  "minLength": 6,
  "suffix": "Enter",
  "preventInInputs": true,
  "forceFocus": true,
  "autoSelectSingle": true
}
```

## Notas

- La vista POS lee esta configuración al montar mediante `getPosBarcodeSettings()` y la pasa a `useBarcodeListener(settings)`.
- Compatibilidad: si existe `windowMsMax` en configuraciones antiguas, se mapea automáticamente a `interKeyTimeout`.
- La API consulta primero `GET /settings/core_system/pos.barcode` y como fallback `GET /settings?module=core_system&key=pos.barcode`.
