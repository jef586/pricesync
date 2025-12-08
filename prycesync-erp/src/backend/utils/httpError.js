/**
 * Custom application error class for standardized error handling
 */
export class AppError extends Error {
  constructor(code, message, field = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.field = field;
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert AppError to HTTP response format
   * @returns {Object} HTTP error response
   */
  toHttpResponse() {
    const response = {
      error: this.message,
      code: this.code
    };

    if (this.field) {
      response.field = this.field;
    }

    return response;
  }

  /**
   * Get HTTP status code based on error code
   * @returns {number} HTTP status code
   */
  getHttpStatus() {
    const statusMap = {
      'VALIDATION_ERROR': 422,
      'FORBIDDEN': 403,
      'NOT_FOUND': 404,
      'CONFLICT': 409,
      'UNAUTHORIZED': 401,
      'INTERNAL_ERROR': 500
    };

    return statusMap[this.code] || 500;
  }
}

/**
 * Error handler middleware for Express
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // If it's our custom AppError, handle it properly
  if (err instanceof AppError) {
    return res.status(err.getHttpStatus()).json(err.toHttpResponse());
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con estos datos',
      code: 'DUPLICATE_ENTRY',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro no encontrado',
      code: 'NOT_FOUND'
    });
  }

  if (err.code === 'P2003') {
    return res.status(409).json({
      error: 'No se puede eliminar porque tiene registros relacionados',
      code: 'FOREIGN_KEY_CONSTRAINT',
      field: err.meta?.field_name
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Default error handler
  console.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { 
      message: err.message,
      stack: err.stack 
    })
  });
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {string} field - Field that failed validation
 * @returns {AppError} Validation error
 */
export function validationError(message, field = null) {
  return new AppError('VALIDATION_ERROR', message, field);
}

/**
 * Create a not found error
 * @param {string} message - Error message
 * @returns {AppError} Not found error
 */
export function notFoundError(message = 'Recurso no encontrado') {
  return new AppError('NOT_FOUND', message);
}

/**
 * Create a conflict error
 * @param {string} message - Error message
 * @param {string} field - Field that caused the conflict
 * @returns {AppError} Conflict error
 */
export function conflictError(message, field = null) {
  return new AppError('CONFLICT', message, field);
}

/**
 * Create a forbidden error
 * @param {string} message - Error message
 * @returns {AppError} Forbidden error
 */
export function forbiddenError(message = 'Acceso denegado') {
  return new AppError('FORBIDDEN', message);
}

/**
 * Create an unauthorized error
 * @param {string} message - Error message
 * @returns {AppError} Unauthorized error
 */
export function unauthorizedError(message = 'No autorizado') {
  return new AppError('UNAUTHORIZED', message);
}

/**
 * Map any error to HTTP response format
 * @param {Error} err - The error object
 * @returns {Object} HTTP error response
 */
export function mapErrorToHttp(err) {
  // If it's our custom AppError, use its built-in method
  if (err instanceof AppError) {
    return {
      status: err.getHttpStatus(),
      body: err.toHttpResponse()
    };
  }

  if (typeof err?.httpCode === 'number' && err.httpCode >= 400) {
    return {
      status: err.httpCode,
      body: {
        error: err.message || 'Error',
        code: err.httpCode === 422 ? 'VALIDATION_ERROR' : (err.httpCode === 409 ? 'CONFLICT' : 'INTERNAL_ERROR')
      }
    }
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return {
      status: 409,
      body: {
        error: 'Ya existe un registro con estos datos',
        code: 'DUPLICATE_ENTRY',
        field: err.meta?.target
      }
    };
  }

  if (err.code === 'P2025') {
    return {
      status: 404,
      body: {
        error: 'Registro no encontrado',
        code: 'NOT_FOUND'
      }
    };
  }

  if (err.code === 'P2003') {
    return {
      status: 409,
      body: {
        error: 'No se puede eliminar porque tiene registros relacionados',
        code: 'FOREIGN_KEY_CONSTRAINT',
        field: err.meta?.field_name
      }
    };
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return {
      status: 401,
      body: {
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      }
    };
  }

  if (err.name === 'TokenExpiredError') {
    return {
      status: 401,
      body: {
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      }
    };
  }

  // Default error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    status: 500,
    body: {
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && { 
        message: err.message,
        stack: err.stack 
      })
    }
  };
}
