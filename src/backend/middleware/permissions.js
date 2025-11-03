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

export const ROLE_PERMISSIONS = {
  SUPERADMIN: ['admin:users','admin:roles','reports:view','stock:view','config:view','config:write','sales:create','sales:update','sales:refund'],
  ADMIN:      ['admin:users','admin:roles','reports:view','stock:view','config:view','config:write','sales:create','sales:update','sales:refund'],
  SUPERVISOR: ['reports:view','stock:view','sales:create','sales:update','sales:refund'],
  SELLER:     ['sales:create'],
  TECHNICIAN: ['config:view'],
}

// Internal helper to permit updating matrix in-memory (for dev only)
export function updateRolePermissions(role, permissions) {
  ROLE_PERMISSIONS[role] = permissions
}

// Middleware: requirePermission(...perms)
export function requirePermission(...required) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' })
      }
      const role = req.user.role
      const effective = new Set(ROLE_PERMISSIONS[role] || [])
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

// sameCompany guard: en endpoints company-scoped
export function sameCompany(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' })
    if (req.user.role === 'SUPERADMIN') return next()
    const targetCompanyId = (req.params.companyId || req.body.companyId || req.query.companyId || req.companyId)
    const userCompanyId = req.user.company?.id || req.user.companyId
    if (targetCompanyId && targetCompanyId !== userCompanyId) {
      return res.status(403).json({ error: 'Acceso restringido a su empresa' })
    }
    next()
  } catch (err) {
    return res.status(500).json({ error: 'Error en validación de empresa', message: err.message })
  }
}