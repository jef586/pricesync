import { z } from 'zod'

// Roles y estados alineados con el esquema Prisma actual (RBAC nuevo)
const RoleEnum = z.enum([
  'SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'SELLER', 'TECHNICIAN'
])
const StatusEnum = z.enum(['active', 'inactive', 'suspended'])

// POST /api/users body
const CreateUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: RoleEnum.default('SELLER'),
  status: StatusEnum.optional()
})

export const validateCreateUser = (req, res, next) => {
  const parsed = CreateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    })
  }
  req.body = parsed.data
  next()
}

// POST/DELETE/PATCH /api/users/:id params validation
// Acepta tanto CUID clásico como CUID2 para compatibilidad
const IdParamSchema = z.object({ id: z.union([z.string().cuid(), z.string().cuid2()]) })

export const validateUserIdParam = (req, res, next) => {
  const parsed = IdParamSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'ID inválido',
      errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    })
  }
  next()
}

// PUT /api/users/:id body (editar nombre y rol)
const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(120),
  role: RoleEnum
})

export const validateUpdateUser = (req, res, next) => {
  const parsed = UpdateUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    })
  }
  req.body = parsed.data
  next()
}

// PATCH /api/users/:id/status body (cambiar estado)
const UpdateStatusSchema = z.object({
  status: StatusEnum
})

export const validateUpdateStatus = (req, res, next) => {
  const parsed = UpdateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    })
  }
  req.body = parsed.data
  next()
}