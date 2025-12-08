import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Supplier, SupplierFilters, Paginated } from '@/types/supplier'
import { listSuppliers, getSupplier, createSupplier, updateSupplier, removeSupplier } from '@/services/suppliers'

export const useSuppliersStore = defineStore('suppliers', () => {
  // Estado
  const items = ref<Supplier[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(8)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Filtros
  const filters = ref<SupplierFilters>({
    q: '',
    status: undefined,
    sort: 'name',
    order: 'asc'
  })

  // Getters
  const byId = computed(() => (id: string) => items.value.find((s) => s.id === id))
  const activeItems = computed(() => items.value.filter((s) => s.status === 'active'))
  const inactiveItems = computed(() => items.value.filter((s) => s.status === 'inactive'))

  // Acciones
  async function list(params: SupplierFilters = {}) {
    try {
      loading.value = true
      error.value = null
      
      // Merge filtros y paginación
      filters.value = {
        ...filters.value,
        ...params
      }
      
      const effective: SupplierFilters = {
        q: filters.value.q,
        status: filters.value.status,
        sort: filters.value.sort,
        order: filters.value.order,
        page: params.page ?? page.value,
        limit: params.limit ?? limit.value
      }
      
      const res: Paginated<Supplier> = await listSuppliers(effective)
      items.value = res.items
      page.value = res.page
      limit.value = res.limit
      total.value = res.total
      
    } catch (err: any) {
      error.value = err?.response?.data?.message || err?.message || 'Error al listar proveedores'
      items.value = []
      total.value = 0
      throw err
    } finally {
      loading.value = false
    }
  }

  async function get(id: string): Promise<Supplier> {
    try {
      loading.value = true
      error.value = null
      const supplier = await getSupplier(id)
      return supplier
    } catch (err: any) {
      error.value = err?.response?.data?.message || err?.message || 'Error al obtener proveedor'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(payload: Partial<Supplier>): Promise<Supplier> {
    try {
      loading.value = true
      error.value = null
      const created = await createSupplier(payload)
      // Actualizar lista local si estamos en primera página
      if (page.value === 1) {
        items.value.unshift(created)
        total.value += 1
      }
      return created
    } catch (err: any) {
      error.value = err?.response?.data?.message || err?.message || 'Error al crear proveedor'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: Partial<Supplier>): Promise<Supplier> {
    try {
      loading.value = true
      error.value = null
      const updated = await updateSupplier(id, payload)
      // Actualizar en la lista local
      const index = items.value.findIndex((s) => s.id === id)
      if (index !== -1) {
        items.value[index] = updated
      }
      return updated
    } catch (err: any) {
      error.value = err?.response?.data?.message || err?.message || 'Error al actualizar proveedor'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string): Promise<void> {
    try {
      loading.value = true
      error.value = null
      await removeSupplier(id)
      // Remover de la lista local
      items.value = items.value.filter((s) => s.id !== id)
      total.value = Math.max(0, total.value - 1)
    } catch (err: any) {
      error.value = err?.response?.data?.message || err?.message || 'Error al eliminar proveedor'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilters(f: SupplierFilters) {
    filters.value = { ...filters.value, ...f }
    // Al cambiar filtros, resetear página
    page.value = 1
  }

  function setPage(p: number) {
    page.value = Math.max(1, p)
  }

  function setLimit(l: number) {
    limit.value = Math.max(1, l)
  }

  function reset() {
    items.value = []
    total.value = 0
    page.value = 1
    limit.value = 8
    loading.value = false
    error.value = null
    filters.value = { q: '', status: undefined, sort: 'name', order: 'asc' }
  }

  return {
    // Estado
    items,
    total,
    page,
    limit,
    loading,
    error,
    filters,
    
    // Getters
    byId,
    activeItems,
    inactiveItems,
    
    // Acciones
    list,
    get,
    create,
    update,
    remove,
    setFilters,
    setPage,
    setLimit,
    reset
  }
})
