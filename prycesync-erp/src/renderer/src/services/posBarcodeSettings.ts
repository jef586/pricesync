import { apiClient } from './api'
import type { BarcodeSettings } from '@/composables/useBarcode'

export const DEFAULT_BARCODE_SETTINGS: BarcodeSettings = {
  enabled: true,
  windowMsMin: 50,
  windowMsMax: 200,
  minLength: 6,
  suffix: 'Enter',
  preventInInputs: true,
}

export async function getPosBarcodeSettings(): Promise<Partial<BarcodeSettings>> {
  try {
    // Try module/key style endpoint
    const res1 = await apiClient.get('/settings/core_system/pos.barcode')
    const data1 = res1?.data?.data ?? res1?.data
    if (data1 && typeof data1 === 'object') return data1 as Partial<BarcodeSettings>
  } catch (_) {}

  try {
    // Fallback generic query style
    const res2 = await apiClient.get('/settings', {
      params: { module: 'core_system', key: 'pos.barcode' },
    })
    const data2 = res2?.data?.data ?? res2?.data
    if (data2 && typeof data2 === 'object') return data2 as Partial<BarcodeSettings>
  } catch (_) {}

  return DEFAULT_BARCODE_SETTINGS
}