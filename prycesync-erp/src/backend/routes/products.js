import express from 'express';
import ArticleController from '../controllers/ArticleController.js';
import { validateCreateArticle, validateUpdateArticle } from '../middleware/articlesValidation.js';
import { authenticate } from '../middleware/auth.js';
import { requireScopes } from '../middleware/scopes.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { recordLegacyRequest } from '../observability/deprecationMetrics.js'

const router = express.Router();

// Feature flag (ON por defecto). Permite apagar el alias y devolver 410 Gone.
function isAliasAllowed() {
  const flag = globalThis.__ALLOW_PRODUCTS_ALIAS
  if (typeof flag === 'boolean') return flag
  return process.env.ALLOW_PRODUCTS_ALIAS !== 'false'
}

// Middleware de deprecación: headers, logging y métricas
const SUNSET = process.env.PRODUCTS_SUNSET_DATE || '2026-01-01'
function legacyDeprecation(req, res, next) {
  // Si el alias está apagado, devolver 410 Gone con sucesor
  if (!isAliasAllowed()) {
    return res.status(410).json({ error: 'Gone', successor: '/api/articles' })
  }

  // Headers de deprecación en todas las respuestas legacy
  res.setHeader('Deprecation', 'true')
  res.setHeader('Sunset', SUNSET)
  const successorUrl = req.originalUrl.replace('/api/products', '/api/articles')
  // Set Link header and a fallback header to ensure availability
  try {
    res.setHeader('Link', `<${successorUrl}>; rel="successor-version"`)
    res.setHeader('X-Successor', successorUrl)
  } catch {}

  // Wrap res.json para debugDeprecation=1 en GET
  const originalJson = res.json.bind(res)
  res.json = (body) => {
    try {
      if (req.method === 'GET' && req.query?.debugDeprecation === '1' && body && typeof body === 'object') {
        const sunset = SUNSET
        body.deprecation = { successor: '/api/articles', sunset }
      }
    } catch {}
    return originalJson(body)
  }

  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const durationMs = Number(end - start) / 1_000_000
    const routePattern = req.route?.path || req.path
    const caller = req.user?.id || req.headers['x-api-key'] || 'unknown'

    // Log estructurado (warn)
    const log = {
      level: 'warn',
      msg: 'Legacy route used',
      route: req.originalUrl,
      method: req.method,
      user: req.user?.id || null,
      apiKey: req.headers['x-api-key'] || null,
      ip: req.ip,
      status: res.statusCode,
      ms: Math.round(durationMs)
    }
    console.warn(JSON.stringify(log))

    // Métricas
    recordLegacyRequest({ route: routePattern, method: req.method, status: String(res.statusCode), caller, durationMs })
  })

  next()
}

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Rate limits (suaves, configurables por env)
const READ_LIMIT = Number(process.env.PRODUCTS_READ_LIMIT || 60)
const WRITE_LIMIT = Number(process.env.PRODUCTS_WRITE_LIMIT || 20)
const readLimit = rateLimit({ keyPrefix: 'rl:products:read', limit: READ_LIMIT, windowSeconds: 60 })
const writeLimit = rateLimit({ keyPrefix: 'rl:products:write', limit: WRITE_LIMIT, windowSeconds: 60 })
const requireRead = requireScopes('article:read')
const requireWrite = requireScopes('article:write')

// Alias de productos -> artículos con headers de deprecación
router.get('/search', legacyDeprecation, requireRead, readLimit, ArticleController.searchArticles);
router.get('/', legacyDeprecation, requireRead, readLimit, ArticleController.getArticles);
router.get('/:id', legacyDeprecation, requireRead, readLimit, ArticleController.getArticleById);
router.post('/', legacyDeprecation, requireWrite, writeLimit, validateCreateArticle, ArticleController.createArticle);
router.put('/:id', legacyDeprecation, requireWrite, writeLimit, validateUpdateArticle, ArticleController.updateArticle);
router.delete('/:id', legacyDeprecation, requireWrite, writeLimit, ArticleController.deleteArticle);

// Adaptación mínima de body para compatibilidad del endpoint de stock
router.patch('/:id/stock', legacyDeprecation, requireWrite, writeLimit, (req, res) => {
  const { quantity, type } = req.body || {};
  if (quantity !== undefined && req.body.stock === undefined) {
    req.body.stock = quantity;
  }
  if (type && req.body.operation === undefined) {
    req.body.operation = type;
  }
  return ArticleController.updateStock(req, res);
});

export default router;
