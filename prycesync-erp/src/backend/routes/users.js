import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { requireScopes } from '../middleware/scopes.js'
import { requirePermission } from '../middleware/permissions.js'
import AuthService from '../services/AuthService.js'
import { validateCreateUser, validateUserIdParam, validateUpdateUser, validateUpdateStatus } from '../middleware/usersValidation.js'
import fs from 'fs'
import path from 'path'
import { Prisma } from '@prisma/client'

const router = express.Router()

// Helper: mapear roles nuevos -> legados (para escribir en BD)
const toLegacyRole = (role) => {
  switch (String(role).toUpperCase()) {
    case 'SUPERADMIN': return 'admin'   // si existiera 'superadmin' en tu enum real, cámbialo por 'superadmin'
    case 'ADMIN': return 'admin'
    case 'SUPERVISOR': return 'manager'
    case 'SELLER': return 'user'
    case 'TECHNICIAN': return 'viewer'
    default: return role
  }
}

// Helper: mapear roles legados -> nuevos (para responder al frontend)
const fromLegacyRole = (role) => {
  switch (String(role).toLowerCase()) {
    case 'superadmin': return 'SUPERADMIN'
    case 'admin': return 'ADMIN'
    case 'manager': return 'SUPERVISOR'
    case 'user': return 'SELLER'
    case 'viewer': return 'TECHNICIAN'
    default: return role
  }
}

// Todas las rutas de usuarios requieren autenticación y permiso admin:users
router.use(authenticate)
router.use(requireScopes('admin:users'))
router.use(requirePermission('admin:users'))

