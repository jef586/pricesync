import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { directPricing, inversePricing, forCombo } from '../services/PricingService.js'

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

export default router