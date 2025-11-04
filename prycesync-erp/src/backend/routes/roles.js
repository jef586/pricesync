import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/permissions.js'
import { prisma } from '../config/database.js'
import fs from 'fs'
import path from 'path'
import AuditService from '../services/AuditService.js'

const router = express.Router()

router.use(authenticate)

// GET /api/roles - list available user roles
router.get('/', requirePermission('admin:roles'), (req, res) => {
  const roles = ['SUPERADMIN','ADMIN','SUPERVISOR','SELLER','TECHNICIAN']
  const catalog = [
    { code: 'SUPERADMIN', label: 'Superadmin', description: 'Acceso total global' },
    { code: 'ADMIN', label: 'Admin', description: 'Gestión completa dentro de la empresa' },
    { code: 'SUPERVISOR', label: 'Supervisor', description: 'Supervisa ventas y reportes' },
    { code: 'SELLER', label: 'Vendedor', description: 'Operaciones básicas de ventas' },
    { code: 'TECHNICIAN', label: 'Técnico', description: 'Acceso a configuración técnica' },
  ]
  res.json({ roles, catalog })
})

// GET /api/roles/matrix - role to permissions matrix
router.get('/matrix', requirePermission('admin:roles'), async (req, res) => {
  const { ROLE_PERMISSIONS, PERMISSIONS } = await import('../middleware/permissions.js')

  const roles = ['SUPERADMIN','ADMIN','SUPERVISOR','SELLER','TECHNICIAN']
  const permissions = Object.entries(PERMISSIONS).map(([code, meta]) => ({
    code,
    label: meta.label,
    group: meta.group,
  }))
  const matrix = roles.map(role => ({ role, permissions: (ROLE_PERMISSIONS[role] || []).slice() }))

  res.json({ permissions, roles, matrix })
})

// PUT /api/roles/:role/permissions - update permissions for a role (SUPERADMIN only)
router.put('/:role/permissions', requirePermission('admin:roles:write'), async (req, res) => {
  const { ROLE_PERMISSIONS, PERMISSIONS, updateRolePermissions } = await import('../middleware/permissions.js')
  const role = req.params.role
  const perms = req.body?.permissions

  if (!Array.isArray(perms)) {
    return res.status(400).json({ error: 'permissions debe ser un array de strings' })
  }

  const validRoles = ['SUPERADMIN','ADMIN','SUPERVISOR','SELLER','TECHNICIAN']
  if (!validRoles.includes(role)) {
    return res.status(404).json({ error: 'Rol no válido' })
  }

  // Only SUPERADMIN may update global matrix (ADMIN con write podría habilitarse por flag futura)
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Permiso denegado' })
  }

  // Validate permissions exist
  const unknown = perms.filter(p => !Object.keys(PERMISSIONS).includes(p))
  if (unknown.length) {
    return res.status(400).json({ error: `Permisos desconocidos: ${unknown.join(', ')}` })
  }

  // Protect critical SUPERADMIN permissions
  if (role === 'SUPERADMIN') {
    const required = ['admin:users','admin:roles']
    for (const r of required) {
      if (!perms.includes(r)) {
        return res.status(400).json({ error: `SUPERADMIN debe conservar permiso crítico: ${r}` })
      }
    }
  }

  // Anti-escalación: el editor no puede asignar permisos que no posee (SUPERADMIN posee todos del catálogo)
  const editorRole = String(req.user.role).toUpperCase()
  const editorEffective = new Set(editorRole === 'SUPERADMIN' ? Object.keys(PERMISSIONS) : (ROLE_PERMISSIONS[editorRole] || []))
  const notOwned = perms.filter(p => !editorEffective.has(p))
  if (notOwned.length) {
    return res.status(403).json({ error: 'No puedes asignar permisos que no posees', missing: notOwned })
  }

  // Diff para auditoría
  const current = new Set(ROLE_PERMISSIONS[role] || [])
  const next = new Set(perms)
  const added = [...next].filter(p => !current.has(p))
  const removed = [...current].filter(p => !next.has(p))

  // Persistencia: actualiza in-memory para visualización existente
  updateRolePermissions(role, perms)

  // Persistencia atómica en BD (si catálogo existe) y auditoría
  try {
    // Mapear permisos a IDs existentes
    const permissionRows = await prisma.permission.findMany({
      where: { name: { in: perms } },
      select: { id: true, name: true }
    })
    const foundNames = new Set(permissionRows.map(p => p.name))
    const missingDb = perms.filter(p => !foundNames.has(p))
    if (missingDb.length) {
      return res.status(400).json({ error: 'Permisos no registrados en BD', missing: missingDb })
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { role } }),
      prisma.rolePermission.createMany({
        data: permissionRows.map(p => ({ role, permissionId: p.id }))
      })
    ])

    // Auditoría persistente (DB)
    await AuditService.logRolePermissionsUpdate({
      actor: req.user,
      role,
      added,
      removed,
      companyId: req.user?.company?.id || req.user?.companyId || null,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })
  } catch (err) {
    return res.status(500).json({ error: 'Fallo al persistir cambios en BD', message: err.message })
  }

  return res.json({ message: 'Matriz actualizada', matrix: ROLE_PERMISSIONS, diff: { added, removed } })
})

export default router