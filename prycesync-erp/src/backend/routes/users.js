import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'
import AuthService from '../services/AuthService.js'
import { validateCreateUser, validateUserIdParam } from '../middleware/usersValidation.js'

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

// POST /api/users - create a new user within current company
router.post('/', validateCreateUser, async (req, res) => {
  try {
    const companyId = req.user.company?.id
    if (!companyId) {
      return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' })
    }

    const { name, email, role, status } = req.body

    // Check duplication by email (global uniqueness per schema)
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'El usuario ya existe', code: 'USER_EMAIL_EXISTS' })
    }

    // Generate a temporary random password (invite flow)
    const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const passwordHash = await AuthService.hashPassword(tempPassword)

    const created = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'user',
        status: status || 'active',
        passwordHash,
        companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    })

    return res.status(201).json({
      message: 'Usuario creado',
      user: created
    })
  } catch (err) {
    console.error('Error creating user:', err)
    return res.status(500).json({ error: 'Error creando usuario', code: 'CREATE_USER_FAILED' })
  }
})

// POST /api/users/:id/send-invite - stub mailer: logs and responds
router.post('/:id/send-invite', validateUserIdParam, async (req, res) => {
  try {
    const { id } = req.params
    const companyId = req.user.company?.id
    if (!companyId) {
      return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, companyId: true }
    })

    if (!user || user.companyId !== companyId) {
      return res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' })
    }

    // Stub invite email: in real impl, integrate nodemailer/transporter
    console.log(`[INVITE] Enviando invitación a ${user.email} (userId=${user.id}) por ${req.user.email}`)

    return res.json({
      ok: true,
      message: 'Invitación enviada (stub)',
      to: user.email,
      userId: user.id
    })
  } catch (err) {
    console.error('Error sending invite:', err)
    return res.status(500).json({ error: 'Error enviando invitación', code: 'SEND_INVITE_FAILED' })
  }
})

export default router