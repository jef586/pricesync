import { setActivePinia, createPinia } from 'pinia'
import { useSuppliersStore } from '@/stores/suppliers'
import { listSuppliers, getSupplier, createSupplier, updateSupplier, removeSupplier } from '@/services/suppliers'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock del servicio
vi.mock('@/services/suppliers', () => ({
  listSuppliers: vi.fn(),
  getSupplier: vi.fn(),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  removeSupplier: vi.fn()
}))

describe('useSuppliersStore', () => {
  let store: ReturnType<typeof useSuppliersStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSuppliersStore()
    // Limpiar mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('estado inicial', () => {
    it('debe tener el estado inicial correcto', () => {
      expect(store.items).toEqual([])
      expect(store.total).toBe(0)
      expect(store.page).toBe(1)
      expect(store.limit).toBe(8)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.filters).toEqual({
        q: '',
        status: undefined,
        sort: 'name',
        order: 'asc'
      })
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      store.items = [
        { id: '1', name: 'Proveedor 1', status: 'active' },
        { id: '2', name: 'Proveedor 2', status: 'inactive' },
        { id: '3', name: 'Proveedor 3', status: 'active' }
      ]
    })

    it('byId debe encontrar proveedor por id', () => {
      const supplier = store.byId('2')
      expect(supplier).toEqual(store.items[1])
    })

    it('byId debe retornar undefined si no encuentra', () => {
      const supplier = store.byId('999')
      expect(supplier).toBeUndefined()
    })

    it('activeItems debe filtrar solo proveedores activos', () => {
      const active = store.activeItems
      expect(active).toHaveLength(2)
      expect(active.every(s => s.status === 'active')).toBe(true)
    })

    it('inactiveItems debe filtrar solo proveedores inactivos', () => {
      const inactive = store.inactiveItems
      expect(inactive).toHaveLength(1)
      expect(inactive.every(s => s.status === 'inactive')).toBe(true)
    })
  })

  describe('acciones', () => {
    describe('list', () => {
      it('debe cargar proveedores exitosamente', async () => {
        const mockResponse = {
          items: [
            { id: '1', name: 'Proveedor 1', status: 'active' },
            { id: '2', name: 'Proveedor 2', status: 'inactive' }
          ],
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }

        vi.mocked(listSuppliers).mockResolvedValue(mockResponse)

        await store.list()

        expect(listSuppliers).toHaveBeenCalledWith({
          q: '',
          status: undefined,
          sort: 'name',
          order: 'asc',
          page: 1,
          limit: 8
        })

        expect(store.items).toEqual(mockResponse.items)
        expect(store.total).toBe(mockResponse.total)
        expect(store.page).toBe(mockResponse.page)
        expect(store.limit).toBe(mockResponse.limit)
        expect(store.loading).toBe(false)
        expect(store.error).toBe(null)
      })

      it('debe manejar errores correctamente', async () => {
        const mockError = new Error('Error de red')
        vi.mocked(listSuppliers).mockRejectedValue(mockError)

        await expect(store.list()).rejects.toThrow(mockError)

        expect(store.items).toEqual([])
        expect(store.total).toBe(0)
        expect(store.loading).toBe(false)
        expect(store.error).toBe('Error de red')
      })

      it('debe fusionar filtros correctamente', async () => {
        const mockResponse = {
          items: [],
          page: 2,
          limit: 20,
          total: 0,
          totalPages: 0
        }

        vi.mocked(listSuppliers).mockResolvedValue(mockResponse)

        await store.list({ q: 'busqueda', status: 'active', page: 2, limit: 20 })

        expect(listSuppliers).toHaveBeenCalledWith({
          q: 'busqueda',
          status: 'active',
          sort: 'name',
          order: 'asc',
          page: 2,
          limit: 20
        })

        expect(store.filters.q).toBe('busqueda')
        expect(store.filters.status).toBe('active')
        expect(store.page).toBe(2)
        expect(store.limit).toBe(20)
      })
    })

    describe('create', () => {
      it('debe crear un proveedor exitosamente', async () => {
        const newSupplier = { id: '4', name: 'Nuevo Proveedor', status: 'active' }
        vi.mocked(createSupplier).mockResolvedValue(newSupplier)

        const result = await store.create({ name: 'Nuevo Proveedor' })

        expect(createSupplier).toHaveBeenCalledWith({ name: 'Nuevo Proveedor' })
        expect(result).toEqual(newSupplier)
        expect(store.items[0]).toEqual(newSupplier)
        expect(store.total).toBe(1)
        expect(store.loading).toBe(false)
      })

      it('no debe agregar a la lista si no está en la primera página', async () => {
        store.page = 2
        const newSupplier = { id: '4', name: 'Nuevo Proveedor', status: 'active' }
        vi.mocked(createSupplier).mockResolvedValue(newSupplier)

        await store.create({ name: 'Nuevo Proveedor' })

        expect(store.items).not.toContain(newSupplier)
        expect(store.total).toBe(0)
      })
    })

    describe('update', () => {
      it('debe actualizar un proveedor exitosamente', async () => {
        store.items = [
          { id: '1', name: 'Proveedor 1', status: 'active' },
          { id: '2', name: 'Proveedor 2', status: 'inactive' }
        ]

        const updatedSupplier = { id: '1', name: 'Proveedor Actualizado', status: 'active' }
        vi.mocked(updateSupplier).mockResolvedValue(updatedSupplier)

        const result = await store.update('1', { name: 'Proveedor Actualizado' })

        expect(updateSupplier).toHaveBeenCalledWith('1', { name: 'Proveedor Actualizado' })
        expect(result).toEqual(updatedSupplier)
        expect(store.items[0]).toEqual(updatedSupplier)
        expect(store.loading).toBe(false)
      })
    })

    describe('remove', () => {
      it('debe eliminar un proveedor exitosamente', async () => {
        store.items = [
          { id: '1', name: 'Proveedor 1', status: 'active' },
          { id: '2', name: 'Proveedor 2', status: 'inactive' }
        ]
        store.total = 2

        vi.mocked(removeSupplier).mockResolvedValue(undefined)

        await store.remove('1')

        expect(removeSupplier).toHaveBeenCalledWith('1')
        expect(store.items).toHaveLength(1)
        expect(store.items.find(s => s.id === '1')).toBeUndefined()
        expect(store.total).toBe(1)
        expect(store.loading).toBe(false)
      })
    })
  })

  describe('métodos auxiliares', () => {
    it('setFilters debe actualizar filtros y resetear página', () => {
      store.page = 5
      store.setFilters({ q: 'nueva búsqueda', status: 'active' })

      expect(store.filters.q).toBe('nueva búsqueda')
      expect(store.filters.status).toBe('active')
      expect(store.page).toBe(1)
    })

    it('setPage debe actualizar página con valor mínimo de 1', () => {
      store.setPage(5)
      expect(store.page).toBe(5)

      store.setPage(0)
      expect(store.page).toBe(1)

      store.setPage(-5)
      expect(store.page).toBe(1)
    })

    it('setLimit debe actualizar límite con valor mínimo de 1', () => {
      store.setLimit(20)
      expect(store.limit).toBe(20)

      store.setLimit(0)
      expect(store.limit).toBe(1)

      store.setLimit(-5)
      expect(store.limit).toBe(1)
    })

    it('reset debe restaurar estado inicial', () => {
      // Modificar el estado
      store.items = [{ id: '1', name: 'Proveedor 1' }]
      store.total = 1
      store.page = 5
      store.limit = 20
      store.loading = true
      store.error = 'Error'
      store.filters.q = 'búsqueda'

      store.reset()

      expect(store.items).toEqual([])
      expect(store.total).toBe(0)
      expect(store.page).toBe(1)
      expect(store.limit).toBe(8)
      expect(store.loading).toBe(false)
      expect(store.error).toBe(null)
      expect(store.filters).toEqual({
        q: '',
        status: undefined,
        sort: 'name',
        order: 'asc'
      })
    })
  })
})
