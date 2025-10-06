# Pricing Configuration Guide

This guide explains how pricing rules work across the app and how to configure and preview them.

## Concepts
- Default Margin: Base margin applied when no supplier-specific override exists.
- Price Source: Determines whether sale price is calculated from `costPrice` or `listPrice`.
- Rounding: Mode (`nearest`, `up`, `down`) and number of decimals for final sale price.
- Supplier Overrides: Per-supplier margin that takes precedence over default.

## Frontend Preview
- View: `src/renderer/src/views/PricingSettingsView.vue` at route `/company/pricing`.
- Selector allows choosing a supplier; entering Cost and optional List Price shows computed sale price.
- Service: `src/renderer/src/services/settingsService.ts` — `computePreviewSale(cost, list, settings, supplierId?)`.

## Backend Calculation
- Service: `src/backend/services/PricingService.js` — `computeSalePrice({ costPrice, listPrice, settings, supplierId })`.
- Applies overrides when `supplierId` is provided; otherwise uses default margin.
- Honors rounding and `allowBelowCost` settings.

## Recommended Integrations
- Product updates: pass `supplierId` to backend pricing when available.
- Imports: apply pricing during supplier product import; use `supplierId`.

## Troubleshooting
- If preview doesn’t reflect overrides, confirm they were saved and the selected supplier matches the override.
- Verify rounding mode and decimals; extreme decimals may produce unexpected UI formatting.