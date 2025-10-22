// SQL Validator: garantiza solo SELECT sobre tablas permitidas y sin operaciones peligrosas
const DANGEROUS = /(insert|update|delete|drop|alter|truncate|grant|revoke)\b/i

export function validateSql(sql, allowed = ['products','inventory','categories']) {
  if (typeof sql !== 'string') {
    return { valid: false, reason: 'SQL no es string' }
  }
  const normalized = sql.trim().replace(/\s+/g, ' ')
  if (!/^select\b/i.test(normalized)) {
    return { valid: false, reason: 'Solo se permiten SELECT' }
  }
  if (DANGEROUS.test(normalized)) {
    return { valid: false, reason: 'Operación no permitida en SQL' }
  }
  // Extraer tablas en FROM/JOIN (nombre simple)
  const tables = []
  const fromMatch = normalized.match(/\bfrom\s+([a-z_\.]+)/i)
  if (fromMatch) tables.push(fromMatch[1].split('.').pop())
  const joinMatches = normalized.matchAll(/\bjoin\s+([a-z_\.]+)/gi)
  for (const m of joinMatches) tables.push(m[1].split('.').pop())

  // Validar que todas las tablas estén permitidas
  const invalid = tables.filter(t => !allowed.includes(t))
  if (invalid.length) {
    return { valid: false, reason: `Tablas no permitidas: ${invalid.join(', ')}` }
  }
  // No permitir múltiples statements
  if (normalized.includes(';')) {
    return { valid: false, reason: 'Múltiples sentencias no permitidas' }
  }
  return { valid: true, sql: normalized, tables }
}