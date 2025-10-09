import { describe, it, expect } from 'vitest'
import { computeSalePrice } from '../PricingService.js'

describe('PricingService.computeSalePrice', () => {
  const basePricing = {
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

  it('usa costPrice cuando listPrice no aplica', () => {
    const price = computeSalePrice({
      costPrice: 100,
      listPrice: null,
      pricing: { ...basePricing, priceSource: 'costPrice' },
      supplierId: null
    })
    expect(price).toBe(135)
  })

  it('usa listPrice cuando priceSource es listPrice', () => {
    const price = computeSalePrice({
      costPrice: 100,
      listPrice: 200,
      pricing: { ...basePricing, priceSource: 'listPrice' },
      supplierId: null
    })
    expect(price).toBe(270)
  })

  it('aplica override de margen por proveedor', () => {
    const price = computeSalePrice({
      costPrice: 100,
      listPrice: 0,
      pricing: {
        ...basePricing,
        supplierOverrides: { sup1: { marginPercent: 50 } }
      },
      supplierId: 'sup1'
    })
    expect(price).toBe(150)
  })

  it('no permite precio por debajo de costo si allowBelowCost=false', () => {
    const price = computeSalePrice({
      costPrice: 100,
      listPrice: null,
      pricing: { ...basePricing, defaultMarginPercent: -10, allowBelowCost: false },
      supplierId: null
    })
    expect(price).toBe(100)
  })

  it('redondea hacia arriba/abajo/nearest con decimales', () => {
    const base = 123.451
    // margen 0 para probar redondeo directo del valor fuente
    const up = computeSalePrice({
      costPrice: base,
      listPrice: null,
      pricing: { ...basePricing, defaultMarginPercent: 0, roundingMode: 'up', roundingDecimals: 2 },
      supplierId: null
    })
    expect(up).toBe(123.46)

    const down = computeSalePrice({
      costPrice: base,
      listPrice: null,
      pricing: { ...basePricing, defaultMarginPercent: 0, roundingMode: 'down', roundingDecimals: 2 },
      supplierId: null
    })
    expect(down).toBe(123.45)

    const nearest = computeSalePrice({
      costPrice: 123.456,
      listPrice: null,
      pricing: { ...basePricing, defaultMarginPercent: 0, roundingMode: 'nearest', roundingDecimals: 2 },
      supplierId: null
    })
    expect(nearest).toBe(123.46)
  })
})