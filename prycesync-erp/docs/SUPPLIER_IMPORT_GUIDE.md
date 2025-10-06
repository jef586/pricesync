# Supplier Product Import Guide

This guide explains how to import supplier products and how pricing should integrate during the process.

## Import Endpoints
- `POST /suppliers/import/execute`: executes a bulk import.
- `POST /suppliers/:id/products/import/execute`: executes an import scoped to a supplier.

## Recommended Pricing Integration
- When importing, pass `supplierId` to pricing calculation so supplier overrides are applied.
- Honor `applyOnImport` and `overwriteSalePrice` settings to determine whether to compute sale price and replace existing values.

## UI Flow
- Navigate to `/suppliers/:id`.
- Open the import modal, select your spreadsheet, and start the import.
- Review imported products in the supplier’s product list.

## Validation Tips
- Ensure product rows include cost/list price columns as expected by your parser.
- Validate supplier mapping: the imported products must associate to the correct `supplierId`.