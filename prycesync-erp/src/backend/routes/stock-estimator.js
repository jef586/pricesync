import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'
import { rateLimit } from '../middleware/rateLimit.js'
import prisma from '../config/database.js'
import StockEstimatorService from '../services/StockEstimatorService.js'

const router = express.Router()

// All routes require auth
router.use(authenticate)

// Rate limits
const readLimit = rateLimit({ keyPrefix: 'rl:stock:estimator:read', limit: 60, windowSeconds: 60 })
const writeLimit = rateLimit({ keyPrefix: 'rl:stock:estimator:write', limit: 20, windowSeconds: 60 })

// GET /api/stock/estimator/:articleId?window=auto
router.get('/estimator/:articleId', requireScopes('stock:read'), readLimit, async (req, res, next) => {
  try {
    const companyId = req.user.company.id
    const articleId = String(req.params.articleId)
    const window = req.query.window || 'auto'
    const supplierId = req.query.supplierId || null
    const result = await StockEstimatorService.calc({ companyId, articleId, window, supplierId })
    res.json(result)
  } catch (err) { next(err) }
})

// GET /api/stock/estimator?semaphore=RED&supplierId=...&page=1&pageSize=25
router.get('/estimator', requireScopes('stock:read'), readLimit, async (req, res, next) => {
  try {
    const companyId = req.user.company.id
    const supplierId = req.query.supplierId || null
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '25', 10)))
    const wantedSemaphore = req.query.semaphore || null
    const window = req.query.window || 'auto'

    // Determinar universo de artículos (opcional por proveedor)
    let articleIds = null
    if (supplierId) {
      const links = await prisma.supplierProduct.findMany({
        where: { companyId, supplierId: String(supplierId) },
        select: { articleId: true }
      })
      articleIds = [...new Set(links.map(l => l.articleId))]
      if (articleIds.length === 0) return res.json({ items: [], page, pageSize, total: 0 })
    }

    const where = { companyId }
    if (articleIds) where.id = { in: articleIds }

    const total = await prisma.article.count({ where })
    const articles = await prisma.article.findMany({
      where,
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Calcular estimación por artículo
    const results = []
    for (const a of articles) {
      const r = await StockEstimatorService.calc({ companyId, articleId: a.id, window, supplierId })
      if (wantedSemaphore && r.semaphore !== wantedSemaphore) continue
      results.push({ articleId: a.id, articleName: a.name, articleCode: a.code, ...r })
    }

    res.json({ items: results, page, pageSize, total })
  } catch (err) { next(err) }
})

// POST /api/stock/estimator/rebuild
router.post('/estimator/rebuild', requireScopes('stock:write'), writeLimit, async (req, res, next) => {
  try {
    const companyId = req.user.company.id
    const out = await StockEstimatorService.rebuildDemandStats({ companyId })
    res.json(out)
  } catch (err) { next(err) }
})

// GET /api/stock/estimator/settings
router.get('/estimator/settings', requireScopes('stock:read'), readLimit, async (req, res, next) => {
  try {
    const companyId = req.user.company.id
    const supplierId = req.query.supplierId || null
    const settings = await StockEstimatorService.getSettings({ companyId, supplierId })
    res.json(settings)
  } catch (err) { next(err) }
})

// PUT /api/stock/estimator/settings
router.put('/estimator/settings', requireScopes('stock:write'), writeLimit, async (req, res, next) => {
  try {
    const companyId = req.user.company.id
    const { scope = 'GLOBAL', scopeId = null, leadTimeDays, safetyStockDays, coverageDays } = req.body || {}
    const settings = await StockEstimatorService.updateSettings({ companyId, scope, scopeId, leadTimeDays, safetyStockDays, coverageDays })
    res.json(settings)
  } catch (err) { next(err) }
})

export default router