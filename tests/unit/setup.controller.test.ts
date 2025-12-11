import { describe, it, expect, vi, beforeEach } from 'vitest'
import SetupController from '../../src/backend/controllers/SetupController.js'

// Mock prisma dependency used by controller
vi.mock('../../src/backend/config/database.js', () => {
  const state: any = {
    company: {
      name: 'Empresa Test',
      taxId: '20-12345678-9',
      address: 'Calle 123',
      fiscalConfig: {
        legalName: 'Empresa Test S.A.',
        contributorType: 'RESPONSABLE_INSCRIPTO',
        pricing: {
          defaultMarginPercent: 35,
          priceSource: 'costPrice',
          applyOnImport: true,
          applyOnUpdate: true,
          roundingMode: 'nearest',
          roundingDecimals: 0,
          overwriteSalePrice: false,
          allowBelowCost: false,
          supplierOverrides: {}
        }
      }
    },
    counts: {
      articles: 1,
      suppliers: 1,
      supplierProducts: 5,
      importsCompleted: 1,
      invoicesNotDraft: 2
    }
  }
  return {
    default: {
      company: {
        findUnique: vi.fn(async () => state.company)
      },
      article: { count: vi.fn(async () => state.counts.articles) },
      supplier: { count: vi.fn(async () => state.counts.suppliers) },
      supplierProduct: { count: vi.fn(async () => state.counts.supplierProducts) },
      importJob: { count: vi.fn(async () => state.counts.importsCompleted) },
      invoice: { count: vi.fn(async () => state.counts.invoicesNotDraft) }
    }
  }
})

function mockReq() {
  return { user: { company: { id: 'company-1' } } } as any
}

function mockRes() {
  const res: any = {}
  res.statusCode = 200
  res.status = (code: number) => { res.statusCode = code; return res }
  res.json = (payload: any) => { res.body = payload; return res }
  return res
}

describe('SetupController.getStatus', () => {
  it('returns all flags true when data present', async () => {
    const req = mockReq()
    const res = mockRes()
    await SetupController.getStatus(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      companyConfigured: true,
      firstProductCreated: true,
      supplierConfigured: true,
      pricingConfigured: true,
      firstSaleCompleted: true
    })
  })
})

