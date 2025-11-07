import express from 'express'
import { authenticate } from '../middleware/auth.js'
import prisma from '../config/database.js'
import { directPricing, inversePricing, forCombo } from '../services/PricingService.js'
import { BulkPricingService } from '../services/BulkPricingService.js'
import QuantityPromotionService from '../services/QuantityPromotionService.js'

const router = express.Router()

// Protect all pricing routes
router.use(authenticate)

// Calculate pricing (direct, inverse, or combo)
router.post('/calculate', async (req, res) => {
  try {
    const {
      mode,
      cost,
      gainPct,
      pricePublic,
      taxRate,
      internalTaxType,
      internalTaxValue,
      components,
      companyId
    } = req.body || {}

    const v = Number(taxRate ?? 21)

    if (mode === 'inverse') {
      const result = inversePricing({
        pricePublic,
        cost,
        taxRate: v,
        internalTaxType: internalTaxType ?? null,
        internalTaxValue: internalTaxValue ?? null
      })
      return res.json({ success: true, data: result })
    }

    if (mode === 'combo') {
      const cid = companyId || req.user?.company?.id || null
      if (!cid) {
        return res.status(400).json({ success: false, error: 'MISSING_COMPANY', message: 'companyId requerido' })
      }
      const result = await forCombo({
        companyId: cid,
        components: Array.isArray(components) ? components : [],
        taxRate: v,
        gainPct: gainPct ?? null,
        internalTaxType: internalTaxType ?? null,
        internalTaxValue: internalTaxValue ?? null
      })
      return res.json({ success: true, data: result })
    }

    // Default: direct pricing
    const result = directPricing({
      cost,
      gainPct: Number(gainPct ?? 0),
      taxRate: v,
      internalTaxType: internalTaxType ?? null,
      internalTaxValue: internalTaxValue ?? null
    })
    return res.json({ success: true, data: result })
  } catch (err) {
    console.error('Pricing calculation error:', err)
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message })
  }
})

// Resolve bulk pricing tier for an article/UoM/qty
router.post('/resolve-bulk', async (req, res) => {
  try {
    const { articleId, uom, qty, basePrice } = req.body || {}
    if (!articleId) return res.status(400).json({ success: false, error: 'MISSING_FIELD', message: 'articleId requerido' })
    if (!uom) return res.status(400).json({ success: false, error: 'MISSING_FIELD', message: 'uom requerido' })
    const q = Number(qty)
    if (!q || q <= 0) return res.status(400).json({ success: false, error: 'INVALID_QTY', message: 'qty debe ser > 0' })
    const base = Number(basePrice)
    if (Number.isNaN(base)) return res.status(400).json({ success: false, error: 'INVALID_BASE_PRICE', message: 'basePrice inválido' })

    const result = await BulkPricingService.resolve({ articleId, uom, qty: q, basePrice: base })
    return res.json({ success: true, data: result })
  } catch (err) {
    console.error('resolve-bulk error:', err)
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message })
  }
})

export default router

// Preview de pricing efectivo aplicando L4 si corresponde (UH-ART-26)
router.get('/preview', async (req, res) => {
  try {
    const { articleId, qty, priceList } = req.query || {}
    const id = String(articleId || '')
    const q = Number(qty || 0)
    const list = String(priceList || '').toLowerCase()
    if (!id) return res.status(400).json({ success: false, error: 'MISSING_FIELD', message: 'articleId requerido' })
    if (!['l1', 'l2', 'l3'].includes(list)) return res.status(400).json({ success: false, error: 'INVALID_LIST', message: 'priceList debe ser l1|l2|l3' })
    if (!(q > 0)) return res.status(400).json({ success: false, error: 'INVALID_QTY', message: 'qty debe ser > 0' })

    const art = await prisma.article.findFirst({ where: { id }, select: { id: true, cost: true, taxRate: true, internalTaxType: true, internalTaxValue: true } })
    if (!art) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Artículo no encontrado' })

    const fixed = await prisma.articlePricesFixed.findUnique({ where: { articleId: id } })
    const taxRate = Number(art.taxRate || 21)

    function computeBaseFromFixed(listKey) {
      const margin = fixed?.[`${listKey}MarginPct`] != null ? Number(fixed?.[`${listKey}MarginPct`]) : null
      const final = fixed?.[`${listKey}FinalPrice`] != null ? Number(fixed?.[`${listKey}FinalPrice`]) : null
      if (final != null) {
        return final
      }
      if (margin != null) {
        const { pricePublic } = directPricing({ cost: art.cost || 0, gainPct: margin, taxRate, internalTaxType: art.internalTaxType, internalTaxValue: art.internalTaxValue })
        return pricePublic
      }
      // Fallback: precio público del artículo si no hay fijo
      return null
    }

    const listKey = list === 'l1' ? 'l1' : list === 'l2' ? 'l2' : 'l3'
    const baseUnitPrice = computeBaseFromFixed(listKey)
    if (baseUnitPrice == null) {
      return res.status(404).json({ success: false, error: 'NO_FIXED_PRICE', message: `Sin precio fijo ${listKey.toUpperCase()} configurado` })
    }

    const applied = await QuantityPromotionService.applyArticleQuantityPromo({ articleId: id, uom: 'UN', quantity: q, baseUnitPrice }, {})
    return res.json({ success: true, data: { baseUnitPrice, finalUnitPrice: applied.unitPrice, appliedPromo: applied.applied ? applied.tier : null } })
  } catch (err) {
    console.error('pricing preview error:', err)
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message })
  }
})