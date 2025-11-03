// Permissions map and role→permissions matrix
export const PERMISSIONS = {
  'admin:users': 'Gestionar usuarios',
  'admin:roles': 'Ver/editar matriz de permisos',
  'sales:create': 'Crear ventas',
  'sales:update': 'Editar ventas',
  'sales:refund': 'Anular/Devolver',
  'reports:view': 'Ver reportes',
  'stock:view': 'Ver stock',
  'config:view': 'Ver configuración',
  'config:write': 'Editar configuración',
}

// Normalize legacy roles to new RBAC roles for backward compatibility
function normalizeRole(role) {
  switch (String(role).toLowerCase()) {
    case 'superadmin': return 'SUPERADMIN'
    case 'admin': return 'ADMIN'
    case 'manager': return 'SUPERVISOR'
    case 'user': return 'SELLER'
    case 'viewer': return 'TECHNICIAN'
    default: return role
  }
}

export const ROLE_PERMISSIONS = {
  SUPERADMIN: ['admin:users','admin:roles','reports:view','stock:view','config:view','config:write','sales:create','sales:update','sales:refund'],
  ADMIN:      ['admin:users','admin:roles','reports:view','stock:view','config:view','config:write','sales:create','sales:update','sales:refund'],
  SUPERVISOR: ['reports:view','stock:view','sales:create','sales:update','sales:refund'],
  SELLER:     ['sales:create'],
  TECHNICIAN: ['config:view'],
}

// Internal helper to permit updating matrix in-memory (for dev only)
export function updateRolePermissions(role, permissions) {
  const key = normalizeRole(role)
  ROLE_PERMISSIONS[key] = permissions
}

// Middleware: requirePermission(...perms)
export function requirePermission(...required) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' })
      }
      const roleKey = normalizeRole(req.user.role)
      const effective = new Set(ROLE_PERMISSIONS[roleKey] || [])
      const missing = required.filter(p => !effective.has(p))
      if (missing.length) {
        return res.status(403).json({ error: 'Permiso denegado', missing })
      }
      next()
    } catch (err) {
      return res.status(500).json({ error: 'Error en autorización', message: err.message })
    }
  }
}