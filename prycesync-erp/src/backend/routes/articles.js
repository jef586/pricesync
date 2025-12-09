import express from 'express'
import ArticleController from '../controllers/ArticleController.js'
import { validateUpdateArticle, validateCreateArticle } from '../middleware/articlesValidation.js'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { recordArticleRequest } from '../observability/deprecationMetrics.js'
import multer from 'multer'
import ArticleBulkPricingController from '../controllers/ArticleBulkPricingController.js'
import ArticleQuantityPromotionController from '../controllers/ArticleQuantityPromotionController.js'
import ArticleFixedPricesController from '../controllers/ArticleFixedPricesController.js'

const router = express.Router()

// Proteger todas las rutas
router.use(authenticate)

// Instrumentación básica para sucesor (para % legacy vs total)
router.use((req, res, next) => {
  res.on('finish', () => {
    recordArticleRequest()
  })
  next()
})

// Lectura: 60/min
const readLimit = rateLimit({ keyPrefix: 'rl:articles:read', limit: 60, windowSeconds: 60 })
const requireRead = requireScopes('article:read')
// Resolver artículos en compras (permiso específico)
const requireResolve = requireScopes('purchases:resolve')

// Escritura: 20/min
const writeLimit = rateLimit({ keyPrefix: 'rl:articles:write', limit: 20, windowSeconds: 60 })
const requireWrite = requireScopes('article:write')
const requirePromoWrite = requireScopes('promotions:write')

// Búsqueda y listado
router.get('/search', requireRead, readLimit, ArticleController.searchArticles)
router.get('/', requireRead, readLimit, ArticleController.getArticles)
// Export CSV del listado filtrado (usa filtros de /search)
router.get('/export.csv', requireRead, readLimit, ArticleController.exportArticlesCSV)
// Lookup enriquecido para POS / consulta de precios
const lookupBurstLimit = rateLimit({ keyPrefix: 'rl:articles:lookup', limit: 10, windowSeconds: 1 })
router.get('/lookup', requireRead, lookupBurstLimit, readLimit, ArticleController.lookupArticle)
// Resolver
router.get('/resolve', requireResolve, readLimit, ArticleController.resolveArticle)

// CRUD
router.get('/:id', requireRead, readLimit, ArticleController.getArticleById)
router.post('/', requireWrite, writeLimit, validateCreateArticle, ArticleController.createArticle)
router.put('/:id', requireWrite, writeLimit, validateUpdateArticle, ArticleController.updateArticle)
router.delete('/:id', requireWrite, writeLimit, ArticleController.deleteArticle)

// Stock
router.patch('/:id/stock', requireWrite, writeLimit, ArticleController.updateStock)

// Subrecursos: UoM
router.get('/:id/uoms', requireRead, readLimit, ArticleController.getUoms)
router.post('/:id/uoms', requireWrite, writeLimit, ArticleController.upsertUom)
router.delete('/:id/uoms/:uom', requireWrite, writeLimit, ArticleController.deleteUom)
router.post('/:id/convert', requireRead, readLimit, ArticleController.convertUom)
router.post('/:id/price', requireRead, readLimit, ArticleController.priceForUom)

// Subrecursos: códigos de barras
router.get('/:id/barcodes', requireRead, readLimit, ArticleController.getBarcodes)
router.post('/:id/barcodes', requireWrite, writeLimit, ArticleController.addBarcode)
router.delete('/:id/barcodes/:barcodeId', requireWrite, writeLimit, ArticleController.deleteBarcode)

// Subrecurso: reglas de precio por mayor (bulk pricing)
router.get('/:id/bulk-pricing', requireRead, readLimit, ArticleBulkPricingController.list)
router.post('/:id/bulk-pricing', requireWrite, writeLimit, ArticleBulkPricingController.create)
router.put('/:id/bulk-pricing/:ruleId', requireWrite, writeLimit, ArticleBulkPricingController.update)
router.delete('/:id/bulk-pricing/:ruleId', requireWrite, writeLimit, ArticleBulkPricingController.remove)

// Subrecurso: promoción por cantidad (tiers específicos del artículo)
router.get('/:id/quantity-promo', requireRead, readLimit, ArticleQuantityPromotionController.get)
router.post('/:id/quantity-promo', requireWrite, requirePromoWrite, writeLimit, ArticleQuantityPromotionController.create)
router.put('/:id/quantity-promo', requireWrite, requirePromoWrite, writeLimit, ArticleQuantityPromotionController.update)
router.delete('/:id/quantity-promo', requireWrite, requirePromoWrite, writeLimit, ArticleQuantityPromotionController.remove)

// Tiers de la promoción por cantidad
router.get('/:id/quantity-promo/tiers', requireRead, readLimit, ArticleQuantityPromotionController.listTiers)
router.post('/:id/quantity-promo/tiers', requireWrite, requirePromoWrite, writeLimit, ArticleQuantityPromotionController.createTier)
router.put('/:id/quantity-promo/tiers/:tierId', requireWrite, requirePromoWrite, writeLimit, ArticleQuantityPromotionController.updateTier)
router.delete('/:id/quantity-promo/tiers/:tierId', requireWrite, requirePromoWrite, writeLimit, ArticleQuantityPromotionController.deleteTier)

// UH-ART-26: Precios fijos por listas (L1–L3)
router.get('/:id/prices-fixed', requireRead, readLimit, ArticleFixedPricesController.get)
router.put('/:id/prices-fixed', requireWrite, writeLimit, ArticleFixedPricesController.upsert)

// Alias de compatibilidad: qty-promos -> quantity-promo
router.get('/:id/qty-promos', requireRead, readLimit, ArticleQuantityPromotionController.get)
router.put('/:id/qty-promos', requireWrite, requirePromoWrite, writeLimit, ArticleQuantityPromotionController.update)

// Subrecursos: proveedores
router.get('/:id/suppliers', requireRead, readLimit, ArticleController.getSuppliers)
router.post('/:id/suppliers', requireWrite, writeLimit, ArticleController.addSupplierLink)
router.put('/:id/suppliers/:linkId', requireWrite, writeLimit, ArticleController.updateSupplierLink)
router.delete('/:id/suppliers/:linkId', requireWrite, writeLimit, ArticleController.deleteSupplierLink)

// Subrecurso: imagen principal del artículo
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Formato de imagen no soportado'));
  }
});
router.post('/:id/image', requireWrite, writeLimit, upload.single('image'), ArticleController.uploadImage)
router.delete('/:id/image', requireWrite, writeLimit, ArticleController.deleteImage)

export default router
