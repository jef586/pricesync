# PriceSync ERP - Requerimientos del Proyecto

## 🎯 Objetivo Principal
ERP modular completo con IA integrada, inicialmente enfocado en repuestos automotrices, pero arquitecturado para ser reutilizable en otros negocios verticales.

## 🏢 Perfil de Usuario
- **Usuario Primario**: Vendedores de casas de repuestos de autos en Argentina
- **Expansión**: Comerciantes de Paraguay, Bolivia, y países limítrofes
- **Futuros usuarios**: Retail general, farmacias, ferreterías

## 💼 Modelo de Negocio
- **Tipo**: Licencia única (NO subscripción)
- **Estructura**: Módulos separados por vertical
- **Versiones**: Económica y Premium por módulo
- **Demo**: Versión gratuita de 30 días con limitaciones
- **Updates**: Automáticas incluidas en licencia

## 🏗️ Arquitectura del Sistema

### Core Engine Universal
- ✅ Facturación electrónica (AFIP + sistemas internacionales)
- ✅ Control de stock/inventario universal
- ✅ Gestión de clientes (CRM básico)
- ✅ Reportes contables estándar
- ✅ Sistema de usuarios y permisos
- ✅ Sistema de plugins/módulos hot-pluggable
- ✅ Configuración multi-empresa
- ✅ Sistema de licencias integrado

### Módulos Comerciales

#### 🚗 Módulo Auto-Parts (V1)
**Versión Económica ($299 USD):**
- Facturación AFIP básica (A, B, C)
- Control stock básico
- Gestión clientes
- Import Excel de listas de proveedores
- Pricing manual con margen fijo configurable
- Reportes básicos (ventas, stock)
- 1 usuario únicamente

**Versión Premium ($899 USD):**
- Todo lo de Económica +
- 🤖 IA Pricing vs MercadoLibre (API oficial)
- 🤖 Identificación automática por foto (Google Vision)
- 🤖 Alertas de precios competencia
- 🤖 Análisis predictivo de demanda
- 📊 Reportes avanzados + Business Intelligence
- 👥 Usuarios ilimitados
- 🔄 Sincronización multi-sucursal

#### 🏪 Módulos Futuros (V2+)
- Retail General
- Farmacia
- Ferretería
- Otros verticales bajo demanda

## 🌍 Internacionalización
Sistema preparado desde V1 para:
- 🇦🇷 **Argentina**: AFIP/ARCA integration
- 🇵🇾 **Paraguay**: SIFEN integration  
- 🇧🇴 **Bolivia**: Sistema de Facturación Virtual
- 🇧🇷 **Brasil**: NFe (V2)
- 🇨🇱 **Chile**: SII (V2)
- 🇺🇾 **Uruguay**: DGI (V2)

## 💻 Stack Tecnológico FIJO

### Frontend
- **Framework**: Electron + Vue 3 + TypeScript
- **Styling**: Tailwind CSS + Design System propio
- **State Management**: Pinia + Persist
- **Build Tool**: Vite
- **Routing**: Vue Router 4

### Backend
- **Runtime**: Node.js (embebido en Electron)
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis para APIs externas
- **API Framework**: Express.js

### DevOps & Deploy
- **Containerización**: Docker completo (obligatorio)
- **Desarrollo**: docker-compose con hot reload
- **Updates**: Electron Updater (automáticas)
- **Build**: Electron Builder para distribución

### APIs Externas
- **Fiscal Argentina**: TusFacturasApp (AFIP integration)
- **IA Pricing**: OpenAI GPT-4 para análisis
- **Vision IA**: Google Vision API
- **Ecommerce**: MercadoLibre API oficial (NO scraping)

## 🎨 Requerimientos UX/UI

### Design System Obligatorio
- **Componentes base**: Button, Input, Select, Checkbox, Spinner
- **Componentes complejos**: DataTable, Modal, FormField, Filters
- **Layout**: Header, Sidebar, Main, Footer modulares
- **Tokens**: Colores, espaciado, tipografía, shadows consistentes

### Flujo Principal (Split-Screen Pro)
- **Panel Izquierdo**: Upload foto/código + historial
- **Panel Derecho**: Análisis + precio sugerido + competencia
- **Tiempo objetivo**: <3 segundos para mostrar precio
- **Clicks objetivo**: <2 clicks para completar flujo

