import { describe, it, expect } from 'vitest'
import { isValidCUIT } from '../validateCuit.js'

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

describe('validateCuit.isValidCUIT', () => {
  it('rejects non-11-digit inputs', () => {
    expect(isValidCUIT('')).toBe(false)
    expect(isValidCUIT('123')).toBe(false)
    expect(isValidCUIT('20-30405060')).toBe(false)
  })

  it('validates proper checksum', () => {
    const base = '2030405060'
    const check = computeCheckDigit(base)
    const cuit = base + String(check)
    expect(isValidCUIT(cuit)).toBe(true)
    expect(isValidCUIT('20304050600')).toBe(false)
  })
})