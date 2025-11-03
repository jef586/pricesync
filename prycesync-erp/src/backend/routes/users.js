import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'

const router = express.Router()

// Todas las rutas de usuarios requieren autenticación y permiso admin:users
router.use(authenticate)
router.use(requireScopes('admin:users'))

// GET /api/users?q=&role=&status=&page=&size=&sort=
router.get('/', async (req, res) => {
  try {
    const companyId = req.user.company?.id
    if (!companyId) {
      return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' })
    }

    // Params con defaults
    const q = String(req.query.q || '').trim()
    const role = String(req.query.role || '').trim()
    const status = String(req.query.status || '').trim()
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const size = Math.max(1, Math.min(100, parseInt(req.query.size || '20', 10)))
    const sortParam = String(req.query.sort || '').trim() // ej: "name:asc" o "lastLogin:desc"

    const skip = (page - 1) * size

    // Campos de orden permitidos
    const allowedSortFields = new Set(['name', 'email', 'role', 'status', 'lastLogin', 'createdAt'])
    let orderBy = { createdAt: 'desc' }
    if (sortParam) {
      const [field, dir] = sortParam.split(':')
      const order = dir === 'asc' ? 'asc' : 'desc'
      if (allowedSortFields.has(field)) {
        orderBy = { [field]: order }
      }
    }

    // Construcción del where con filtros + companyId
    const where = {
      companyId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
      ...(status && { status }),
    }

    // Consulta paralela para rendimiento
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true,
        },
        skip,
        take: size,
        orderBy,
      }),
      prisma.user.count({ where }),
    ])

    return res.json({
      users,
      pagination: {
        page,
        limit: size,
        total,
        pages: Math.ceil(total / size),
      },
    })
  } catch (err) {
    console.error('Error listing users:', err)
    return res.status(500).json({ error: 'Error obteniendo usuarios', code: 'GET_USERS_FAILED' })
  }
})

export default router