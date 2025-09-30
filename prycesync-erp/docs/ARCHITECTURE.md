# PriceSync ERP - Arquitectura del Sistema

## 🏗️ Arquitectura General

### Patrón Arquitectural
- **Tipo**: Modular Monolith con Plugin System
- **Frontend**: Single Page Application (SPA)
- **Backend**: API REST embebida en Electron
- **Database**: Single database con schemas por módulo
- **Deploy**: Desktop app con backend integrado

### Principios de Diseño
- **Modularidad**: Cada vertical es un plugin independiente
- **Reutilización**: Core engine compartido entre todos los módulos
- **Escalabilidad**: Arquitectura preparada para multi-sucursal
- **Mantenibilidad**: Separación clara de responsabilidades
- **Testabilidad**: Inyección de dependencias y mocking

## 📁 Estructura de Carpetas

```
pricesync-erp/
├── docs/                           # Documentación del proyecto
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md  
│   ├── TECH_STACK.md
│   ├── DATABASE_SCHEMA.md
│   └── API_SPECS.md
├── docker/                         # Configuraciones Docker
│   ├── app/
│   │   └── Dockerfile
│   ├── db/
│   │   └── Dockerfile
│   └── redis/
│       └── Dockerfile
├── docker-compose.yml              # Orquestación desarrollo
├── docker-compose.prod.yml         # Orquestación producción
├── src/
│   ├── main/                       # Proceso principal Electron
│   │   ├── main.ts                 # Entry point Electron
│   │   ├── preload.ts              # Bridge renderer-main
│   │   ├── menu.ts                 # Menu de aplicación
│   │   ├── updater.ts              # Auto-updates
│   │   └── window-manager.ts       # Gestión ventanas
│   ├── renderer/                   # Frontend Vue
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── main.ts             # Vue app entry
│   │   │   ├── App.vue             # Root component
│   │   │   ├── router/             # Vue Router config
│   │   │   ├── stores/             # Pinia stores
│   │   │   ├── composables/        # Vue composables
│   │   │   ├── components/         # Sistema de componentes
│   │   │   │   ├── base/           # Componentes atómicos
│   │   │   │   ├── forms/          # Componentes formulario
│   │   │   │   ├── tables/         # Sistema DataTable
│   │   │   │   ├── modals/         # Sistema Modal
│   │   │   │   ├── layout/         # Layout components
│   │   │   │   └── business/       # Componentes negocio
│   │   │   ├── views/              # Páginas principales
│   │   │   ├── assets/             # Assets estáticos
│   │   │   ├── styles/             # Estilos globales
│   │   │   │   ├── tokens.css      # Design tokens
│   │   │   │   ├── components.css  # Componentes base
│   │   │   │   └── utilities.css   # Utilidades Tailwind
│   │   │   └── utils/              # Utilidades y helpers
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   ├── backend/                    # API Backend Node.js
│   │   ├── server.ts               # Express server setup
│   │   ├── core/                   # Core engine universal
│   │   │   ├── auth/               # Autenticación y autorización
│   │   │   ├── billing/            # Motor facturación universal
│   │   │   ├── inventory/          # Motor inventario universal
│   │   │   ├── customers/          # Motor clientes (CRM)
│   │   │   ├── reports/            # Motor reportes
│   │   │   ├── users/              # Gestión usuarios
│   │   │   ├── companies/          # Multi-empresa
│   │   │   ├── plugins/            # Sistema plugins
│   │   │   └── licensing/          # Control licencias
│   │   ├── modules/                # Módulos de negocio
│   │   │   ├── auto-parts/         # Módulo repuestos
│   │   │   │   ├── controllers/    # Controllers específicos
│   │   │   │   ├── services/       # Business logic
│   │   │   │   ├── models/         # Modelos Prisma extend
│   │   │   │   ├── ai/             # Servicios IA
│   │   │   │   │   ├── chat/       # Chat IA para consultas inventario
│   │   │   │   │   ├── pricing/    # IA para análisis de precios
│   │   │   │   │   └── vision/     # Reconocimiento imágenes
│   │   │   │   ├── integrations/   # APIs externas
│   │   │   │   └── routes/         # Rutas específicas
│   │   │   └── retail/             # Módulo retail (futuro)
│   │   ├── shared/                 # Código compartido
│   │   │   ├── types/              # Types TypeScript
│   │   │   ├── utils/              # Utilidades comunes
│   │   │   ├── middleware/         # Express middleware
│   │   │   ├── validators/         # Validaciones Zod
│   │   │   └── errors/             # Error handling
│   │   └── integrations/           # Integraciones externas
│   │       ├── fiscal/             # Sistemas fiscales
│   │       │   ├── argentina/      # AFIP via TusFacturasApp
│   │       │   ├── paraguay/       # SIFEN
│   │       │   └── bolivia/        # Sistema Virtual
│   │       ├── ai/                 # Servicios IA
│       │   ├── openai/         # GPT integration
│       │   ├── claude/         # Anthropic Claude integration
│       │   ├── gemini/         # Google Gemini integration
│       │   └── chat-service/   # Servicio unificado chat IA
│       │       ├── query-processor.ts    # Procesamiento consultas NL
│       │       ├── sql-validator.ts      # Validación seguridad SQL
│       │       ├── response-formatter.ts # Formateo respuestas
│       │       └── context-manager.ts    # Gestión contexto conversación
│   │       └── ecommerce/          # Marketplaces
│   │           └── mercadolibre/   # ML API oficial
│   └── shared/                     # Código compartido main/renderer
│       ├── types/                  # Types compartidos
│       ├── constants/              # Constantes
│       └── ipc/                    # IPC channels definition
├── prisma/                         # Database schema y migrations
│   ├── schema.prisma               # Schema principal
│   ├── migrations/                 # Migraciones históricas
│   └── seeds/                      # Data inicial
├── tests/                          # Testing suite
│   ├── unit/                       # Tests unitarios
│   ├── integration/                # Tests integración
│   └── e2e/                        # Tests end-to-end
├── scripts/                        # Scripts utilidades
│   ├── setup.sh                    # Setup inicial
│   ├── migrate.js                  # Migraciones data
│   └── build.js                    # Build personalizado
├── .env.example                    # Variables ambiente
├── .dockerignore
├── .gitignore
├── package.json                    # Dependencies principales
├── tsconfig.json                   # TypeScript config
└── README.md                       # Documentación setup
```

