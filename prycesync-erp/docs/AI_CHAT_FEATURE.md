# Chat IA para Consultas de Inventario

## 📋 Descripción General

Chat IA integrado en PryceSync ERP que permite consultas en lenguaje natural sobre stock, precios y productos. Implementado con Backend Node 20 + Express + Prisma y Frontend Vue 3 + Pinia + Tailwind.

**Estado**: ✅ Implementado (MVP) — con seguridad, rate-limiting y auditoría básica.

## 🎯 Objetivos

- Consultar inventario (stock, precios, productos) con lenguaje natural.
- Responder con datos reales del ERP y formato claro para la UI.
- Seguridad: validación SQL, sanitización de inputs y consultas parametrizadas.
- Experiencia similar a ChatGPT con modo oscuro y sugerencias.

## 🏗️ Arquitectura Técnica

### Frontend
```
src/renderer/src/components/business/
└── ChatInterface.vue           # Contenedor del chat
    ├── ChatWindow.vue         # Lista de mensajes
    ├── ChatInput.vue          # Input de texto y envío
    ├── ChatMessage.vue        # Burbuja + tabla de resultados
    └── ChatTyping.vue         # Indicador de escritura

src/renderer/src/stores/modules/auto-parts/
└── chat.ts                    # Store Pinia (historial persistente)
```

Ruta protegida:
- `/ai-chat` → `AIChatView.vue`

### Backend
```
src/backend/integrations/ai/chat-service/
├── query-processor.js         # Heurísticas NL + fallback IA JSON
├── sql-validator.js           # Valida solo SELECT y tablas permitidas
├── response-formatter.js      # Construye payload tabla para UI
└── context-manager.js         # Proveedor, límites, tablas permitidas

src/backend/services/ChatService.js       # Orquesta, audita y formatea
src/backend/controllers/ChatController.js # Validación input + endpoint
src/backend/routes/ai.js                  # POST /api/ai/chat con rate-limit
```

- Prisma consulta: `articles`, `stock_balances`, `categories`.
- Auditoría: `core_reports/ai_chat.log` (JSONL por línea)

## 🔧 Configuración

Variables `.env.docker` (Dockerizado):
```
OPENAI_API_KEY=
AI_PROVIDER=openai
AI_MAX_TOKENS=300
VITE_AI_PROVIDER=openai
```

- `AI_PROVIDER`: `openai` (otros proveedores planificados)
- `AI_MAX_TOKENS`: límite de tokens por respuesta IA
- `VITE_AI_PROVIDER`: mostrado en la UI

## 🚀 Uso

### Endpoint Express (validado con Postman)
- Método: `POST`
- URL: `http://localhost:3002/api/ai/chat`
- Body JSON: `{ "text": "stock del filtro de aceite Mann" }`
- Respuesta:
```
{
  ok: true,
  message: "Encontrados N resultado(s).",
  payload: {
    type: "table",
    count: N,
    data: [ { id, name, sku, pricePublic, stockOnHand } ],
    meta: { source: "heuristic|ai_json", timestamp }
  },
  elapsedMs: 123
}
```

### Interfaz de Usuario (Electron + Vue 3)
- Abrir `/ai-chat` en el ERP.
- Escribir consultas (ejemplos):
  - "Stock del alternador Bosch 12V?"
  - "Precio del filtro de aceite Mann?"
  - "Productos de la categoría Frenos"
- Historial persiste hasta cerrar sesión.
- Modo oscuro respeta tema del sistema.

## 🔒 Seguridad

- Rate-limiting: 10 req/min/usuario/ip.
- Sanitización de texto en `query-processor.js`.
- `sql-validator.js`: solo `SELECT`, sin `INSERT/UPDATE/DELETE`, sin `;`.
- Tablas permitidas: `products`, `inventory`, `categories` (mapeadas a tablas reales).
- Consultas Prisma parametrizadas.

## 🧪 Pruebas

- Vitest unit tests:
  - `sql-validator.spec.js` → casos válidos/ inválidos.
  - `query-processor.spec.js` → heurísticas y fallback IA (mock provider/prisma).
  - `ChatService.spec.js` → auditoría y formateo (mock processQuery y fs).
- Playwright: navegación básica a `/ai-chat` y render de componentes.
- Objetivo cobertura: ≥ 70% en módulo IA.

## 📊 Logs y Auditoría

- Archivo: `core_reports/ai_chat.log` (JSON por línea)
- Campos: `{ type, userId, text, source, error, count, elapsedMs, at }`

## 🧭 Definition of Done (DoD)

- Endpoint `/api/ai/chat` funcionando y probado en Postman.
- UI renderizada dentro del ERP dockerizado sin errores.
- Logs en `core_reports` por cada consulta.
- Tests mínimos con cobertura ≥ 70% en módulo IA.
- Documentación actualizada (este documento).

## 📝 Notas

- Proveedores adicionales (`claude`, `gemini`) planificados.
- Ajustar prompts y heurísticas según feedback.
- Considerar permisos/roles para filtrar resultados por compañía.