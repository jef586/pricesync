import AuthService from '../services/AuthService.js';

// Middleware para verificar autenticación
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar token
    const decoded = AuthService.verifyToken(token);
    
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Tipo de token inválido',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Obtener usuario
    const user = await AuthService.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        error: 'Usuario inactivo',
        code: 'USER_INACTIVE'
      });
    }

    // Agregar usuario al request con claims del token (role, permissions, companyId)
    req.user = {
      ...user,
      role: decoded.role || user.role,
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
      companyId: decoded.companyId || user.company?.id || user.companyId || null
    };
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN',
      message: error.message
    });
  }
};

// Middleware para verificar roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);
    
    if (decoded.type === 'access') {
      const user = await AuthService.getUserById(decoded.userId);
      req.user = user && user.status === 'active' ? {
        ...user,
        role: decoded.role || user.role,
        permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [],
        companyId: decoded.companyId || user.company?.id || user.companyId || null
      } : null;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Middleware para verificar que el usuario pertenece a la misma empresa
export const sameCompany = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  const scopeEnabled = String(process.env.COMPANY_SCOPE_ENABLED || 'true').toLowerCase() === 'true';

  // SUPERADMIN: puede acceder a cualquier empresa (bypass)
  if (String(req.user.role).toUpperCase() === 'SUPERADMIN' || !scopeEnabled) {
    return next();
  }

  const actorCompanyId = req.user.company?.id || req.user.companyId || null;
  if (!actorCompanyId) {
    return res.status(401).json({
      error: 'Usuario sin empresa asignada',
      code: 'USER_NO_COMPANY'
    });
  }

  const companyId =
    req.params.companyId ||
    req.body?.companyId ||
    req.query?.companyId ||
    null;
  
  if (companyId && companyId !== actorCompanyId) {
    return res.status(403).json({
      error: 'Acceso denegado a recursos de otra empresa',
      code: 'CROSS_COMPANY_ACCESS_DENIED'
    });
  }

  next();
};