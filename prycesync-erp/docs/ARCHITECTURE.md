# PriceSync ERP - Arquitectura del Sistema (Actualizado 2025 Q4)

## 🏗️ Arquitectura General

### Patrón Arquitectural

* **Tipo**: Modular Monolith con **Plugin System** (verticales desacoplados)
* **Frontend**: SPA (Vue 3 + Tailwind) en Electron (desktop)
* **Backend**: API REST **embebida en Electron** (Node.js + Express)
* **Database**: PostgreSQL **single DB** con **schemas por dominio** (core_*) y verticales (mod_*)
* **Deploy**: App de escritorio con backend integrado + **Servidor Central** para licencias/telemetría

### Principios de Diseño

* **Modularidad**: Cada vertical y submódulo en su propio paquete (plugins hot-pluggable)
* **Reutilización**: Core engine (auth, permisos, stock, clientes, reporting) compartido
* **Escalabilidad**: Multi-empresa / **multi-sucursal**; base para **sync** y móvil
* **Mantenibilidad**: Bounded contexts + convenciones de carpetas/código
* **Testabilidad**: DI, puertos/adaptadores, mocks, fixtures y contratos de API

---

## 🌐 Visión de Ecosistema

```
┌──────────────────────────────────────────────┐
│           SERVIDOR CENTRAL (Cloud)           │
│  • API Licencias: validate / status / hb     │
│  • Dashboard monitoreo licencias/uso         │
│  • Canal de updates (Electron Updater)       │
└──────────────────────────────────────────────┘
                ↑ HTTPS (RSA + JWT)
┌──────────────────────────────────────────────┐
│        APP DESKTOP (Electron + Vue 3)        │
│  • POS Ventas: lector HID + ESC/POS          │
│  • Inventario y Catálogo (subcategorías)     │
│  • Combos/Promos, Comisiones                 │
│  • Facturación AFIP + Padrón (Fase 2)        │
│  • IA Pricing (Premium)                      │
│  • Cliente de licencias (activación + hb)    │
└──────────────────────────────────────────────┘
                ↑ REST / IPC
┌──────────────────────────────────────────────┐
│     APP MÓVIL (React Native + SQLite)        │
│  • Pedidos offline, catálogo con imágenes    │
│  • Sync por lotes con Desktop/API            │
└──────────────────────────────────────────────┘
```

---

## 📁 Estructura de Carpetas

```
pricesync-erp/
├── docs/
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── DATABASE_SCHEMA.md
│   └── API_SPECS.md
├── cloud-server/                   # Servidor central de licencias/telemetría
│   ├── src/
│   │   ├── api/licenses.controller.ts
│   │   ├── services/crypto-rsa.ts
│   │   ├── services/telemetry.ts
│   │   └── dashboard/ (panel admin)
│   ├── prisma/ (schema cloud)
│   └── Dockerfile
├── docker/
│   ├── app/Dockerfile
│   ├── db/Dockerfile
│   └── redis/Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── src/
│   ├── main/                      # Proceso principal Electron
│   │   ├── main.ts
│   │   ├── preload.ts
│   │   ├── updater.ts             # Auto-updates
│   │   └── window-manager.ts
│   ├── renderer/                  # Frontend Vue
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── router/
│   │   │   ├── stores/            # Pinia stores (auth, sales, pricing, etc.)
│   │   │   ├── components/        # Design System + business
│   │   │   ├── views/             # POS, Inventory, Pricing, Customers, etc.
│   │   │   ├── styles/            # Tokens + utilidades Tailwind
│   │   │   └── utils/
│   │   └── vite.config.ts
│   ├── backend/                   # API local (Node + Express)
│   │   ├── server.ts
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   ├── licensing/         # cliente licencias (RSA/JWT/hb)
│   │   │   ├── inventory/
│   │   │   ├── customers/         # + padrón AFIP (F2)
│   │   │   ├── billing/           # AFIP (F2)
│   │   │   ├── pricing/
│   │   │   ├── reports/
│   │   │   └── plugins/
│   │   ├── modules/
│   │   │   ├── sales/             # POS (ventas internas / pagos / tickets)
│   │   │   └── auto-parts/        # vertical específico (compatibilidad, etc.)
│   │   ├── shared/ (utils, middleware, validators, errors)
│   │   └── integrations/
│   │       ├── fiscal/argentina   # AFIP/TusFacturasApp (F2)
│   │       ├── ecommerce/mercadolibre
│   │       └── ai/{openai,gemini,claude}/
├── prisma/
│   ├── schema.prisma              # DB local (core_* y mod_*)
│   ├── migrations/
│   └── seeds/
├── tests/ (unit, integration, e2e)
└── scripts/ (setup, migrate, build)
```

