import prisma from '../config/database.js'
import { PricingSettingsSchema } from '../core/settings/pricing.schemas.js'

class SetupController {
  static async getStatus(req, res) {
    try {
      const companyId = req.companyId || req.user?.company?.id || req.user?.companyId
      if (!companyId) {
        return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })
      }

      const company = await prisma.company.findUnique({
        where: { id: String(companyId) },
        select: {
          name: true,
          taxId: true,
          address: true,
          fiscalConfig: true
        }
      })

      const fiscal = company?.fiscalConfig || {}
      const contributorType = String(fiscal.contributorType || '').trim()
      const legalName = String(fiscal.legalName || '').trim()
      const companyConfigured = Boolean(
        company?.name && company?.taxId && company?.address && contributorType && legalName
      )

      let articlesCount = 0
      try { articlesCount = await prisma.article.count({ where: { companyId: String(companyId), deletedAt: null } }) } catch {}
      const firstProductCreated = articlesCount > 0

      let suppliersCount = 0
      try { suppliersCount = await prisma.supplier.count({ where: { companyId: String(companyId), deletedAt: null } }) } catch {}
      let importsCompletedCount = 0
      try { importsCompletedCount = await prisma.importJob.count({ where: { companyId: String(companyId), status: 'completed' } }) } catch {}
      const supplierConfigured = (suppliersCount > 0) || (importsCompletedCount > 0)

      const pricingCfg = fiscal?.pricing || {}
      const pricingParsed = PricingSettingsSchema.safeParse(pricingCfg)
      const pricingConfigured = pricingParsed.success

      let invoicesCount = 0
      try { invoicesCount = await prisma.invoice.count({ where: { companyId: String(companyId), status: { not: 'draft' }, deletedAt: null } }) } catch {}
      const firstSaleCompleted = invoicesCount > 0

      return res.json({
        companyConfigured,
        firstProductCreated,
        supplierConfigured,
        pricingConfigured,
        firstSaleCompleted
      })
    } catch (error) {
      return res.status(500).json({ error: 'Error interno del servidor', message: error?.message })
    }
  }
}

export default SetupController