## 🧩 Sistema de Módulos (Plugin Architecture)

### Interface Base para Módulos
```typescript
interface IModule {
  // Metadata
  name: string;
  version: string;
  description: string;
  author: string;
  
  // Dependencias
  dependencies: string[];
  coreVersion: string;
  
  // Configuración
  routes: Route[];
  components: ComponentDefinition[];
  services: ServiceDefinition[];
  migrations: Migration[];
  permissions: Permission[];
  
  // Lifecycle hooks
  onInstall(): Promise<void>;
  onUninstall(): Promise<void>;
  onActivate(): Promise<void>;
  onDeactivate(): Promise<void>;
  onUpdate(oldVersion: string): Promise<void>;
}
```

### Plugin Manager
```typescript
class PluginManager {
  private loadedPlugins: Map<string, IModule>;
  private pluginConfigs: Map<string, PluginConfig>;
  
  async loadPlugin(pluginPath: string): Promise<void>;
  async unloadPlugin(pluginName: string): Promise<void>;
  async activatePlugin(pluginName: string): Promise<void>;
  async deactivatePlugin(pluginName: string): Promise<void>;
  
  getActivePlugins(): IModule[];
  validatePluginCompatibility(plugin: IModule): boolean;
}
```

## 🗄️ Arquitectura de Base de Datos

### Estrategia Multi-Schema
```sql
-- Core schemas (universal)
CREATE SCHEMA core_auth;      -- Users, roles, permissions
CREATE SCHEMA core_billing;   -- Invoices, invoice_items
CREATE SCHEMA core_inventory; -- Products, stock, movements  
CREATE SCHEMA core_customers;  -- Customers, addresses
CREATE SCHEMA core_reports;   -- Report definitions, schedules
CREATE SCHEMA core_companies; -- Companies, branches

-- Module schemas (específicos por vertical)
CREATE SCHEMA mod_auto_parts; -- Vehicle compatibility, ML prices
CREATE SCHEMA mod_retail;     -- Retail-specific tables (futuro)
CREATE SCHEMA mod_pharmacy;   -- Pharmacy-specific tables (futuro)
```

