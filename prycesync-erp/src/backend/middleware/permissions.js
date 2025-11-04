// Permissions catalog and role→permissions matrix
// Normalizado con etiqueta y grupo para UI de lectura
export const PERMISSIONS = {
  'admin:users': { label: 'Gestionar usuarios', group: 'Administración' },
  'admin:roles': { label: 'Ver/editar matriz de permisos', group: 'Administración' },
  'sales:create': { label: 'Crear ventas', group: 'Ventas' },
  'sales:update': { label: 'Editar ventas', group: 'Ventas' },
  'sales:refund': { label: 'Anular/Devolver', group: 'Ventas' },
  'reports:view': { label: 'Ver reportes', group: 'Reportes' },
  'stock:view': { label: 'Ver stock', group: 'Stock' },
  'config:view': { label: 'Ver configuración', group: 'Configuración' },
  'config:write': { label: 'Editar configuración', group: 'Configuración' },
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