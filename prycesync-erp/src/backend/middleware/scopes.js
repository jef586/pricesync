// Middleware de verificación de scopes basado en rol (compat legacy + RBAC nuevo)

// Normaliza roles RBAC nuevos a roles legacy utilizados en este middleware
function normalizeToLegacy(role) {
  const r = String(role || '').toUpperCase()
  switch (r) {
    case 'SUPERADMIN':
    case 'ADMIN':
      return 'admin'
    case 'SUPERVISOR':
      return 'manager'
    case 'SELLER':
      return 'user'
    case 'TECHNICIAN':
      return 'viewer'
    default:
      return String(role || 'viewer')
  }
}

const ROLE_SCOPES = {
  admin: new Set([
    'article:read',
    'article:write',
    'stock:read',
    'stock:write',
    'stock:override',
    'stock:kardex',
    'stock:export',
    'imports:read',
    'imports:write',
    'purchases:resolve',
    // Admin users management
    'admin:users'
  ]),
  manager: new Set([
    'article:read',
    'article:write',
    'stock:read',
    'stock:write',
    'stock:kardex',
    'stock:export',
    'imports:read',
    'imports:write',
    'purchases:resolve'
  ]),
  user: new Set(['article:read', 'stock:read', 'stock:kardex', 'imports:read', 'purchases:resolve']),
  viewer: new Set(['article:read', 'stock:read', 'stock:kardex', 'imports:read', 'purchases:resolve'])
}

export function requireScopes(...required) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado', code: 'NOT_AUTHENTICATED' })
    }

    const legacyRole = normalizeToLegacy(req.user.role)
    const scopes = ROLE_SCOPES[legacyRole] || new Set()

    const missing = required.filter((s) => !scopes.has(s))
    if (missing.length) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_SCOPES',
        required,
        currentRole: req.user.role,
        normalizedRole: legacyRole
      })
    }

    next()
  }
}