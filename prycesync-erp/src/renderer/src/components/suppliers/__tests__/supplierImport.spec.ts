import { describe, it, expect } from 'vitest'
import { autoMapHeaders, validateRow } from '@/utils/supplierImport'

describe('supplier import utils', () => {
  it('auto maps typical spanish headers', () => {
    const headers = ['Código Proveedor','Nombre Producto','Precio Costo','Precio Lista','Marca','Rubro','IVA','Unidad']
    const mapping = autoMapHeaders(headers)
    expect(mapping.supplier_sku).toBe('Código Proveedor')
    expect(mapping.name).toBe('Nombre Producto')
    expect(mapping.cost_price).toBe('Precio Costo')
    expect(mapping.tax_rate).toBe('IVA')
  })

  it('validates required fields and VAT range', () => {
    const ok = validateRow({ supplierCode: 'SKU1', supplierName: 'Prod', costPrice: 123.45, taxRate: 21 })
    expect(ok.errors.length).toBe(0)
    expect(ok.warnings.length).toBe(0)

    const bad = validateRow({ supplierCode: '', supplierName: '', costPrice: 'abc', taxRate: 15 })
    expect(bad.errors).toContain('supplier_sku vacío')
    expect(bad.errors).toContain('name vacío')
    expect(bad.errors).toContain('cost_price inválido')
    expect(bad.warnings).toContain('IVA fuera de 0/10.5/21/27')
  })

  it('accepts VAT edge values', () => {
    for (const v of [0, 10.5, 21, 27]) {
      const res = validateRow({ supplierCode: 'A', supplierName: 'B', costPrice: 1, taxRate: v })
      expect(res.warnings.length).toBe(0)
    }
  })
})

