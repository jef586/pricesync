import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'
import { rateLimit } from '../middleware/rateLimit.js'
import StockController from '../controllers/StockController.js'

const router = express.Router()

// All routes require auth
router.use(authenticate)

// Rate limits
const readLimit = rateLimit({ keyPrefix: 'rl:stock:read', limit: 60, windowSeconds: 60 })
const writeLimit = rateLimit({ keyPrefix: 'rl:stock:write', limit: 20, windowSeconds: 60 })

// Dynamic middleware for override scope when requested
function requireOverrideIfNeeded(req, res, next) {
  if (req.body?.override) {
    return requireScopes('stock:override')(req, res, next)
  }
  next()
}

// Balances and movements listing
router.get('/balances', requireScopes('stock:read'), readLimit, StockController.listBalances)
router.get('/movements', requireScopes('stock:read'), readLimit, StockController.listMovements)

// Manual movement creation
router.post('/movements', requireScopes('stock:write'), requireOverrideIfNeeded, writeLimit, StockController.createMovement)

export default router