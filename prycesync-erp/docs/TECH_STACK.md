# PriceSync ERP - Stack Tecnológico Detallado

## 🎯 Resumen Ejecutivo
Stack tecnológico moderno, dockerizado, con énfasis en TypeScript, componentización y arquitectura modular para un ERP desktop escalable.

## 💻 Desktop Application Framework

### Electron
- **Versión**: >= 28.x (LTS)
- **Justificación**: Permite usar tecnologías web en desktop con acceso nativo al OS
- **Configuración**: 
  - Context isolation: true
  - Node integration: false (seguridad)
  - Preload scripts para IPC seguro

```typescript
// main/main.ts - Configuración base
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });
};
```

### Electron Builder
- **Versión**: >= 24.x
- **Propósito**: Empaquetado y distribución
- **Targets**: 
  - Windows: nsis, portable
  - Futuro: macOS dmg, Linux AppImage

```json
// electron-builder config
{
  "appId": "com.pricesync.erp",
  "productName": "PriceSync ERP",
  "directories": {
    "output": "dist-electron"
  },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowElevation": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  }
}
```

### Electron Updater
- **Versión**: >= 6.x
- **Propósito**: Updates automáticas
- **Provider**: GitHub Releases
- **Configuración**: 
  - Check updates al inicio
  - Download en background
  - Install on restart

## 🎨 Frontend Framework

### Vue 3
- **Versión**: >= 3.4.x (Composition API)
- **Justificación**: 
  - Performance superior vs Vue 2
  - Composition API para better code organization
  - Mejor TypeScript support
  - Ecosystem maduro

```typescript
// main.ts - Vue app setup
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router) 
app.use(createI18n({
  locale: 'es-AR',
  fallbackLocale: 'en-US'
}))
app.mount('#app')
```

### Vue Router 4
- **Versión**: >= 4.2.x
- **Features usadas**:
  - Route guards para autenticación
  - Dynamic routing para módulos
  - Lazy loading de componentes

### Pinia
- **Versión**: >= 2.1.x
- **Justificación**: Vuex 5 oficial, mejor TypeScript support
- **Plugins**: 
  - pinia-plugin-persistedstate para persistencia

```typescript
// stores/auth.ts - Store example
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials)
    user.value = response.user
    token.value = response.token
  }
  
  const logout = () => {
    user.value = null
    token.value = null
  }
  
  return { user, token, login, logout }
}, {
  persist: true
})
```

## 🎨 Styling & Design System

### Tailwind CSS
- **Versión**: >= 3.4.x
- **Justificación**: 
  - Utility-first approach
  - Excelente para design systems
  - Tree-shaking automático
  - Dark mode built-in

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{vue,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6', 
          900: '#1e3a8a'
        },
        brand: {
          blue: '#3b82f6',
          green: '#10b981',
          red: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

### HeadlessUI Vue
- **Versión**: >= 1.7.x
- **Propósito**: Componentes accesibles sin styling
- **Componentes**: Modals, Dropdowns, Tabs, etc.

### Heroicons
- **Versión**: >= 2.0.x
- **Propósito**: Icon system consistente
- **Variantes**: Outline, Solid, Mini

## 📱 Development & Build Tools

### Vite
- **Versión**: >= 5.x
- **Justificación**: 
  - Hot reload ultra rápido
  - ESM native
  - Plugin ecosystem maduro
  - TypeScript out-of-the-box

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'src/main/preload.ts',
        onstart(options) {
          options.reload()
        }
      }
    ])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  }
})
```

### TypeScript
- **Versión**: >= 5.3.x
- **Configuración**: Strict mode enabled
- **Features**: 
  - Path mapping
  - Incremental compilation
  - Project references

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/src/*"],
      "@shared/*": ["src/shared/*"],
      "@backend/*": ["src/backend/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.vue"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## 🗄️ Backend & Database

### Node.js
- **Versión**: >= 20.x LTS
- **Runtime**: Embebido en Electron main process
- **Configuración**: ES Modules enabled

### Express.js
- **Versión**: >= 4.18.x
- **Middleware stack**:
  - cors
  - helmet (seguridad)
  - compression
  - rate-limiting
  - request logging

```typescript
// backend/server.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { authRouter } from './core/auth/routes'
import { billingRouter } from './core/billing/routes'

