import express from 'express';
import SupplierController from '../controllers/SupplierController.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Configurar multer para subida de archivos Excel
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo archivos Excel
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'), false);
    }
  }
});

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Rutas CRUD básicas de proveedores
router.get('/search', SupplierController.searchSuppliers);
router.get('/', SupplierController.getSuppliers);
router.get('/:id', SupplierController.getSupplierById);
router.post('/', SupplierController.createSupplier);
router.put('/:id', SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

// Rutas específicas para productos de proveedores
router.get('/:id/products', SupplierController.getSupplierProducts);
router.post('/:id/products', SupplierController.addSupplierProduct);
router.put('/:supplierId/products/:productId', SupplierController.updateSupplierProduct);
router.delete('/:supplierId/products/:productId', SupplierController.deleteSupplierProduct);

// Rutas para importación de Excel (proveedores)
router.post('/import/preview', upload.single('file'), SupplierController.previewExcelImport);
router.post('/import/execute', upload.single('file'), SupplierController.executeExcelImport);
router.get('/import/template', SupplierController.downloadImportTemplate);

// Rutas para importación de productos de proveedores
router.post('/:id/products/import/preview', upload.single('file'), SupplierController.previewProductsImport);
router.post('/:id/products/import/execute', upload.single('file'), SupplierController.executeProductsImport);
router.get('/:id/products/import/template', SupplierController.downloadProductsTemplate);

// Rutas para exportación
router.get('/export/excel', SupplierController.exportSuppliersToExcel);
router.get('/:id/products/export', SupplierController.exportSupplierProductsToExcel);

export default router;