import { apiClient } from './api'

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