# PriceSync ERP - Database Schema

## 🗄️ Arquitectura de Base de Datos

### Estrategia Multi-Schema
Utilizamos esquemas separados para mantener modularidad y permitir expansión fácil:

```sql
-- Core schemas (universales - todos los módulos)
CREATE SCHEMA core_auth;        -- Usuarios, roles, permisos
CREATE SCHEMA core_billing;     -- Facturación universal  
CREATE SCHEMA core_inventory;   -- Inventario universal
CREATE SCHEMA core_customers;   -- Gestión de clientes (CRM)
CREATE SCHEMA core_reports;     -- Sistema de reportes
CREATE SCHEMA core_companies;   -- Multi-empresa
CREATE SCHEMA core_system;      -- Configuración sistema

-- Módulo-specific schemas
CREATE SCHEMA mod_auto_parts;   -- Específico repuestos
CREATE SCHEMA mod_retail;       -- Específico retail (futuro)
CREATE SCHEMA mod_pharmacy;     -- Específico farmacia (futuro)
```

### Principios de Diseño
- **Normalización**: 3NF mínimo para integridad datos
- **Auditabilidad**: created_at, updated_at, deleted_at en todas las tablas
- **Soft Deletes**: deleted_at para mantener integridad referencial
- **UUIDs**: Claves primarias tipo CUID para distribución futura
- **Indexes**: Optimizados para queries frecuentes
- **Constraints**: Foreign keys y check constraints para data integrity

## 📋 Core Schema: Authentication & Authorization

### core_auth.users
```sql
CREATE TABLE core_auth.users (
    id            TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    avatar_url    TEXT,
    role          user_role NOT NULL DEFAULT 'user',
    status        user_status NOT NULL DEFAULT 'active',
    
    -- Relaciones
    company_id    TEXT NOT NULL REFERENCES core_companies.companies(id),
    
    -- Auditoria
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW(),
    deleted_at    TIMESTAMP,
    last_login    TIMESTAMP,
    
    -- Configuración personal
    preferences   JSONB DEFAULT '{}',
    timezone      TEXT DEFAULT 'America/Argentina/Buenos_Aires'
);

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
```

### core_auth.permissions
```sql
CREATE TABLE core_auth.permissions (
    id          TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    name        TEXT UNIQUE NOT NULL, -- 'billing:create', 'inventory:read'
    description TEXT,
    module      TEXT NOT NULL, -- 'core', 'auto-parts', 'retail'
    
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### core_auth.role_permissions
```sql
CREATE TABLE core_auth.role_permissions (
    id            TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    role          user_role NOT NULL,
    permission_id TEXT NOT NULL REFERENCES core_auth.permissions(id),
    
    created_at    TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(role, permission_id)
);
```

### core_auth.user_sessions
```sql
CREATE TABLE core_auth.user_sessions (
    id           TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    user_id      TEXT NOT NULL REFERENCES core_auth.users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL,
    refresh_hash TEXT NOT NULL,
    expires_at   TIMESTAMP NOT NULL,
    ip_address   INET,
    user_agent   TEXT,
    
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);
```

## 🏢 Core Schema: Companies & Multi-tenant

### core_companies.companies
```sql
CREATE TABLE core_companies.companies (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    name                TEXT NOT NULL,
    legal_name          TEXT,
    tax_id              TEXT UNIQUE NOT NULL, -- CUIT en Argentina
    tax_type            TEXT NOT NULL, -- 'monotributo', 'responsable_inscripto'
    
    -- Contacto
    email               TEXT,
    phone               TEXT,
    website             TEXT,
    
    -- Dirección fiscal
    address_street      TEXT NOT NULL,
    address_number      TEXT,
    address_floor       TEXT,
    address_apartment   TEXT,
    address_city        TEXT NOT NULL,
    address_state       TEXT NOT NULL,
    address_country     TEXT NOT NULL DEFAULT 'AR',
    address_postal_code TEXT,
    
    -- Configuración fiscal
    fiscal_config       JSONB DEFAULT '{}', -- Configuración por país
    
    -- Estado y auditoría
    status              company_status NOT NULL DEFAULT 'active',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    deleted_at          TIMESTAMP
);

