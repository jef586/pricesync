import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as SalesValidation from '../middleware/salesValidation.js'
import SalesController from '../controllers/SalesController.js'

vi.mock('../config/database.js', () => {
  return {
    default: {
      salesOrder: {
        findMany: vi.fn(async () => [
          { id: 's1', number: 'SO-00000001', status: 'completed', subtotal: 1000, total: 1210, totalRounded: 1210, createdAt: new Date().toISOString(), customer: { id: 'c1', name: 'Juan' } }
        ]),
        count: vi.fn(async () => 1)
      }
    }
  }
})

function makeRes() {
  const res = { statusCode: 200, body: null }
  return {
    status: (code) => { res.statusCode = code; return { json: (b) => { res.body = b } } },
    json: (b) => { res.body = b },
    _res: () => res
  }
}

describe('GET /api/sales/list handler', () => {
  let req
  let res
  beforeEach(() => {
    req = { query: { page: '1', limit: '10', sortBy: 'createdAt', sortOrder: 'desc' }, user: { company: { id: 'comp1' } } }
    res = makeRes()
  })

  it('validates query and returns items with pagination meta', async () => {
    const next = vi.fn()
    await SalesValidation.validateListSales(req, res, next)
    expect(next).toHaveBeenCalled()

    await SalesController.list(req, res)
    const r = res._res()
    expect(r.statusCode).toBe(200)
    expect(r.body).toHaveProperty('items')
    expect(r.body).toHaveProperty('page', 1)
    expect(r.body).toHaveProperty('limit', 10)
    expect(r.body).toHaveProperty('total', 1)
    expect(Array.isArray(r.body.items)).toBe(true)
  })

  it('returns 400 on invalid params', async () => {
    const badReq = { query: { page: '0' }, user: { company: { id: 'comp1' } } }
    const badRes = makeRes()
    const next = vi.fn()
    await SalesValidation.validateListSales(badReq, badRes, next)
    const r = badRes._res()
    expect(r.statusCode).toBe(400)
  })
})
