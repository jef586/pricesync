PriceSync ERP — Requerimientos Completos (Original + Nuevos)

🎯 Objetivo Principal

ERP modular completo con IA integrada, inicialmente enfocado en repuestos automotrices, pero ahora evolucionado hacia un core de Ventas (POS) con integración futura de facturación AFIP, licenciamiento centralizado, y una app móvil para vendedores.

🏢 Perfil de Usuario

Usuarios principales: Comercios y casas de repuestos en Argentina.

Expansión: Paraguay, Bolivia y países limítrofes.

Futuros usuarios: Retail, farmacias, ferreterías y comercios minoristas.

💼 Modelo de Negocio

Licencia única con control centralizado (sin suscripción mensual).

Licencias activadas por código RSA, monitoreo con heartbeat horario.

Versiones: Económica (solo ventas internas) y Premium (IA + AFIP + móvil).

Demo de 30 días con limitaciones.

🧭 Fases del Proyecto (Roadmap 20 Semanas)

🟩 Fase 1 (Semanas 1–5): Core de Ventas + Licenciamiento

Ventas básicas sin AFIP.

Lector de códigos de barras USB HID.

Impresora térmica ESC/POS (58/80mm).

Subcategorías jerárquicas y combos/ofertas.

Sistema de licencias con servidor central.

Control de comisiones por vendedor.

🟦 Fase 2 (Semanas 6–10): Facturación AFIP + Métricas + Migraciones

Conversión Venta → Factura (TusFacturasApp API).

API Padrón AFIP (validación CUIT/CUIL, autocompletado datos fiscales).

Métricas físicas (litros, kilos, metros) + reportes comparativos $/unidad.

Sistema de migración desde Excel/Tango/Bejerman.

🟧 Fase 3 (Semanas 11–15): App Móvil + Seguridad Anti-Crackeo

App móvil React Native + Expo (pedidos offline).

API móvil dedicada (autenticación JWT, sync, rate limit).

Seguridad avanzada: ofuscación, DB cifrada, detección de crackeo.

🟥 Fase 4 (Semanas 16–20): IA Pricing + Reportes Avanzados

Integración con MercadoLibre API.

Análisis de competencia + precios sugeridos.

Dashboard BI avanzado, export PDF/Excel, gráficos interactivos.

✅ Requerimientos Clave

🧾 Módulo de Ventas POS

Crear ventas internas (no fiscales) con productos, descuentos, combos.

Buscar productos por lector de códigos de barras.

Mostrar imagen previa del producto.

Imprimir ticket térmico con ESC/POS.

Modo offline con almacenamiento local temporal.

Subcategorías en productos (estructura árbol).

Combos y promociones automáticas (3x2, % descuento).

🔑 Sistema de Licencias

Servidor central (Node.js + Express) con endpoints /validate, /status/:licenseKey, /heartbeat.

Cliente desktop con activación y heartbeat horario.

Bloqueo automático si licencia expirada o inválida.

Cifrado RSA + JWT + HTTPS.

Dashboard para monitoreo de licencias activas.

🧍‍♂️ Comisiones por Vendedor

Configuración de % por vendedor.

Cálculo automático en cada venta.

Reportes por período y exportación Excel.

🧠 Facturación AFIP (Fase 2)

Flujo Venta → Factura.

Validación automática con API Padrón AFIP.

Generación de CAE + PDF fiscal + ticket térmico con QR.

⚖️ Métricas Físicas

Campos adicionales en producto: unit_type (L, Kg, m, u), unit_quantity.

Reportes de ventas por unidades físicas y monetarias.

🗂️ Migración desde Otros Sistemas

Wizard 5 pasos: Selección, Upload, Mapeo, Validación, Confirmación.

Templates Excel para Tango/Bejerman/Genérico.

📱 App Móvil para Vendedores

Crear pedidos offline con catálogo local.

Sincronizar automáticamente con API central.

Indicadores de estado: sincronizado/pendiente.

🛡️ Seguridad Anti‑Crackeo

Ofuscación del código Electron + Node.

DB cifrada (clave derivada de licencia + hardware ID).

Validación de integridad (checksums, firmas digitales).

Anti‑debug + detección de entornos virtuales.

🤖 IA Pricing (Fase 4)

Integración MercadoLibre API (oficial).

Sugerencias de precios basadas en competencia.

Análisis histórico de ventas + demanda.

🔒 Restricciones No Negociables

Docker obligatorio.

Electron + Vue 3 + TypeScript.

PostgreSQL + Prisma + Redis.

React Native + Expo (SQLite local) para móvil.

Comunicación HTTPS.

API MercadoLibre oficial (sin scraping).

RSA + JWT en licencias.

📊 Métricas de Éxito por Fase

F1: POS operativo con lector e impresión <30s. Licenciamiento funcional.

F2: AFIP integrada, 1000 filas importadas sin errores.

F3: App móvil con sincronización confiable.

F4: IA Pricing preciso (>75%) y dashboard BI completo.

⚙️ Dependencias y Stack

Frontend: Electron + Vue 3 + Tailwind + Pinia.

Backend: Node.js + Express + Prisma + PostgreSQL.

Hardware POS: escpos, escpos-usb.

Seguridad: helmet, jsonwebtoken, javascript-obfuscator.

Móvil: React Native + Expo + SQLite.

DevOps: Docker Compose, CI con doctor/health/test, Electron Builder.

📚 Documentación a Actualizar

ARCHITECTURE.md: incluir servidor central de licencias + app móvil.

DATABASE_SCHEMA.md: agregar tablas licenses, commissions, combos, promotions, price_lists.

TECH_STACK.md: añadir React Native, ESC/POS, seguridad avanzada.

ROADMAP.md: reflejar roadmap de 20 semanas.

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




## ⚠️ IMPORTANTE PARA TRAE
Este documento es la **FUENTE DE VERDAD** del proyecto. Cualquier decisión técnica debe ser validada contra estos requerimientos. Si algo parece contradictorio o unclear, **PREGUNTAR** antes de implementar.

**NO CAMBIAR** estos requerimientos sin aprobación explícita del product owner.