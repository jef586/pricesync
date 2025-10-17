import express from 'express'
import ArticleController from '../controllers/ArticleController.js'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = express.Router()

// Proteger todas las rutas
router.use(authenticate)

// Lectura: 60/min
const readLimit = rateLimit({ keyPrefix: 'rl:articles:read', limit: 60, windowSeconds: 60 })
const requireRead = requireScopes('article:read')

// Escritura: 20/min
const writeLimit = rateLimit({ keyPrefix: 'rl:articles:write', limit: 20, windowSeconds: 60 })
const requireWrite = requireScopes('article:write')

// Búsqueda y listado
router.get('/search', requireRead, readLimit, ArticleController.searchArticles)
router.get('/', requireRead, readLimit, ArticleController.getArticles)

// CRUD
router.get('/:id', requireRead, readLimit, ArticleController.getArticleById)
router.post('/', requireWrite, writeLimit, ArticleController.createArticle)
router.put('/:id', requireWrite, writeLimit, ArticleController.updateArticle)
router.delete('/:id', requireWrite, writeLimit, ArticleController.deleteArticle)

// Stock
router.patch('/:id/stock', requireWrite, writeLimit, ArticleController.updateStock)

// Subrecursos: códigos de barras
router.get('/:id/barcodes', requireRead, readLimit, ArticleController.getBarcodes)
router.post('/:id/barcodes', requireWrite, writeLimit, ArticleController.addBarcode)
router.delete('/:id/barcodes/:barcodeId', requireWrite, writeLimit, ArticleController.deleteBarcode)

// Subrecursos: proveedores
router.get('/:id/suppliers', requireRead, readLimit, ArticleController.getSuppliers)
router.post('/:id/suppliers', requireWrite, writeLimit, ArticleController.addSupplierLink)
router.delete('/:id/suppliers/:linkId', requireWrite, writeLimit, ArticleController.deleteSupplierLink)

export default router