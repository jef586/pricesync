import express from 'express';
import InvoiceController from '../controllers/InvoiceController.js';
import { authenticate } from '../middleware/auth.js';
import {
  validateCreateInvoice,
  validateUpdateInvoice,
  validateGetInvoice,
  validateDeleteInvoice,
  validateDuplicateInvoice,
  validateListInvoices,
  validateInvoiceReports,
  validateInvoiceItems,
  validateCompanyAccess
} from '../middleware/invoiceValidation.js';

const router = express.Router();

// Aplicar middleware de autenticación y validación de empresa a todas las rutas
router.use(authenticate);
router.use(validateCompanyAccess);

// Rutas de facturas
router.get('/', validateListInvoices, InvoiceController.list);
router.get('/reports', validateInvoiceReports, InvoiceController.getReports);
router.get('/:id', validateGetInvoice, InvoiceController.getById);
router.post('/', validateCreateInvoice, validateInvoiceItems, InvoiceController.create);
router.put('/:id', validateUpdateInvoice, InvoiceController.update);
router.delete('/:id', validateDeleteInvoice, InvoiceController.delete);
router.post('/:id/duplicate', validateDuplicateInvoice, InvoiceController.duplicate);

export default router;