const app = express()

// Security & performance middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : false
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))

// API routes
app.use('/api/auth', authRouter)
app.use('/api/billing', billingRouter)

export { app }
```

### PostgreSQL
- **Versión**: >= 15.x
- **Justificación**:
  - ACID compliance
  - JSON support
  - Full-text search
  - Extensibilidad
  - Schemas para modularidad

### Prisma ORM
- **Versión**: >= 5.7.x
- **Features usadas**:
  - Type-safe queries
  - Migrations
  - Schema introspection
  - Multiple database support

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@schema("core_auth")
}

model Company {
  id       String @id @default(cuid())
  name     String
  taxId    String @unique
  country  String
  users    User[]
  invoices Invoice[]
  
  @@schema("core_auth")
}
```

### Redis
- **Versión**: >= 7.x
- **Propósito**: 
  - Cache APIs externas (MercadoLibre)
  - Rate limiting
  - Session storage
  - Task queues

## 🔌 APIs & Integrations

### HTTP Client - Axios
- **Versión**: >= 1.6.x
- **Features**:
  - Request/Response interceptors
  - Automatic retries
  - Request timeout
  - Cancel requests

```typescript
// shared/api-client.ts
import axios from 'axios'

const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor  
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await handleTokenRefresh()
    }
    return Promise.reject(error)
  }
)
```

### Validación - Zod
- **Versión**: >= 3.22.x
- **Propósito**: Schema validation y TypeScript inference
- **Usage**: API inputs, form validation, config validation

```typescript
// shared/validators/billing.ts
import { z } from 'zod'

export const InvoiceSchema = z.object({
  customerId: z.string().cuid(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })).min(1),
  type: z.enum(['A', 'B', 'C']),
  notes: z.string().optional()
})

export type InvoiceInput = z.infer<typeof InvoiceSchema>
```

### File Processing
- **Excel**: xlsx (lectura) + exceljs (escritura)
- **PDF**: puppeteer para generación
- **Images**: sharp para procesamiento
- **CSV**: papaparse para import/export

## 🤖 AI & External APIs

### OpenAI
- **Versión**: >= 4.x
- **Models**: GPT-4 para análisis de texto
- **Usage**: Interpretación de nombres de piezas, análisis de mercado

### Google Cloud Vision API
- **Versión**: >= 4.x  
- **Features**: Text detection, object detection
- **Usage**: Identificación de repuestos por imagen

### MercadoLibre API
- **Version**: Items API v1, Search API v1
- **Endpoints principales**:
  - `/sites/MLA/search` - Búsqueda productos
  - `/items/{item_id}` - Detalles producto
  - `/sites/MLA/categories` - Categorías

### TusFacturasApp (AFIP)
- **API Version**: v1
- **Endpoints**:
  - Crear comprobantes
  - Consultar CAE
  - Download PDF/XML

```typescript
// integrations/fiscal/argentina/tusfacturas-client.ts
class TusFacturasClient {
  private apiKey: string
  private baseUrl = 'https://www.tusfacturas.app/api/v2'
  
  async createInvoice(invoice: InvoiceData): Promise<AfipResponse> {
    const response = await this.httpClient.post('/facturacion/nuevo', {
      ...invoice,
      apikey: this.apiKey,
      usertoken: this.userToken
    })
    
    return response.data
  }
}
```

## 🐳 DevOps & Deployment

### Docker
- **Base Images**:
  - node:20-alpine (aplicación)
  - postgres:15-alpine (base datos)
  - redis:7-alpine (cache)

### Docker Compose
- **Services**: app, db, redis
- **Networks**: Internal network para servicios
- **Volumes**: Persistent data para DB

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: docker/app/Dockerfile
      target: development
    ports:
      - "3000:3000"  # Frontend Vite
      - "3001:3001"  # Backend API
    volumes:
      - ./src:/app/src
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/pricesync
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    command: npm run dev

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pricesync
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🧪 Testing Framework

### Vitest
- **Versión**: >= 1.x
- **Propósito**: Unit testing (reemplaza Jest)
- **Features**: Fast, Vite-native, TypeScript support

