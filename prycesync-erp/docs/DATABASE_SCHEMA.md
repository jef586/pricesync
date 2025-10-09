# PriceSync ERP - Database Schema (Actualizado 2025 Q4)

> **Alcance:** Este esquema fusiona el **original** con los **nuevos requerimientos**: Ventas POS como core, lector/impresora, subcategorías, combos/ofertas, comisiones, licencias + monitoreo, Padrón AFIP, migraciones, métricas físicas, móvil offline, seguridad.

---

## 🗄️ Arquitectura de Base de Datos

### Estrategia Multi‑Schema (PostgreSQL)

```sql
-- Core (universales)
CREATE SCHEMA core_auth;        -- Usuarios, roles, permisos, sesiones
CREATE SCHEMA core_companies;   -- Empresas, sucursales, secuencias
CREATE SCHEMA core_customers;   -- Clientes, direcciones, validación AFIP
CREATE SCHEMA core_inventory;   -- Productos, categorías, stock y movimientos
CREATE SCHEMA core_pricing;     -- Listas de precios
CREATE SCHEMA core_promotions;  -- Promos/ofertas
CREATE SCHEMA core_sales;       -- Ventas POS, pagos, caja
CREATE SCHEMA core_billing;     -- Facturación (AFIP) - Fase 2
CREATE SCHEMA core_commissions; -- Vendedores y comisiones
CREATE SCHEMA core_licensing;   -- Licencias locales y activaciones
CREATE SCHEMA core_mobile;      -- Sync móvil/offline
CREATE SCHEMA core_reports;     -- Reportes y schedulers
CREATE SCHEMA core_system;      -- Settings, módulos, versiones

-- Verticales
CREATE SCHEMA mod_auto_parts;   -- Específico repuestos (compatibilidad, ML, etc.)
CREATE SCHEMA mod_retail;       -- Futuro
CREATE SCHEMA mod_pharmacy;     -- Futuro
```

### Principios de Diseño

* **3NF** mínima y tipos fuertes (ENUM/CHECK).
* **Auditoría**: `created_at`, `updated_at`, `deleted_at` (soft delete) donde aplique.
* **CUID/UUID** como PK (`TEXT` con `gen_random_uuid()` o función CUID según extensión).
* **Índices** para búsquedas, joins y ordenamientos críticos.
* **RLS opcional** por `company_id` (no habilitado por defecto).

> **Nota:** se reemplaza `products.images TEXT[]` por **tabla normalizada** `product_images`. Mantener el campo legacy temporalmente.

---

## 👤 core_auth (Auth & Permisos)

### Enums

```sql
CREATE TYPE user_role   AS ENUM ('superadmin','admin','manager','cashier','salesperson','user','viewer');
CREATE TYPE user_status AS ENUM ('active','inactive','suspended');
```

### users

```sql
CREATE TABLE core_auth.users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL REFERENCES core_companies.companies(id),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  role          user_role   NOT NULL DEFAULT 'user',
  status        user_status NOT NULL DEFAULT 'active',
  preferences   JSONB       NOT NULL DEFAULT '{}',
  timezone      TEXT        NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  last_login    TIMESTAMP,
  created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMP
);
```

### permissions & role_permissions

```sql
CREATE TABLE core_auth.permissions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,   -- p.ej. 'sales:create'
  description TEXT,
  module      TEXT NOT NULL,          -- 'core','sales','inventory','auto-parts'
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_auth.role_permissions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  permission_id TEXT NOT NULL REFERENCES core_auth.permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(role, permission_id)
);
```

### user_sessions