---

## 🧩 Sistema de Módulos (Plugin Architecture)

### Interface Base

```ts
interface IModule {
  name: string; version: string; description: string; author: string;
  dependencies: string[]; coreVersion: string;
  routes: Route[]; components: ComponentDefinition[]; services: ServiceDefinition[];
  migrations: Migration[]; permissions: Permission[];
  onInstall(): Promise<void>; onUninstall(): Promise<void>;
  onActivate(): Promise<void>; onDeactivate(): Promise<void>;
  onUpdate(oldVersion: string): Promise<void>;
}
```

### Plugin Manager (resumen)

```ts
class PluginManager {
  private loaded = new Map<string, IModule>();
  async loadPlugin(path: string): Promise<void> {}
  async activatePlugin(name: string): Promise<void> {}
  async deactivatePlugin(name: string): Promise<void> {}
  validateCompatibility(plugin: IModule): boolean { return true; }
  getActive(): IModule[] { return [...this.loaded.values()]; }
}
```

---

## 🗄️ Arquitectura de Base de Datos (PostgreSQL)

### Schemas (core)

* `core_auth` (users, roles, permissions)
* `core_companies` (companies, branches, sequences)
* `core_customers` (customers, addresses)
* `core_inventory` (products, stock, movements)
* `core_billing` (invoices, invoice_items) **(Fase 2)**
* `core_pricing` (price_lists, price_list_items)
* `core_promotions` (promotions)
* `core_sales` (**nuevo**: sales_orders, sales_order_items, sales_payments, pos_shifts, cash_movements)
* `core_commissions` (**nuevo**: salespersons, commissions)
* `core_licensing` (**nuevo**: licenses, license_activations)
* `core_mobile` (**nuevo**: mobile_users, mobile_orders)

### Schemas (verticales)

* `mod_auto_parts` (compatibilidad por vehículo, atributos específicos)
* `mod_retail`, `mod_pharmacy` (futuro)

### Patrones de Acceso

* **Repository Pattern** (Prisma) y **Servicios de Dominio** por bounded context
* **Transacciones** para secuencias/numeración y cierres de caja
* **Índices/Constraints**: UNIQUE por (`company_id`,`branch_id`,`order_number`) en ventas; FKs en cascada; CHECKs en estados/medios de pago

---

## 🖨️ Hardware POS

### Lector de Códigos de Barras (USB HID)

* Detección por **burst** de teclado (renderer)
* Buffer temporal + heurística de fin de lectura
* Fallback a input manual; Enter = confirmar línea

### Impresora Térmica ESC/POS

* Librerías: `escpos`, `escpos-usb`
* Configuración: impresora activa, ancho 58/80mm, logo/plantilla
* Template de ticket: **header** (logo/datos), **items** (prod | cant | p.u. | subtotal), **footer** (total, pagos, fecha/hora, QR CAE cuando aplique)

---

## 📱 App Móvil (React Native + Expo)

* **Offline-first** con SQLite: catálogo + pedidos
* **Sync** por lotes con `/api/mobile/sync` (compresión gzip, paginación)
* **Auth** JWT (7 días) + refresh; `expo-secure-store` para llaves
* **Conflictos**: estrategia simple *last-write-wins* (V1)

---

## 🔐 Seguridad End-to-End

1. **Licenciamiento**

* Servidor central con claves **RSA** (firmas), endpoints: `/licenses/validate`, `/licenses/status/:key`, `/licenses/heartbeat`
* Cliente Desktop: activación inicial, **heartbeat** horario (ventas, productos, usuarios, versión), bloqueo si expira

2. **Aplicación**

