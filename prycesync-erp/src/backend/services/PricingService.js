import prisma from '../config/database.js'

function getDefaultPricing() {
  return {
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

export async function getCompanyPricing(companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { fiscalConfig: true }
  })
  const fiscal = company?.fiscalConfig || {}
  const pricing = fiscal.pricing || {}
  return { ...getDefaultPricing(), ...pricing }
}

export function computeSalePrice({ costPrice, listPrice, pricing, supplierId }) {
  const sourceValue = pricing.priceSource === 'listPrice' && listPrice ? listPrice : costPrice
  const marginPercent = (() => {
    if (supplierId && pricing.supplierOverrides && pricing.supplierOverrides[supplierId]?.marginPercent != null) {
      return pricing.supplierOverrides[supplierId].marginPercent
    }
    return pricing.defaultMarginPercent
  })()

  let value = sourceValue * (1 + marginPercent / 100)

  // Opcional: proteger por debajo de costo
  if (!pricing.allowBelowCost && value < costPrice) {
    value = costPrice
  }

  // Redondeo
  const factor = Math.pow(10, pricing.roundingDecimals)
  if (pricing.roundingMode === 'up') {
    value = Math.ceil(value * factor) / factor
  } else if (pricing.roundingMode === 'down') {
    value = Math.floor(value * factor) / factor
  } else {
    value = Math.round(value * factor) / factor
  }

  return value
}

function computeInternalTax(cost, internalTaxType, internalTaxValue) {
  const c = Number(cost || 0)
  if (!internalTaxType || internalTaxValue == null) return 0
  const val = Number(internalTaxValue)
  if (internalTaxType === 'NONE') return 0
  if (internalTaxType === 'FIXED' || internalTaxType === 'ABS') return val
  if (internalTaxType === 'PERCENT') return c * (val / 100)
  return 0
}

function roundHalfUp(n, decimals = 2) {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor + Number.EPSILON) / factor
}

export function directPricing({ cost, gainPct = 0, taxRate = 21, internalTaxType = null, internalTaxValue = null }) {
  const c = Number(cost || 0)
  const g = Number(gainPct || 0)
  const v = Number(taxRate || 0)
  const internalTax = computeInternalTax(c, internalTaxType, internalTaxValue)
  const baseWithMargin = c * (1 + g / 100)
  const net = baseWithMargin + internalTax
  const pricePublic = roundHalfUp(net * (1 + v / 100), 2)
  return { pricePublic }
}

// Deriva costo y precio para un combo/kit en base a sus componentes
// components: [{ articleId, qty }]
export async function forCombo({ companyId, components = [], taxRate = 21, gainPct = null, internalTaxType = null, internalTaxValue = null }) {
  const compList = Array.isArray(components) ? components.filter(c => c && c.articleId && (c.qty || c.quantity)) : []
  if (compList.length === 0) {
    return { cost: 0, pricePublic: 0 }
  }

  const ids = [...new Set(compList.map(c => String(c.articleId)))]
  const articles = await prisma.article.findMany({
    where: { companyId, id: { in: ids } },
    select: { id: true, cost: true }
  })
  const costById = new Map(articles.map(a => [a.id, Number(a.cost || 0)]))
  const totalCost = compList.reduce((acc, c) => acc + (costById.get(String(c.articleId)) || 0) * Number(c.qty || c.quantity || 0), 0)

  let finalGainPct = gainPct
  if (finalGainPct == null) {
    const pricing = await getCompanyPricing(companyId)
    finalGainPct = pricing.defaultMarginPercent
  }

  const { pricePublic } = directPricing({ cost: totalCost, gainPct: finalGainPct, taxRate, internalTaxType, internalTaxValue })
  return { cost: Number(totalCost.toFixed(2)), pricePublic }
}

// Calcula margen (gainPct) inverso dado un precio público final
export function inversePricing({ pricePublic, cost, taxRate = 21, internalTaxType = null, internalTaxValue = null }) {
  const p = Number(pricePublic || 0)
  const c = Number(cost || 0)
  const v = Number(taxRate || 0)
  if (!(c > 0)) {
    return { gainPct: null, pricePublic: roundHalfUp(p, 2) }
  }
  const internalTax = computeInternalTax(c, internalTaxType, internalTaxValue)
  const netWithoutVAT = p / (1 + v / 100)
  const baseWithMargin = netWithoutVAT - internalTax
  const g = ((baseWithMargin / c) - 1) * 100
  const gainPct = roundHalfUp(g, 2)
  return { gainPct, pricePublic: roundHalfUp(p, 2) }
}
