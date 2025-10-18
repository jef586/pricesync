import express from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'
import { rateLimit } from '../middleware/rateLimit.js'
import ImportArticlesController from '../controllers/ImportArticlesController.js'

const router = express.Router()

// Multer en memoria, 10MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Auth para todas las rutas
router.use(authenticate)

// Rate limits
const readLimit = rateLimit({ keyPrefix: 'rl:imports:read', limit: 60, windowSeconds: 60 })
const writeLimit = rateLimit({ keyPrefix: 'rl:imports:write', limit: 20, windowSeconds: 60 })

// Iniciar importación de artículos desde Excel
router.post(
  '/articles',
  requireScopes('imports:write'),
  upload.single('file'),
  writeLimit,
  ImportArticlesController.start
)

// Consultar estado del job
router.get(
  '/:jobId',
  requireScopes('imports:read'),
  readLimit,
  ImportArticlesController.status
)

export default router