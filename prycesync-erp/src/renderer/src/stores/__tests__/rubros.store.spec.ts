import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRubrosStore } from '../rubros'

vi.mock('@/services/rubros', () => {
  return {
    listRubros: vi.fn(async (params: any) => ({ items: [{ id: 'r1', name: 'Rubro 1', level: 0, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { children: 2, articles: 0 } }], total: 1, page: params.page || 1, size: params.size || 10, pages: 1 })),
    getRubroChildren: vi.fn(async (parentId: string | null, params: any) => ({ items: parentId ? [{ id: 'c1', name: 'Hijo 1', level: 1, isActive: true, parentId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { children: 0, articles: 0 } }] : [], total: parentId ? 1 : 0, page: params.page || 1, size: params.size || 10, pages: 3 })),
    createRubro: vi.fn(async (payload: any) => ({ id: 'new', name: payload.name || 'Nuevo', level: payload.parentId ? 1 : 0, isActive: true, parentId: payload.parentId || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { children: 0, articles: 0 } })),
    updateRubro: vi.fn(async (id: string, payload: any) => ({ id, name: payload.name || 'Updated', level: 0, isActive: true, parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { children: 0, articles: 0 } })),
    deleteRubro: vi.fn(async () => {}),
    restoreRubro: vi.fn(async (id: string) => ({ id, name: 'Restored', level: 0, isActive: true, parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null, _count: { children: 0, articles: 0 } })),
    moveRubro: vi.fn(async (id: string) => ({ id, name: 'Moved', level: 0, isActive: true, parentId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), _count: { children: 0, articles: 0 } }))
  }
})

describe('useRubrosStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('carga árbol raíz', async () => {
    const store = useRubrosStore()
    await store.fetchTree()
    expect(store.tree.length).toBe(1)
    expect(store.tree[0].loaded).toBe(false)
  })

  it('expande nodo y carga hijos', async () => {
    const store = useRubrosStore()
    await store.fetchTree()
    const root = store.tree[0]
    await store.expandNode(root.id)
    expect(root.loaded).toBe(true)
    expect(root.children?.length).toBe(1)
  })

  it('selección de nodo carga tabla de hijos', async () => {
    const store = useRubrosStore()
    await store.fetchTree()
    await store.selectNode(store.tree[0])
    expect(store.selectedNode?.id).toBe(store.tree[0].id)
    expect(store.items.length).toBe(1)
  })

  it('filtros por texto afectan filteredItems', async () => {
    const store = useRubrosStore()
    await store.fetchTree()
    await store.selectNode(store.tree[0])
    store.setFilters({ q: 'zzz' })
    expect(store.filteredItems.length).toBe(0)
    store.setFilters({ q: '' })
    expect(store.filteredItems.length).toBe(1)
  })

  it('paginación server-side actualiza estado', async () => {
    const store = useRubrosStore()
    await store.fetchChildren(null)
    await store.setPage(2)
    expect(store.pagination.page).toBe(2)
  })
})
