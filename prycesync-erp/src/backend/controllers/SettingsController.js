import prisma from '../config/database.js'
import { PrintingSettingsSchema, defaultPrintingSettings } from '../core/settings/printing.schemas.js'

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

  // --- Printing Settings ---
  static getDefaultPrinting() {
    return { ...defaultPrintingSettings }
  }

  static mergePrintingConfig(existing) {
    const defaults = SettingsController.getDefaultPrinting()
    const current = existing && typeof existing === 'object' ? existing : {}
    return { ...defaults, ...current }
  }

  static async getPrintingSettings(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId
      if (!companyId) {
        return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })
      }

      const branchId = req.query.branchId || null

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { fiscalConfig: true }
      })

      const fiscal = company?.fiscalConfig || {}
      const printingRoot = fiscal.printing || {}
      const base = SettingsController.mergePrintingConfig(printingRoot.default || printingRoot)

      let data = base
      if (branchId && printingRoot.branches && typeof printingRoot.branches === 'object') {
        const override = printingRoot.branches[branchId]
        if (override) {
          data = SettingsController.mergePrintingConfig({ ...base, ...override })
        }
      }

      // attach branchId to payload for clarity
      data.branchId = branchId || null
      return res.json({ success: true, data })
    } catch (error) {
      console.error('Error obteniendo settings de impresión:', error)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }

  static async updatePrintingSettings(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId
      if (!companyId) {
        return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })
      }

      const input = req.body || {}
      const branchId = input.branchId || null
      // Zod validation aligned to renderer schema (partial allowed)
      const parsed = PrintingSettingsSchema.partial().safeParse(input)
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Configuración de impresión inválida', details: parsed.error.flatten() } })
      }
      const printing = SettingsController.mergePrintingConfig(parsed.data)

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { fiscalConfig: true }
      })

      const fiscalConfig = company?.fiscalConfig || {}
      const currentPrinting = fiscalConfig.printing || {}

      let updatedPrinting
      if (branchId) {
        const branches = currentPrinting.branches || {}
        branches[branchId] = {
          defaultPrinter: printing.defaultPrinter,
          paperWidth: printing.paperWidth,
          marginTop: printing.marginTop,
          marginRight: printing.marginRight,
          marginBottom: printing.marginBottom,
          marginLeft: printing.marginLeft,
          fontSize: printing.fontSize,
          autoPrintAfterSale: printing.autoPrintAfterSale
        }
        updatedPrinting = {
          default: SettingsController.mergePrintingConfig(currentPrinting.default || {}),
          branches
        }
      } else {
        updatedPrinting = {
          default: {
            defaultPrinter: printing.defaultPrinter,
            paperWidth: printing.paperWidth,
            marginTop: printing.marginTop,
            marginRight: printing.marginRight,
            marginBottom: printing.marginBottom,
            marginLeft: printing.marginLeft,
            fontSize: printing.fontSize,
            autoPrintAfterSale: printing.autoPrintAfterSale
          },
          branches: currentPrinting.branches || {}
        }
      }

      const updatedFiscal = { ...fiscalConfig, printing: updatedPrinting }

      const updated = await prisma.company.update({
        where: { id: companyId },
        data: { fiscalConfig: updatedFiscal },
        select: { fiscalConfig: true }
      })

      const responsePayload = branchId
        ? { ...updated.fiscalConfig.printing.default, ...updated.fiscalConfig.printing.branches?.[branchId], branchId }
        : { ...updated.fiscalConfig.printing.default, branchId: null }

      return res.json({ success: true, data: responsePayload })
    } catch (error) {
      console.error('Error actualizando settings de impresión:', error)
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } })
    }
  }
}

export default SettingsController