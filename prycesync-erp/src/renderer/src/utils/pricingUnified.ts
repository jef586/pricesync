export type RoundingMode = 'HALF_UP'|'UP'|'DOWN'

export function roundHalfUp(n: number): number { return Math.round(n * 100) / 100 }
export function roundUp(n: number): number { const f = 100; return Math.ceil(n * f) / f }
export function roundDown(n: number): number { const f = 100; return Math.floor(n * f) / f }

export function applyRounding(n: number, mode: RoundingMode = 'HALF_UP'): number {
  if (mode === 'UP') return roundUp(n)
  if (mode === 'DOWN') return roundDown(n)
  return roundHalfUp(n)
}

export function internalTaxAmount(cost: number, amount: number, pct: number): number {
  const addPct = Number(pct || 0) > 0 ? Number(cost || 0) * (Number(pct) / 100) : 0
  const amt = Number(amount || 0)
  return amt + addPct
}

export function directPricing(cost: number, internalTaxAmt: number, internalTaxPct: number, marginPct: number, vatPct: number, mode: RoundingMode = 'HALF_UP') {
  const netBase = Number(cost || 0) + internalTaxAmount(cost, internalTaxAmt, internalTaxPct)
  const neto = netBase * (1 + Number(marginPct || 0) / 100)
  const netRounded = applyRounding(neto, mode)
  const final = netRounded * (1 + Number(vatPct || 0) / 100)
  return { neto: netRounded, final: applyRounding(final, mode) }
}

export function inverseMargin(cost: number, internalTaxAmt: number, internalTaxPct: number, finalPrice: number, vatPct: number, mode: RoundingMode = 'HALF_UP') {
  const netBase = Number(cost || 0) + internalTaxAmount(cost, internalTaxAmt, internalTaxPct)
  if (netBase <= 0) throw new Error('NET_BASE_MUST_BE_POSITIVE')
  const precioNeto = Number(finalPrice || 0) / (1 + Number(vatPct || 0) / 100)
  const margen = (precioNeto / netBase - 1) * 100
  return applyRounding(margen, mode)
}

