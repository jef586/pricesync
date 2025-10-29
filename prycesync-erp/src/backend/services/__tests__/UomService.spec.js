import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma to control DB-dependent behavior
vi.mock('../../config/database.js', () => {
  const prisma = {
    articleUom: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  }
  return { default: prisma }
})

let prismaMock
let UomService

beforeEach(async () => {
  const dbModule = await import('../../config/database.js')
  prismaMock = dbModule.default
  Object.values(prismaMock.articleUom).forEach(fn => fn.mockReset())
  ;({ default: UomService } = await import('../UomService.js'))
})

describe('UomService.parseUom', () => {
  it('accepts valid UoMs', () => {
    expect(UomService.parseUom('UN')).toBe('UN')
    expect(UomService.parseUom('kg')).toBe('KG')
    expect(UomService.parseUom('Lt')).toBe('LT')
  })

  it('throws on invalid UoM', () => {
    expect(() => UomService.parseUom('XX')).toThrow(/UoM inválida/i)
  })
})

describe('UomService.normalizeQtyInput', () => {
  it('rounds decimals for KG/LT to 3 places', () => {
    const kg = UomService.normalizeQtyInput('KG', 1.2346)
    expect(kg.toNumber()).toBe(1.235)
    const lt = UomService.normalizeQtyInput('LT', 2.9999)
    expect(lt.toNumber()).toBe(3.000)
  })

  it('requires integer quantities for UN/BU', () => {
    const un = UomService.normalizeQtyInput('UN', 5)
    expect(un.toNumber()).toBe(5)
    expect(() => UomService.normalizeQtyInput('UN', 1.2)).toThrow(/entera/i)
    expect(() => UomService.normalizeQtyInput('BU', 0.5)).toThrow(/entera/i)
  })

  it('throws if qty <= 0', () => {
    expect(() => UomService.normalizeQtyInput('UN', 0)).toThrow(/mayor a 0/i)
    expect(() => UomService.normalizeQtyInput('KG', -1)).toThrow(/mayor a 0/i)
  })
})

describe('UomService.getFactor / convertToUN', () => {
  it('returns factor 1 for UN and missing configs', async () => {
    prismaMock.articleUom.findFirst.mockResolvedValue(null)
    const fUn = await UomService.getFactor('A1', 'UN')
    expect(fUn.toNumber()).toBe(1)
    const fMissing = await UomService.getFactor('A1', 'KG')
    expect(fMissing.toNumber()).toBe(1)
  })

  it('converts to base UN using factor and rounding to 3 decimals', async () => {
    prismaMock.articleUom.findFirst.mockResolvedValue({ factor: 2 })
    const qtyUn = await UomService.convertToUN('A1', 'KG', 2.345)
    expect(qtyUn.toNumber()).toBe(4.690)
  })
})

describe('UomService.priceFor', () => {
  it('uses priceOverride if present', async () => {
    prismaMock.articleUom.findFirst.mockResolvedValue({ factor: 3, priceOverride: 100 })
    const res = await UomService.priceFor('A1', 'BU', 50, 21)
    expect(res.net.toNumber()).toBe(100.00)
    expect(res.gross.toNumber()).toBe(121.00)
  })

  it('calculates net = basePrice * factor and gross with tax', async () => {
    prismaMock.articleUom.findFirst.mockResolvedValue({ factor: 2, priceOverride: null })
    const res = await UomService.priceFor('A1', 'KG', 50, 10)
    expect(res.net.toNumber()).toBe(100.00)
    expect(res.gross.toNumber()).toBe(110.00)
  })
})

describe('UomService.ensureUnBase', () => {
  it('creates UN base when missing', async () => {
    prismaMock.articleUom.findFirst.mockResolvedValue(null)
    prismaMock.articleUom.create.mockResolvedValue({ id: 'u1', articleId: 'A1', uom: 'UN', factor: 1 })
    const ok = await UomService.ensureUnBase('A1')
    expect(ok).toBe(true)
    expect(prismaMock.articleUom.create).toHaveBeenCalled()
  })

  it('does nothing if UN base exists', async () => {
    prismaMock.articleUom.findFirst.mockResolvedValue({ id: 'u1', articleId: 'A1', uom: 'UN', factor: 1 })
    const ok = await UomService.ensureUnBase('A1')
    expect(ok).toBe(true)
    expect(prismaMock.articleUom.create).not.toHaveBeenCalled()
  })
})