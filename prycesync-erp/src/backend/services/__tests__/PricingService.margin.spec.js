import { describe, it, expect } from 'vitest'
import { directPricing, inversePricing } from '../PricingService.js'

describe('PricingService margen negativo', () => {
  it('directo: cost=2000, iva=21, margen=-10', () => {
    const { pricePublic } = directPricing({ cost: 2000, gainPct: -10, taxRate: 21, internalTaxType: 'NONE', internalTaxValue: 0 })
    expect(pricePublic).toBe(2178)
  })

  it('inverso: cost=2000, iva=21, pricePublic=1500 → margen negativo', () => {
    const { gainPct, pricePublic } = inversePricing({ pricePublic: 1500, cost: 2000, taxRate: 21, internalTaxType: 'NONE', internalTaxValue: 0 })
    expect(pricePublic).toBe(1500)
    expect(gainPct).toBeLessThan(0)
  })

  it('cost=0 y pricePublic=100 → gainPct=null', () => {
    const { gainPct, pricePublic } = inversePricing({ pricePublic: 100, cost: 0, taxRate: 21, internalTaxType: 'NONE', internalTaxValue: 0 })
    expect(pricePublic).toBe(100)
    expect(gainPct).toBeNull()
  })
})