CREATE TYPE company_status AS ENUM ('active', 'inactive', 'suspended', 'trial');
```

### core_companies.branches
```sql
CREATE TABLE core_companies.branches (
    id             TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id     TEXT NOT NULL REFERENCES core_companies.companies(id),
    name           TEXT NOT NULL,
    code           TEXT NOT NULL, -- Punto de venta AFIP
    
    -- Dirección sucursal
    address_street      TEXT NOT NULL,
    address_number      TEXT,
    address_city        TEXT NOT NULL,
    address_state       TEXT NOT NULL,
    address_country     TEXT NOT NULL DEFAULT 'AR',
    address_postal_code TEXT,
    
    -- Contacto
    phone          TEXT,
    email          TEXT,
    manager_name   TEXT,
    
    -- Configuración fiscal
    afip_point_of_sale INTEGER, -- Punto de venta AFIP
    
    is_main        BOOLEAN DEFAULT FALSE,
    status         branch_status DEFAULT 'active',
    
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW(),
    deleted_at     TIMESTAMP,
    
    UNIQUE(company_id, code)
);

CREATE TYPE branch_status AS ENUM ('active', 'inactive');
```

## 👥 Core Schema: Customer Management (CRM)

### core_customers.customers
```sql
CREATE TABLE core_customers.customers (
    id              TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id      TEXT NOT NULL REFERENCES core_companies.companies(id),
    
    -- Información básica
    name            TEXT NOT NULL,
    legal_name      TEXT,
    tax_id          TEXT, -- CUIT/DNI
    tax_type        customer_tax_type,
    customer_type   customer_type NOT NULL DEFAULT 'individual',
    
    -- Contacto
    email           TEXT,
    phone           TEXT,
    mobile          TEXT,
    website         TEXT,
    
    -- Dirección principal
    address_street      TEXT,
    address_number      TEXT,
    address_floor       TEXT,
    address_apartment   TEXT,
    address_city        TEXT,
    address_state       TEXT,
    address_country     TEXT DEFAULT 'AR',
    address_postal_code TEXT,
    
    -- Configuración comercial
    credit_limit    DECIMAL(12,2) DEFAULT 0,
    payment_terms   INTEGER DEFAULT 0, -- Días
    discount_rate   DECIMAL(5,2) DEFAULT 0, -- Porcentaje
    
    -- Clasificación
    category        TEXT, -- 'mayorista', 'minorista', 'taller'
    rating          INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Metadatos
    notes           TEXT,
    tags            TEXT[],
    
    status          customer_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted_at      TIMESTAMP
);

