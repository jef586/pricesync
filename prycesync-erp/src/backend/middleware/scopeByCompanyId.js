// Reusable company scoping middleware for multi-tenant endpoints
// - Non-SUPERADMIN: enforces actor company and blocks cross-tenant IDs
// - SUPERADMIN: allows specifying target company via params/query/body

export const scopeByCompanyId = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Usuario no autenticado', code: 'NOT_AUTHENTICATED' });
  }

  const scopeEnabled = String(process.env.COMPANY_SCOPE_ENABLED || 'true').toLowerCase() === 'true';
  const isSuperadmin = String(user.role).toUpperCase() === 'SUPERADMIN';
  const actorCompanyId = user.company?.id || user.companyId || null;
  const requestedCompanyId = req.params?.companyId || req.query?.companyId || req.body?.companyId || null;

  if (!scopeEnabled) {
    req.companyId = requestedCompanyId || actorCompanyId || null;
    return next();
  }

  if (isSuperadmin) {
    // SUPERADMIN puede operar sobre cualquier empresa; si no se especifica, usar la propia si existe
    req.companyId = requestedCompanyId || actorCompanyId || null;
    return next();
  }

  if (!actorCompanyId) {
    return res.status(401).json({ error: 'Usuario sin empresa asignada', code: 'USER_NO_COMPANY' });
  }

  if (requestedCompanyId && requestedCompanyId !== actorCompanyId) {
    return res.status(403).json({ error: 'Acceso denegado a recursos de otra empresa', code: 'CROSS_COMPANY_ACCESS_DENIED' });
  }

  req.companyId = actorCompanyId;
  return next();
};

export default scopeByCompanyId;