### Playwright
- **Versión**: >= 1.40.x
- **Propósito**: E2E testing
- **Browsers**: Chromium, Firefox, Safari

### Testing Library Vue
- **Versión**: >= 8.x
- **Propósito**: Component testing
- **Philosophy**: Testing user behavior, not implementation

```typescript
// tests/unit/components/BaseButton.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import BaseButton from '@/components/base/BaseButton.vue'

describe('BaseButton', () => {
  it('renders with correct text', () => {
    render(BaseButton, {
      props: { variant: 'primary' },
      slots: { default: 'Click me' }
    })
    
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
})
```

## 📦 Package Management

### NPM
- **Versión**: >= 10.x
- **Justificación**: Built-in con Node.js, workspaces support
- **Configuración**: 
  - Lock file committed
  - Exact versions para deps críticas

### Scripts principales
```json
{
  "scripts": {
    // Development
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "electron src/main/main.ts",
    
    // Building
    "build": "npm run build:vite && npm run build:electron",
    "build:vite": "vite build",
    "build:electron": "electron-builder",
    
    // Docker
    "docker:dev": "docker-compose up",
    "docker:build": "docker-compose build",
    "docker:clean": "docker-compose down -v",
    
    // Database
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed",
    
    // Testing
    "test": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage"
  }
}
```

## 🌐 Internationalization

### Vue I18n
- **Versión**: >= 9.8.x
- **Locales soportados**:
  - es-AR (Español Argentina)
  - es-PY (Español Paraguay)  
  - es-BO (Español Bolivia)
  - en-US (Inglés - fallback)

```typescript
// i18n/es-AR.json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "search": "Buscar"
  },
  "billing": {
    "invoice": "Factura",
    "customer": "Cliente", 
    "amount": "Importe",
    "tax": "IVA",
    "total": "Total"
  },
  "autoparts": {
    "part": "Repuesto",
    "brand": "Marca",
    "model": "Modelo",
    "compatibility": "Compatibilidad"
  }
}
```

## 🔒 Security

### Encryption
- **Passwords**: bcrypt
- **Tokens**: jsonwebtoken
- **Sensitive data**: crypto-js (AES-256)

### Environment Variables
```bash
# .env.example
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/pricesync
REDIS_URL=redis://localhost:6379

# API Keys (encrypted in production)
OPENAI_API_KEY=sk-...
GOOGLE_VISION_API_KEY=...
TUSFACTURAS_API_KEY=...
MERCADOLIBRE_CLIENT_ID=...

# Security
JWT_SECRET=your-super-secret-key
ENCRYPTION_KEY=your-encryption-key
```

## 📈 Monitoring & Logging

### Winston
- **Versión**: >= 3.11.x
- **Propósito**: Structured logging
- **Transports**: Console, File, Remote (opcional)

### Sentry (Opcional)
- **Versión**: >= 7.x
- **Propósito**: Error tracking y performance monitoring
- **Integration**: Vue, Electron main process

---

## ⚠️ IMPORTANTES PARA TRAE

### Versiones Exactas Requeridas
- Node.js: `20.10.0` o superior
- npm: `10.2.0` o superior  
- PostgreSQL: `15.5` o superior
- Docker: `24.0.0` o superior
- Docker Compose: `2.21.0` o superior

### Dependencies NO Negociables
- Vue 3 (NO Vue 2, NO React, NO Angular)
- TypeScript (NO JavaScript puro)
- Tailwind CSS (NO Bootstrap, NO Material UI), usar V3 , es mas estable
- PostgreSQL (NO MySQL, NO MongoDB)
- Prisma ORM (NO TypeORM, NO Sequelize)

### Performance Targets
- Cold start: < 3 segundos
- Hot reload: < 500ms
- Database queries: < 100ms promedio
- API responses: < 1 segundo
- Bundle size: < 50MB para distribución

### Arquitectura Constraints
- Modular: Core engine + plugins
- Type-safe: Todo en TypeScript strict
- Responsive: Funciona en 1200px mínimo
- Offline-ready: Cache local para funciones críticas
- Update-friendly: Sin breaking changes en APIs internas