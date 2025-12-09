export type PriceLists = {
  pricePublic?: number
  priceLists?: { L1?: number | null; L2?: number | null; L3?: number | null; L4?: { price: number; minQty: number } | null }
  cost?: number
  tax?: { ivaPct: number; internalTaxType?: 'NONE'|'FIXED'|'ABS'|'PERCENT'|null; internalTaxValue?: number|null }
}

export type PriceMeta = { price: number, used: 'L1'|'L2'|'L3'|'L4'|'PUBLIC', fallbackOf?: 'L1'|'L2'|'L3'|'L4' }

function computeInternalTax(cost: number, internalTaxType?: string|null, internalTaxValue?: number|null) {
  const c = Number(cost || 0)
  const val = Number(internalTaxValue || 0)
  if (!internalTaxType || internalTaxType === 'NONE') return 0
  if (internalTaxType === 'FIXED' || internalTaxType === 'ABS') return val
  if (internalTaxType === 'PERCENT') return c * (val / 100)
  return 0
}

export function directPricingFE({ cost, gainPct = 0, taxRate = 21, internalTaxType = null, internalTaxValue = null }: { cost: number, gainPct?: number, taxRate?: number, internalTaxType?: string|null, internalTaxValue?: number|null }) {
  const c = Number(cost || 0)
  const g = Number(gainPct || 0)
  const v = Number(taxRate || 0)
  const internalTax = computeInternalTax(c, internalTaxType, internalTaxValue)
  const baseWithMargin = c * (1 + g / 100)
  const net = baseWithMargin + internalTax
  const pricePublic = Math.round(net * (1 + v / 100) * 100) / 100
  return { pricePublic }
}

export function computePriceForRowFromLists(lists: PriceLists | undefined, qty: number, listIdLower: string, lastNonPromoListId: 'l1'|'l2'|'l3' = 'l1'): PriceMeta | null {
  const pub = Number((lists?.pricePublic ?? 0) || 0)
  if (!lists || !lists.priceLists) return { price: pub, used: 'PUBLIC' }
  if (['l1','l2','l3'].includes(listIdLower)) {
    const key = listIdLower.toUpperCase() as 'L1'|'L2'|'L3'
    const val = lists.priceLists?.[key]
    if (val != null) return { price: Number(val), used: key }
    // FE fallback a márgenes por defecto si no vino la lista calculada
    const defaults: Record<'L1'|'L2'|'L3', number> = { L1: 20, L2: 15, L3: 10 }
    const { pricePublic } = directPricingFE({ cost: Number(lists.cost || 0), gainPct: defaults[key], taxRate: Number(lists.tax?.ivaPct || 21), internalTaxType: lists.tax?.internalTaxType || null, internalTaxValue: Number(lists.tax?.internalTaxValue || 0) })
    if (pricePublic > 0) return { price: Number(pricePublic), used: key }
    return { price: pub, used: 'PUBLIC', fallbackOf: key }
  }
  if (listIdLower === 'l4') {
    const promo = lists.priceLists?.L4
    if (promo && Number(qty) >= Number(promo.minQty || 0)) return { price: Number(promo.price || pub), used: 'L4' }
    const nn = lastNonPromoListId.toUpperCase() as 'L1'|'L2'|'L3'
    const val = lists.priceLists?.[nn]
    if (val != null) return { price: Number(val), used: nn }
    // FE fallback a márgenes por defecto si no vino la lista calculada
    const defaults: Record<'L1'|'L2'|'L3', number> = { L1: 20, L2: 15, L3: 10 }
    const { pricePublic } = directPricingFE({ cost: Number(lists.cost || 0), gainPct: defaults[nn], taxRate: Number(lists.tax?.ivaPct || 21), internalTaxType: lists.tax?.internalTaxType || null, internalTaxValue: Number(lists.tax?.internalTaxValue || 0) })
    if (pricePublic > 0) return { price: Number(pricePublic), used: nn }
    return { price: pub, used: 'PUBLIC', fallbackOf: 'L4' }
  }
  return { price: pub, used: 'PUBLIC' }
}