// GET /api/users?q=&role=&status=&page=&size=&sort=
router.get('/', async (req, res) => {
  try {
    const companyId = req.user.company?.id
    if (!companyId) {
      return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' })
    }

    const q = String(req.query.q || '').trim()
    const status = String(req.query.status || '').trim()
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const size = Math.max(1, Math.min(100, parseInt(req.query.size || '20', 10)))
    const sortParam = String(req.query.sort || '').trim()
    const requestedRole = String(req.query.role || '').trim().toUpperCase()

    const skip = (page - 1) * size

    const allowedSortFields = new Set(['name', 'email', 'status', 'lastLogin', 'createdAt'])
    let orderBy = { createdAt: 'desc' }
    if (sortParam) {
      const [field, dir] = sortParam.split(':')
      const order = dir === 'asc' ? 'asc' : 'desc'
      if (allowedSortFields.has(field)) {
        orderBy = { [field]: order }
      }
    }

    const where = {
      companyId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
      ...(requestedRole && { role: requestedRole })
    }

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

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'El usuario ya existe', code: 'USER_EMAIL_EXISTS' })
    }

    const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const passwordHash = await AuthService.hashPassword(tempPassword)

    const roleNorm = String(role || 'SELLER').toUpperCase()

    const created = await prisma.user.create({
      data: {
        email,
        name,
        role: roleNorm,
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
// Helpers for role comparisons and audit
const ROLE_PRIORITY = {
  SUPERADMIN: 5,
  ADMIN: 4,
  SUPERVISOR: 3,
  MANAGER: 3,
  SELLER: 2,
  TECHNICIAN: 2,
  USER: 1,
  VIEWER: 1
}

async function isLastActiveSuperadmin(companyId, targetUserId) {
  const count = await prisma.user.count({
    where: { companyId, role: 'SUPERADMIN', status: 'active' }
  })
  if (count !== 1) return false
  const last = await prisma.user.findFirst({
    where: { companyId, role: 'SUPERADMIN', status: 'active' },
    select: { id: true }
  })
  return last?.id === targetUserId
}

function canAssignRole(editorRole, targetRole) {
  const e = ROLE_PRIORITY[editorRole] ?? 0
  const t = ROLE_PRIORITY[targetRole] ?? 0
  return e >= t
}

async function hasOtherActiveAdminsWithPermission(companyId, excludeUserId) {
  const count = await prisma.user.count({
    where: {
      companyId,
      id: { not: excludeUserId },
      status: 'active',
      OR: [{ role: 'SUPERADMIN' }, { role: 'ADMIN' }]
    }
  })
  return count > 0
}

function logUserAudit({ actorId, targetId, companyId, changes }) {
  try {
    const line = JSON.stringify({
      type: 'user_change',
      actorId,
      targetId,
      companyId,
      changes,
      at: new Date().toISOString()
    }) + '\n'
    const logfile = path.join(process.cwd(), 'core_reports', 'audit_users.log')
    fs.mkdirSync(path.dirname(logfile), { recursive: true })
    fs.appendFileSync(logfile, line)
  } catch (e) {
    console.warn('Audit log write failed', e)
    console.log('AUDIT USER:', { actorId, targetId, companyId, changes })
  }
}

// GET /api/users/:id
router.get('/:id', validateUserIdParam, async (req, res) => {
  try {
    const { id } = req.params
    const companyId = req.user.company?.id
    if (!companyId) {
      return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' })
    }

    const user = await prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        companyId: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' })
    }

    const lastSuper = await isLastActiveSuperadmin(companyId, id)
    return res.json({ ok: true, user: { ...user, isLastSuperadmin: lastSuper } })
  } catch (err) {
    console.error('Error get user by id:', err)
    return res.status(500).json({ error: 'Error obteniendo usuario', code: 'GET_USER_FAILED' })
  }
})

// PUT /api/users/:id (editar nombre y rol)
router.put('/:id', validateUserIdParam, validateUpdateUser, async (req, res) => {
  try {
    const { id } = req.params
    const { name, role } = req.body
    const companyId = req.user.company?.id
    const actor = req.user
    if (!companyId) {
      return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' })
    }

    const target = await prisma.user.findFirst({ where: { id, companyId } })
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' })

    // Último SUPERADMIN → no cambiar a otro rol
    const lastSuper = await isLastActiveSuperadmin(companyId, id)
    if (lastSuper && target.role === 'SUPERADMIN' && role !== 'SUPERADMIN') {
      return res.status(409).json({ error: 'No se puede cambiar el rol del último SUPERADMIN', code: 'LAST_SUPERADMIN_BLOCK' })
    }

    // Anti-escalación
    if (!canAssignRole(actor.role, role)) {
      return res.status(403).json({ error: 'No puedes asignar un rol con mayor privilegio que el tuyo', code: 'ROLE_ESCALATION_BLOCK' })
    }

    // Self-protect: perder admin:users si eres el único
    const editorIsTarget = actor.id === target.id
    const roleRemovesAdminScope = role !== 'SUPERADMIN' && role !== 'ADMIN'
    if (editorIsTarget && roleRemovesAdminScope) {
      const others = await hasOtherActiveAdminsWithPermission(companyId, actor.id)
      if (!others) {
        return res.status(409).json({ error: 'No puedes degradarte si dejaría al sistema sin admins operativos', code: 'SELF_PROTECT_BLOCK' })
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: { name, role } })

    logUserAudit({
      actorId: actor.id,
      targetId: id,
      companyId,
      changes: { before: { name: target.name, role: target.role }, after: { name, role } }
    })

    return res.json({ ok: true, user: { id: updated.id, name: updated.name, role: updated.role } })
  } catch (err) {
    console.error('Error updating user:', err)
    return res.status(500).json({ error: 'Error actualizando usuario', code: 'UPDATE_USER_FAILED' })
  }
})

// PATCH /api/users/:id/status
router.patch('/:id/status', validateUserIdParam, validateUpdateStatus, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const companyId = req.user.company?.id
    const actor = req.user
    if (!companyId) {
      return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' })
    }

    const target = await prisma.user.findFirst({ where: { id, companyId } })
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' })

    // Anti-escalación: un usuario no puede cambiar el estado de otro con mayor privilegio
    if (!canAssignRole(actor.role, target.role)) {
      return res.status(403).json({ error: 'No puedes cambiar el estado de un usuario con mayor privilegio que el tuyo', code: 'STATUS_ESCALATION_BLOCK' })
    }

    // Último SUPERADMIN → no cambiar estado a no-activo
    const lastSuper = await isLastActiveSuperadmin(companyId, id)
    if (lastSuper && target.role === 'SUPERADMIN' && status !== 'active') {
      return res.status(409).json({ error: 'No se puede cambiar el estado del último SUPERADMIN', code: 'LAST_SUPERADMIN_STATE_BLOCK' })
    }

    // Self-protect: no suspenderse/inactivarse si dejaría sin admins operativos
    const editorIsTarget = actor.id === target.id
    if (editorIsTarget && status !== 'active') {
      const others = await hasOtherActiveAdminsWithPermission(companyId, actor.id)
      if (!others) {
        return res.status(409).json({ error: 'No puedes cambiar tu estado si dejaría al sistema sin admins operativos', code: 'SELF_STATE_BLOCK' })
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: { status } })

    logUserAudit({
      actorId: actor.id,
      targetId: id,
      companyId,
      changes: { before: { status: target.status }, after: { status } }
    })

    return res.json({ ok: true, user: { id: updated.id, status: updated.status } })
  } catch (err) {
    console.error('Error updating status:', err)
    return res.status(500).json({ error: 'Error actualizando estado', code: 'UPDATE_STATUS_FAILED' })
  }
})