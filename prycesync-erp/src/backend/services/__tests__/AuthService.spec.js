import { describe, it, expect } from 'vitest'
import AuthService from '../AuthService.js'

describe('AuthService core methods', () => {
  it('hashPassword y verifyPassword funcionan correctamente', async () => {
    const plain = 'SuperSecret123!'
    const hash = await AuthService.hashPassword(plain)
    expect(hash).toBeTypeOf('string')
    expect(hash).not.toBe(plain)
    const ok = await AuthService.verifyPassword(plain, hash)
    expect(ok).toBe(true)
    const bad = await AuthService.verifyPassword('wrong', hash)
    expect(bad).toBe(false)
  })

  it('generateTokens y verifyToken devuelve payload esperado', () => {
    const { accessToken, refreshToken } = AuthService.generateTokens('user-123')
    expect(accessToken).toBeTypeOf('string')
    expect(refreshToken).toBeTypeOf('string')

    const accessPayload = AuthService.verifyToken(accessToken)
    expect(accessPayload.userId).toBe('user-123')
    expect(accessPayload.type).toBe('access')

    const refreshPayload = AuthService.verifyToken(refreshToken)
    expect(refreshPayload.userId).toBe('user-123')
    expect(refreshPayload.type).toBe('refresh')
  })
})