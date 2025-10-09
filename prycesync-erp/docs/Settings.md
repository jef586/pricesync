POS > Barcode

- Módulo: `core_system`
- Clave: `pos.barcode`
- Tipo: JSON

Campos y defaults:

- `enabled`: boolean (default `true`)
- `windowMsMin`: number (default `50`) — mínimo Δt entre keydowns para considerar ráfaga HID
- `windowMsMax`: number (default `200`) — máximo Δt entre keydowns para considerar ráfaga HID
- `minLength`: number (default `6`) — mínimo de caracteres antes del terminador
- `suffix`: `'Enter' | 'Tab'` (default `'Enter'`) — tecla terminadora configurada en el escáner
- `preventInInputs`: boolean (default `true`) — evita interferir en inputs durante una ráfaga

Ejemplo:

```json
{
  "enabled": true,
  "windowMsMin": 50,
  "windowMsMax": 200,
  "minLength": 6,
  "suffix": "Enter",
  "preventInInputs": true
}
```

Notas

- La vista POS lee esta configuración al montar mediante el servicio `getPosBarcodeSettings()` y pasa los valores al composable `useBarcode(settings)`.
- Si el store no devuelve configuración, se aplican los defaults arriba.
- La API consulta primero `GET /settings/core_system/pos.barcode` y como fallback `GET /settings?module=core_system&key=pos.barcode`.