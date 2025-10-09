# PriceSync ERP - Stack Tecnológico (Actualizado 2025 Q4)

> **Resumen:** Stack dockerizado, TypeScript-first y modular, con foco en **Ventas POS**, **licenciamiento centralizado**, **móvil offline-first**, **AFIP/Padrón**, **ESC/POS**, **IA Pricing** y **seguridad anti‑crackeo**.

---

## 🧩 Principios Clave

* **Type-safe** extremo (TS estricto en FE/BE).
* **Monorepo** con workspaces (npm) y **Docker** obligatorio.
* **Modular Monolith** con **plugins** por vertical.
* **Performance**: HMR < 500 ms, cold start < 3 s, queries < 100 ms.
* **Security-by-default**: HTTPS, JWT, RSA, ofuscación, integridad.

---

## 💻 Desktop App (Electron + Vue 3)

### Electron

* **Versión:** >= 28.x (LTS)
* **Config:** `contextIsolation: true`, `nodeIntegration: false`, preload para IPC seguro.
* **Updater:** electron‑updater >= 6.x (canales: stable/beta/alpha, GitHub Releases).
* **Builder:** electron‑builder >= 24.x (Windows NSIS/portable; futuro macOS/Linux).
* **Code signing** (por SO) + **javascript‑obfuscator** en build.

### Vue 3 + Vite

* **Vue 3:** >= 3.4.x (Composition API).
* **Vite:** >= 5.x (vite‑plugin‑electron para main/preload).
* **Router 4:** route guards, lazy routes por módulo.
* **Pinia 2:** stores modulares + `pinia-plugin-persistedstate`.
* **Tailwind 3.4:** tokens + DS propio (HeadlessUI + Heroicons).

### Accesibilidad

* **HeadlessUI** (>=1.7.x), **@tailwindcss/forms**, **@tailwindcss/typography**.
* WCAG AA, navegación por teclado, ARIA.

---

## 🗄️ Backend Local (Node.js + Express)

* **Node.js:** >= 20.x LTS (ESM).
* **Express 4.18+** con middleware: `helmet`, `cors`, `compression`, `morgan`, `rate-limiter-flexible`.
* **Validación:** **Zod** 3.22+ (DTOs FE/BE compartidos cuando aplique).
* **HTTP Client:** **Axios** 1.6+ (interceptores + refresh tokens).
* **PDF/Archivos:** `puppeteer` (PDF), `exceljs` (XLSX), `papaparse` (CSV), `sharp` (imágenes).

### Base de Datos

* **PostgreSQL:** >= 15.x (JSONB, FTS, schemas por dominio).
* **Prisma:** >= 5.7.x (migrations, client type‑safe).
* **Redis 7.x:** cache AFIP/ML, rate limiting, colas simples.
* **Cifrado:** `pgcrypto` (campos sensibles) + cifrado de disco/OS.

### Hardware POS

* **Barcode (USB HID):** captura por eventos de teclado (renderer) con buffer/heurística.
* **Impresora térmica (ESC/POS):** `escpos`, `escpos-usb`, plantillas configurables (58/80 mm, logo, QR CAE).

---

## 🌐 Integraciones Externas

* **AFIP (Fase 2):** vía **TusFacturasApp** (emitir, CAE, PDF/QR).
* **Padrón AFIP:** SR‑Padrón v2 (con cache Redis 24h).
* **MercadoLibre API:** búsqueda y pricing comparativo (Premium).
* **Google Cloud Vision:** identificación de piezas por imagen (Premium).
* **OpenAI (GPT‑4):** análisis de mercado/reglas para **IA Pricing**.

> **Nota:** Todas las integraciones detrás de interfaces/estrategias para testear y reemplazar.

---

## 📱 App Móvil (Fase 3)

* **React Native + Expo** (SDK actual): catálogo con imágenes y **pedidos offline**.
* **SQLite** local + `expo-secure-store` (tokens/llaves).
* **Sync REST** (`/api/mobile/sync`): batch, **gzip**, paginación, *last‑write‑wins*.
* **Auth móvil:** JWT 7 días + refresh + rate limit por usuario.

---

## 🔐 Seguridad End‑to‑End

