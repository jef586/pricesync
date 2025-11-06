import prisma from '../config/database.js'
import UomService from '../services/UomService.js'

function ensureArrayJson(val) {
  if (val == null) return []
  if (Array.isArray(val)) return val
  try { const parsed = JSON.parse(String(val)); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}

function validateTierPayload(tier) {
  const errors = []
  const min = Number(tier?.minQtyUn)
  if (!min || min <= 0) errors.push('minQtyUn debe ser > 0')
  const hasUnitPrice = tier?.pricePerUnit != null && tier?.pricePerUnit !== ''
  const hasPercentOff = tier?.percentOff != null && tier?.percentOff !== ''
  if (hasUnitPrice === hasPercentOff) errors.push('Debe especificar solo precio unitario o % desc.')
  const ppu = Number(tier?.pricePerUnit)
  const pct = Number(tier?.percentOff)
  if (hasUnitPrice && (!isFinite(ppu) || ppu <= 0)) errors.push('pricePerUnit debe ser > 0')
  if (hasPercentOff && (!isFinite(pct) || pct <= 0)) errors.push('percentOff debe ser > 0')
  return errors
}

export default class ArticleQuantityPromotionController {
  static async get(req, res) {
    try {
      const articleId = String(req.params.articleId)
      const promo = await prisma.articleQuantityPromotion.findFirst({
        where: { articleId },
        include: { tiers: { orderBy: { sort: 'asc' } } }
      })
      return res.json(promo || null)
    } catch (err) {
      return res.status(err.httpCode || 500).json({ message: err.message || 'Error obteniendo promoción' })
    }
  }

  static async create(req, res) {
      try {
        const articleId = String(req.params.articleId)
        const body = req.body || {}
        const priceListIds = ensureArrayJson(body.priceListIds)
        const data = {
          articleId,
          active: body.active !== false,
          exclusive: !!body.exclusive,
          priceListIds,
          startsAt: body.startsAt ? new Date(body.startsAt) : null,
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
          createdBy: req.user?.id || null,
          updatedBy: req.user?.id || null
        }
        const created = await prisma.articleQuantityPromotion.create({ data })
        return res.status(201).json(created)
      } catch (err) {
        return res.status(err.httpCode || 500).json({ message: err.message || 'Error creando promoción' })
      }
  }

  static async update(req, res) {
    try {
      const articleId = String(req.params.articleId)
      const body = req.body || {}
      const existing = await prisma.articleQuantityPromotion.findFirst({ where: { articleId } })
      if (!existing) return res.status(404).json({ message: 'Promoción no encontrada' })
      const patch = {
        active: body.active != null ? !!body.active : existing.active,
        exclusive: body.exclusive != null ? !!body.exclusive : existing.exclusive,
        priceListIds: body.priceListIds != null ? ensureArrayJson(body.priceListIds) : existing.priceListIds,
        startsAt: body.startsAt != null ? (body.startsAt ? new Date(body.startsAt) : null) : existing.startsAt,
        endsAt: body.endsAt != null ? (body.endsAt ? new Date(body.endsAt) : null) : existing.endsAt,
        updatedBy: req.user?.id || existing.updatedBy,
        updatedAt: new Date()
      }
      const updated = await prisma.articleQuantityPromotion.update({ where: { id: existing.id }, data: patch })
      return res.json(updated)
    } catch (err) {
      return res.status(err.httpCode || 500).json({ message: err.message || 'Error actualizando promoción' })
    }
  }

  static async remove(req, res) {
    try {
      const articleId = String(req.params.articleId)
      const existing = await prisma.articleQuantityPromotion.findFirst({ where: { articleId } })
      if (!existing) return res.status(404).json({ message: 'Promoción no encontrada' })
      await prisma.articleQuantityPromoTier.deleteMany({ where: { promotionId: existing.id } })
      await prisma.articleQuantityPromotion.delete({ where: { id: existing.id } })
      return res.json({ success: true })
    } catch (err) {
      return res.status(err.httpCode || 500).json({ message: err.message || 'Error eliminando promoción' })
    }
  }

  // Tiers CRUD (scoped by article promotion)
  static async listTiers(req, res) {
    try {
      const articleId = String(req.params.articleId)
      const promo = await prisma.articleQuantityPromotion.findFirst({ where: { articleId } })
      if (!promo) return res.json([])
      const rows = await prisma.articleQuantityPromoTier.findMany({ where: { promotionId: promo.id }, orderBy: { sort: 'asc' } })
      return res.json(rows)
    } catch (err) {
      return res.status(err.httpCode || 500).json({ message: err.message || 'Error listando tiers' })
    }
  }

  static async createTier(req, res) {
    try {
      const articleId = String(req.params.articleId)
      const promo = await prisma.articleQuantityPromotion.findFirst({ where: { articleId } })
      if (!promo) return res.status(404).json({ message: 'Promoción no encontrada' })
      const body = req.body || {}
      const errs = validateTierPayload(body)
      if (errs.length) return res.status(400).json({ message: 'VALIDATION_ERROR', errors: errs })
      // compute next sort as last+1 by minQty asc
      const existing = await prisma.articleQuantityPromoTier.findMany({ where: { promotionId: promo.id }, orderBy: { sort: 'asc' } })
      const nextSort = (existing[existing.length - 1]?.sort || 0) + 1
      const data = {
        promotionId: promo.id,
        minQtyUn: Number(body.minQtyUn),
        pricePerUnit: body.pricePerUnit != null ? Number(body.pricePerUnit) : null,
        percentOff: body.percentOff != null ? Number(body.percentOff) : null,
        sort: nextSort
      }
      const created = await prisma.articleQuantityPromoTier.create({ data })
      return res.status(201).json(created)
    } catch (err) {
      return res.status(err.httpCode || 500).json({ message: err.message || 'Error creando tier' })
    }
  }

  static async updateTier(req, res) {
    try {
      const articleId = String(req.params.articleId)
      const tierId = String(req.params.tierId)
      const promo = await prisma.articleQuantityPromotion.findFirst({ where: { articleId } })
      if (!promo) return res.status(404).json({ message: 'Promoción no encontrada' })
      const tier = await prisma.articleQuantityPromoTier.findUnique({ where: { id: tierId } })
      if (!tier || tier.promotionId !== promo.id) return res.status(404).json({ message: 'Tier no encontrado' })
      const body = req.body || {}
      const errs = validateTierPayload({
        minQtyUn: body.minQtyUn != null ? body.minQtyUn : tier.minQtyUn,
        pricePerUnit: body.pricePerUnit != null ? body.pricePerUnit : tier.pricePerUnit,
        percentOff: body.percentOff != null ? body.percentOff : tier.percentOff
      })
      if (errs.length) return res.status(400).json({ message: 'VALIDATION_ERROR', errors: errs })
      const patch = {
        minQtyUn: body.minQtyUn != null ? Number(body.minQtyUn) : tier.minQtyUn,
        pricePerUnit: body.pricePerUnit != null ? Number(body.pricePerUnit) : tier.pricePerUnit,
        percentOff: body.percentOff != null ? Number(body.percentOff) : tier.percentOff,
        sort: body.sort != null ? Number(body.sort) : tier.sort
      }
      const updated = await prisma.articleQuantityPromoTier.update({ where: { id: tierId }, data: patch })
      return res.json(updated)
    } catch (err) {
      return res.status(err.httpCode || 500).json({ message: err.message || 'Error actualizando tier' })
    }
  }

  static async deleteTier(req, res) {
    try {
      const articleId = String(req.params.articleId)
      const tierId = String(req.params.tierId)
      const promo = await prisma.articleQuantityPromotion.findFirst({ where: { articleId } })
      if (!promo) return res.status(404).json({ message: 'Promoción no encontrada' })
      const tier = await prisma.articleQuantityPromoTier.findUnique({ where: { id: tierId } })
      if (!tier || tier.promotionId !== promo.id) return res.status(404).json({ message: 'Tier no encontrado' })
      await prisma.articleQuantityPromoTier.delete({ where: { id: tierId } })
      return res.json({ success: true })
    } catch (err) {
      return res.status(err.httpCode || 500).json({ message: err.message || 'Error eliminando tier' })
    }
  }
}