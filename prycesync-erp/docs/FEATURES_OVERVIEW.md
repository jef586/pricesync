# PryceSync ERP — Features Overview

This document summarizes the main modules and features of the system to help users and developers understand what’s available and where to find it.

## Core Navigation
- `/dashboard`: Quick stats and recent activity
- `/invoices`: List, create, edit and view invoices
- `/customers`: Manage customers and details
- `/inventory`: Inventory view and product navigation
- `/suppliers`: Supplier management and product imports
- `/company`: Company profile
- `/company/pricing`: Pricing configuration and preview
- `/help`: In-app Help (features overview and quick guidance)

## Pricing Configuration
- Default margin, price source (cost or list), rounding mode and decimals
- Supplier overrides: per-supplier margin configuration
- Preview calculation: choose supplier, enter cost/list price, and see computed sale price

## Suppliers and Product Imports
- Import products from supplier spreadsheets
- Recommended integration: pass `supplierId` to pricing when importing to apply overrides

## Products and Inventory
- Create/edit products, see stock and pricing in inventory
- Navigate to product detail and editing from inventory

## Invoices
- Create, edit and view invoices
- Includes item lines with quantities and pricing

## Authentication and Route Guards
- Routes with `requiresAuth` redirect to `/auth` when not authenticated
- Successful login redirects to dashboard

## Where to Look in Code
- Frontend router: `src/renderer/src/router/index.ts`
- Help view: `src/renderer/src/views/HelpView.vue`
- Pricing settings view: `src/renderer/src/views/PricingSettingsView.vue`
- Pricing preview service: `src/renderer/src/services/settingsService.ts`
- Backend pricing service: `src/backend/services/PricingService.js`