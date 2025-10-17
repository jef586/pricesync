// Middleware de verificación de scopes basado en rol

const ROLE_SCOPES = {
  admin: new Set(['article:read', 'article:write']),
  manager: new Set(['article:read', 'article:write']),
  user: new Set(['article:read']),
  viewer: new Set(['article:read'])
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