* **JWT** (access 15 min / refresh 7 d) + rotación.
* **RSA** para **licencias** (firma/validación) en **servidor central**.
* **Ofuscación** (`javascript-obfuscator`) + **checksums** y verificación de **integridad**.
* **Anti‑debug / Anti‑VM**, **watermarking** por licencia, **kill‑switch** remoto.
* **CORS** estricto, CSRF no aplica (app desktop), headers de seguridad (`helmet`).

---

## ☁️ Servidor Central (Licencias + Telemetría)

* **Stack:** Node.js + Express + PostgreSQL.
* **Endpoints:** `/api/licenses/validate`, `/status/:key`, `/heartbeat`.
* **Seguridad:** HTTPS, JWT de sesión, claves **RSA** para firma.
* **Dashboard Admin**: monitoreo de heartbeats/alertas, gestión de licencias.

---

## 🧪 Testing & QA

* **Vitest 1.x** (unit + integration), **Testing Library Vue 8.x** (UI).
* **Playwright 1.40+** (E2E multi‑browser).
* **Contract tests** para integraciones (pactos ligeros / mocks).
* **Coverage objetivo:** ≥ 80% en core.

---

## 🐳 DevOps & Delivery

* **Docker** 24+ / **Compose** 2.21+: servicios `app`, `db`, `redis`, `cloud-server`.
* **CI/CD (GitHub Actions):** jobs `doctor`, `health`, `test`, build Electron, code‑sign y release.
* **Artefactos:** `dist-electron` (NSIS/portable), checksums firmados.
* **Config:** `.env` + `.env.production` (secrets cifrados).

### Scripts NPM (convención)

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:vite\" \"npm:dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "electron .",
    "build": "npm run build:vite && npm run build:electron",
    "build:vite": "vite build",
    "build:electron": "electron-builder",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## 🔎 Observabilidad

* **Winston** 3.11+ (console/file/remote), logs estructurados (JSON).
* **Sentry** 7.x (opcional) para errores/performance en renderer + main + backend local.
* **Métricas** negocio/técnicas expuestas en health endpoints (p.ej. `/api/health`, `/api/doctor`).

---

## 🌍 I18n

* **vue‑i18n** 9.8+: `es-AR` (base), `es-PY`, `es-BO`, `en-US` (fallback).
* Cargas lazy por módulo, claves namespaced.

---

## 📦 Dependencias NO Negociables

* **Vue 3**, **TypeScript**, **Tailwind v3** (no Bootstrap/Material), **PostgreSQL**, **Prisma**.
* API **oficial** MercadoLibre (sin scraping).
* Docker obligatorio (cero dependencias locales).

---

## 🎯 Objetivos de Performance

* **Cold start** < 3 s  ·  **HMR** < 500 ms  ·  **API** < 1 s  ·  **Bundle** ≤ 50 MB.

---

## 🔐 Variables de Entorno (ejemplo)

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@db:5432/pricesync
REDIS_URL=redis://redis:6379

OPENAI_API_KEY=...
GOOGLE_VISION_API_KEY=...
TUSFACTURAS_API_KEY=...
MERCADOLIBRE_CLIENT_ID=...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

---

## 📚 Snippets de Referencia

### Electron (main)

```ts
const win = new BrowserWindow({
  width: 1400, height: 900, minWidth: 1200, minHeight: 700,
  webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname,'preload.js'), webSecurity: true }
});
```

### Express (server)

```ts
app.use(helmet()); app.use(cors({ origin: isDev ? 'http://localhost:5173' : false }));
app.use(compression()); app.use(express.json({ limit: '10mb' }));
```

### Prisma (schema)

```prisma
model User { id String @id @default(cuid()) email String @unique name String role UserRole companyId String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt @@schema("core_auth") }
```

---

## ✅ Checklist de Alineación con Requerimientos

* POS con **lector** y **ESC/POS** listo.
* **Licenciamiento** RSA + heartbeat.
* **Móvil** RN + SQLite offline + sync.
* **AFIP** (F2) + **Padrón** con cache.
* **IA Pricing** (ML + Vision + GPT‑4).
* **Comisiones**, **promos**, **combos** soportados a nivel API/DB.
* **Seguridad** anti‑crackeo aplicada en build.
