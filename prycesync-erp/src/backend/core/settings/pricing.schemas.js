import { z } from 'zod'

export const SupplierOverrideSchema = z.object({
  marginPercent: z.number().min(0).max(1000),
  applyOnImport: z.boolean().optional(),
  overwriteSalePrice: z.boolean().optional()
})

export const PricingSettingsSchema = z.object({
  defaultMarginPercent: z.number().min(0).max(1000),
  priceSource: z.enum(['costPrice', 'listPrice']),
  applyOnImport: z.boolean(),
  applyOnUpdate: z.boolean(),
  roundingMode: z.enum(['nearest', 'up', 'down']),
  roundingDecimals: z.number().min(0).max(4),
  overwriteSalePrice: z.boolean(),
  allowBelowCost: z.boolean(),
  supplierOverrides: z.record(SupplierOverrideSchema)
})

export const defaultPricingSettings = {
  defaultMarginPercent: 35,
  priceSource: 'costPrice',
  applyOnImport: true,
  applyOnUpdate: true,
  roundingMode: 'nearest',
  roundingDecimals: 0,
  overwriteSalePrice: false,
  allowBelowCost: false,
  supplierOverrides: {}
}

