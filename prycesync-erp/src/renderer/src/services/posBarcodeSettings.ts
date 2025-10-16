import { apiClient } from './api'

export interface PosBarcodeSettings {
  enabled: boolean
  windowMsMin: number
  windowMsMax?: number
  interKeyTimeout?: number
  minLength: number
  suffix: 'Enter' | 'Tab' | 'none'
  preventInInputs: boolean
  forceFocus?: boolean
  autoSelectSingle?: boolean
}

export const DEFAULT_BARCODE_SETTINGS: PosBarcodeSettings = {
  enabled: true,
  windowMsMin: 50,
  windowMsMax: 200,
  interKeyTimeout: 200,
  minLength: 6,
  suffix: 'Enter',
  preventInInputs: true,
  forceFocus: true,
  autoSelectSingle: true,
}

export async function getPosBarcodeSettings(): Promise<Partial<PosBarcodeSettings>> {
  try {
    // Try module/key style endpoint
    const res1 = await apiClient.get('/settings/core_system/pos.barcode')
    const data1 = res1?.data?.data ?? res1?.data
    if (data1 && typeof data1 === 'object') {
      const mapped: any = { ...data1 }
      if (mapped.interKeyTimeout == null && mapped.windowMsMax != null) {
        mapped.interKeyTimeout = mapped.windowMsMax
      }
      return mapped as Partial<PosBarcodeSettings>
    }
  } catch (_) {}

  try {
    // Fallback generic query style
    const res2 = await apiClient.get('/settings', {
      params: { module: 'core_system', key: 'pos.barcode' },
    })
    const data2 = res2?.data?.data ?? res2?.data
    if (data2 && typeof data2 === 'object') {
      const mapped: any = { ...data2 }
      if (mapped.interKeyTimeout == null && mapped.windowMsMax != null) {
        mapped.interKeyTimeout = mapped.windowMsMax
      }
      return mapped as Partial<PosBarcodeSettings>
    }
  } catch (_) {}

  return DEFAULT_BARCODE_SETTINGS
}