### Accesibilidad
- **Contraste**: Mínimo WCAG AA (4.5:1)
- **Tipografía**: 16px mínimo, sistema operativo + fallbacks
- **Keyboard**: Navegación completa por teclado
- **Screen readers**: Semantic HTML + ARIA labels

## 🔄 Funcionalidades Core

### 1. Sistema de Facturación
- **Tipos**: Facturas A, B, C + Notas crédito/débito
- **AFIP**: Integración real con CAE + código QR
- **Estados**: Borrador → Enviada → Pagada → Anulada
- **Numeración**: Automática + puntos de venta configurables
- **Export**: PDF para impresión + XML fiscal

### 2. Control de Inventario
- **Movimientos**: Entradas, salidas, ajustes, transferencias
- **Stock**: Tiempo real + alertas stock mínimo
- **Valuación**: FIFO, LIFO, Promedio ponderado
- **Ubicaciones**: Multi-depósito + multi-sucursal

### 3. IA Pricing (Premium)
- **Input**: Foto pieza OR código/descripción
- **Proceso**: Vision API → identificación → ML API → análisis
- **Output**: Precio sugerido + justificación + competencia
- **Configuración**: Márgenes por categoría + reglas pricing

### 4. Sistema de Módulos
- **Hot-plugging**: Activar/desactivar sin reiniciar
- **Licencias**: Control por módulo + vencimientos
- **Configuración**: Settings por módulo independientes
- **Updates**: Módulos independientes del core

## 📊 Versión Demo

### Limitaciones Demo (30 días)
- ❌ Máximo 50 facturas
- ❌ Máximo 20 clientes  
- ❌ Máximo 100 productos
- ❌ Sin integración AFIP real (simulada)
- ❌ Watermark en reportes
- ❌ No exportar datos completos

### Features Demo
- ✅ Todas las funciones básicas visibles
- ✅ IA pricing simulado (datos dummy)
- ✅ UI completa navegable
- ✅ Import Excel funcional
- ✅ Reportes con marca de agua

## 🎯 Métricas de Éxito V1

### Técnicas
- ✅ Docker compose up = todo funciona
- ✅ AFIP integration test exitoso
- ✅ Tiempo respuesta IA <5 segundos
- ✅ Hot reload funcionando
- ✅ Updates automáticas probadas

### Negocio
- ✅ Demo mode funcional para presentaciones
- ✅ Pricing IA >75% accuracy en piezas comunes
- ✅ Sistema modular permite agregar países fácilmente
- ✅ Componentes reutilizables aceleran desarrollo futuro

## 🚫 Restricciones CRÍTICAS

### NO NEGOCIABLES
- **Docker obligatorio**: CERO dependencias locales
- **Vue 3**: NO cambiar a React u otros frameworks
- **PostgreSQL**: NO cambiar a MySQL/MongoDB
- **Componentes reutilizables**: NO duplicar código UI
- **API oficial ML**: NO scraping bajo ninguna circunstancia
- **Licencia única**: NO modelo subscripción

### Evitar Absolutamente
- **Scope creep**: Mantener enfoque en requerimientos definidos
- **Over-engineering**: Implementar solo lo necesario para V1
- **Inconsistencia UI**: Seguir design system estrictamente
- **Dependencias innecesarias**: Evaluar cada librería nueva

## 📅 Roadmap Macro

### Semana 1-4: Core Engine
- Base Docker + Vue + PostgreSQL
- Sistema de componentes + design tokens  
- AFIP integration básica
- User management + auth

### Semana 5-8: Auto-Parts Económico
- Import Excel proveedores
- Pricing manual + márgenes
- Stock control específico repuestos
- Demo mode completo

### Semana 9-12: Auto-Parts Premium  
- IA pricing + ML API integration
- Google Vision + identificación automática
- Reportes avanzados + analytics
- Multi-usuario

### Semana 13-16: Deploy + Polish
- Testing completo + QA
- Documentación usuario final
- Installer + updates automáticas
- Preparación para otros países

---

## ⚠️ IMPORTANTE PARA TRAE
Este documento es la **FUENTE DE VERDAD** del proyecto. Cualquier decisión técnica debe ser validada contra estos requerimientos. Si algo parece contradictorio o unclear, **PREGUNTAR** antes de implementar.

**NO CAMBIAR** estos requerimientos sin aprobación explícita del product owner.