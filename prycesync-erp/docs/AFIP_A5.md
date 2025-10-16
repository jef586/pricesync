# AFIP A5

Integración oficial AFIP WSAA + Padrón A5 sin SDK externo.

## Variables de Entorno

- `AFIP_ENV=homo|prod`
- `AFIP_SERVICE=ws_sr_padron_a5`
- `AFIP_CUIT_REPRESENTADA=30712345678`
- `AFIP_CERT_PATH=/run/secrets/afip_cert.crt`
- `AFIP_KEY_PATH=/run/secrets/afip_key.key`
- `REDIS_URL=redis://redis:6379`
- `AFIP_CACHE_TTL_S=86400`

Certificado y clave deben estar disponibles en las rutas configuradas (Docker Secrets).

## Flujo

1. Construcción de TRA (uniqueId, generation/expiration ±1min / +12h).
2. Firmado CMS con `openssl smime` (DER, nodetach).
3. LoginCms WSAA → `token`, `sign`, `expiration`.
4. Cache TA en Redis con TTL dinámico (expiration-now-60s).
5. Llamada SOAP Padrón A5 `getPersona(token, sign, cuitRepresentada, idPersona)`.
6. Parseo XML y normalización a JSON.

## Endpoint

- `GET /api/afip/padron/:cuit`
  - Valida CUIT (11 dígitos + checksum).
  - Cache persona en `afip:a5:persona:${cuit}` con TTL `AFIP_CACHE_TTL_S`.
  - Respuesta JSON:

```json
{
  "cuit": "20301234567",
  "denominacion": "ACME SA",
  "estadoClave": "Activo",
  "domicilioFiscal": {
    "calle": "Falsa",
    "numero": "123",
    "localidad": "CABA",
    "provincia": "Capital Federal",
    "codPostal": "1000"
  },
  "actividades": [
    { "codigo": "1111", "descripcion": "Comercio" }
  ],
  "impuestos": ["IVA"],
  "regimenes": ["MONOTRIBUTO"]
}
```

## Probar con curl

```
curl "http://localhost:3002/api/afip/padron/20301234567"
```

## Errores comunes

- `400 CUIT inválido`: formato o checksum incorrecto.
- `502 AFIP A5 error`: fault SOAP, proveedor caído o WSAA inválido. El TA se renueva automáticamente al expirar.

## Notas Docker

- La imagen `node:20-alpine` instala `openssl`. Asegurar hora sincronizada del contenedor.