* **Ofuscación** JS/TS en build (`javascript-obfuscator`)
* **Integridad**: checksums firmados; code-signing
* **Anti-debug/Anti-VM**; watermarking por licencia; **kill-switch** remoto

3. **Datos**

* DB local **cifrada** (clave derivada de licencia + HWID)
* **HTTPS** obligatorio, **JWT** + rate limiting
* Cache sensible con expiración y rotación de claves

4. **Permisos (RBAC)**

* Roles: `superadmin`, `admin`, `cashier`, `salesperson`, `viewer`
* Scopes por módulo: `sales:*`, `billing:*`, `inventory:*`, `pricing:*`, `licensing:*`

---

## 🔄 Flujo de Datos y Estado (Pinia)

* **Stores core**: `auth`, `company`, `ui`, `licensing`, `notifications`
* **Stores de ventas (POS)**: `sales` (borrador, parqueadas), `payments` (mixtos), `pricing` (lista activa, reglas), `promotions`
* **IPC**: canales `db:*`, `api:*`, `file:*`, `system:*` (renderer ↔ main)

---

## 📡 Integraciones Externas

* **AFIP** (Fase 2): TusFacturasApp — facturación, CAE/QR; **Padrón AFIP** (validación CUIT/CUIL, cache 24h)
* **MercadoLibre API** (Premium): referencias de precios
* **Google Vision** (Premium): identificación visual
* **ESC/POS**: impresión térmica tickets

---

## 📊 Flujos Clave

* **Venta POS**: Lector → buscar → agregar → total → **Imprimir ticket** (objetivo < **30s**)
* **Parquear/Retomar**: venta en curso ↔ lista de parqueadas
* **Caja**: apertura → movimientos (in/out) → cierre y reporte
* **Comisiones**: calcular al cerrar venta → reporte por período
* **Facturación AFIP (F2)**: venta confirmada → validar cliente (Padrón) → AFIP → CAE → PDF/QR
* **Móvil**: crear pedido offline → reconexión → **sync**

---

## 🚀 Deployment y Updates

* **Docker Compose** (desarrollo y prod): app, DB, Redis, cloud-server
* **Electron Builder** con firma y ofuscación
* **Auto-updates** por canal (stable/beta/alpha) desde **Servidor Central**
* **CI/CD** (GitHub Actions): `doctor` / `health` / `test`, empaquetado y notarización

---

## 🛠️ Monitoring & Logging

* **Logging estructurado** (console + file rotating + remoto para errores críticos)
* **Métricas**: response time, uso de memoria/CPU/disk; KPIs de negocio (ventas/hora, tickets, errores POS, latencia AFIP)
* **Alertas**: expiración de licencias, fallas de heartbeat, fallos de impresión

---

## ⚠️ Notas Críticas para Desarrollo

* **Modularidad estricta**: código específico de vertical en su módulo
* **TypeScript estricto** en toda la base
* **Cobertura mínima 80%** en core
* **Docker-only**: cero dependencias locales
* **Estrategia de datos**: sin **scope creep**; reglas claras para combos/promos y cálculos de totales (util único compartido FE/BE)

---

## 🧾 Anexo: Endpoints Clave (resumen)

* **Ventas/POS**:
  `POST /api/sales` · `POST /api/sales/:id/items` · `POST /api/sales/:id/park|resume` · `POST /api/sales/:id/payments` · `POST /api/sales/:id/print`
* **Caja**:
  `POST /api/pos/shifts/open|close` · `POST /api/pos/shifts/:id/cash-movements`
* **Pricing/Promos/Combos**:
  `GET /api/pricing/price-lists` · `POST /api/sales/:id/apply-promotion` · `GET /api/combos`
* **Comisiones**:
  `GET /api/commissions/report?from=&to=`
* **AFIP (F2)**:
  `POST /api/sales/:id/invoice` · `POST /api/customers/validate-cuit`
* **Licencias (cloud)**:
  `POST /api/licenses/validate` · `POST /api/licenses/heartbeat` · `GET /api/licenses/status/:key`
* **Móvil**:
  `POST /api/mobile/auth/login` · `GET /api/mobile/products` · `POST /api/mobile/orders` · `POST /api/mobile/sync`
