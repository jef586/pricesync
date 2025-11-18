import { defineStore } from 'pinia'

export type Currency = 'ARS' | 'USD'

export interface TransformConfig {
  costPriceIncludesVat: boolean
  currency: Currency
  usdRate?: number
}

export interface SupplierImportConfig {
  headerRow: number
  mapping: Record<string, string>
  transformConfig: TransformConfig
}

export interface ImportOptions {
  applyOnImport: boolean
  overwriteSalePrice: boolean
}

export interface WizardState {
  supplierId: string
  fileName: string | null
  fileSize: number | null
  headerRow: number
  availableHeaders: string[]
  mapping: Record<string, string>
  transformConfig: TransformConfig
  options: ImportOptions
}

function storageKey(supplierId: string) {
  return `supplier_import_config:${supplierId}`
}

export const useSupplierImportStore = defineStore('supplierImport', {
  state: (): WizardState => ({
    supplierId: '',
    fileName: null,
    fileSize: null,
    headerRow: 1,
    availableHeaders: [],
    mapping: {},
    transformConfig: { costPriceIncludesVat: false, currency: 'ARS', usdRate: undefined },
    options: { applyOnImport: true, overwriteSalePrice: false }
  }),
  actions: {
    setSupplier(supplierId: string) {
      this.supplierId = supplierId
      const cfg = this.loadConfig(supplierId)
      if (cfg) {
        this.headerRow = cfg.headerRow
        this.mapping = cfg.mapping
        this.transformConfig = cfg.transformConfig
      }
    },
    setHeaders(headers: string[]) {
      this.availableHeaders = headers
    },
    setHeaderRow(n: number) {
      this.headerRow = Math.max(1, Math.floor(n))
    },
    setMapping(k: string, v: string) {
      this.mapping = { ...this.mapping, [k]: v }
    },
    setTransformConfig(cfg: Partial<TransformConfig>) {
      this.transformConfig = { ...this.transformConfig, ...cfg }
    },
    setOptions(opts: Partial<ImportOptions>) {
      this.options = { ...this.options, ...opts }
    },
    saveConfig() {
      if (!this.supplierId) return
      const payload: SupplierImportConfig = {
        headerRow: this.headerRow,
        mapping: this.mapping,
        transformConfig: this.transformConfig
      }
      localStorage.setItem(storageKey(this.supplierId), JSON.stringify(payload))
    },
    loadConfig(supplierId: string): SupplierImportConfig | null {
      try {
        const raw = localStorage.getItem(storageKey(supplierId))
        if (!raw) return null
        const parsed = JSON.parse(raw) as SupplierImportConfig
        return parsed
      } catch {
        return null
      }
    },
    setFileMeta(name: string | null, size: number | null) {
      this.fileName = name
      this.fileSize = size
    }
  }
})

