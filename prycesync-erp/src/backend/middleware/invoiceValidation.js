import { body, param, query, validationResult } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validaciones para crear factura
export const validateCreateInvoice = [
  body('customerId')
    .notEmpty()
    .withMessage('El ID del cliente es requerido')
    .custom(isCUID)
    .withMessage('El ID del cliente debe ser un CUID válido'),
  
  body('type')
    .optional()
    .isIn(['A', 'B', 'C', 'E'])
    .withMessage('El tipo de factura debe ser A, B, C o E'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un item en la factura'),
  
  body('items.*.productId')
    .optional()
    .custom(isCUID)
    .withMessage('El ID del producto debe ser un CUID válido'),
  
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('La cantidad debe ser mayor a 0'),
  
  body('items.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser mayor o igual a 0'),
  
  body('items.*.discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El descuento debe estar entre 0 y 100'),
  
  body('items.*.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('La tasa de impuesto debe estar entre 0 y 100'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden exceder 1000 caracteres'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser una fecha válida')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La fecha de vencimiento debe ser futura');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validaciones para actualizar factura
export const validateUpdateInvoice = [
  param('id')
    .custom(isCUID)
    .withMessage('El ID de la factura debe ser un CUID válido'),

  body('type')
    .optional()
    .isIn(['A', 'B', 'C', 'E'])
    .withMessage('El tipo de factura debe ser A, B, C o E'),

  body('customerId')
    .optional()
    .custom(isCUID)
    .withMessage('El ID del cliente debe ser un CUID válido'),
  
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('El estado debe ser: draft, sent, paid, overdue o cancelled'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Las notas no pueden exceder 1000 caracteres'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de vencimiento debe ser una fecha válida'),
  
  body('paidDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de pago debe ser una fecha válida')
    .custom((value, { req }) => {
      if (req.body.status === 'paid' && !value) {
        throw new Error('La fecha de pago es requerida cuando el estado es "paid"');
      }
      return true;
    }),
  
  body('items')
    .optional()
    .isArray()
    .withMessage('Los items deben ser un array'),
  
  body('items.*.productId')
    .optional()
    .custom(isCUID)
    .withMessage('El ID del producto debe ser un CUID válido'),
  
  body('items.*.description')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('La descripción debe tener entre 1 y 500 caracteres'),
  
  body('items.*.quantity')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('La cantidad debe ser mayor a 0'),
  
  body('items.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser mayor o igual a 0'),
  
  body('items.*.discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El descuento debe estar entre 0 y 100'),
  
  body('items.*.taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('La tasa de impuesto debe estar entre 0 y 100'),
  
  handleValidationErrors
];

// Función auxiliar para validar CUID
const isCUID = (value) => {
  return /^c[a-z0-9]{24}$/.test(value);
};

// Validaciones para obtener factura por ID
export const validateGetInvoice = [
  param('id')
    .custom(isCUID)
    .withMessage('El ID de la factura debe ser un CUID válido'),
  
  handleValidationErrors
];

// Validaciones para eliminar factura
export const validateDeleteInvoice = [
  param('id')
    .custom(isCUID)
    .withMessage('El ID de la factura debe ser un CUID válido'),
  
  handleValidationErrors
];

// Validaciones para duplicar factura
export const validateDuplicateInvoice = [
  param('id')
    .custom(isCUID)
    .withMessage('El ID de la factura debe ser un CUID válido'),
  
  handleValidationErrors
];

// Validaciones para listar facturas
export const validateListInvoices = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('La búsqueda debe tener entre 1 y 100 caracteres'),
  
  query('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('El estado debe ser: draft, sent, paid, overdue o cancelled'),
  
  query('type')
    .optional()
    .isIn(['A', 'B', 'C', 'E'])
    .withMessage('El tipo debe ser A, B, C o E'),
  
  query('customerId')
    .optional()
    .custom(isCUID)
    .withMessage('El ID del cliente debe ser un CUID válido'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe ser una fecha válida'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe ser una fecha válida')
    .custom((value, { req }) => {
      if (req.query.dateFrom && new Date(value) < new Date(req.query.dateFrom)) {
        throw new Error('La fecha hasta debe ser posterior a la fecha desde');
      }
      return true;
    }),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'issueDate', 'dueDate', 'number', 'total', 'status'])
    .withMessage('El campo de ordenamiento debe ser: createdAt, issueDate, dueDate, number, total o status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('El orden debe ser asc o desc'),
  
  handleValidationErrors
];

// Validaciones para reportes de facturación
export const validateInvoiceReports = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'quarter', 'year'])
    .withMessage('El período debe ser: day, week, month, quarter o year'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('La fecha desde debe ser una fecha válida'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('La fecha hasta debe ser una fecha válida')
    .custom((value, { req }) => {
      if (req.query.dateFrom && new Date(value) < new Date(req.query.dateFrom)) {
        throw new Error('La fecha hasta debe ser posterior a la fecha desde');
      }
      return true;
    }),
  
  query('customerId')
    .optional()
    .custom(isCUID)
    .withMessage('El ID del cliente debe ser un CUID válido'),
  
  query('type')
    .optional()
    .isIn(['A', 'B', 'C', 'E'])
    .withMessage('El tipo debe ser A, B, C o E'),
  
  query('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
    .withMessage('El estado debe ser: draft, sent, paid, overdue o cancelled'),
  
  handleValidationErrors
];

// Middleware personalizado para validar items de factura
export const validateInvoiceItems = (req, res, next) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({
      success: false,
      message: 'Los items deben ser un array'
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Validar que cada item tenga los campos requeridos
    if (!item.quantity || !item.unitPrice) {
      return res.status(400).json({
        success: false,
        message: `El item ${i + 1} debe tener quantity y unitPrice`
      });
    }

    // Validar tipos de datos
    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `La cantidad del item ${i + 1} debe ser un número mayor a 0`
      });
    }

    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: `El precio unitario del item ${i + 1} debe ser un número mayor o igual a 0`
      });
    }

    // Validar descuento si está presente
    if (item.discount !== undefined) {
      if (typeof item.discount !== 'number' || item.discount < 0 || item.discount > 100) {
        return res.status(400).json({
          success: false,
          message: `El descuento del item ${i + 1} debe estar entre 0 y 100`
        });
      }
    }

    // Validar tasa de impuesto si está presente
    if (item.taxRate !== undefined) {
      if (typeof item.taxRate !== 'number' || item.taxRate < 0 || item.taxRate > 100) {
        return res.status(400).json({
          success: false,
          message: `La tasa de impuesto del item ${i + 1} debe estar entre 0 y 100`
        });
      }
    }
  }

  next();
};

// Middleware para validar permisos de empresa
export const validateCompanyAccess = async (req, res, next) => {
  try {
    if (!req.user || !req.user.company || !req.user.company.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado o sin empresa asignada'
      });
    }

    next();
  } catch (error) {
    console.error('Error validating company access:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};