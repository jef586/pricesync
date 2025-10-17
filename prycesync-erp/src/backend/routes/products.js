import express from 'express';
import ArticleController from '../controllers/ArticleController.js';
import { authenticate } from '../middleware/auth.js';
import { requireScopes } from '../middleware/scopes.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Middleware para deprecación
const SUNSET = process.env.PRODUCTS_SUNSET_DATE || '2026-01-01'
function deprecationHeaders(req, res, next) {
  res.setHeader('Deprecation', 'true')
  res.setHeader('Sunset', SUNSET)
  console.warn(JSON.stringify({ level: 'warn', msg: 'Legacy route used', route: req.originalUrl, method: req.method }))
  next()
}

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Lectura: 60/min; Escritura: 20/min
const readLimit = rateLimit({ keyPrefix: 'rl:products:read', limit: 60, windowSeconds: 60 })
const writeLimit = rateLimit({ keyPrefix: 'rl:products:write', limit: 20, windowSeconds: 60 })
const requireRead = requireScopes('article:read')
const requireWrite = requireScopes('article:write')

// Alias de productos -> artículos con headers de deprecación
router.get('/search', deprecationHeaders, requireRead, readLimit, ArticleController.searchArticles);
router.get('/', deprecationHeaders, requireRead, readLimit, ArticleController.getArticles);
router.get('/:id', deprecationHeaders, requireRead, readLimit, ArticleController.getArticleById);
router.post('/', deprecationHeaders, requireWrite, writeLimit, ArticleController.createArticle);
router.put('/:id', deprecationHeaders, requireWrite, writeLimit, ArticleController.updateArticle);
router.delete('/:id', deprecationHeaders, requireWrite, writeLimit, ArticleController.deleteArticle);

// Adaptación mínima de body para compatibilidad del endpoint de stock
router.patch('/:id/stock', deprecationHeaders, requireWrite, writeLimit, (req, res) => {
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