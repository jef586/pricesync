import express from 'express'
import ArticleController from '../controllers/ArticleController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Proteger todas las rutas
router.use(authenticate)

// Búsqueda y listado
router.get('/search', ArticleController.searchArticles)
router.get('/', ArticleController.getArticles)

// CRUD
router.get('/:id', ArticleController.getArticleById)
router.post('/', ArticleController.createArticle)
router.put('/:id', ArticleController.updateArticle)
router.delete('/:id', ArticleController.deleteArticle)

// Stock
router.patch('/:id/stock', ArticleController.updateStock)

// Subrecursos: códigos de barras
router.get('/:id/barcodes', ArticleController.getBarcodes)
router.post('/:id/barcodes', ArticleController.addBarcode)
router.delete('/:id/barcodes/:barcodeId', ArticleController.deleteBarcode)

// Subrecursos: proveedores
router.get('/:id/suppliers', ArticleController.getSuppliers)
router.post('/:id/suppliers', ArticleController.addSupplierLink)
router.delete('/:id/suppliers/:linkId', ArticleController.deleteSupplierLink)

export default router