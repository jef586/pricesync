import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Redis helpers
vi.mock('../../config/redis.js', () => {
  const store = new Map()
  return {
    getCache: vi.fn(async (key) => {
      return store.has(key) ? store.get(key) : null
    }),
    setCache: vi.fn(async (key, value, ttl) => {
      store.set(key, value)
      return true
    })
  }
})

// Ensure provider is mock
beforeEach(() => {
  process.env.PADRON_PROVIDER = 'mock'
  process.env.ENRICH_CACHE_TTL_SECONDS = '3600'
})

// Import service (after mocks)
import CustomerEnrichmentService from '../CustomerEnrichmentService.js'

describe('CustomerEnrichmentService', () => {
  it('returns 400 for invalid CUIT', async () => {
    await expect(CustomerEnrichmentService.enrichByCuit('123', { id: 'u1' }))
      .rejects.toMatchObject({ code: 400 })
  })

  it('fetches from mock adapter and normalizes data', async () => {
    const res = await CustomerEnrichmentService.enrichByCuit('20-30405060-9', { id: 'u1' })
    expect(res).toBeTruthy()
    expect(res.docType).toBe('CUIL')
    expect(res.docNumber).toBe('20304050609')
    expect(res.name).toMatch(/RAZÓN SOCIAL|APELLIDO/i)
    expect(['RI','MONOTRIBUTO','EXENTO','CF']).toContain(res.ivaCondition)
    expect(res.address.street.length).toBeGreaterThanOrEqual(1)
    expect(res.source).toBe('MOCK')
  })

  it('returns null for not found (204 scenario)', async () => {
    const res = await CustomerEnrichmentService.enrichByCuit('30-70826787-8', { id: 'u1' })
    expect(res).toBeNull()
  })

  it('serves from cache on repeat', async () => {
    const cuit = '27223344556'
    const first = await CustomerEnrichmentService.enrichByCuit(cuit, { id: 'u2' })
    // first may be null for mock if not present; set a fake cache and ensure hit
    if (!first) {
      const { setCache } = await import('../../config/redis.js')
      await setCache(`padron:${cuit}`, {
        id: null, docType: 'CUIT', docNumber: cuit, name: 'Cache Hit',
        ivaCondition: 'CF', address: { street: '', city: '', state: '', zip: '' }, source: 'MOCK', fetchedAt: new Date().toISOString()
      }, 3600)
    }
    const res = await CustomerEnrichmentService.enrichByCuit(cuit, { id: 'u2' })
    expect(res).toBeTruthy()
    expect(res.docNumber).toBe(cuit)
  })
})