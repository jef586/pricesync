export type SupplierImportMapping = Record<string, string>

export function autoMapHeaders(headers: string[]): SupplierImportMapping {
  const lower = headers.map(h => h.toLowerCase())
  const find = (tokens: string[]) => {
    const idx = lower.findIndex(h => tokens.some(t => h.includes(t)))
    return idx >= 0 ? headers[idx] : ''
  }
  return {
    supplier_sku: find(['sku','código proveedor','codigo proveedor','code']),
    name: find(['nombre','producto','name']),
    cost_price: find(['costo','precio costo','cost']),
    list_price: find(['lista','precio lista','list']),
    brand: find(['marca','brand']),
    category_name: find(['rubro','categoría','categoria','category']),
    tax_rate: find(['iva','tax']),
    unit: find(['unidad','unit'])
  }
}

export interface SupplierImportRow {
  supplierCode?: string
  supplierName?: string
  costPrice?: any
  listPrice?: any
  taxRate?: any
}

export function validateRow(row: SupplierImportRow): { errors: string[], warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  if (!row.supplierCode || String(row.supplierCode).trim() === '') errors.push('supplier_sku vacío')
  if (!row.supplierName || String(row.supplierName).trim() === '') errors.push('name vacío')
  const cost = Number(row.costPrice)
  if (!Number.isFinite(cost) || cost <= 0) errors.push('cost_price inválido')
  if (row.taxRate != null && row.taxRate !== '') {
    const vat = Number(row.taxRate)
    const ok = [0, 10.5, 21, 27].some(v => Math.abs(v - vat) < 0.0001)
    if (!ok) warnings.push('IVA fuera de 0/10.5/21/27')
  }
  return { errors, warnings }
}

export function normalizeCost(costPrice: number, taxRate: number | undefined, includesVat: boolean, currency: 'ARS' | 'USD', usdRate?: number): number {
  const cost = Number(costPrice || 0)
  const vat = Number(taxRate || 0)
  const base = includesVat ? (vat > 0 ? cost / (1 + vat / 100) : cost) : cost
  const rate = currency === 'USD' ? Number(usdRate || 1) : 1
  return Number((base * rate).toFixed(2))
}
