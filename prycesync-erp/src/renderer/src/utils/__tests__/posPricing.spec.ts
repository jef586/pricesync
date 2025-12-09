import { describe, it, expect } from 'vitest'
import { computePriceForRowFromLists } from '../posPricing'

describe('POS Price Lists', () => {
  const base = { pricePublic: 2200, priceLists: { L1: 2904, L2: 2783, L3: 2662, L4: { price: 2200, minQty: 3 } } }

  it('L2 uses list value (AC1)', () => {
    const meta = computePriceForRowFromLists(base, 1, 'l2')
    expect(meta?.used).toBe('L2')
    expect(meta?.price).toBe(2783)
  })

  it('L4 applies only when qty >= minQty (AC3)', () => {
    const m1 = computePriceForRowFromLists(base, 2, 'l4', 'l1')
    expect(m1?.used).not.toBe('L4')
    const m2 = computePriceForRowFromLists(base, 3, 'l4', 'l1')
    expect(m2?.used).toBe('L4')
    expect(m2?.price).toBe(2200)
  })

  it('Fallback to public when list missing (AC4)', () => {
    const lists = { pricePublic: 2200, priceLists: { L1: null, L2: null, L3: null, L4: null as any } }
    const meta = computePriceForRowFromLists(lists, 1, 'l2')
    expect(meta?.used).toBe('PUBLIC')
    expect(meta?.fallbackOf).toBe('L2')
    expect(meta?.price).toBe(2200)
  })
})
