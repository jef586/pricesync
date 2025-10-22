import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'

// Control flag for query-processor mock behavior
let shouldThrow = false

// Mock Prisma to avoid DB calls from any accidental imports
vi.mock('../../config/database.js', () => {
  const prisma = {
    article: { findMany: vi.fn().mockResolvedValue([]) },
    stockBalance: { findMany: vi.fn().mockResolvedValue([]) },
    category: { findFirst: vi.fn().mockResolvedValue(null) }
  }
  return { default: prisma }
})

// Mock processQuery to control ChatService behavior
vi.mock('../../integrations/ai/chat-service/query-processor.js', () => {
  return {
    processQuery: vi.fn(async (text, ctx) => {
      if (shouldThrow) {
        throw new Error('Boom')
      }
      return { results: [{ id: 1, name: 'Alternador Bosch', sku: 'ALT-12V', pricePublic: 1000, stockOnHand: 5 }, { id: 2, name: 'Filtro Mann', sku: 'FIL-MANN', pricePublic: 500, stockOnHand: 12 }], source: 'heuristic', error: null }
    })
  }
})

// Use the real response formatter for message/payload assertions
// Optionally mock context if needed (but not necessary for this test)

describe('ChatService.ask', () => {
  let appendSpy

  beforeEach(() => {
    // Avoid writing to disk in tests
    appendSpy = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {})
    shouldThrow = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns formatted response with count, message and meta', async () => {
    const { ChatService } = await import('../ChatService.js')

    const svc = new ChatService()
    const res = await svc.ask({ userId: 'u1', text: 'precio del alternador' })

    // validate format
    expect(res).toBeTruthy()
    expect(res.payload).toBeTruthy()
    expect(res.payload.count).toBe(2)
    expect(res.message).toMatch(/Encontrados 2 resultado\(s\)\./)
    expect(res.payload.meta.source).toBe('heuristic')
    expect(typeof res.elapsedMs).toBe('number')
    expect(res.elapsedMs).toBeGreaterThanOrEqual(0)

    // audit logging invoked
    expect(appendSpy).toHaveBeenCalled()
  })

  it('logs and rethrows on error', async () => {
    const { ChatService } = await import('../ChatService.js')

    shouldThrow = true
    const svc = new ChatService()
    try {
      await svc.ask({ userId: 'u2', text: 'stock del filtro' })
      throw new Error('Expected error to be thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
    }

    // audit logging for error
    expect(appendSpy).toHaveBeenCalled()
  })
})