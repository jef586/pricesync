import { describe, it, expect } from 'vitest'
import { applyRounding, internalTaxAmount, directPricing, inverseMargin } from '@/utils/pricingUnified'

describe('pricingUnified utils', () => {
  it('directo: calcula neto y final con HALF_UP', () => {
    const { neto, final } = directPricing(100, 10, 0, 20, 21, 'HALF_UP')
    expect(neto).toBeCloseTo(132, 2)
    expect(final).toBeCloseTo(159.72, 2)
  })
  it('inverso: calcula margen desde precio final', () => {
    const margen = inverseMargin(100, 10, 0, 159.72, 21, 'HALF_UP')
    expect(margen).toBeCloseTo(20, 2)
  })
  it('internalTaxAmount: combina monto y %', () => {
    const amt = internalTaxAmount(200, 10, 5)
    expect(amt).toBeCloseTo(20, 2)
  })
  it('redondeo: UP/DOWN/HALF_UP', () => {
    expect(applyRounding(1.234, 'HALF_UP')).toBeCloseTo(1.23, 2)
    expect(applyRounding(1.231, 'UP')).toBeCloseTo(1.24, 2)
    expect(applyRounding(1.239, 'DOWN')).toBeCloseTo(1.23, 2)
  })
})