CREATE TYPE customer_type AS ENUM ('individual', 'company');
CREATE TYPE customer_tax_type AS ENUM ('monotributo', 'responsable_inscripto', 'exento', 'consumidor_final');
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blocked');
```

### core_customers.customer_addresses
```sql
CREATE TABLE core_customers.customer_addresses (
    id             TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    customer_id    TEXT NOT NULL REFERENCES core_customers.customers(id) ON DELETE CASCADE,
    
    type           address_type NOT NULL DEFAULT 'billing',
    name           TEXT, -- 'Oficina Central', 'Depósito Norte'
    
    street         TEXT NOT NULL,
    number         TEXT,
    floor          TEXT,
    apartment      TEXT,
    city           TEXT NOT NULL,
    state          TEXT NOT NULL,
    country        TEXT NOT NULL DEFAULT 'AR',
    postal_code    TEXT,
    
    is_default     BOOLEAN DEFAULT FALSE,
    
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE TYPE address_type AS ENUM ('billing', 'shipping', 'both');
```

## 📦 Core Schema: Inventory Management

### core_inventory.products
```sql
CREATE TABLE core_inventory.products (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id            TEXT NOT NULL REFERENCES core_companies.companies(id),
    
    -- Información básica
    sku                   TEXT NOT NULL,
    barcode               TEXT,
    name                  TEXT NOT NULL,
    description           TEXT,
    short_description     TEXT,
    
    -- Categorización
    category_id           TEXT REFERENCES core_inventory.categories(id),
    brand                 TEXT,
    model                 TEXT,
    
    -- Precios y costos
    cost_price            DECIMAL(12,4) DEFAULT 0, -- Precio de costo
    selling_price         DECIMAL(12,4) DEFAULT 0, -- Precio de venta
    min_price             DECIMAL(12,4) DEFAULT 0, -- Precio mínimo
    suggested_price       DECIMAL(12,4), -- Precio sugerido por IA
    
    -- Control de stock
    track_stock           BOOLEAN DEFAULT TRUE,
    stock_quantity        DECIMAL(10,3) DEFAULT 0,
    stock_reserved        DECIMAL(10,3) DEFAULT 0, -- Stock reservado
    stock_minimum         DECIMAL(10,3) DEFAULT 0, -- Stock mínimo
    stock_maximum         DECIMAL(10,3), -- Stock máximo
    
    -- Unidades de medida
    unit_type             TEXT DEFAULT 'unit', -- 'unit', 'kg', 'liter', 'meter'
    unit_weight           DECIMAL(8,3), -- Peso en kg
    unit_dimensions       JSONB, -- {length, width, height} en cm
    
    -- Configuración
    is_active             BOOLEAN DEFAULT TRUE,
    is_taxable            BOOLEAN DEFAULT TRUE,
    tax_rate              DECIMAL(5,2) DEFAULT 21.00, -- IVA 21%
    
    -- Metadatos
    tags                  TEXT[],
    images                TEXT[], -- URLs de imágenes
    specifications        JSONB DEFAULT '{}', -- Especificaciones técnicas
    
    -- Auditoría
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW(),
    deleted_at            TIMESTAMP,
    
    UNIQUE(company_id, sku)
);
```

### core_inventory.categories
```sql
CREATE TABLE core_inventory.categories (
    id          TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id  TEXT NOT NULL REFERENCES core_companies.companies(id),
    
    name        TEXT NOT NULL,
    code        TEXT,
    description TEXT,
    
    -- Jerarquía
    parent_id   TEXT REFERENCES core_inventory.categories(id),
    level       INTEGER DEFAULT 0,
    path        TEXT, -- Materialized path: '1.2.3'
    
    -- Configuración
    margin_rate DECIMAL(5,2), -- Margen por defecto para esta categoría
    is_active   BOOLEAN DEFAULT TRUE,
    
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    deleted_at  TIMESTAMP,
    
    UNIQUE(company_id, name, parent_id)
);
```

### core_inventory.stock_movements
```sql
CREATE TABLE core_inventory.stock_movements (
    id           TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id   TEXT NOT NULL REFERENCES core_companies.companies(id),
    product_id   TEXT NOT NULL REFERENCES core_inventory.products(id),
    branch_id    TEXT REFERENCES core_companies.branches(id),
    
    -- Movimiento
    movement_type movement_type NOT NULL,
    quantity      DECIMAL(10,3) NOT NULL, -- Positivo = entrada, Negativo = salida
    cost_price    DECIMAL(12,4), -- Precio de costo en este movimiento
    
    -- Referencias
    reference_type TEXT, -- 'invoice', 'purchase', 'adjustment', 'transfer'
    reference_id   TEXT, -- ID del documento relacionado
    
    -- Información adicional
    notes         TEXT,
    batch_number  TEXT, -- Número de lote
    expiry_date   DATE, -- Fecha vencimiento
    
    -- Usuario que realizó el movimiento
    user_id       TEXT NOT NULL REFERENCES core_auth.users(id),
    
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TYPE movement_type AS ENUM (
    'initial_stock',    -- Stock inicial
    'purchase',         -- Compra
    'sale',            -- Venta
    'adjustment_plus', -- Ajuste positivo
    'adjustment_minus',-- Ajuste negativo
    'transfer_in',     -- Transferencia entrada
    'transfer_out',    -- Transferencia salida
    'return_in',       -- Devolución entrada
    'return_out'       -- Devolución salida
);
```

## 💰 Core Schema: Billing System

### core_billing.invoices
```sql
CREATE TABLE core_billing.invoices (
    id                TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id        TEXT NOT NULL REFERENCES core_companies.companies(id),
    branch_id         TEXT NOT NULL REFERENCES core_companies.branches(id),
    customer_id       TEXT NOT NULL REFERENCES core_customers.customers(id),
    
    -- Numeración
    invoice_type      invoice_type NOT NULL,
    point_of_sale     INTEGER NOT NULL, -- Punto de venta AFIP
    invoice_number    BIGINT NOT NULL, -- Número secuencial
    full_number       TEXT GENERATED ALWAYS AS (
        LPAD(point_of_sale::TEXT, 5, '0') || '-' || 
        LPAD(invoice_number::TEXT, 8, '0')
    ) STORED,
    
    -- Fechas
    invoice_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date          DATE,
    service_from      DATE, -- Para servicios
    service_to        DATE,
    
    -- AFIP
    cae               TEXT, -- Código Autorización Electrónica
    cae_expiry        DATE, -- Vencimiento CAE
    afip_status       afip_status DEFAULT 'pending',
    afip_response     JSONB, -- Respuesta completa AFIP
    
    -- Montos
    subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount        DECIMAL(12,2) NOT NULL DEFAULT 0, -- IVA
    discount_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Configuración
    currency          TEXT DEFAULT 'ARS',
    exchange_rate     DECIMAL(10,4) DEFAULT 1,
    payment_terms     INTEGER DEFAULT 0, -- Días
    
    -- Estado y observaciones
    status            invoice_status NOT NULL DEFAULT 'draft',
    notes             TEXT,
    internal_notes    TEXT, -- Notas internas (no van en PDF)
    
    -- Usuario que creó
    created_by        TEXT NOT NULL REFERENCES core_auth.users(id),
    
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW(),
    deleted_at        TIMESTAMP,
    
    UNIQUE(company_id, invoice_type, point_of_sale, invoice_number)
);

CREATE TYPE invoice_type AS ENUM ('A', 'B', 'C', 'CREDIT_A', 'CREDIT_B', 'CREDIT_C', 'DEBIT_A', 'DEBIT_B', 'DEBIT_C');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE afip_status AS ENUM ('pending', 'approved', 'rejected', 'error');
```

### core_billing.invoice_items
```sql
CREATE TABLE core_billing.invoice_items (
    id            TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    invoice_id    TEXT NOT NULL REFERENCES core_billing.invoices(id) ON DELETE CASCADE,
    product_id    TEXT REFERENCES core_inventory.products(id),
    
    -- Si no hay product_id, es un item manual
    description   TEXT NOT NULL,
    quantity      DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit_price    DECIMAL(12,4) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0, -- Porcentaje descuento
    
    -- Impuestos
    tax_rate      DECIMAL(5,2) NOT NULL DEFAULT 21.00, -- % IVA
    tax_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Totales calculados
    subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0, -- quantity * unit_price - discount
    total         DECIMAL(12,2) NOT NULL DEFAULT 0, -- subtotal + tax_amount
    
    -- Orden en la factura
    line_number   INTEGER NOT NULL,
    
    created_at    TIMESTAMP DEFAULT NOW()
);
```

### core_billing.invoice_payments
```sql
CREATE TABLE core_billing.invoice_payments (
    id            TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    invoice_id    TEXT NOT NULL REFERENCES core_billing.invoices(id),
    
    payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    amount        DECIMAL(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    reference     TEXT, -- Número cheque, transferencia, etc.
    notes         TEXT,
    
    created_by    TEXT NOT NULL REFERENCES core_auth.users(id),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TYPE payment_method AS ENUM ('cash', 'check', 'transfer', 'credit_card', 'debit_card', 'other');
```

## 🚗 Module Schema: Auto Parts Specific

### mod_auto_parts.vehicle_brands
```sql
CREATE TABLE mod_auto_parts.vehicle_brands (
    id         TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    name       TEXT UNIQUE NOT NULL, -- 'Toyota', 'Ford', 'Chevrolet'
    logo_url   TEXT,
    country    TEXT, -- País de origen
    is_active  BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### mod_auto_parts.vehicle_models
```sql
CREATE TABLE mod_auto_parts.vehicle_models (
    id               TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    brand_id         TEXT NOT NULL REFERENCES mod_auto_parts.vehicle_brands(id),
    name             TEXT NOT NULL, -- 'Corolla', 'Focus', 'Cruze'
    generation       TEXT, -- 'XI (E170)', 'Mk3'
    year_from        INTEGER, -- 2014
    year_to          INTEGER, -- 2019
    engine_options   TEXT[], -- ['1.8L', '2.0L Hybrid']
    body_types       TEXT[], -- ['sedan', 'hatchback']
    
    is_active        BOOLEAN DEFAULT TRUE,
    
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(brand_id, name, generation)
);
```

### mod_auto_parts.part_categories
```sql
CREATE TABLE mod_auto_parts.part_categories (
    id                TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    
    name              TEXT UNIQUE NOT NULL, -- 'Filtros', 'Frenos', 'Motor'
    code              TEXT UNIQUE, -- 'FIL', 'FRE', 'MOT'
    description       TEXT,
    parent_id         TEXT REFERENCES mod_auto_parts.part_categories(id),
    
    -- Configuración específica repuestos
    typical_margin    DECIMAL(5,2), -- Margen típico para esta categoría
    warranty_months   INTEGER, -- Garantía estándar en meses
    
    -- ML integration
    ml_category_id    TEXT, -- ID categoría en MercadoLibre
    ml_attributes     JSONB, -- Atributos específicos ML
    
    is_active         BOOLEAN DEFAULT TRUE,
    
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);
```

### mod_auto_parts.part_compatibility
```sql
CREATE TABLE mod_auto_parts.part_compatibility (
    id               TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    product_id       TEXT NOT NULL REFERENCES core_inventory.products(id),
    
    -- Compatibilidad con vehículos
    brand_id         TEXT REFERENCES mod_auto_parts.vehicle_brands(id),
    model_id         TEXT REFERENCES mod_auto_parts.vehicle_models(id),
    year_from        INTEGER,
    year_to          INTEGER,
    engine           TEXT, -- '1.8L', '2.0L Turbo'
    
    -- OEM Numbers
    oem_numbers      TEXT[], -- ['90915-YZZD4', '15400-RTA-003']
    
    -- Notas específicas
    notes            TEXT, -- 'Solo para versión XLi'
    fit_type         fit_type DEFAULT 'direct', -- direct, universal, modified
    
    created_at       TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(product_id, brand_id, model_id, engine)
);

CREATE TYPE fit_type AS ENUM ('direct', 'universal', 'modified');
```

### mod_auto_parts.ml_price_history
```sql
CREATE TABLE mod_auto_parts.ml_price_history (
    id              TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    product_id      TEXT NOT NULL REFERENCES core_inventory.products(id),
    
    -- Datos MercadoLibre
    ml_item_id      TEXT NOT NULL, -- MLA123456789
    ml_title        TEXT NOT NULL,
    ml_price        DECIMAL(12,2) NOT NULL,
    ml_currency     TEXT DEFAULT 'ARS',
    ml_condition    TEXT, -- 'new', 'used'
    ml_seller_id    TEXT,
    ml_reputation   JSONB, -- Reputación del vendedor
    
    -- Análisis
    is_competitor   BOOLEAN DEFAULT FALSE,
    similarity_score DECIMAL(3,2), -- 0.00 - 1.00
    
    -- Timestamp
    scraped_at      TIMESTAMP NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    
    INDEX(product_id, scraped_at),
    INDEX(ml_item_id, scraped_at)
);
```

### mod_auto_parts.ai_price_analysis
```sql
CREATE TABLE mod_auto_parts.ai_price_analysis (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    product_id            TEXT NOT NULL REFERENCES core_inventory.products(id),
    
    -- Input datos
    cost_price            DECIMAL(12,4) NOT NULL, -- Precio costo proveedor
    current_selling_price DECIMAL(12,4), -- Precio actual de venta
    desired_margin        DECIMAL(5,2), -- Margen deseado %
    
    -- Análisis competencia
    ml_min_price          DECIMAL(12,2), -- Precio mínimo encontrado en ML
    ml_max_price          DECIMAL(12,2), -- Precio máximo encontrado en ML  
    ml_avg_price          DECIMAL(12,2), -- Precio promedio ML
    competitor_count      INTEGER DEFAULT 0, -- Cantidad de competidores
    
    -- Recomendación IA
    suggested_price       DECIMAL(12,4) NOT NULL, -- Precio sugerido
    confidence_score      DECIMAL(3,2), -- Confianza 0.00-1.00
    reasoning             TEXT, -- Explicación del algoritmo
    
    -- Metadatos
    analysis_version      TEXT, -- Versión del algoritmo usado
    market_position       market_position, -- Posicionamiento sugerido
    
    created_at            TIMESTAMP DEFAULT NOW(),
    expires_at            TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
    
    INDEX(product_id, created_at)
);

CREATE TYPE market_position AS ENUM ('premium', 'competitive', 'budget', 'loss_leader');
```

### mod_auto_parts.supplier_price_lists
```sql
CREATE TABLE mod_auto_parts.supplier_price_lists (
    id                TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id        TEXT NOT NULL REFERENCES core_companies.companies(id),
    
    -- Información proveedor
    supplier_name     TEXT NOT NULL,
    supplier_code     TEXT, -- Código interno del proveedor
    contact_email     TEXT,
    contact_phone     TEXT,
    
    -- Lista de precios
    list_name         TEXT NOT NULL, -- 'Lista Enero 2024'
    list_date         DATE NOT NULL,
    currency          TEXT DEFAULT 'ARS',
    valid_from        DATE,
    valid_to          DATE,
    
    -- Configuración
    default_margin    DECIMAL(5,2), -- Margen por defecto
    payment_terms     INTEGER, -- Días de pago
    
    -- Archivo original
    filename          TEXT, -- Nombre archivo Excel subido
    file_size         INTEGER,
    file_hash         TEXT, -- Hash para detectar duplicados
    
    -- Estado
    status            price_list_status DEFAULT 'active',
    processed_at      TIMESTAMP, -- Cuando se procesó
    processed_by      TEXT REFERENCES core_auth.users(id),
    
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TYPE price_list_status AS ENUM ('active', 'inactive', 'processing', 'error');
```

### mod_auto_parts.supplier_price_items
```sql
CREATE TABLE mod_auto_parts.supplier_price_items (
    id                TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    price_list_id     TEXT NOT NULL REFERENCES mod_auto_parts.supplier_price_lists(id) ON DELETE CASCADE,
    
    -- Datos del proveedor
    supplier_sku      TEXT NOT NULL, -- SKU del proveedor
    supplier_name     TEXT NOT NULL, -- Nombre según proveedor
    brand             TEXT,
    oem_numbers       TEXT[], -- Números OEM
    
    -- Precios
    cost_price        DECIMAL(12,4) NOT NULL,
    list_price        DECIMAL(12,4), -- Precio lista sugerido
    min_qty           INTEGER DEFAULT 1, -- Cantidad mínima
    
    -- Matching con productos internos
    matched_product_id TEXT REFERENCES core_inventory.products(id),
    match_confidence   DECIMAL(3,2), -- 0.00-1.00
    match_type         match_type DEFAULT 'manual',
    
    -- Estado
    is_active         BOOLEAN DEFAULT TRUE,
    last_updated      TIMESTAMP DEFAULT NOW(),
    
    created_at        TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(price_list_id, supplier_sku)
);

CREATE TYPE match_type AS ENUM ('exact', 'fuzzy', 'manual', 'ai_suggested');
```

## 📊 Core Schema: Reports & Analytics

### core_reports.report_definitions
```sql
CREATE TABLE core_reports.report_definitions (
    id             TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id     TEXT NOT NULL REFERENCES core_companies.companies(id),
    
    name           TEXT NOT NULL,
    description    TEXT,
    module         TEXT NOT NULL, -- 'core', 'auto-parts', 'retail'
    category       TEXT, -- 'sales', 'inventory', 'financial'
    
    -- Configuración del reporte
    query_template TEXT NOT NULL, -- SQL template con parámetros
    parameters     JSONB DEFAULT '[]', -- Parámetros configurables
    
    -- Visualización
    chart_type     TEXT, -- 'table', 'bar', 'line', 'pie'
    chart_config   JSONB DEFAULT '{}',
    
    -- Permisos
    required_permission TEXT NOT NULL,
    is_public      BOOLEAN DEFAULT FALSE, -- Visible para todos los usuarios
    
    created_by     TEXT NOT NULL REFERENCES core_auth.users(id),
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW(),
    deleted_at     TIMESTAMP
);
```

### core_reports.scheduled_reports
```sql
CREATE TABLE core_reports.scheduled_reports (
    id              TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    report_id       TEXT NOT NULL REFERENCES core_reports.report_definitions(id),
    user_id         TEXT NOT NULL REFERENCES core_auth.users(id),
    
    name            TEXT NOT NULL,
    schedule_cron   TEXT NOT NULL, -- Expresión cron
    parameters      JSONB DEFAULT '{}', -- Parámetros específicos
    
    -- Configuración entrega
    email_to        TEXT[], -- Emails para enviar
    export_format   TEXT DEFAULT 'pdf', -- pdf, excel, csv
    
    -- Estado
    is_active       BOOLEAN DEFAULT TRUE,
    last_run        TIMESTAMP,
    next_run        TIMESTAMP,
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Core Schema: System Configuration

### core_system.settings
```sql
CREATE TABLE core_system.settings (
    id         TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id TEXT REFERENCES core_companies.companies(id), -- NULL = global setting
    module     TEXT NOT NULL, -- 'core', 'auto-parts', etc.
    
    key        TEXT NOT NULL, -- 'default_tax_rate', 'ml_api_key'
    value      JSONB NOT NULL, -- Valor serializado
    type       setting_type NOT NULL, -- Para validación
    
    -- Metadatos
    description TEXT,
    is_secret   BOOLEAN DEFAULT FALSE, -- Para keys, passwords
    is_readonly BOOLEAN DEFAULT FALSE, -- No editable por usuario
    
    updated_by  TEXT REFERENCES core_auth.users(id),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(company_id, module, key)
);

CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json', 'encrypted');
```

### core_system.modules
```sql
CREATE TABLE core_system.modules (
    id              TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    
    name            TEXT UNIQUE NOT NULL, -- 'auto-parts', 'retail'
    version         TEXT NOT NULL, -- '1.0.0'
    description     TEXT,
    
    -- Configuración
    is_core         BOOLEAN DEFAULT FALSE, -- Es módulo core?
    dependencies    TEXT[], -- Dependencias de otros módulos
    
    -- Estado
    status          module_status DEFAULT 'available',
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TYPE module_status AS ENUM ('available', 'installed', 'active', 'inactive', 'error');
```

### core_system.company_modules
```sql
CREATE TABLE core_system.company_modules (
    id           TEXT PRIMARY KEY DEFAULT gen_random_cuid(),
    company_id   TEXT NOT NULL REFERENCES core_companies.companies(id),
    module_id    TEXT NOT NULL REFERENCES core_system.modules(id),
    
    -- Licencia
    license_type module_license_type NOT NULL,
    license_key  TEXT,
    expires_at   TIMESTAMP, -- NULL = perpetuo
    
    -- Estado
    status       module_status DEFAULT 'inactive',
    activated_at TIMESTAMP,
    activated_by TEXT REFERENCES core_auth.users(id),
    
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(company_id, module_id)
);

CREATE TYPE module_license_type AS ENUM ('trial', 'basic', 'premium', 'enterprise');
```

## 📈 Índices y Optimizaciones

### Índices Críticos para Performance
```sql
-- Autenticación (queries frecuentes)
CREATE INDEX idx_users_email ON core_auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_company ON core_auth.users(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_user ON core_auth.user_sessions(user_id, expires_at);

-- Facturación (reports y búsquedas)
CREATE INDEX idx_invoices_company_date ON core_billing.invoices(company_id, invoice_date);
CREATE INDEX idx_invoices_customer ON core_billing.invoices(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_full_number ON core_billing.invoices(full_number);
CREATE INDEX idx_invoices_afip_status ON core_billing.invoices(afip_status, invoice_date);

-- Inventario (búsquedas y stock)
CREATE INDEX idx_products_company_sku ON core_inventory.products(company_id, sku);
CREATE INDEX idx_products_name_search ON core_inventory.products USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_products_category ON core_inventory.products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_movements_product ON core_inventory.stock_movements(product_id, created_at DESC);

-- Auto-parts específicos
CREATE INDEX idx_ml_prices_product_date ON mod_auto_parts.ml_price_history(product_id, scraped_at DESC);
CREATE INDEX idx_compatibility_brand_model ON mod_auto_parts.part_compatibility(brand_id, model_id);
CREATE INDEX idx_ai_analysis_product_valid ON mod_auto_parts.ai_price_analysis(product_id, expires_at) WHERE expires_at > NOW();
```

### Constraints y Validaciones
```sql
-- Validaciones de negocio
ALTER TABLE core_billing.invoices 
    ADD CONSTRAINT chk_invoice_amounts 
    CHECK (subtotal >= 0 AND tax_amount >= 0 AND total_amount >= 0);

ALTER TABLE core_billing.invoice_items
    ADD CONSTRAINT chk_item_amounts
    CHECK (quantity > 0 AND unit_price >= 0);

ALTER TABLE core_inventory.products
    ADD CONSTRAINT chk_prices
    CHECK (cost_price >= 0 AND selling_price >= 0);

ALTER TABLE core_inventory.stock_movements
    ADD CONSTRAINT chk_stock_quantity
    CHECK (quantity != 0); -- No permitir movimientos con cantidad 0
```

---

## 🔄 Migraciones y Versionado

### Estrategia de Migraciones
- **Prisma Migrations**: Control de versiones automático
- **Backwards Compatible**: Nuevas columnas opcionales
- **Data Migrations**: Scripts separados para transformación datos
- **Rollback Plan**: Cada migración debe ser reversible

### Schema Versioning
```sql
CREATE TABLE core_system.schema_versions (
    id             SERIAL PRIMARY KEY,
    version        TEXT NOT NULL,
    applied_at     TIMESTAMP DEFAULT NOW(),
    rollback_sql   TEXT, -- SQL para revertir si es necesario
    description    TEXT
);
```

## ⚠️ NOTAS CRÍTICAS PARA DESARROLLO

### Principios NO Negociables
1. **Soft Deletes**: NUNCA DELETE físico en tablas importantes
2. **Auditoría**: created_at, updated_at, deleted_at en TODAS las tablas
3. **Foreign Keys**: Integridad referencial siempre
4. **Naming Convention**: snake_case, nombres descriptivos
5. **Schemas**: Separación lógica por módulos

### Performance Guidelines
- **Índices**: Crear para queries frecuentes (WHERE, ORDER BY, JOIN)
- **Paginación**: LIMIT/OFFSET para listas grandes
- **N+1 Queries**: Usar JOINs o includes de Prisma
- **Full Text Search**: GIN indexes para búsquedas texto
- **Partitioning**: Considerar para tablas de movimientos/logs

### Security Guidelines
- **No Plain Text**: Passwords siempre hasheados
- **Sensitive Data**: Encryption en campos críticos
- **Row Level Security**: Filtrar por company_id siempre
- **Input Validation**: Prisma + Zod en todas las entradas
- **SQL Injection**: Solo queries parametrizadas