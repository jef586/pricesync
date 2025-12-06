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
  return DEFAULT_BARCODE_SETTINGS
}
