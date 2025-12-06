import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import express from 'express'
import fetch from 'node-fetch'

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => { req.user = { id: 'user-1', company: { id: 'company-1' } }; next() },
  authorize: () => (req, res, next) => next(),
  optionalAuth: () => (req, res, next) => next(),
  sameCompany: () => (req, res, next) => next()
}))
vi.mock('../middleware/scopes.js', () => ({ requireScopes: () => (req, res, next) => next() }))
vi.mock('../middleware/rateLimit.js', () => ({ rateLimit: () => (req, res, next) => next() }))

const db = { articles: [], barcodes: [], suppliers: [] }

vi.mock('../config/database.js', () => {
  const prisma = {
    article: {
      async findFirst({ where, select }) {
        const rec = db.articles.find(a => a.companyId === where.companyId && a.deletedAt == null && (
          (where.id && a.id === where.id) ||
          (where.barcode && a.barcode === where.barcode) ||
          (where.sku && a.sku === where.sku)
        ))
        if (!rec) return null
        const out = { ...rec }
        return select ? Object.keys(select).reduce((acc, k) => (select[k] ? (acc[k] = out[k], acc) : acc), {}) : out
      }
    },
    articleBarcode: {
      async findFirst({ where, include }) {
        const row = db.barcodes.find(b => b.code === where.code && db.articles.find(a => a.id === b.articleId && a.companyId === where.article.companyId && a.deletedAt == null))
        if (!row) return null
        if (include?.article) {
          const a = db.articles.find(x => x.id === row.articleId)
          const sel = include.article.select
          const out = sel ? Object.keys(sel).reduce((acc, k) => (sel[k] ? (acc[k] = a[k], acc) : acc), {}) : a
          return { article: out }
        }
        return row
      }
    },
    articleSupplier: {
      async findFirst({ where, include }) {
        const row = db.suppliers.find(s => s.supplierSku === where.supplierSku && db.articles.find(a => a.id === s.articleId && a.companyId === where.article.companyId && a.deletedAt == null))
        if (!row) return null
        if (include?.article) {
          const a = db.articles.find(x => x.id === row.articleId)
          const sel = include.article.select
          const out = sel ? Object.keys(sel).reduce((acc, k) => (sel[k] ? (acc[k] = a[k], acc) : acc), {}) : a
          return { article: out }
        }
        return row
      }
    }
  }
  async function connectDatabase() {}
  return { default: prisma, connectDatabase }
})

import articlesRoutes from '../routes/articles.js'

let server, baseURL

beforeAll(async () => {
  db.articles.push({ id: 'A1', companyId: 'company-1', deletedAt: null, name: 'Art Main', sku: 'SKU-1', barcode: '5880765R710191', pricePublic: 100, taxRate: 21, stock: 5 })
  db.barcodes.push({ id: 'B1', articleId: 'A1', code: 'ALIAS-1' })
  db.suppliers.push({ id: 'S1', articleId: 'A1', supplierId: 'SUP-1', supplierSku: 'PROV-1' })

  const app = express()
  app.use(express.json())
  app.use('/api/articles', articlesRoutes)
  server = app.listen(0)
  await new Promise(res => server.once('listening', res))
  const port = server.address().port
  baseURL = `http://127.0.0.1:${port}`
})

afterAll(async () => { if (server) await new Promise(res => server.close(res)) })

describe('Lookup de artículos', () => {
  it('422 cuando falta barcode', async () => {
    const res = await fetch(`${baseURL}/api/articles/lookup`)
    expect(res.status).toBe(422)
  })

  it('normaliza espacios y coincide por barcode principal', async () => {
    const res = await fetch(`${baseURL}/api/articles/lookup?barcode=${encodeURIComponent(' 5880765R710191 ')}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('A1')
  })

  it('coincide por alias secundario', async () => {
    const res = await fetch(`${baseURL}/api/articles/lookup?barcode=ALIAS-1`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('A1')
  })

  it('coincide por supplierSku', async () => {
    const res = await fetch(`${baseURL}/api/articles/lookup?barcode=PROV-1`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('A1')
  })

  it('coincide por sku', async () => {
    const res = await fetch(`${baseURL}/api/articles/lookup?barcode=SKU-1`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('A1')
  })

  it('404 cuando no existe', async () => {
    const res = await fetch(`${baseURL}/api/articles/lookup?barcode=NO-EXISTE`)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('ARTICLE_NOT_FOUND')
  })
})