### Patrón Repository
```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: FilterOptions): Promise<T[]>;
  create(entity: CreateEntityInput): Promise<T>;
  update(id: string, data: UpdateEntityInput): Promise<T>;
  delete(id: string): Promise<void>;
}

class BaseRepository<T> implements IRepository<T> {
  constructor(protected prisma: PrismaClient, protected model: string) {}
  // Implementation using Prisma
}
```

## 🎨 Sistema de Componentes Frontend

### Atomic Design Methodology
```
base/           # Atoms - Componentes básicos indivisibles
├── BaseButton.vue
├── BaseInput.vue  
├── BaseSelect.vue
├── BaseCheckbox.vue
├── BaseSpinner.vue
└── BaseIcon.vue

forms/          # Molecules - Combinaciones de atoms
├── FormField.vue      # Input + Label + Validation
├── FormGroup.vue      # Agrupador campos
├── FormActions.vue    # Submit + Cancel buttons
└── SearchBox.vue      # Input + Search icon

tables/         # Organisms - Componentes complejos
├── DataTable.vue      # Tabla completa con features
├── TableHeader.vue    # Header con sorting
├── TableRow.vue       # Fila reutilizable
├── TableCell.vue      # Celda tipada
├── TablePagination.vue
└── TableFilters.vue

layout/         # Templates - Layouts de página
├── AppHeader.vue
├── AppSidebar.vue
├── AppMain.vue
└── AppFooter.vue

business/       # Pages - Componentes específicos negocio
├── InvoiceForm.vue
├── CustomerCard.vue
├── PriceAnalysis.vue
└── ChatInterface.vue    # Chat IA para consultas (Fase 3)
```

### Design Token System
```typescript
// design-tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',  
      error: '#ef4444',
      info: '#06b6d4'
    }
  },
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    4: '1rem',     // 16px
    // ... resto escala
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }]
    }
  }
}
```

## 🔄 Flujo de Datos (State Management)

### Pinia Store Architecture
```typescript
// Core stores
stores/
├── auth.ts           # Autenticación y usuario actual
├── company.ts        # Empresa activa y configuración
├── ui.ts             # Estado UI global (tema, sidebar, etc.)
├── licensing.ts      # Estado licencias y módulos activos
└── notifications.ts  # Sistema notificaciones

// Module stores  
modules/
├── auto-parts/
│   ├── products.ts   # Catálogo productos repuestos
│   ├── pricing.ts    # IA pricing y análisis ML
│   ├── suppliers.ts  # Gestión proveedores
│   ├── inventory.ts  # Stock específico repuestos
│   └── chat.ts       # Estado chat IA y conversaciones (Fase 3)
└── billing/
    ├── invoices.ts   # Facturas y comprobantes
    ├── customers.ts  # Gestión clientes
    └── fiscal.ts     # Estado AFIP y comprobantes
```

### IPC Communication Pattern
```typescript
// main/ipc-handlers.ts
export const ipcHandlers = {
  // Database operations
  'db:create': async (table: string, data: any) => {},
  'db:read': async (table: string, id: string) => {},
  'db:update': async (table: string, id: string, data: any) => {},
  'db:delete': async (table: string, id: string) => {},
  
  // External APIs
  'api:afip:invoice': async (invoiceData: InvoiceData) => {},
  'api:ml:search': async (query: string) => {},
  'api:vision:analyze': async (image: Buffer) => {},
  'api:ai:chat': async (query: string, context: ChatContext) => {}, // Fase 3
  
  // File operations
  'file:import-excel': async (filePath: string) => {},
  'file:export-pdf': async (data: any, template: string) => {},
  
  // System operations
  'system:get-info': async () => {},
  'system:check-updates': async () => {}
};
```