```sql
CREATE TABLE core_auth.user_sessions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES core_auth.users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL,
  refresh_hash TEXT NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🏢 core_companies (Empresas & Sucursales)

### Enums

```sql
CREATE TYPE company_status AS ENUM ('active','inactive','suspended','trial');
CREATE TYPE branch_status  AS ENUM ('active','inactive');
```

### companies

```sql
CREATE TABLE core_companies.companies (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  legal_name   TEXT,
  tax_id       TEXT UNIQUE NOT NULL,   -- CUIT
  tax_type     TEXT NOT NULL,          -- 'RI','Monotributo', etc.
  email        TEXT,
  phone        TEXT,
  website      TEXT,
  address_street TEXT NOT NULL,
  address_number TEXT,
  address_city   TEXT NOT NULL,
  address_state  TEXT NOT NULL,
  address_country TEXT NOT NULL DEFAULT 'AR',
  address_postal_code TEXT,
  fiscal_config JSONB NOT NULL DEFAULT '{}',
  status       company_status NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMP
);
```

### branches

```sql
CREATE TABLE core_companies.branches (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  code         TEXT NOT NULL,              -- código interno / PV
  afip_point_of_sale INTEGER,              -- AFIP (Fase 2)
  is_main      BOOLEAN NOT NULL DEFAULT FALSE,
  status       branch_status NOT NULL DEFAULT 'active',
  address_street TEXT NOT NULL,
  address_number TEXT,
  address_city   TEXT NOT NULL,
  address_state  TEXT NOT NULL,
  address_country TEXT NOT NULL DEFAULT 'AR',
  address_postal_code TEXT,
  phone        TEXT,
  email        TEXT,
  manager_name TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMP,
  UNIQUE(company_id, code)
);
```

### secuencias (para facturación y numeradores por sucursal)

```sql
CREATE TABLE core_companies.sequences (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  branch_id    TEXT REFERENCES core_companies.branches(id) ON DELETE CASCADE,
  scope        TEXT NOT NULL,        -- 'invoice:A','sales:order','ticket'
  current_value BIGINT NOT NULL DEFAULT 0,
  step         INTEGER NOT NULL DEFAULT 1,
  UNIQUE(company_id, branch_id, scope)
);
```

---

## 👥 core_customers (Clientes + Padrón AFIP)

### Enums

```sql
CREATE TYPE customer_type      AS ENUM ('individual','company');
CREATE TYPE customer_tax_type  AS ENUM ('monotributo','responsable_inscripto','exento','consumidor_final');
CREATE TYPE customer_status    AS ENUM ('active','inactive','blocked');
```

### customers

```sql
CREATE TABLE core_customers.customers (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  legal_name   TEXT,
  tax_id       TEXT,
  tax_type     customer_tax_type,
  customer_type customer_type NOT NULL DEFAULT 'individual',
  email        TEXT,
  phone        TEXT,
  mobile       TEXT,
  website      TEXT,
  address_street TEXT,
  address_number TEXT,
  address_floor TEXT,
  address_apartment TEXT,
  address_city  TEXT,
  address_state TEXT,
  address_country TEXT DEFAULT 'AR',
  address_postal_code TEXT,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_terms INTEGER NOT NULL DEFAULT 0,
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  category     TEXT,
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes        TEXT,
  tags         TEXT[],
  status       customer_status NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMP
);
```

### afip_cache (validaciones CUIT/CUIL)

```sql
CREATE TABLE core_customers.afip_cache (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_id     TEXT UNIQUE NOT NULL,      -- CUIT/CUIL
  payload    JSONB NOT NULL,            -- respuesta padrón
  fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_afip_cache_valid ON core_customers.afip_cache (tax_id) WHERE expires_at > NOW();
```

---

## 📦 core_inventory (Productos, Categorías, Stock)

### products

```sql
CREATE TABLE core_inventory.products (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  sku              TEXT NOT NULL,
  barcode          TEXT,
  name             TEXT NOT NULL,
  description      TEXT,
  short_description TEXT,
  category_id      TEXT REFERENCES core_inventory.categories(id),
  brand            TEXT,
  model            TEXT,
  cost_price       DECIMAL(12,4) NOT NULL DEFAULT 0,
  selling_price    DECIMAL(12,4) NOT NULL DEFAULT 0,
  min_price        DECIMAL(12,4) NOT NULL DEFAULT 0,
  suggested_price  DECIMAL(12,4),
  track_stock      BOOLEAN NOT NULL DEFAULT TRUE,
  stock_quantity   DECIMAL(10,3) NOT NULL DEFAULT 0,
  stock_reserved   DECIMAL(10,3) NOT NULL DEFAULT 0,
  stock_minimum    DECIMAL(10,3) NOT NULL DEFAULT 0,
  stock_maximum    DECIMAL(10,3),
  unit_type        TEXT NOT NULL DEFAULT 'unit', -- unit|kg|liter|meter
  unit_quantity    DECIMAL(10,3) DEFAULT 1,      -- 1L, 5kg, etc.
  unit_weight      DECIMAL(8,3),
  unit_dimensions  JSONB,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_taxable       BOOLEAN NOT NULL DEFAULT TRUE,
  tax_rate         DECIMAL(5,2) NOT NULL DEFAULT 21.00,
  tags             TEXT[],
  specifications   JSONB NOT NULL DEFAULT '{}',
  images           TEXT[], -- LEGACY, se migrará a product_images
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMP,
  UNIQUE(company_id, sku)
);
```

### product_images (nuevo)

```sql
CREATE TABLE core_inventory.product_images (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  TEXT NOT NULL REFERENCES core_inventory.products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_product_images_product ON core_inventory.product_images(product_id);
```

### categories (árbol de subcategorías)

```sql
CREATE TABLE core_inventory.categories (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT,
  description TEXT,
  parent_id   TEXT REFERENCES core_inventory.categories(id) ON DELETE SET NULL,
  level       INTEGER NOT NULL DEFAULT 0,
  path        TEXT,                                 -- materialized path
  margin_rate DECIMAL(5,2),                         -- margen por defecto
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMP,
  UNIQUE(company_id, name, parent_id)
);
```

### stock_movements

```sql
CREATE TYPE movement_type AS ENUM (
  'initial_stock','purchase','sale','adjustment_plus','adjustment_minus',
  'transfer_in','transfer_out','return_in','return_out'
);

CREATE TABLE core_inventory.stock_movements (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL REFERENCES core_inventory.products(id) ON DELETE CASCADE,
  branch_id    TEXT REFERENCES core_companies.branches(id) ON DELETE SET NULL,
  movement_type movement_type NOT NULL,
  quantity     DECIMAL(10,3) NOT NULL,  -- + entrada / - salida
  cost_price   DECIMAL(12,4),
  reference_type TEXT,                   -- 'invoice','sale','adjustment','transfer'
  reference_id   TEXT,
  notes         TEXT,
  batch_number  TEXT,
  expiry_date   DATE,
  user_id       TEXT NOT NULL REFERENCES core_auth.users(id),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (quantity <> 0)
);
CREATE INDEX idx_stock_movements_product ON core_inventory.stock_movements(product_id, created_at DESC);
```

---

## 💵 core_pricing (Listas de precios)

```sql
CREATE TABLE core_pricing.price_lists (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'ARS',
  rounding_rule TEXT,                 -- p.ej. round_5, round_10
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_pricing.price_list_items (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id TEXT NOT NULL REFERENCES core_pricing.price_lists(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES core_inventory.products(id) ON DELETE CASCADE,
  price         DECIMAL(12,4) NOT NULL,
  min_price     DECIMAL(12,4),
  max_discount  DECIMAL(5,2),
  UNIQUE(price_list_id, product_id)
);
```

---

## 🎯 core_promotions (Promos y Ofertas)

```sql
CREATE TYPE promo_type AS ENUM ('percent','fixed','bxgy');

CREATE TABLE core_promotions.promotions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        promo_type NOT NULL,
  value       DECIMAL(12,4) NOT NULL,      -- % o monto
  start_at    TIMESTAMP NOT NULL,
  end_at      TIMESTAMP,
  conditions  JSONB NOT NULL DEFAULT '{}', -- categoría, qty mínima, etc.
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🧾 core_sales (Ventas POS, Pagos, Caja)

### Enums

```sql
CREATE TYPE sale_status   AS ENUM ('draft','confirmed','paid','cancelled');
CREATE TYPE pay_method    AS ENUM ('cash','debit','credit','transfer','other');
CREATE TYPE shift_status  AS ENUM ('open','closed');
```

### sales_orders

```sql
CREATE TABLE core_sales.sales_orders (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  branch_id     TEXT NOT NULL REFERENCES core_companies.branches(id) ON DELETE CASCADE,
  customer_id   TEXT REFERENCES core_customers.customers(id) ON DELETE SET NULL,
  order_number  BIGINT NOT NULL,
  status        sale_status NOT NULL DEFAULT 'draft',
  price_list_id TEXT REFERENCES core_pricing.price_lists(id),
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  surcharge_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  rounding_diff DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  channel       TEXT NOT NULL DEFAULT 'pos', -- pos|web|admin
  cashier_id    TEXT REFERENCES core_auth.users(id),
  park_token    TEXT,
  parked_at     TIMESTAMP,
  invoice_id    TEXT REFERENCES core_billing.invoices(id), -- Fase 2
  created_by    TEXT NOT NULL REFERENCES core_auth.users(id),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, branch_id, order_number)
);
```

### sales_order_items

```sql
CREATE TABLE core_sales.sales_order_items (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id TEXT NOT NULL REFERENCES core_sales.sales_orders(id) ON DELETE CASCADE,
  product_id    TEXT REFERENCES core_inventory.products(id) ON DELETE SET NULL,
  sku           TEXT,
  description   TEXT NOT NULL,
  quantity      DECIMAL(10,3) NOT NULL,
  unit_price    DECIMAL(12,4) NOT NULL,
  discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_rate      DECIMAL(5,2) NOT NULL DEFAULT 21.00,
  subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0,
  total         DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_weighted   BOOLEAN NOT NULL DEFAULT FALSE,
  promo_id      TEXT REFERENCES core_promotions.promotions(id),
  line_number   INTEGER NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### sales_payments

```sql
CREATE TABLE core_sales.sales_payments (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id TEXT NOT NULL REFERENCES core_sales.sales_orders(id) ON DELETE CASCADE,
  method        pay_method NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  method_details JSONB NOT NULL DEFAULT '{}', -- brand, last4, cuotas, authCode
  payment_date  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### pos_shifts & cash_movements

```sql
CREATE TABLE core_sales.pos_shifts (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    TEXT NOT NULL REFERENCES core_companies.companies(id) ON DELETE CASCADE,
  branch_id     TEXT NOT NULL REFERENCES core_companies.branches(id) ON DELETE CASCADE,
  opened_by     TEXT NOT NULL REFERENCES core_auth.users(id),
  opening_float DECIMAL(12,2) NOT NULL DEFAULT 0,
  declared_cash DECIMAL(12,2),
  closed_by     TEXT REFERENCES core_auth.users(id),
  closed_at     TIMESTAMP,
  status        shift_status NOT NULL DEFAULT 'open',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_sales.cash_movements (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id   TEXT NOT NULL REFERENCES core_sales.pos_shifts(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('in','out')),
  amount     DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  reason     TEXT,
  created_by TEXT NOT NULL REFERENCES core_auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### returns (Notas de crédito desde venta) – opcional V1.1

```sql
CREATE TABLE core_sales.returns (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id TEXT NOT NULL REFERENCES core_sales.sales_orders(id) ON DELETE CASCADE,
  invoice_id    TEXT REFERENCES core_billing.invoices(id), -- si existiera
  reason        TEXT,
  created_by    TEXT NOT NULL REFERENCES core_auth.users(id),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_sales.return_items (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id   TEXT NOT NULL REFERENCES core_sales.returns(id) ON DELETE CASCADE,
  order_item_id TEXT NOT NULL REFERENCES core_sales.sales_order_items(id) ON DELETE CASCADE,
  quantity    DECIMAL(10,3) NOT NULL,
  amount      DECIMAL(12,2) NOT NULL
);
```

---

## 🧾 core_billing (Facturación AFIP) — Fase 2

*(basado en el original; se mantiene casi igual con vínculo `sales_orders.invoice_id`)*

### Enums

```sql
CREATE TYPE invoice_type   AS ENUM ('A','B','C','CREDIT_A','CREDIT_B','CREDIT_C','DEBIT_A','DEBIT_B','DEBIT_C');
CREATE TYPE invoice_status AS ENUM ('draft','pending','sent','paid','overdue','cancelled');
CREATE TYPE afip_status    AS ENUM ('pending','approved','rejected','error');
```

### invoices & invoice_items & invoice_payments

```sql
-- (idéntico a la versión original, con UNIQUE (company_id, invoice_type, point_of_sale, invoice_number))
```

---

## 👤 core_commissions (Vendedores & Comisiones)

```sql
CREATE TABLE core_commissions.salespersons (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT UNIQUE NOT NULL REFERENCES core_auth.users(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_commissions.commissions (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id TEXT NOT NULL REFERENCES core_commissions.salespersons(id) ON DELETE CASCADE,
  sales_order_id TEXT NOT NULL REFERENCES core_sales.sales_orders(id) ON DELETE CASCADE,
  base_amount    DECIMAL(12,2) NOT NULL,
  rate           DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(12,2) NOT NULL,
  period_from    DATE NOT NULL,
  period_to      DATE NOT NULL,
  settled        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(salesperson_id, sales_order_id)
);
```

---

## 🔐 core_licensing (Licencias locales)

```sql
CREATE TABLE core_licensing.licenses (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key  TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  plan         TEXT NOT NULL CHECK (plan IN ('standard','premium')),
  status       TEXT NOT NULL CHECK (status IN ('active','expired','revoked')) DEFAULT 'active',
  expires_at   TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE core_licensing.license_activations (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id     TEXT NOT NULL REFERENCES core_licensing.licenses(id) ON DELETE CASCADE,
  device_id      TEXT NOT NULL, -- HWID
  activated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMP,
  version        TEXT,
  meta           JSONB NOT NULL DEFAULT '{}'
);
```

---

## 📱 core_mobile (Móvil Offline‑First)

```sql
CREATE TABLE core_mobile.mobile_users (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT UNIQUE NOT NULL REFERENCES core_auth.users(id) ON DELETE CASCADE,
  device_id  TEXT,
  last_sync_at TIMESTAMP
);

CREATE TABLE core_mobile.mobile_orders (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id TEXT NOT NULL REFERENCES core_commissions.salespersons(id) ON DELETE CASCADE,
  customer_id   TEXT REFERENCES core_customers.customers(id) ON DELETE SET NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending','synced','error')) DEFAULT 'pending',
  payload       JSONB NOT NULL, -- snapshot de la orden
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  synced_at     TIMESTAMP
);
```

---

## 🚗 mod_auto_parts (Esquema vertical Auto‑Parts)

*(mantiene tablas del original con ajustes menores)*

* `vehicle_brands`, `vehicle_models`, `part_categories`, `part_compatibility`
* `ml_price_history`, `ai_price_analysis`, `supplier_price_lists`, `supplier_price_items`

> Se recomienda indexación adicional por `brand_id, model_id` y vigencia de análisis (`expires_at`).

---

## 📊 core_reports (Reportes & Scheduler)

*(igual al original; asegurar permisos por `required_permission` y filtros por `company_id`)*

---

## 🧩 core_system (Settings, Módulos, Versionado)

*(igual al original + `schema_versions` para control de cambios)*

```sql
CREATE TABLE core_system.schema_versions (
  id          SERIAL PRIMARY KEY,
  version     TEXT NOT NULL,
  applied_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  rollback_sql TEXT,
  description TEXT
);
```

---

## 📈 Índices Clave

```sql
-- Auth
CREATE INDEX idx_users_email ON core_auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_user ON core_auth.user_sessions(user_id, expires_at);

-- Ventas
CREATE INDEX idx_sales_company_date ON core_sales.sales_orders(company_id, created_at DESC);
CREATE INDEX idx_sales_customer ON core_sales.sales_orders(customer_id) WHERE status <> 'cancelled';
CREATE INDEX idx_sales_payments_order ON core_sales.sales_payments(sales_order_id);

-- Facturación
CREATE INDEX idx_invoices_company_date ON core_billing.invoices(company_id, invoice_date);
CREATE INDEX idx_invoices_customer ON core_billing.invoices(customer_id) WHERE deleted_at IS NULL;

-- Inventario
CREATE INDEX idx_products_company_sku ON core_inventory.products(company_id, sku);
CREATE INDEX idx_products_search ON core_inventory.products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description,'')));
CREATE INDEX idx_categories_path ON core_inventory.categories(path);
CREATE INDEX idx_stock_product_date ON core_inventory.stock_movements(product_id, created_at DESC);

-- Auto‑parts
CREATE INDEX idx_compat_brand_model ON mod_auto_parts.part_compatibility(brand_id, model_id);
CREATE INDEX idx_ml_price_date ON mod_auto_parts.ml_price_history(product_id, scraped_at DESC);
CREATE INDEX idx_ai_analysis_valid ON mod_auto_parts.ai_price_analysis(product_id, expires_at) WHERE expires_at > NOW();
```

---

## ✅ Constraints y Reglas de Negocio

```sql
ALTER TABLE core_billing.invoices
  ADD CONSTRAINT chk_invoice_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND total_amount >= 0);

ALTER TABLE core_billing.invoice_items
  ADD CONSTRAINT chk_item_amounts CHECK (quantity > 0 AND unit_price >= 0);

ALTER TABLE core_inventory.products
  ADD CONSTRAINT chk_prices CHECK (cost_price >= 0 AND selling_price >= 0);

ALTER TABLE core_sales.sales_order_items
  ADD CONSTRAINT chk_sales_item CHECK (quantity > 0 AND unit_price >= 0);

ALTER TABLE core_sales.sales_orders
  ADD CONSTRAINT chk_total_non_negative CHECK (subtotal >= 0 AND total_amount >= 0);
```

---

## 🔄 Migraciones & Backwards‑Compatibility

* **Imágenes de producto**: poblar `core_inventory.product_images` desde `products.images[]`; luego deprecate.
* **Numeradores**: mover a `core_companies.sequences` por `scope`.
* **Relleno inicial**: crear `price_lists` por defecto y rol/permissions mínimos.

### Recomendación de Migrations (Prisma)

1. Crear nuevos schemas/tablas (`core_sales`, `core_pricing`, `core_promotions`, `core_commissions`, `core_licensing`, `core_mobile`).
2. Migrar datos legacy de imágenes.
3. Crear índices y constraints.
4. Semillas (roles, permisos, lista de precios “General”).

---

## 🔐 Seguridad & RLS (opcional)

* Columnas `company_id` obligatorias para scoping.
* Políticas RLS por `company_id` si se habilita (capa adicional).
* Encriptar campos sensibles en `core_system.settings` cuando `is_secret = TRUE`.

---

## ⚠️ Notas para Desarrollo

* **Soft deletes** en entidades maestras (clientes, productos) y documentos (ventas/facturas).
* **Transacciones** al confirmar ventas (descuento stock) y cierres de caja.
* **Idempotencia** en creación de pagos y park/resume.
* **TTL** en `core_customers.afip_cache` (24h por defecto).
