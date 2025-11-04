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

function mergePricingConfig(existing) {
  const defaults = getDefaultPricing()
  const current = existing && typeof existing === 'object' ? existing : {}
  return { ...defaults, ...current }
}

class SettingsController {
  static async getPricingSettings(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId
      if (!companyId) {
        return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { fiscalConfig: true }
      })

      const fiscal = company?.fiscalConfig || {}
      const pricing = mergePricingConfig(fiscal.pricing)

      return res.json({ success: true, data: pricing })
    } catch (error) {
      console.error('Error obteniendo settings de pricing:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  static async updatePricingSettings(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId
      if (!companyId) {
        return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })
      }

      const input = req.body || {}
      const pricing = mergePricingConfig(input)

      if (typeof pricing.defaultMarginPercent !== 'number' || pricing.defaultMarginPercent < 0 || pricing.defaultMarginPercent > 1000) {
        return res.status(400).json({ error: 'defaultMarginPercent inválido' })
      }
      if (!['costPrice', 'listPrice'].includes(pricing.priceSource)) {
        return res.status(400).json({ error: 'priceSource inválido' })
      }
      if (!['nearest', 'up', 'down'].includes(pricing.roundingMode)) {
        return res.status(400).json({ error: 'roundingMode inválido' })
      }
      if (typeof pricing.roundingDecimals !== 'number' || pricing.roundingDecimals < 0 || pricing.roundingDecimals > 4) {
        return res.status(400).json({ error: 'roundingDecimals inválido (0-4)' })
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { fiscalConfig: true }
      })

      const fiscalConfig = company?.fiscalConfig || {}
      const updatedFiscal = { ...fiscalConfig, pricing }

      const updated = await prisma.company.update({
        where: { id: companyId },
        data: { fiscalConfig: updatedFiscal },
        select: { fiscalConfig: true }
      })

      return res.json({ success: true, data: updated.fiscalConfig.pricing })
    } catch (error) {
      console.error('Error actualizando settings de pricing:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
}

export default SettingsController