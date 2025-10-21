import { Prisma } from '@prisma/client'

/**
 * Convierte errores de Prisma/JS en respuestas HTTP legibles para el cliente.
 * Devuelve { status, body } donde body siempre incluye { success: false, message, ... }.
 */
export function mapErrorToHttp(error, defaultMessage = 'Error interno del servidor') {
  const unknown = { status: 500, body: { success: false, message: defaultMessage, details: fullMessage(error) } }

  try {
    if (!error) return unknown

    // Zod (por seguridad; normalmente se maneja antes)
    if (error?.name === 'ZodError') {
      const details = Array.isArray(error.issues)
        ? error.issues.map(i => `${(i.path || []).join('.') || 'campo'}: ${i.message}`).join('; ')
        : 'Datos inválidos'
      return { status: 400, body: { success: false, message: 'Datos inválidos', details } }
    }

    // Prisma: errores de validación del cliente (schema/entrada)
    if (error instanceof Prisma.PrismaClientValidationError) {
      const parsed = parsePrismaValidationMessage(error.message)
      return {
        status: 400,
        body: {
          success: false,
          message: parsed?.message || 'Datos inválidos para la operación',
          field: parsed?.field,
          hint: parsed?.hint,
          details: fullMessage(error)
        }
      }
    }

    // Prisma: errores conocidos del motor
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const code = error.code
      switch (code) {
        case 'P2002': // Unique constraint failed
          return { status: 409, body: { success: false, message: 'Valor duplicado en un campo único', code } }
        case 'P2003': // Foreign key constraint failed
          return { status: 400, body: { success: false, message: `Referencia no válida (${error.meta?.field_name || error.meta?.target || 'campo desconocido'})`, code } }
        case 'P2025': // Record not found
          return { status: 404, body: { success: false, message: 'Registro no encontrado o ya eliminado', code } }
        case 'P2011':
        case 'P2012':
        case 'P2013':
        case 'P2009': // Data validation error
          return { status: 400, body: { success: false, message: 'Validación de datos fallida', code, details: fullMessage(error) } }
        case 'P2033': // Number out of range
          return { status: 400, body: { success: false, message: 'Número fuera de rango para el tipo de dato', code } }
        default:
          return { status: 500, body: { success: false, message: defaultMessage, code, details: fullMessage(error) } }
      }
    }

    // Errores genéricos de JS
    const name = error.name || 'Error'
    if (name === 'TypeError' || name === 'RangeError' || name === 'SyntaxError') {
      return { status: 500, body: { success: false, message: defaultMessage, details: fullMessage(error) } }
    }

    // Fallback
    return unknown
  } catch (e) {
    return unknown
  }
}

function parsePrismaValidationMessage(message) {
  if (!message || typeof message !== 'string') return null

  // Unknown arg `field` in data
  const m1 = message.match(/Unknown arg `([^`]+)` in data/i)
  if (m1) {
    const field = m1[1]
    return {
      field,
      message: `Campo desconocido en datos: ${field}`,
      hint: 'Verifique el nombre del campo y el modelo Prisma'
    }
  }

  // Argument field: Got invalid value ... (e.g., null vs enum/string/number)
  const m2 = message.match(/Argument\s+(\w+):\s+Got invalid value[^\n]*\n/i)
  if (m2) {
    const field = m2[1]
    return {
      field,
      message: `Valor inválido para campo: ${field}`,
      hint: 'Revise tipo y si admite null según el esquema'
    }
  }

  // Missing required arg: Argument field is missing.
  const m3 = message.match(/Argument\s+(\w+)\s+is missing/i)
  if (m3) {
    const field = m3[1]
    return {
      field,
      message: `Falta un argumento requerido: ${field}`,
      hint: 'Incluya el campo requerido en la creación/actualización'
    }
  }

  return null
}

function fullMessage(err) {
  const msg = err?.message || String(err)
  return typeof msg === 'string' ? msg.slice(0, 2000) : undefined
}