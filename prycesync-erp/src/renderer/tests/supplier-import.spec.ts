import { describe, it, expect } from 'vitest'
import { autoMapHeaders, normalizeCost } from '@/utils/supplierImport'

describe('supplierImport utils', () => {
  it('autoMapHeaders maps common synonyms', () => {
    const headers = ['Código Proveedor', 'Nombre', 'Precio Costo', 'IVA', 'Unidad']
    const m = autoMapHeaders(headers)
    expect(m.supplier_sku).toBe('Código Proveedor')
    expect(m.name).toBe('Nombre')
    expect(m.cost_price).toBe('Precio Costo')
    expect(m.tax_rate).toBe('IVA')
    expect(m.unit).toBe('Unidad')
  })

  it('normalizeCost removes VAT and converts currency', () => {
    const cost = normalizeCost(121, 21, true, 'ARS')
    expect(cost).toBe(100)
    const usd = normalizeCost(100, 0, false, 'USD', 1000)
    expect(usd).toBe(100000)
  })
})

