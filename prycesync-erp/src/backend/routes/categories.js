import express from 'express';
import CategoryController from '../controllers/CategoryController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Rutas de categorías
router.get('/search', CategoryController.searchCategories);
router.get('/tree', CategoryController.getCategoryTree);
router.get('/', CategoryController.getCategories);
router.get('/:id', CategoryController.getCategoryById);
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.delete('/:id', CategoryController.deleteCategory);

export default router;