## 🚀 Patrones de Deployment

### Docker Multi-Stage Strategy
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build:electron

# Development stage
FROM node:18-alpine AS development  
WORKDIR /app
RUN npm ci
COPY . .
EXPOSE 3000 5173 3001
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "run", "electron:serve"]
```

### Update Strategy
```typescript
// Auto-updater configuration
export const updateConfig = {
  provider: 'github',
  owner: 'tu-username',
  repo: 'pricesync-erp',
  publishAutoUpdate: true,
  
  // Canales de actualización
  channels: {
    stable: 'latest',
    beta: 'beta',
    alpha: 'alpha'
  },
  
  // Configuración por módulo
  moduleUpdates: {
    'auto-parts': {
      autoUpdate: true,
      channel: 'stable'
    },
    'retail': {
      autoUpdate: false, 
      channel: 'beta'
    }
  }
};
```

## 🔒 Arquitectura de Seguridad

### Authentication & Authorization
```typescript
// JWT-based auth con refresh tokens
interface AuthTokens {
  accessToken: string;   // 15 minutos
  refreshToken: string;  // 7 días  
  user: UserProfile;
  permissions: Permission[];
}

// Role-based permissions
enum Permission {
  BILLING_CREATE = 'billing:create',
  BILLING_READ = 'billing:read', 
  BILLING_UPDATE = 'billing:update',
  BILLING_DELETE = 'billing:delete',
  
  INVENTORY_MANAGE = 'inventory:manage',
  CUSTOMERS_MANAGE = 'customers:manage',
  
  ADMIN_USERS = 'admin:users',
  ADMIN_SYSTEM = 'admin:system'
}
```

### Data Encryption
```typescript
// Configuración datos sensibles
export const encryptionConfig = {
  // Datos en reposo
  database: {
    encryption: 'AES-256-GCM',
    keyRotation: '90d'
  },
  
  // Datos en tránsito  
  api: {
    https: true,
    tlsVersion: '1.3',
    certificateValidation: true
  },
  
  // Credentials storage
  credentials: {
    storage: 'keychain', // OS keychain
    encryption: 'AES-256-CBC'
  }
};
```

## 📊 Arquitectura de Monitoreo

### Logging Strategy
```typescript
// Structured logging
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context: {
    userId?: string;
    companyId?: string; 
    module: string;
    action: string;
  };
  metadata?: Record<string, any>;
}

// Log destinations
export const loggingConfig = {
  console: { level: 'debug' },
  file: { 
    level: 'info',
    path: './logs/',
    rotation: 'daily',
    retention: '30d'
  },
  remote: {
    level: 'error',
    endpoint: 'https://logging-service.com/api/logs'
  }
};
```

### Performance Monitoring
```typescript
// Métricas clave del sistema
interface SystemMetrics {
  // Performance
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  
  // Business metrics
  invoicesPerHour: number;
  aiRequestsPerHour: number;
  errorRate: number;
  
  // Module-specific
  moduleMetrics: Record<string, ModuleMetrics>;
}
```

---

## ⚠️ NOTAS CRÍTICAS PARA DESARROLLO

### Principios NO Negociables
1. **Modularidad**: Todo código específico de vertical VA en su módulo
2. **Reutilización**: NO duplicar lógica entre módulos
3. **Tipado**: TypeScript estricto en TODA la codebase
4. **Testing**: Coverage mínimo 80% en core engine
5. **Docker**: TODO desarrollo en containers

### Patrones a Seguir Estrictamente
- **Repository Pattern** para acceso a datos
- **Factory Pattern** para integraciones fiscales
- **Observer Pattern** para eventos entre módulos
- **Strategy Pattern** para algoritmos de pricing
- **Decorator Pattern** para middleware y validaciones

### Anti-Patrones a Evitar
- ❌ **God Objects**: Clases con más de 200 líneas
- ❌ **Tight Coupling**: Dependencias directas entre módulos
- ❌ **Magic Numbers**: Usar constantes nombradas
- ❌ **Callback Hell**: Usar async/await consistentemente
- ❌ **Global State**: Estado global solo en stores Pinia