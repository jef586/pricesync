import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useArticleStore } from '@/stores/articles'
import type { ArticleDTO, Paginated } from '@/types/article'

// Mock del servicio HTTP
vi.mock('@/services/articles', () => {
  const sample: ArticleDTO[] = [
    {
      id: 'a1',
      name: 'Artículo 1',
      type: 'PRODUCT',
      active: true,
      sku: 'SKU-1',
      barcode: '779000000001',
      barcodeType: 'EAN13',
      rubroId: 'r1',
      subrubroId: null,
      taxRate: 21,
      cost: 100,
      gainPct: 50,
      pricePublic: 181.5, // 100 + internalTax(0) => neto 150 => +IVA 181.5
      stock: 10,
      stockMin: 3,
      stockMax: 50,
      controlStock: true,
      description: null,
      internalTaxType: null,
      internalTaxValue: null,
      subjectIIBB: false,
      subjectGanancias: false,
      subjectPercIVA: false,
      pointsPerUnit: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    },
    {
      id: 'a2',
      name: 'Artículo 2',
      type: 'SERVICE',
      active: false,
      sku: 'SKU-2',
      barcode: null,
      barcodeType: null,
      rubroId: 'r1',
      subrubroId: null,
      taxRate: 0,
      cost: 50,
      gainPct: 20,
      pricePublic: 60,
      stock: 0,
      stockMin: 0,
      stockMax: 0,
      controlStock: false,
      description: 'Servicio demo',
      internalTaxType: null,
      internalTaxValue: null,
      subjectIIBB: false,
      subjectGanancias: false,
      subjectPercIVA: false,
      pointsPerUnit: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    }
  ]

  return {
    listArticles: vi.fn(async () => ({
      items: sample,
      page: 1,
      pageSize: 10,
      total: sample.length,
      totalPages: 1
    } satisfies Paginated<ArticleDTO>)),
    getArticle: vi.fn(async (id: string) => sample.find((a) => a.id === id) as ArticleDTO),
    createArticle: vi.fn(async (payload: Partial<ArticleDTO>) => ({
      ...(payload as ArticleDTO),
      id: 'a3',
      name: payload.name ?? 'Nuevo',
      type: (payload.type as any) ?? 'PRODUCT',
      active: payload.active ?? true,
      barcodeType: payload.barcodeType ?? null,
      rubroId: payload.rubroId ?? 'r1',
      taxRate: payload.taxRate ?? 21,
      cost: payload.cost ?? 0,
      gainPct: payload.gainPct ?? 0,
      pricePublic: payload.pricePublic ?? 0,
      stock: payload.stock ?? 0,
      stockMin: payload.stockMin ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ArticleDTO)),
    updateArticle: vi.fn(async (id: string, payload: Partial<ArticleDTO>) => ({
      id,
      name: payload.name ?? 'Artículo actualizado',
      type: 'PRODUCT',
      active: true,
      sku: 'SKU-1',
      barcode: '779000000001',
      barcodeType: 'EAN13',
      rubroId: 'r1',
      subrubroId: null,
      taxRate: 21,
      cost: 100,
      gainPct: payload.gainPct ?? 50,
      pricePublic: 181.5,
      stock: payload.stock ?? 20,
      stockMin: 3,
      stockMax: 50,
      controlStock: true,
      description: null,
      internalTaxType: null,
      internalTaxValue: null,
      subjectIIBB: false,
      subjectGanancias: false,
      subjectPercIVA: false,
      pointsPerUnit: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    } as ArticleDTO)),
    removeArticle: vi.fn(async () => undefined)
  }
})

describe('useArticleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('lista artículos con filtros y paginación', async () => {
    const store = useArticleStore()
    expect(store.items.length).toBe(0)

    await store.list({ q: 'art', page: 1, pageSize: 10 })

    expect(store.items.length).toBeGreaterThan(0)
    expect(store.page).toBe(1)
    expect(store.pageSize).toBe(10)
    expect(store.total).toBe(store.items.length)
    expect(store.error).toBeNull()
  })

  it('get devuelve un artículo por id', async () => {
    const store = useArticleStore()
    await store.list()
    const art = await store.get('a1')
    expect(art?.id).toBe('a1')
  })

  it('create agrega el artículo a la lista y aumenta total', async () => {
    const store = useArticleStore()
    await store.list()
    const before = store.total
    const created = await store.create({ name: 'Nuevo Artículo', type: 'PRODUCT', active: true, rubroId: 'r1', barcodeType: null, taxRate: 21, cost: 10, gainPct: 20, pricePublic: 14, stock: 5, stockMin: 1 })
    expect(created.id).toBe('a3')
    expect(store.items[0]?.id).toBe('a3')
    expect(store.total).toBe(before + 1)
  })

  it('update reemplaza el artículo en la lista', async () => {
    const store = useArticleStore()
    await store.list()
    const updated = await store.update('a1', { stock: 20, gainPct: 55 })
    expect(updated.stock).toBe(20)
    const found = store.byId('a1')
    expect(found?.stock).toBe(20)
    expect(store.error).toBeNull()
  })

  it('remove elimina el artículo y decrementa total', async () => {
    const store = useArticleStore()
    await store.list()
    const before = store.total
    await store.remove('a2')
    expect(store.byId('a2')).toBeUndefined()
    expect(store.total).toBe(before - 1)
  })

  it('getters activeItems y lowStock funcionan', async () => {
    const store = useArticleStore()
    await store.list()
    expect(store.activeItems.every((a) => a.active)).toBe(true)
    expect(store.lowStock.some((a) => a.stock <= (a.stockMin ?? 0))).toBe(true)
  })

  it('setFilters resetea página y mergea filtros', () => {
    const store = useArticleStore()
    store.page = 3
    store.setFilters({ q: 'x', active: true })
    expect(store.page).toBe(1)
    expect(store.filters.q).toBe('x')
    expect(store.filters.active).toBe(true)
  })

  it('setPage actualiza la página', () => {
    const store = useArticleStore()
    store.setPage(5)
    expect(store.page).toBe(5)
  })

  it('reset limpia el estado', async () => {
    const store = useArticleStore()
    await store.list()
    store.reset()
    expect(store.items.length).toBe(0)
    expect(store.page).toBe(1)
    expect(store.pageSize).toBe(10)
    expect(store.total).toBe(0)
    expect(store.error).toBeNull()
  })
})