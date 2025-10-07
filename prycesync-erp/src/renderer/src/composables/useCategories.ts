import { ref, computed } from 'vue'
import axios from 'axios'

// Interfaces
interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  parent?: {
    id: string
    name: string
  }
  children?: Category[]
  _count?: {
    products: number
  }
  createdAt: string
  updatedAt: string
}

interface CreateCategoryData {
  name: string
  description?: string
  parentId?: string
}

interface UpdateCategoryData {
  name?: string
  description?: string
  parentId?: string
}

interface CategoryFilters {
  search?: string
  parentId?: string
  includeChildren?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface CategoryTree extends Category {
  children: CategoryTree[]
}

// API Base URL (compatible con Docker y Vite)
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
    console.log('🚨 API Error in useCategories:', error.response?.status, error.response?.data)
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

export function useCategories() {
  // State
  const categories = ref<Category[]>([])
  const categoryTree = ref<CategoryTree[]>([])
  const currentCategory = ref<Category | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Computed properties
  const hasCategories = computed(() => categories.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const rootCategories = computed(() => 
    categories.value.filter(category => !category.parentId)
  )

  // Helper functions
  const clearError = () => {
    error.value = null
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  // Fetch categories
  const fetchCategories = async (filters: CategoryFilters = {}) => {
    try {
      setLoading(true)
      clearError()

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.parentId !== undefined) params.append('parentId', filters.parentId || '')
      if (filters.includeChildren) params.append('includeChildren', 'true')
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const response = await apiClient.get(`/categories?${params.toString()}`)
      
      if (response.data.success) {
        categories.value = response.data.data
        pagination.value = response.data.pagination
      } else {
        throw new Error(response.data.message || 'Error al obtener categorías')
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      error.value = err.response?.data?.message || err.message || 'Error al obtener categorías'
    } finally {
      setLoading(false)
    }
  }

  // Fetch category by ID
  const fetchCategory = async (id: string) => {
    try {
      setLoading(true)
      clearError()

      const response = await apiClient.get(`/categories/${id}`)
      
      if (response.data.success) {
        currentCategory.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error al obtener categoría')
      }
    } catch (err: any) {
      console.error('Error fetching category:', err)
      error.value = err.response?.data?.message || err.message || 'Error al obtener categoría'
      return null
    } finally {
      setLoading(false)
    }
  }

  // Search categories
  const searchCategories = async (query: string, limit: number = 10) => {
    try {
      if (!query || query.length < 2) {
        return []
      }

      const params = new URLSearchParams()
      params.append('q', query)
      params.append('limit', limit.toString())

      const response = await apiClient.get(`/categories/search?${params.toString()}`)
      
      return response.data || []
    } catch (err: any) {
      console.error('Error searching categories:', err)
      return []
    }
  }

  // Fetch category tree
  const fetchCategoryTree = async () => {
    try {
      setLoading(true)
      clearError()

      const response = await apiClient.get('/categories/tree')
      
      if (response.data.success) {
        categoryTree.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error al obtener árbol de categorías')
      }
    } catch (err: any) {
      console.error('Error fetching category tree:', err)
      error.value = err.response?.data?.message || err.message || 'Error al obtener árbol de categorías'
      return []
    } finally {
      setLoading(false)
    }
  }

  // Create category
  const createCategory = async (data: CreateCategoryData) => {
    try {
      setLoading(true)
      clearError()

      const response = await apiClient.post('/categories', data)
      
      if (response.data.success) {
        // Refresh categories list
        await fetchCategories()
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error al crear categoría')
      }
    } catch (err: any) {
      console.error('Error creating category:', err)
      error.value = err.response?.data?.message || err.message || 'Error al crear categoría'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update category
  const updateCategory = async (id: string, data: UpdateCategoryData) => {
    try {
      setLoading(true)
      clearError()

      const response = await apiClient.put(`/categories/${id}`, data)
      
      if (response.data.success) {
        // Update current category if it's the one being updated
        if (currentCategory.value?.id === id) {
          currentCategory.value = response.data.data
        }
        
        // Refresh categories list
        await fetchCategories()
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error al actualizar categoría')
      }
    } catch (err: any) {
      console.error('Error updating category:', err)
      error.value = err.response?.data?.message || err.message || 'Error al actualizar categoría'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete category
  const deleteCategory = async (id: string) => {
    try {
      setLoading(true)
      clearError()

      const response = await apiClient.delete(`/categories/${id}`)
      
      if (response.data.success) {
        // Remove from categories list
        categories.value = categories.value.filter(category => category.id !== id)
        
        // Clear current category if it's the one being deleted
        if (currentCategory.value?.id === id) {
          currentCategory.value = null
        }
        
        return true
      } else {
        throw new Error(response.data.message || 'Error al eliminar categoría')
      }
    } catch (err: any) {
      console.error('Error deleting category:', err)
      error.value = err.response?.data?.message || err.message || 'Error al eliminar categoría'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get category options for select components
  const getCategoryOptions = (includeEmpty: boolean = true) => {
    const options = categories.value.map(category => ({
      value: category.id,
      label: category.name,
      parent: category.parent?.name
    }))

    if (includeEmpty) {
      options.unshift({ value: '', label: 'Sin categoría', parent: undefined })
    }

    return options
  }

  // Get hierarchical category options
  const getHierarchicalOptions = (tree: CategoryTree[] = categoryTree.value, level: number = 0): Array<{value: string, label: string}> => {
    const options: Array<{value: string, label: string}> = []
    
    tree.forEach(category => {
      const indent = '  '.repeat(level)
      options.push({
        value: category.id,
        label: `${indent}${category.name}`
      })
      
      if (category.children && category.children.length > 0) {
        options.push(...getHierarchicalOptions(category.children, level + 1))
      }
    })
    
    return options
  }

  // Reset state
  const resetState = () => {
    categories.value = []
    categoryTree.value = []
    currentCategory.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  }

  return {
    // State
    categories,
    categoryTree,
    currentCategory,
    loading,
    error,
    pagination,

    // Computed
    hasCategories,
    isLoading,
    hasError,
    rootCategories,

    // Methods
    clearError,
    setLoading,
    fetchCategories,
    fetchCategory,
    searchCategories,
    fetchCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryOptions,
    getHierarchicalOptions,
    resetState
  }
}