import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../config/database.js', () => {
  const prisma = {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    userSession: { create: vi.fn(), deleteMany: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    company: { findUnique: vi.fn() }
  }
  return { default: prisma }
})

let prismaMock
let AuthService

beforeEach(async () => {
  const dbModule = await import('../../config/database.js')
  prismaMock = dbModule.default
  Object.values(prismaMock.user).forEach(fn => fn.mockReset())
  Object.values(prismaMock.userSession).forEach(fn => fn.mockReset())
  Object.values(prismaMock.company).forEach(fn => fn.mockReset())
  ;({ default: AuthService } = await import('../AuthService.js'))
})

describe('AuthService DB-dependent methods', () => {
  it('register: falla si usuario existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'e@x.com' })
    await expect(AuthService.register({ email: 'e@x.com', password: 'p', name: 'n', companyId: 'c1' }))
      .rejects.toThrow('El usuario ya existe')
  })

  it('register: falla si empresa no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.company.findUnique.mockResolvedValue(null)
    await expect(AuthService.register({ email: 'e@x.com', password: 'p', name: 'n', companyId: 'c1' }))
      .rejects.toThrow('Empresa no encontrada')
  })

  it('register: crea usuario y sesión', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.company.findUnique.mockResolvedValue({ id: 'c1', name: 'Comp' })
    prismaMock.user.create.mockResolvedValue({ id: 'u1', email: 'e@x.com', name: 'n', role: 'user', status: 'active', company: { id: 'c1', name: 'Comp' }, createdAt: new Date() })
    prismaMock.userSession.create.mockResolvedValue({ id: 's1' })

    const res = await AuthService.register({ email: 'e@x.com', password: 'p', name: 'n', companyId: 'c1' })
    expect(res.user.id).toBe('u1')
    expect(res.tokens.accessToken).toBeTypeOf('string')
    expect(prismaMock.userSession.create).toHaveBeenCalledOnce()
  })

  it('login: falla si usuario no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    await expect(AuthService.login({ email: 'none@x.com', password: 'p' }))
      .rejects.toThrow('Credenciales inválidas')
  })

  it('login: falla si usuario inactivo', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'e@x.com', status: 'disabled', company: { id: 'c1', name: 'Comp' }, passwordHash: 'hash' })
    await expect(AuthService.login({ email: 'e@x.com', password: 'p' }))
      .rejects.toThrow('Usuario inactivo')
  })

  it('login: falla si password inválido', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'e@x.com', status: 'active', company: { id: 'c1', name: 'Comp' }, passwordHash: 'hash' })
    const spy = vi.spyOn(AuthService, 'verifyPassword').mockResolvedValue(false)
    await expect(AuthService.login({ email: 'e@x.com', password: 'wrong' }))
      .rejects.toThrow('Credenciales inválidas')
    spy.mockRestore()
  })

  it('login: éxito crea sesión y actualiza último login', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'e@x.com', status: 'active', company: { id: 'c1', name: 'Comp' }, passwordHash: await AuthService.hashPassword('p') })
    prismaMock.userSession.create.mockResolvedValue({ id: 's1' })
    prismaMock.user.update.mockResolvedValue({ id: 'u1' })
    const res = await AuthService.login({ email: 'e@x.com', password: 'p', ipAddress: '1.2.3.4', userAgent: 'UA' })
    expect(res.user.email).toBe('e@x.com')
    expect(prismaMock.userSession.create).toHaveBeenCalledOnce()
    expect(prismaMock.user.update).toHaveBeenCalledOnce()
  })

  it('logout: elimina sesiones por tokenHash', async () => {
    prismaMock.userSession.deleteMany.mockResolvedValue({ count: 1 })
    const res = await AuthService.logout('refresh-token')
    expect(res.message).toBe('Logout exitoso')
    expect(prismaMock.userSession.deleteMany).toHaveBeenCalledOnce()
  })

  it('refreshToken: falla si sesión inválida o expirada', async () => {
    prismaMock.userSession.findFirst.mockResolvedValue(null)
    await expect(AuthService.refreshToken('bad-token')).rejects.toThrow(/Sesión inválida o expirada/)
  })

  it('refreshToken: éxito genera nuevos tokens y actualiza sesión', async () => {
    prismaMock.userSession.findFirst.mockResolvedValue({ id: 'sess1', userId: 'u1', user: { id: 'u1' } })
    prismaMock.userSession.update.mockResolvedValue({ id: 'sess1' })
    const tokens = await AuthService.refreshToken('refresh-token')
    expect(tokens.accessToken).toBeTypeOf('string')
    expect(tokens.refreshToken).toBeTypeOf('string')
    expect(prismaMock.userSession.update).toHaveBeenCalledOnce()
  })

  it('getUserById: retorna usuario o error si no existe', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'e@x.com', name: 'n', role: 'user', status: 'active', company: { id: 'c1', name: 'Comp' }, createdAt: new Date(), lastLogin: new Date() })
    const user = await AuthService.getUserById('u1')
    expect(user.id).toBe('u1')

    prismaMock.user.findUnique.mockResolvedValue(null)
    await expect(AuthService.getUserById('nope')).rejects.toThrow(/Usuario no encontrado/)
  })
})