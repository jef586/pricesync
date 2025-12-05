import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import fetch from 'node-fetch'

// Mock auth/scopes/rateLimit to pass through and inject a test user
vi.mock('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'user-1', role: 'admin', scopes: ['article:read', 'article:write'], company: { id: 'company-1' } }
    next()
  },
  authorize: () => (req, res, next) => next(),
  optionalAuth: () => (req, res, next) => next(),
  sameCompany: () => (req, res, next) => next()
}))
vi.mock('../middleware/scopes.js', () => ({
  requireScopes: () => (req, res, next) => next()
}))
vi.mock('../middleware/rateLimit.js', () => ({
  rateLimit: () => (req, res, next) => next()
}))

// Simple in-memory Prisma mock
const db = {
  articles: [],
  categories: [],
  invoiceItems: []
}
let nextId = 1

  vi.mock('../config/database.js', () => {
    const prisma = {
      article: {
      async create({ data, include }) {
        const conflict = db.articles.find(a => a.companyId === data.companyId && (a.sku === data.sku || (data.barcode && a.barcode === data.barcode)))
        if (conflict) throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
        const id = data.id || `art-${nextId++}`
        const record = { id, deletedAt: null, ...data }
        db.articles.push(record)
        return include?.category ? { ...record, category: record.categoryId ? { id: record.categoryId, name: 'Cat' } : null } : record
      },
      async findFirst({ where, include }) {
        const rec = db.articles.find(a => (!where.id || a.id === where.id) && a.companyId === where.companyId && a.deletedAt === null)
        if (!rec) return null
        if (include?.category) {
          return { ...rec, category: rec.categoryId ? { id: rec.categoryId, name: 'Cat' } : null }
        }
        return rec
      },
      async findMany({ where, select, skip = 0, take = 9999, orderBy }) {
        const list = db.articles.filter(a => a.companyId === where.companyId && a.deletedAt === null)
        const sliced = list.slice(skip, skip + take)
        return sliced.map(a => ({ ...a }))
      },
      async count({ where }) {
        return db.articles.filter(a => a.companyId === where.companyId && a.deletedAt === null).length
      },
      async update({ where, data, include }) {
        const idx = db.articles.findIndex(a => a.id === where.id)
        if (idx === -1) throw Object.assign(new Error('Not found'), { code: 'P2025' })
        const target = db.articles[idx]
        const newSku = data.sku ?? target.sku
        const newBarcode = data.barcode ?? target.barcode
        const conflict = db.articles.find(a => a.id !== target.id && a.companyId === (target.companyId || data.companyId) && (a.sku === newSku || (newBarcode && a.barcode === newBarcode)))
        if (conflict) throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
        const merged = { ...target, ...data }
        db.articles[idx] = merged
        return include?.category ? { ...merged, category: merged.categoryId ? { id: merged.categoryId, name: 'Cat' } : null } : merged
      }
      },
    category: {
      async findFirst({ where }) {
        return db.categories.find(c => c.id === where.id && c.companyId === where.companyId && c.deletedAt == null) || null
      }
    },
    invoiceItem: {
      async findFirst({ where }) {
        return db.invoiceItems.find(ii => ii.articleId === where.articleId) || null
      }
    }
  }
  async function connectDatabase() { /* no-op for tests */ }
  return { default: prisma, connectDatabase }
})

import articlesRoutes from '../routes/articles.js'

let server, baseURL
beforeAll(async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/articles', articlesRoutes)
  server = app.listen(0)
  await new Promise(res => server.once('listening', res))
  const port = server.address().port
  baseURL = `http://127.0.0.1:${port}`
})

afterAll(async () => {
  if (server) {
    await new Promise(res => server.close(res))
  }
})

describe('CRUD de Artículos', () => {
  it('crea un artículo', async () => {
    const res = await fetch(`${baseURL}/api/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Articulo 1', cost: 100, taxRate: 21 })
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBeDefined()
    expect(body.name).toBe('Articulo 1')
    expect(body.pricePublic).toBe(121)
  })

  it('obtiene listado con paginación', async () => {
    const res = await fetch(`${baseURL}/api/articles?page=1&limit=10`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(1)
    expect(body.pagination.page).toBe(1)
  })

  it('obtiene por id', async () => {
    const listRes = await fetch(`${baseURL}/api/articles`)
    const listBody = await listRes.json()
    const id = listBody.data[0].id

    const res = await fetch(`${baseURL}/api/articles/${id}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(id)
    expect(body.name).toBe('Articulo 1')
  })

  it('actualiza artículo (inverso con pricePublic)', async () => {
    const listRes = await fetch(`${baseURL}/api/articles`)
    const listBody = await listRes.json()
    const id = listBody.data[0].id

    const res = await fetch(`${baseURL}/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricePublic: 242, taxRate: 21 })
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pricePublic).toBe(242)
    expect(body.gainPct).toBe(100)
  })

  it('conflicto por sku duplicado (409)', async () => {
    await fetch(`${baseURL}/api/articles`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Articulo 2', cost: 100, taxRate: 21, sku: 'DUP-1' })
    })
    const listRes = await fetch(`${baseURL}/api/articles`)
    const listBody = await listRes.json()
    const id = listBody.data[0].id
    const res = await fetch(`${baseURL}/api/articles/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'DUP-1' })
    })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('ARTICLE_UNIQUE_CONFLICT')
  })

  it('stockMax < stockMin retorna 400', async () => {
    const listRes = await fetch(`${baseURL}/api/articles`)
    const listBody = await listRes.json()
    const id = listBody.data[0].id
    const res = await fetch(`${baseURL}/api/articles/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockMin: 10, stockMax: 5 })
    })
    expect(res.status).toBe(400)
  })

  it('actualiza stock', async () => {
    const listRes = await fetch(`${baseURL}/api/articles`)
    const listBody = await listRes.json()
    const id = listBody.data[0].id

    const res = await fetch(`${baseURL}/api/articles/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'set', stock: 10 })
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.stock).toBe(10)
  })

  it('elimina el artículo (soft delete)', async () => {
    const listRes = await fetch(`${baseURL}/api/articles`)
    const listBody = await listRes.json()
    const id = listBody.data[0].id

    const res = await fetch(`${baseURL}/api/articles/${id}`, { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    const getRes = await fetch(`${baseURL}/api/articles/${id}`)
    expect(getRes.status).toBe(404)
  })
})
