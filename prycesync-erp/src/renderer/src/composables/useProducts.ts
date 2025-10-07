import { ref, computed, readonly } from 'vue'
import axios from 'axios'

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

// API Base URL (use env when available, fallback to localhost)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002/api'

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
    console.log('🚨 API Error in useProducts:', error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized - redirecting to /auth')
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
    limit: 10,
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
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      console.log('useProducts - making API call to:', `/products?${params.toString()}`)
      const response = await apiClient.get(`/products?${params.toString()}`)
      console.log('useProducts - API response:', response.data)
      
      // La API de productos devuelve { success, data, pagination }
      // mientras que otras APIs devuelven { items, pagination }
      const productsData = response.data.data || response.data.products || response.data.items || response.data
      products.value = Array.isArray(productsData) ? productsData : []
      
      console.log('useProducts - products.value after assignment:', products.value)
      console.log('useProducts - products.value type:', typeof products.value)
      console.log('useProducts - products.value isArray:', Array.isArray(products.value))
      
      // Fallback robusto si la API no entrega 'pagination'
      const rawPagination = response.data.pagination || response.data.meta?.pagination || null
      const limit = rawPagination?.limit ?? filters.limit ?? 10
      const total = rawPagination?.total ?? (Array.isArray(productsData) ? productsData.length : 0)
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
      
      const response = await apiClient.get(`/products/${id}`)
      
      if (response.status === 200 || response.data.success) {
        const productData = response.data.data || response.data
        currentProduct.value = productData
        return productData
      } else {
        throw new Error(response.data.message || 'Error al cargar producto')
      }
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

      const response = await apiClient.get(`/products/search?${params.toString()}`)
      
      return response.data || []
    } catch (err: any) {
      console.error('Error searching products:', err)
      return []
    }
  }

  // Create product
  const createProduct = async (data: CreateProductData) => {
    try {
      setLoading(true)
      
      const response = await apiClient.post('/products', data)
      
      if (response.status === 201 || response.data.success) {
        const newProduct = response.data.data || response.data
        products.value.unshift(newProduct)
        return newProduct
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
      
      const response = await apiClient.put(`/products/${id}`, data)
      
      if (response.status === 200 || response.data.success) {
        const updatedProduct = response.data.data || response.data
        
        // Update in products array
        const index = products.value.findIndex(p => p.id === id)
        if (index !== -1) {
          products.value[index] = updatedProduct
        }
        
        // Update current product if it's the same
        if (currentProduct.value?.id === id) {
          currentProduct.value = updatedProduct
        }
        
        return updatedProduct
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
      
      const response = await apiClient.delete(`/products/${id}`)
      
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
      
      const response = await apiClient.patch(`/products/${id}/stock`, stockData)
      
      if (response.status === 200 || response.data.success) {
        const updatedProduct = response.data.data || response.data
        
        // Update in products array
        const index = products.value.findIndex(p => p.id === id)
        if (index !== -1) {
          products.value[index] = updatedProduct
        }
        
        // Update current product if it's the same
        if (currentProduct.value?.id === id) {
          currentProduct.value = updatedProduct
        }
        
        return updatedProduct
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
      limit: 10,
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
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    clearError,
    resetState
  }
}

export type { Product, CreateProductData, UpdateProductData, ProductFilters, StockUpdateData }