import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/permissions.js'

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
router.put('/:role/permissions', requirePermission('admin:roles'), async (req, res) => {
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

  // Only SUPERADMIN may update global matrix
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

  updateRolePermissions(role, perms)
  return res.json({ message: 'Matriz actualizada', matrix: ROLE_PERMISSIONS })
})

export default router