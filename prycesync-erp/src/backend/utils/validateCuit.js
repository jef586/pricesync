export function isValidCUIT(input) {
  const cuit = String(input || '').replace(/[^0-9]/g, '')
  if (cuit.length !== 11) return false
  const digits = cuit.split('').map(d => Number(d))
  if (digits.some(n => Number.isNaN(n))) return false
  const weights = [5,4,3,2,7,6,5,4,3,2]
  const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0)
  let dv = 11 - (sum % 11)
  if (dv === 11) dv = 0
  else if (dv === 10) dv = 9
  return dv === digits[10]
}

export default { isValidCUIT }