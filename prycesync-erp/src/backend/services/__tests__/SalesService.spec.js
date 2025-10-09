import { describe, it, expect } from 'vitest'
import SalesService from '../SalesService.js'

describe('SalesService.calculateTotals', () => {
  it('calcula totales con IVA y descuentos', () => {
    const items = [
      { quantity: 2, unitPrice: 100, taxRate: 21, discount: 10 },
      { quantity: 1, unitPrice: 50, taxRate: 21 }
    ]

    const totals = SalesService.calculateTotals(items)
    expect(totals.subtotal.toNumber()).toBeCloseTo(230.00, 2)
    expect(totals.taxAmount.toNumber()).toBeCloseTo(48.30, 2)
    expect(totals.discountAmount.toNumber()).toBeCloseTo(20.00, 2)
    expect(totals.total.toNumber()).toBeCloseTo(278.30, 2)
    expect(totals.totalRounded.toNumber()).toBeCloseTo(278.30, 2)

    expect(items[0].subtotal.toNumber()).toBeCloseTo(180.00, 2)
    expect(items[0].taxAmount.toNumber()).toBeCloseTo(37.80, 2)
    expect(items[0].total.toNumber()).toBeCloseTo(217.80, 2)
  })
})
