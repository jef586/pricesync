import express from 'express';
import CategoryController from '../controllers/CategoryController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/permissions.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Rutas de rubros con permisos específicos
// GET /api/rubros - Listar rubros (requiere permiso: inventory:rubros:read)
router.get('/', authorize('inventory:rubros:read'), CategoryController.getCategories);

// GET /api/rubros/search - Buscar rubros (requiere permiso: inventory:rubros:read)
router.get('/search', authorize('inventory:rubros:read'), CategoryController.searchCategories);

// GET /api/rubros/tree - Obtener árbol de rubros (requiere permiso: inventory:rubros:read)
router.get('/tree', authorize('inventory:rubros:read'), CategoryController.getCategoryTree);

// GET /api/rubros/:id - Obtener rubro por ID (requiere permiso: inventory:rubros:read)
router.get('/:id', authorize('inventory:rubros:read'), CategoryController.getCategoryById);

// POST /api/rubros - Crear nuevo rubro (requiere permiso: inventory:rubros:create)
router.post('/', authorize('inventory:rubros:create'), CategoryController.createCategory);

// PUT /api/rubros/:id - Actualizar rubro (requiere permiso: inventory:rubros:update)
router.put('/:id', authorize('inventory:rubros:update'), CategoryController.updateCategory);

// DELETE /api/rubros/:id - Eliminar rubro (requiere permiso: inventory:rubros:delete)
router.delete('/:id', authorize('inventory:rubros:delete'), CategoryController.deleteCategory);

export default router;