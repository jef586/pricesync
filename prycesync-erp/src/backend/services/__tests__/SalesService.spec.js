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

  it('aplica recargo porcentual y prorratea con IVA', () => {
    const items = [
      { quantity: 2, unitPrice: 100, taxRate: 21, discount: 10 },
      { quantity: 1, unitPrice: 50, taxRate: 21 }
    ]
    const surcharge = { type: 'PERCENT', value: 10 }
    const totals = SalesService.calculateTotals(items, { type: 'NONE', value: 0 }, surcharge)
    expect(totals.subtotal.toNumber()).toBeCloseTo(230.00, 2)
    expect(totals.discountAmount.toNumber()).toBeCloseTo(0.00, 2)
    // 10% de 230 = 23
    expect(totals.surchargeAmount.toNumber()).toBeCloseTo(23.00, 2)
    // IVA sobre (230 + 23) = 21% de 253 = 53.13
    expect(totals.taxAmount.toNumber()).toBeCloseTo(53.13, 2)
    // Total = 230 + 23 + 53.13 = 306.13
    expect(totals.total.toNumber()).toBeCloseTo(306.13, 2)
    expect(totals.totalRounded.toNumber()).toBeCloseTo(306.13, 2)
    // Prorrateo del recargo por ítem suma al total de recargo
    const sumSurcharge = items.reduce((acc, it) => acc + (it.surchargeShare?.toNumber ? it.surchargeShare.toNumber() : Number(it.surchargeShare || 0)), 0)
    expect(sumSurcharge).toBeCloseTo(23.00, 2)
  })

  it('aplica recargo absoluto y prorratea con IVA', () => {
    const items = [
      { quantity: 2, unitPrice: 100, taxRate: 21, discount: 10 },
      { quantity: 1, unitPrice: 50, taxRate: 21 }
    ]
    const surcharge = { type: 'ABS', value: 30 }
    const totals = SalesService.calculateTotals(items, { type: 'NONE', value: 0 }, surcharge)
    expect(totals.subtotal.toNumber()).toBeCloseTo(230.00, 2)
    expect(totals.discountAmount.toNumber()).toBeCloseTo(0.00, 2)
    // Recargo ABS de 30 (no supera base)
    expect(totals.surchargeAmount.toNumber()).toBeCloseTo(30.00, 2)
    // IVA sobre (230 + 30) = 21% de 260 = 54.60
    expect(totals.taxAmount.toNumber()).toBeCloseTo(54.60, 2)
    // Total = 230 + 30 + 54.60 = 314.60
    expect(totals.total.toNumber()).toBeCloseTo(314.60, 2)
    expect(totals.totalRounded.toNumber()).toBeCloseTo(314.60, 2)
    // Prorrateo del recargo por ítem suma al total de recargo
    const sumSurcharge = items.reduce((acc, it) => acc + (it.surchargeShare?.toNumber ? it.surchargeShare.toNumber() : Number(it.surchargeShare || 0)), 0)
    expect(sumSurcharge).toBeCloseTo(30.00, 2)
  })
})
