import express from 'express';
import CustomerController from '../controllers/CustomerController.js';
import CustomerEnrichmentController from '../controllers/CustomerEnrichmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Rutas de clientes
router.get('/enrich', CustomerEnrichmentController.enrichByCuit);
router.get('/search', CustomerController.searchCustomers);
router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.post('/', CustomerController.createCustomer);
router.put('/:id', CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);

export default router;