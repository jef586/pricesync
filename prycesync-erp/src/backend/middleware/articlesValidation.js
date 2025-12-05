import { z } from 'zod'

const ArticleTypeEnum = z.enum(['PRODUCT', 'SERVICE'])
const BarcodeTypeEnum = z.enum(['EAN13', 'EAN8', 'UPCA', 'CODE128', 'PLU', 'CUSTOM'])
const InternalTaxTypeEnum = z.enum(['NONE', 'FIXED', 'PERCENT'])

const UpdateArticleSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  type: ArticleTypeEnum.optional(),
  active: z.boolean().optional(),
  sku: z.string().trim().min(1).max(200).optional(),
  barcode: z.string().trim().min(1).max(200).optional().nullable(),
  barcodeType: BarcodeTypeEnum.optional().nullable(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  cost: z.coerce.number().min(0).optional().nullable(),
  gainPct: z.coerce.number().min(0).max(1000).optional().nullable(),
  pricePublic: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0).optional(),
  stockMin: z.coerce.number().int().min(0).optional().nullable(),
  stockMax: z.coerce.number().int().min(0).optional().nullable(),
  controlStock: z.boolean().optional(),
  categoryId: z.string().trim().min(1).max(100).optional().nullable(),
  internalTaxType: InternalTaxTypeEnum.optional(),
  internalTaxValue: z.coerce.number().min(0).optional(),
  subjectIIBB: z.boolean().optional(),
  subjectGanancias: z.boolean().optional(),
  subjectPercIVA: z.boolean().optional(),
  pointsPerUnit: z.coerce.number().int().min(0).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  comboOwnPrice: z.boolean().optional(),
  bundleComponents: z.array(z.object({
    articleId: z.string().optional(),
    componentArticleId: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    qty: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().min(0).optional()
  })).optional(),
  comboComponents: z.array(z.object({
    articleId: z.string().optional(),
    componentArticleId: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    qty: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().min(0).optional()
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.stockMin != null && data.stockMax != null && data.stockMax < data.stockMin) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stockMax'], message: 'stockMax debe ser >= stockMin' })
  }
})

export const validateUpdateArticle = (req, res, next) => {
  const parsed = UpdateArticleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      code: 'ARTICLE_UPDATE_VALIDATION_FAILED',
      details: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }
  req.body = parsed.data
  next()
}

