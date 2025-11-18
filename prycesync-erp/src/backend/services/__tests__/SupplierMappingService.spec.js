import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Groq provider
vi.mock('../../integrations/ai/groqProvider.js', () => {
  return {
    groqJsonComplete: vi.fn(async () => ({
      supplier_sku: { columnIndex: 0, confidence: 0.93 },
      name: { columnIndex: 3, confidence: 0.98 },
      cost_price: { columnIndex: 6, confidence: 0.9 },
      list_price: { columnIndex: null, confidence: 0.1 },
      brand: { columnIndex: 4, confidence: 0.85 },
      category_name: { columnIndex: 2, confidence: 0.8 },
      tax_rate: { columnIndex: null, confidence: 0.05 },
      unit: { columnIndex: 5, confidence: 0.7 }
    }))
  }
})

describe('SupplierMappingService.suggestMapping', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('maps fields and clamps confidence', async () => {
    const { SupplierMappingService } = await import('../SupplierMappingService.js')
    const svc = new SupplierMappingService()
    const columns = [
      { index: 0, label: 'COD' },
      { index: 1, label: 'N/A' },
      { index: 2, label: 'RUBRO' },
      { index: 3, label: 'DESCRIPCION' },
      { index: 4, label: 'MARCA' },
      { index: 5, label: 'UN' },
      { index: 6, label: 'COSTO' }
    ]
    const sampleRows = [
      ['1092914', '', 'CORTADORAS', 'Cortadora...', 'NIWA', 'UN', '102493'],
      ['1092915', '', 'CORTADORAS', 'Cortadora...', 'NIWA', 'UN', '106000']
    ]
    const res = await svc.suggestMapping({ supplierId: 'sup_123', supplierName: 'NIWA', columns, sampleRows, hasHeader: true })
    expect(res.supplier_sku).toEqual({ columnIndex: 0, confidence: 0.93 })
    expect(res.name).toEqual({ columnIndex: 3, confidence: 0.98 })
    expect(res.cost_price).toEqual({ columnIndex: 6, confidence: 0.9 })
    expect(res.list_price).toEqual({ columnIndex: null, confidence: 0.1 })
    expect(res.brand).toEqual({ columnIndex: 4, confidence: 0.85 })
    expect(res.category_name).toEqual({ columnIndex: 2, confidence: 0.8 })
    expect(res.tax_rate).toEqual({ columnIndex: null, confidence: 0.05 })
    expect(res.unit).toEqual({ columnIndex: 5, confidence: 0.7 })
  })

  it('handles out-of-range index and non-numeric confidence', async () => {
    vi.doMock('../../integrations/ai/groqProvider.js', () => ({
      groqJsonComplete: vi.fn(async () => ({ name: { columnIndex: 99, confidence: 'x' } }))
    }))
    const { SupplierMappingService } = await import('../SupplierMappingService.js')
    const svc = new SupplierMappingService()
    const columns = [{ index: 0, label: 'A' }, { index: 1, label: 'B' }]
    const sampleRows = [['x','y']]
    const res = await svc.suggestMapping({ supplierId: 's1', supplierName: 'S', columns, sampleRows, hasHeader: true })
    expect(res.name).toEqual({ columnIndex: null, confidence: 0 })
  })
})

