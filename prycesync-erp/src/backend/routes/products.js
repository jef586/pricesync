import express from 'express';
import ArticleController from '../controllers/ArticleController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Alias de productos -> artículos (sin aviso de deprecación)
router.get('/search', ArticleController.searchArticles);
router.get('/', ArticleController.getArticles);
router.get('/:id', ArticleController.getArticleById);
router.post('/', ArticleController.createArticle);
router.put('/:id', ArticleController.updateArticle);
router.delete('/:id', ArticleController.deleteArticle);

// Adaptación mínima de body para compatibilidad del endpoint de stock
router.patch('/:id/stock', (req, res) => {
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