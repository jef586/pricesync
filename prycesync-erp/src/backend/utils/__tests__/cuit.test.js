import { describe, it, expect } from 'vitest'
import { normalizeCuit, isValidCuit, normalizeIvaCondition, inferDocType } from '../../utils/cuit.js'

function computeCheckDigit(base10) {
  const weights = [5,4,3,2,7,6,5,4,3,2]
  const nums = base10.split('').map(n => parseInt(n,10))
  const sum = weights.reduce((acc, w, i) => acc + w * nums[i], 0)
  const mod = sum % 11
  let expected = 11 - mod
  if (expected === 11) expected = 0
  if (expected === 10) expected = 9
  return expected
}

describe('CUIT utils', () => {
  it('normalizeCuit removes non-digits and trims to 11', () => {
    expect(normalizeCuit('20-30405060-9')).toBe('20304050609')
    expect(normalizeCuit('  27 22334455 6 ')).toBe('27223344556')
  })

  it('isValidCuit validates correct check digit', () => {
    const base = '2030405060'
    const check = computeCheckDigit(base)
    const cuit = base + String(check)
    expect(isValidCuit(cuit)).toBe(true)
    expect(isValidCuit('00000000000')).toBe(false)
    expect(isValidCuit('20304050607')).toBe(false)
    expect(isValidCuit('2030405060')).toBe(false)
  })

  it('inferDocType returns CUIT or CUIL by prefix', () => {
    expect(inferDocType('20304050609')).toBe('CUIL')
    expect(inferDocType('30708267878')).toBe('CUIT')
  })

  it('normalizeIvaCondition maps variations to canonical', () => {
    expect(normalizeIvaCondition('Responsable Inscripto')).toBe('RI')
    expect(normalizeIvaCondition('monotributista')).toBe('MONOTRIBUTO')
    expect(normalizeIvaCondition('EXENTA')).toBe('EXENTO')
    expect(normalizeIvaCondition('Consumidor Final')).toBe('CF')
    expect(normalizeIvaCondition('desconocido')).toBe(null)
  })
})