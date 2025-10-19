import express from 'express'
import { authenticate, authorize } from '../middleware/auth.js'
import { getDeprecationState, getMetricsText } from '../observability/deprecationMetrics.js'

const router = express.Router()

// All ops routes require authentication; admin-only for sensitive endpoints
router.use(authenticate)

function isAliasAllowed() {
  const flag = globalThis.__ALLOW_PRODUCTS_ALIAS
  if (typeof flag === 'boolean') return flag
  return process.env.ALLOW_PRODUCTS_ALIAS !== 'false'
}

// Expose deprecation state: % legacy vs total, breakdowns, latencies
router.get('/deprecation-state', authorize('admin'), (req, res) => {
  const state = getDeprecationState()
  res.json({ status: 'ok', data: state })
})

// Prometheus-like metrics exposition
router.get('/metrics', authorize('admin'), (req, res) => {
  const text = getMetricsText()
  res.setHeader('Content-Type', 'text/plain; version=0.0.4')
  res.send(text)
})

// Feature flag toggle for products alias
router.get('/flags/products-alias', authorize('admin'), (req, res) => {
  res.json({ status: 'ok', allow: isAliasAllowed() })
})

router.post('/flags/products-alias', authorize('admin'), (req, res) => {
  const allow = !!req.body?.allow
  globalThis.__ALLOW_PRODUCTS_ALIAS = allow
  res.json({ status: 'ok', allow })
})

export default router