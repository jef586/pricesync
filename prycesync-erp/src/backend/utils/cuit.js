// Utilidades para CUIT/CUIL (es-AR)
// - Normaliza máscaras (99-99999999-9) a 11 dígitos
// - Valida longitud y dígito verificador según algoritmo AFIP

/**
 * Limpia un CUIT/CUIL y devuelve solo 11 dígitos.
 * @param {string} input
 * @returns {string}
 */
export function normalizeCuit(input = '') {
  const digits = String(input).replace(/[^0-9]/g, '')
  return digits.slice(0, 11)
}

/**
 * Valida el dígito verificador de un CUIT/CUIL.
 * @param {string} raw
 * @returns {boolean}
 */
export function isValidCuit(raw = '') {
  const cuit = normalizeCuit(raw)
  if (!cuit || cuit.length !== 11) return false
  if (/^0+$/.test(cuit)) return false

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const nums = cuit.split('').map((d) => parseInt(d, 10))
  const checkDigit = nums[10]
  const sum = weights.reduce((acc, w, i) => acc + w * nums[i], 0)
  const mod = sum % 11
  let expected = 11 - mod
  if (expected === 11) expected = 0
  if (expected === 10) expected = 9
  return expected === checkDigit
}

/**
 * Determina tipo de documento por prefijo (20/23/24/27 persona; 30/33/34 empresa).
 * Nota: Para la consulta tratamos CUIL como CUIT de persona humana.
 * @param {string} raw
 * @returns {('CUIT'|'CUIL')}
 */
export function inferDocType(raw = '') {
  const cuit = normalizeCuit(raw)
  const prefix = cuit.slice(0, 2)
  return ['20', '23', '24', '27'].includes(prefix) ? 'CUIL' : 'CUIT'
}

/**
 * Normaliza condiciones de IVA a RI|MONOTRIBUTO|EXENTO|CF
 * @param {string} value
 * @returns {('RI'|'MONOTRIBUTO'|'EXENTO'|'CF'|null)}
 */
export function normalizeIvaCondition(value = '') {
  const v = String(value).toUpperCase()
  if (/RESPONSABLE\s*INSCRIPTO|RI/.test(v)) return 'RI'
  if (/MONOTRIBUTO|MONOTRIBUTISTA|MT/.test(v)) return 'MONOTRIBUTO'
  if (/EXENTO|EXENTA/.test(v)) return 'EXENTO'
  if (/CONSUMIDOR\s*FINAL|CF/.test(v)) return 'CF'
  return null
}