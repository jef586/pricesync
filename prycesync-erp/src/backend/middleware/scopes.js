// Middleware de verificación de scopes basado en rol

const ROLE_SCOPES = {
  admin: new Set(['article:read', 'article:write', 'stock:read', 'stock:write', 'stock:override']),
  manager: new Set(['article:read', 'article:write', 'stock:read', 'stock:write']),
  user: new Set(['article:read', 'stock:read']),
  viewer: new Set(['article:read', 'stock:read'])
}

export function requireScopes(...required) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado', code: 'NOT_AUTHENTICATED' })
    }

    const role = req.user.role || 'viewer'
    const scopes = ROLE_SCOPES[role] || new Set()

    const missing = required.filter((s) => !scopes.has(s))
    if (missing.length) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_SCOPES',
        required,
        currentRole: role
      })
    }

    next()
  }
}