import { ref, computed, type Ref } from 'vue'
import { useAuthStore } from "../stores/auth";

interface Supplier {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  taxId?: string
  address?: string
  status: 'active' | 'inactive'
  _count?: {
    products: number
  }
  createdAt: string
  updatedAt: string
}

interface SupplierProduct {
  id: string
  supplierCode: string
  supplierName: string
  description?: string
  costPrice: number
  listPrice?: number
  currency: string
  brand?: string
  model?: string
  year?: string
  oem?: string
  minQuantity?: number
  leadTime?: number
  isActive: boolean
  isAvailable: boolean
  lastImportDate?: string
  product?: {
    id: string
    code: string
    name: string
    salePrice?: number
  }
}

interface ProductPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ProductFilters {
  search?: string
  page?: number
  limit?: number
}

export function useSupplierDetail(supplierId: Ref<string>) {
  const authStore = useAuthStore()
  
  // State
  const supplier = ref<Supplier | null>(null)
  const products = ref<SupplierProduct[]>([])
  const isLoading = ref(false)
  const isLoadingProducts = ref(false)
  const hasError = ref(false)
  const error = ref<string | null>(null)
  
  const productPagination = ref<ProductPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // API Base URL (normalizado con sufijo /api)
  const rawBase = (import.meta.env.VITE_API_URL || 'http://localhost:3002').trim()
  const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`

  // Fetch supplier details
  const fetchSupplier = async () => {
    if (!supplierId.value) return

    isLoading.value = true
    hasError.value = false
    error.value = null

    try {
      const response = await fetch(`${API_BASE}/suppliers/${supplierId.value}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      supplier.value = data
    } catch (err) {
      hasError.value = true
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching supplier:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch supplier products
  const fetchProducts = async (filters: ProductFilters = {}) => {
    if (!supplierId.value) return

    isLoadingProducts.value = true
    hasError.value = false
    error.value = null

    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`${API_BASE}/suppliers/${supplierId.value}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      products.value = data.products || []
      
      // Update pagination
      productPagination.value = {
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 20,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }
    } catch (err) {
      hasError.value = true
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching products:', err)
    } finally {
      isLoadingProducts.value = false
    }
  }

  // Add supplier product
  const addSupplierProduct = async (productData: Partial<SupplierProduct>) => {
    if (!supplierId.value) return

    try {
      const response = await fetch(`${API_BASE}/suppliers/${supplierId.value}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const newProduct = await response.json()
      return newProduct
    } catch (err) {
      console.error('Error adding supplier product:', err)
      throw err
    }
  }

  // Update supplier product
  const updateSupplierProduct = async (productId: string, productData: Partial<SupplierProduct>) => {
    if (!supplierId.value) return

    try {
      const response = await fetch(`${API_BASE}/suppliers/${supplierId.value}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const updatedProduct = await response.json()
      return updatedProduct
    } catch (err) {
      console.error('Error updating supplier product:', err)
      throw err
    }
  }

  // Delete supplier product
  const deleteSupplierProduct = async (productId: string) => {
    if (!supplierId.value) return

    try {
      const response = await fetch(`${API_BASE}/suppliers/${supplierId.value}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      return true
    } catch (err) {
      console.error('Error deleting supplier product:', err)
      throw err
    }
  }

  return {
    // State
    supplier,
    products,
    isLoading,
    isLoadingProducts,
    hasError,
    error,
    productPagination,
    
    // Methods
    fetchSupplier,
    fetchProducts,
    addSupplierProduct,
    updateSupplierProduct,
    deleteSupplierProduct
  }
}
