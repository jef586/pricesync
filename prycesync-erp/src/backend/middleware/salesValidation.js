import { z } from "zod";

const SaleItemSchema = z.object({
  productId: z.string().cuid().optional(),
  description: z.string().min(1).max(500).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(21)
});

const SalePaymentSchema = z.object({
  method: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().min(1).optional(),
  reference: z.string().optional(),
  paidAt: z.string().datetime().optional()
});

const CreateSaleSchema = z.object({
  customerId: z.string().cuid(),
  items: z.array(SaleItemSchema).min(1),
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
