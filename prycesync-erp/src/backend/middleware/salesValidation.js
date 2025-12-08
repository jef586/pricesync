import { z } from "zod";

const DiscountTypeEnum = z.enum(["PERCENT", "ABS"]);

const SaleItemSchema = z.object({
  productId: z.string().cuid().optional(),
  articleId: z.string().cuid().optional(),
  description: z.string().min(1).max(500).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  // Compat y nuevos campos
  discount: z.number().min(0).max(100).optional(), // antiguo: %
  discount_type: DiscountTypeEnum.optional(),
  discount_value: z.number().min(0).optional().default(0),
  is_discountable: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional().default(21)
}).refine((data) => {
  // Validaciones específicas según tipo
  const qty = data.quantity;
  const price = data.unitPrice;
  const type = data.discount_type;
  const value = data.discount_value ?? 0;
  if (data.is_discountable === false) return true; // se fuerza 0 en controlador
  if (type === "PERCENT") {
    return value >= 0 && value <= 100;
  }
  if (type === "ABS") {
    return value >= 0 && value <= qty * price;
  }
  // Si no hay tipo pero viene `discount`, validar como porcentaje
  if (data.discount != null) {
    return data.discount >= 0 && data.discount <= 100;
  }
  return true;
}, {
  message: "Descuento inválido según tipo",
  path: ["discount_value"]
});

const SalePaymentSchema = z.object({
  method: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().min(1).optional(),
  reference: z.string().optional(),
  paidAt: z.string().datetime().optional()
});

const FinalDiscountSchema = z.object({
  type: DiscountTypeEnum.optional(),
  value: z.number().min(0).optional().default(0)
}).optional();

// Recargo final
const SurchargeSchema = z.object({
  type: DiscountTypeEnum.optional(),
  value: z.number().min(0).optional().default(0)
}).optional();

const CreateSaleSchema = z.object({
  customerId: z.string().cuid(),
  items: z.array(SaleItemSchema).min(1),
  warehouseId: z.string().cuid().optional(),
  finalDiscount: FinalDiscountSchema,
  surcharge_type: DiscountTypeEnum.optional(),
  surcharge_value: z.number().min(0).optional().default(0),
  payments: z.array(SalePaymentSchema).optional(),
  notes: z.string().max(1000).optional()
});

export const validateCreateSale = (req, res, next) => {
  const parsed = CreateSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  req.body = parsed.data;
  next();
};

export const validateGetSale = (req, res, next) => {
  const idSchema = z.object({ id: z.string().cuid() });
  const parsed = idSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  next();
};

// Validación para PUT /api/sales/:id
const UpdateSaleSchema = z.object({
  customerId: z.string().cuid().optional(),
  items: z.array(SaleItemSchema).min(1).optional(),
  finalDiscount: FinalDiscountSchema,
  surcharge_type: DiscountTypeEnum.optional(),
  surcharge_value: z.number().min(0).optional().default(0),
  payments: z.array(SalePaymentSchema).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['open','partially_paid','paid','cancelled','parked']).optional()
});

export const validateUpdateSale = (req, res, next) => {
  const idSchema = z.object({ id: z.string().cuid() });
  const idParsed = idSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
      errors: idParsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  const parsed = UpdateSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  req.body = parsed.data;
  next();
}

// Validación para POST /api/sales/:id/payments
const SplitPaymentSchema = z.object({
  payments: z.array(z.object({
    method: z.enum(['CASH', 'CARD', 'TRANSFER', 'MERCADO_PAGO']).or(z.string().min(1)),
    amount: z.number().positive(),
    currency: z.string().min(1).default('ARS'),
    method_details: z.record(z.any()).optional()
  })).min(1)
})

export const validateAddPayments = (req, res, next) => {
  const idSchema = z.object({ id: z.string().cuid() });
  const idParsed = idSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
      errors: idParsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  const parsed = SplitPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  req.body = parsed.data;
  next();
}

const SortByEnum = z.enum(["createdAt", "total", "number"]);
const SortOrderEnum = z.enum(["asc", "desc"]);
const StatusFilterEnum = z.enum([
  "draft",
  "completed",
  "void",
  "cancelled",
  "open",
  "paid",
  "parked",
  "partially_paid"
]);

const ListSalesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: SortByEnum.default("createdAt"),
  sortOrder: SortOrderEnum.default("desc"),
  q: z.string().min(1).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: StatusFilterEnum.optional()
});

export const validateListSales = (req, res, next) => {
  const parsed = ListSalesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Parámetros inválidos",
      errors: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  req.query = parsed.data;
  next();
}
