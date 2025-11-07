import prisma from '../config/database.js'

function parseNumber(n) {
  const v = n == null ? null : Number(n)
  return Number.isFinite(v) ? v : null
}

function validateList(list) {
  const { marginPct, finalPrice } = list
  if (marginPct != null && finalPrice != null) {
    return 'No se permite editar margen y precio a la vez'
  }
  return null
}

export default class ArticleFixedPricesController {
  static async get(req, res) {
    try {
      const { id } = req.params
      const companyId = req.user.company.id

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } })
      if (!article) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Artículo no encontrado' })

      const fp = await prisma.articlePricesFixed.findUnique({ where: { articleId: id } })
      return res.json({ success: true, data: fp || null })
    } catch (err) {
      console.error('Error get prices-fixed:', err)
      return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message })
    }
  }

  static async upsert(req, res) {
    try {
      const { id } = req.params
      const companyId = req.user.company.id
      const body = req.body || {}

      const article = await prisma.article.findFirst({ where: { id, companyId, deletedAt: null }, select: { id: true } })
      if (!article) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Artículo no encontrado' })

      // Validaciones de cada lista
      const l1Err = validateList({ marginPct: body.l1MarginPct, finalPrice: body.l1FinalPrice })
      const l2Err = validateList({ marginPct: body.l2MarginPct, finalPrice: body.l2FinalPrice })
      const l3Err = validateList({ marginPct: body.l3MarginPct, finalPrice: body.l3FinalPrice })
      const firstErr = l1Err || l2Err || l3Err
      if (firstErr) return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: firstErr })

      const data = {
        articleId: id,
        l1MarginPct: parseNumber(body.l1MarginPct),
        l1FinalPrice: parseNumber(body.l1FinalPrice),
        l1Locked: !!body.l1Locked,

        l2MarginPct: parseNumber(body.l2MarginPct),
        l2FinalPrice: parseNumber(body.l2FinalPrice),
        l2Locked: !!body.l2Locked,

        l3MarginPct: parseNumber(body.l3MarginPct),
        l3FinalPrice: parseNumber(body.l3FinalPrice),
        l3Locked: !!body.l3Locked,
      }

      const existing = await prisma.articlePricesFixed.findUnique({ where: { articleId: id } })
      const saved = existing
        ? await prisma.articlePricesFixed.update({ where: { articleId: id }, data })
        : await prisma.articlePricesFixed.create({ data })

      return res.json({ success: true, data: saved })
    } catch (err) {
      console.error('Error upsert prices-fixed:', err)
      return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message })
    }
  }
}