import { apiClient } from './api'
import { z } from 'zod'

export interface PricingSettings {
  defaultMarginPercent: number
  priceSource: 'costPrice' | 'listPrice'
  applyOnImport: boolean
  applyOnUpdate: boolean
  roundingMode: 'nearest' | 'up' | 'down'
  roundingDecimals: number
  overwriteSalePrice: boolean
  allowBelowCost: boolean
  supplierOverrides: Record<string, { marginPercent: number }>
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const res = await apiClient.get('/settings/pricing')
  // Backend returns { success, data }
  return res.data.data || res.data
}

export async function updatePricingSettings(settings: Partial<PricingSettings>): Promise<PricingSettings> {
  const res = await apiClient.put('/settings/pricing', settings)
  return res.data.data || res.data
}

export function computePreviewSale(
  costPrice: number,
  listPrice: number | null,
  settings: PricingSettings,
  supplierId?: string | null
): number {
  const source = settings.priceSource === 'listPrice' && listPrice != null ? listPrice : costPrice
  const marginPercent = (() => {
    const sid = supplierId || null
    if (
      sid &&
      settings.supplierOverrides &&
      settings.supplierOverrides[sid] &&
      settings.supplierOverrides[sid].marginPercent != null
    ) {
      return settings.supplierOverrides[sid].marginPercent
    }
    return settings.defaultMarginPercent || 0
  })()
  const margin = source * (1 + marginPercent / 100)
  let value = margin

  if (!settings.allowBelowCost && value < costPrice) {
    value = costPrice
  }

  const factor = Math.pow(10, settings.roundingDecimals || 0)
  if (settings.roundingMode === 'up') {
    value = Math.ceil(value * factor) / factor
  } else if (settings.roundingMode === 'down') {
    value = Math.floor(value * factor) / factor
  } else {
    value = Math.round(value * factor) / factor
  }

  return value
}

// --- Printing Settings ---
export const PrintingSettingsSchema = z.object({
  defaultPrinter: z.string().nullable().optional(),
  paperWidth: z.number().min(30).max(120),
  marginTop: z.number().min(0).max(50),
  marginRight: z.number().min(0).max(50),
  marginBottom: z.number().min(0).max(50),
  marginLeft: z.number().min(0).max(50),
  fontSize: z.number().min(8).max(24),
  autoPrintAfterSale: z.boolean(),
  branchId: z.string().nullable().optional()
})

export type PrintingSettings = z.infer<typeof PrintingSettingsSchema>

export async function getPrintingSettings(params?: { branchId?: string | null }): Promise<PrintingSettings> {
  const res = await apiClient.get('/settings/printing', { params })
  return res.data.data || res.data
}

export async function updatePrintingSettings(payload: Partial<PrintingSettings>): Promise<PrintingSettings> {
  // Validate before sending
  const parsed = PrintingSettingsSchema.partial().safeParse(payload)
  if (!parsed.success) {
    throw new Error('Validación de configuración de impresión inválida')
  }
  const res = await apiClient.put('/settings/printing', payload)
  return res.data.data || res.data
}