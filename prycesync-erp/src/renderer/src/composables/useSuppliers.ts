import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

interface Supplier {
  id: string
  code: string
  name: string
  email: string
  phone: string
  taxId: string
  address: string
  status: 'active' | 'inactive'
  importedProductsCount?: number
  lastImportDate?: string
  createdAt: string
  updatedAt: string
}

interface SupplierFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function useSuppliers() {
  const authStore = useAuthStore()
  
  // State
  const suppliers = ref<Supplier[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Pagination>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0
  })

  // Computed
  const hasError = computed(() => !!error.value)

  // API Base URL (compatible con Docker y Vite)
  const rawBase = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.API_URL || 'http://localhost:3002'
  const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = authStore.token
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Fetch suppliers
  const fetchSuppliers = async (filters: SupplierFilters = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const queryParams = new URLSearchParams()
      
      if (filters.search) queryParams.append('search', filters.search)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.page) queryParams.append('page', filters.page.toString())
      if (filters.limit) queryParams.append('limit', filters.limit.toString())
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

      const response = await fetch(`${API_BASE}/suppliers?${queryParams}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      suppliers.value = data.suppliers || data.data || []
      
      if (data.pagination) {
        pagination.value = data.pagination
      }

    } catch (err) {
      console.error('Error fetching suppliers:', err)
      error.value = err instanceof Error ? err.message : 'Error al cargar proveedores'
      suppliers.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Get supplier by ID
  const getSupplier = async (id: string): Promise<Supplier | null> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE}/suppliers/${id}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.supplier || data.data || data

    } catch (err) {
      console.error('Error fetching supplier:', err)
      error.value = err instanceof Error ? err.message : 'Error al cargar proveedor'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Create supplier
  const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier | null> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE}/suppliers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(supplierData)
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const newSupplier = data.supplier || data.data || data

      // Add to local state
      suppliers.value.unshift(newSupplier)

      return newSupplier

    } catch (err) {
      console.error('Error creating supplier:', err)
      error.value = err instanceof Error ? err.message : 'Error al crear proveedor'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Update supplier
  const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(supplierData)
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const updatedSupplier = data.supplier || data.data || data

      // Update local state
      const index = suppliers.value.findIndex(s => s.id === id)
      if (index !== -1) {
        suppliers.value[index] = updatedSupplier
      }

      return updatedSupplier

    } catch (err) {
      console.error('Error updating supplier:', err)
      error.value = err instanceof Error ? err.message : 'Error al actualizar proveedor'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Delete supplier
  const deleteSupplier = async (id: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // Remove from local state
      suppliers.value = suppliers.value.filter(s => s.id !== id)

      return true

    } catch (err) {
      console.error('Error deleting supplier:', err)
      error.value = err instanceof Error ? err.message : 'Error al eliminar proveedor'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Search suppliers
  const searchSuppliers = async (query: string): Promise<Supplier[]> => {
    try {
      const response = await fetch(`${API_BASE}/suppliers/search?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.suppliers || data.data || []

    } catch (err) {
      console.error('Error searching suppliers:', err)
      return []
    }
  }

  return {
    // State
    suppliers,
    isLoading,
    hasError,
    error,
    pagination,

    // Methods
    fetchSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    searchSuppliers
  }
}
