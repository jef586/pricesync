import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { directPricing, inversePricing, forCombo } from '../services/PricingService.js'
import { BulkPricingService } from '../services/BulkPricingService.js'

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