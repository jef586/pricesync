import { ref, computed, readonly } from 'vue'
import axios from 'axios'
import { resolveArticle } from '@/services/articles'

// Types
interface Product {
  id: string
  sku: string
  name: string
  description?: string
  categoryId?: string
  category?: {
    id: string
    name: string
  }
  costPrice: number
  salePrice: number
  stockQuantity: number
  minStock?: number
  maxStock?: number
  unit: string
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
  updatedAt: string
}

interface CreateProductData {
  name: string
  description?: string
  categoryId?: string
  costPrice: number
  salePrice: number
  stockQuantity: number
  minStock?: number
  maxStock?: number
  unit: string
  status?: 'active' | 'inactive' | 'discontinued'
}

interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

interface ProductFilters {
  search?: string
  status?: string
  categoryId?: string
  lowStock?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface StockUpdateData {
  quantity: number
  type: 'add' | 'subtract' | 'set'
  reason?: string
}

// API Base URL (normalize to ensure "/api" suffix)
const rawBase = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.API_URL || 'http://localhost:3002'
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('ðŸš¨ API Error in useProducts:', error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      console.log('ðŸš¨ 401 Unauthorized - redirecting to /auth')
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export function useProducts() {
  // State
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0
  })

  // Computed
  const hasProducts = computed(() => products.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const lowStockProducts = computed(() => 
    products.value.filter(product => 
      product.minStock && product.stockQuantity <= product.minStock
    )
  )

  // Methods
  const clearError = () => {
    error.value = null
  }

  const setLoading = (state: boolean) => {
    loading.value = state
    if (state) {
      error.value = null
    }
  }

  // Fetch products with filters
  const fetchProducts = async (filters: ProductFilters = {}) => {
    try {
      setLoading(true)
      console.log('useProducts - fetchProducts called with filters:', filters)
      
      const params = new URLSearchParams()
      // Map legacy filters to articles endpoint
      if (filters.search) params.append('search', String(filters.search))
      if (filters.categoryId) params.append('categoryId', String(filters.categoryId))
      if (filters.page) params.append('page', String(filters.page))
      if (filters.limit) params.append('limit', String(filters.limit))
      if (filters.sortBy) params.append('sortBy', String(filters.sortBy))
      if (filters.sortOrder) params.append('sortOrder', String(filters.sortOrder))
      // status -> active (true/false)
      if (filters.status) {
        const s = String(filters.status).toLowerCase()
        if (s === 'active') params.append('active', 'true')
        else if (s === 'inactive') params.append('active', 'false')
      }

      console.log('useProducts - making API call to:', `/articles?${params.toString()}`)
      const response = await apiClient.get(`/articles?${params.toString()}`)
      console.log('useProducts - API response:', response.data)
      
      // La API de artículos puede devolver { data | items | articles }
      const raw = response.data
      const productsData = raw?.data || raw?.items || raw?.articles || (Array.isArray(raw) ? raw : [])
      const arr = Array.isArray(productsData) ? productsData : []

      // Mapear artículos -> Product (compatibilidad)
      products.value = arr.map((a: any) => ({
        id: a.id,
        sku: a.sku || '',
        name: a.name,
        description: a.description || undefined,
        categoryId: a.categoryId || a.category?.id,
        category: a.category ? { id: a.category.id, name: a.category.name } : undefined,
        costPrice: a.cost ?? 0,
        salePrice: (a as any).salePrice ?? a.pricePublic ?? 0,
        stockQuantity: a.stock ?? 0,
        minStock: a.stockMin ?? undefined,
        maxStock: a.stockMax ?? undefined,
        unit: (a.unit || 'UN'),
        status: (a.active === false) ? 'inactive' : 'active',
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
      
      // Fallback robusto si la API no entrega 'pagination'
      const rawPagination = raw?.pagination || raw?.meta?.pagination || null
      const limit = rawPagination?.limit ?? filters.limit ?? 8
      const total = rawPagination?.total ?? (Array.isArray(arr) ? arr.length : 0)
      const pages = rawPagination?.pages ?? rawPagination?.totalPages ?? Math.ceil(total / (limit || 10))

    pagination.value = {
      page: rawPagination?.page ?? filters.page ?? 1,
      limit,
      total,
      totalPages: pages
    }
    } catch (err: any) {
      console.error('useProducts - fetchProducts error:', err)
      error.value = err.response?.data?.message || err.message || 'Error al cargar productos'
      products.value = []
    } finally {
      setLoading(false)
    }
  }

  // Fetch single product
  const fetchProduct = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await apiClient.get(`/articles/${id}`)
      const raw = response.data?.data || response.data
      const a: any = raw
      const productData: Product = {
        id: a.id,
        sku: a.sku || '',
        name: a.name,
        description: a.description || undefined,
        categoryId: a.categoryId || a.category?.id,
        category: a.category ? { id: a.category.id, name: a.category.name } : undefined,
        costPrice: a.cost ?? 0,
        salePrice: (a as any).salePrice ?? a.pricePublic ?? 0,
        stockQuantity: a.stock ?? 0,
        minStock: a.stockMin ?? undefined,
        maxStock: a.stockMax ?? undefined,
        unit: (a.unit || 'UN'),
        status: (a.active === false) ? 'inactive' : 'active',
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }
      currentProduct.value = productData
      return productData
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar producto'
      currentProduct.value = null
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Search products
  const searchProducts = async (query: string, limit: number = 10) => {
    try {
      if (!query || query.length < 2) {
        return []
      }

      const params = new URLSearchParams()
      params.append('q', query)
      params.append('limit', limit.toString())

      // Refactor: usar artículos
      const response = await apiClient.get(`/articles/search?${params.toString()}`)
      const items = Array.isArray(response.data) ? response.data : (response.data?.data || [])

      // Mapear al formato esperado por las vistas POS
      return items.map((a: any) => ({
        id: a.id,
        name: a.name,
        sku: a.sku || '',
        code: a.sku || '',
        salePrice: (a as any).salePrice ?? a.pricePublic ?? 0,
        imageUrl: (a as any).imageUrl ?? null
      }))
    } catch (err: any) {
      console.error('Error searching products:', err)
      return []
    }
  }

  // Search products by barcode or code (exact, then fallback)
  const searchByBarcode = async (barcode: string): Promise<any[]> => {
    try {
      if (!barcode || barcode.length < 2) return []
      const art = await resolveArticle({ barcode })
      if (!art) return []
      return [{
        id: art.id,
        name: art.name,
        code: art.sku || art.barcode || barcode,
        salePrice: (art as any).salePrice ?? art.pricePublic ?? 0
      }]
    } catch (err) {
      console.error('Error searching products by barcode:', err)
      return []
    }
  }

  // Helper: map Article payload to Product format (frontend compatibility)
  const mapArticleToProduct = (a: any): Product => ({
    id: a.id,
    sku: a.sku || '',
    name: a.name,
    description: a.description || undefined,
    categoryId: a.categoryId || a.category?.id,
    category: a.category ? { id: a.category.id, name: a.category.name } : undefined,
    costPrice: a.cost ?? 0,
    salePrice: (a as any).salePrice ?? a.pricePublic ?? 0,
    stockQuantity: a.stock ?? 0,
    minStock: a.stockMin ?? undefined,
    maxStock: a.stockMax ?? undefined,
    unit: (a.unit || 'UN'),
    status: (a.active === false) ? 'inactive' : 'active',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt
  })
  // Create product
  const createProduct = async (data: CreateProductData) => {
    try {
      setLoading(true)
      // Refactor: create via Articles API
      const response = await apiClient.post('/articles', data)
      const raw = response.data?.data || response.data
      if (response.status === 201 || response.data.success || raw?.id) {
        const mapped = mapArticleToProduct(raw)
        products.value.unshift(mapped)
        return mapped
      } else {
        throw new Error(response.data.message || 'Error al crear producto')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al crear producto'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update product
  const updateProduct = async (id: string, data: Partial<CreateProductData>) => {
    try {
      setLoading(true)
      // Refactor: update via Articles API
      const response = await apiClient.put(`/articles/${id}`, data)
      const raw = response.data?.data || response.data
      if (response.status === 200 || response.data.success || raw?.id) {
        const mapped = mapArticleToProduct(raw)
        // Update in products array
        const index = products.value.findIndex(p => p.id === id)
        if (index !== -1) {
          products.value[index] = mapped
        }
        // Update current product if it's the same
        if (currentProduct.value?.id === id) {
          currentProduct.value = mapped
        }
        return mapped
      } else {
        throw new Error(response.data.message || 'Error al actualizar producto')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al actualizar producto'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete product (soft delete)
  const deleteProduct = async (id: string) => {
    try {
      setLoading(true)
      // Refactor: delete via Articles API
      const response = await apiClient.delete(`/articles/${id}`)
      
      if (response.status === 200 || response.data.success) {
        // Remove from products array
        products.value = products.value.filter(p => p.id !== id)
        
        // Clear current product if it's the deleted one
        if (currentProduct.value?.id === id) {
          currentProduct.value = null
        }
        
        return true
      } else {
        throw new Error(response.data.message || 'Error al eliminar producto')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al eliminar producto'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update stock
  const updateStock = async (id: string, stockData: StockUpdateData) => {
    try {
      setLoading(true)
      // Refactor: stock update via Articles API
      const response = await apiClient.patch(`/articles/${id}/stock`, stockData)
      const raw = response.data?.data || response.data
      if (response.status === 200 || response.data.success || raw?.id) {
        const mapped = mapArticleToProduct(raw)
        // Update in products array
        const index = products.value.findIndex(p => p.id === id)
        if (index !== -1) {
          products.value[index] = mapped
        }
        // Update current product if it's the same
        if (currentProduct.value?.id === id) {
          currentProduct.value = mapped
        }
        return mapped
      } else {
        throw new Error(response.data.message || 'Error al actualizar stock')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al actualizar stock'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Reset state
  const resetState = () => {
    products.value = []
    currentProduct.value = null
    error.value = null
    loading.value = false
    pagination.value = {
      page: 1,
      limit: 8,
      total: 0,
      totalPages: 0
    }
  }

  return {
    // State (readonly)
    products: products,
    currentProduct: readonly(currentProduct),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    
    // Computed
    hasProducts,
    isLoading,
    hasError,
    lowStockProducts,
    
    // Methods
    fetchProducts,
    fetchProduct,
    searchProducts,
    searchByBarcode,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    clearError,
    resetState
  }
}

export type { Product, CreateProductData, UpdateProductData, ProductFilters, StockUpdateData }
