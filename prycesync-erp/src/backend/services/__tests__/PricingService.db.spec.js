import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../config/database.js', () => {
  const prisma = {
    company: { findUnique: vi.fn() }
  }
  return { default: prisma }
})

let prismaMock
let getCompanyPricing

beforeEach(async () => {
  const dbModule = await import('../../config/database.js')
  prismaMock = dbModule.default
  Object.values(prismaMock.company).forEach(fn => fn.mockReset())
  ;({ getCompanyPricing } = await import('../PricingService.js'))
})

describe('PricingService.getCompanyPricing', () => {
  it('retorna defaults cuando no hay configuración de empresa', async () => {
    prismaMock.company.findUnique.mockResolvedValue(null)
    const pricing = await getCompanyPricing('company-1')
    expect(pricing.priceSource).toBe('costPrice')
    expect(pricing.defaultMarginPercent).toBe(35)
    expect(pricing.roundingMode).toBe('nearest')
    expect(pricing.roundingDecimals).toBe(0)
  })

  it('fusiona defaults con fiscal.pricing de la empresa', async () => {
    prismaMock.company.findUnique.mockResolvedValue({
      fiscalConfig: {
        pricing: {
          defaultMarginPercent: 10,
          roundingMode: 'down',
          roundingDecimals: 2,
          allowBelowCost: true
        }
      }
    })

    const pricing = await getCompanyPricing('company-1')
    expect(pricing.defaultMarginPercent).toBe(10)
    expect(pricing.roundingMode).toBe('down')
    expect(pricing.roundingDecimals).toBe(2)
    expect(pricing.allowBelowCost).toBe(true)
    // Valores no definidos mantienen defaults
    expect(pricing.priceSource).toBe('costPrice')
  })
})