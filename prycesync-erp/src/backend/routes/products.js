import express from 'express';
import ProductController from '../controllers/ProductController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Rutas de productos
router.get('/search', ProductController.searchProducts);
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', ProductController.createProduct);
router.put('/:id', ProductController.updateProduct);
router.delete('/:id', ProductController.deleteProduct);
router.patch('/:id/stock', ProductController.updateStock);

export default router;