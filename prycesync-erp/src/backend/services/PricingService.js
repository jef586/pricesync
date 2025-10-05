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