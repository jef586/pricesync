import { ref, computed, readonly } from 'vue'
import axios from 'axios'

// Types
interface Customer {
  id: string
  code: string
  name: string
  email?: string
  taxId: string
  address?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  type: 'individual' | 'company' | 'government'
  status: 'active' | 'inactive' | 'suspended'
  creditLimit?: number
  paymentTerms?: number
  createdAt: string
  updatedAt: string
}

interface CreateCustomerData {
  name: string
  email?: string
  taxId: string
  address?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  type: 'individual' | 'company' | 'government'
  status?: 'active' | 'inactive' | 'suspended'
  creditLimit?: number
  paymentTerms?: number
}

interface CustomerFilters {
  search?: string
  status?: string
  type?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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
    console.log('🚨 API Error in useCustomers:', error.response?.status, error.response?.data)
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

export function useCustomers() {
  // State
  const customers = ref<Customer[]>([])
  const currentCustomer = ref<Customer | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0
  })

  // Computed
  const hasCustomers = computed(() => customers.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

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

  // Fetch customers with filters
  const fetchCustomers = async (filters: CustomerFilters = {}) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await apiClient.get(`/customers?${params.toString()}`)
      
      // El controlador devuelve directamente { customers, pagination }
      customers.value = response.data.customers
      pagination.value = {
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.pages
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar clientes'
      customers.value = []
    } finally {
      setLoading(false)
    }
  }

  // Fetch single customer
  const fetchCustomer = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await apiClient.get(`/customers/${id}`)
      
      // Verificar si la respuesta es exitosa (código 200 para obtener datos)
      if (response.status === 200 || response.data.success) {
        const customerData = response.data.data || response.data
        currentCustomer.value = customerData
        return customerData
      } else {
        throw new Error(response.data.message || 'Error al cargar cliente')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar cliente'
      currentCustomer.value = null
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Search customers
  const searchCustomers = async (query: string, limit: number = 10) => {
    try {
      if (!query || query.length < 2) {
        return []
      }

      const params = new URLSearchParams()
      params.append('q', query)
      params.append('limit', limit.toString())

      const response = await apiClient.get(`/customers/search?${params.toString()}`)
      
      return response.data || []
    } catch (err: any) {
      console.error('Error searching customers:', err)
      return []
    }
  }

  // Create customer
  const createCustomer = async (data: CreateCustomerData) => {
    try {
      setLoading(true)
      
      const response = await apiClient.post('/customers', data)
      
      // Verificar si la respuesta es exitosa (código 201 para creación)
      if (response.status === 201 || response.data.success) {
        const newCustomer = response.data.data || response.data
        customers.value.unshift(newCustomer)
        return newCustomer
      } else {
        throw new Error(response.data.message || 'Error al crear cliente')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al crear cliente'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update customer
  const updateCustomer = async (id: string, data: Partial<CreateCustomerData>) => {
    try {
      setLoading(true)
      
      const response = await apiClient.put(`/customers/${id}`, data)
      
      if (response.status === 200 || response.data.success) {
        const updatedCustomer = response.data.data || response.data
        const index = customers.value.findIndex(cust => cust.id === id)
        if (index !== -1) {
          customers.value[index] = updatedCustomer
        }
        if (currentCustomer.value?.id === id) {
          currentCustomer.value = updatedCustomer
        }
        return updatedCustomer
      } else {
        throw new Error(response.data.message || 'Error al actualizar cliente')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al actualizar cliente'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete customer
  const deleteCustomer = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await apiClient.delete(`/customers/${id}`)
      
      if (response.status === 200 || response.data.success) {
        customers.value = customers.value.filter(cust => cust.id !== id)
        if (currentCustomer.value?.id === id) {
          currentCustomer.value = null
        }
        return true
      } else {
        throw new Error(response.data.message || 'Error al eliminar cliente')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al eliminar cliente'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Utility functions
  const getStatusLabel = (status: Customer['status']) => {
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      suspended: 'Suspendido'
    }
    return labels[status] || status
  }

  const getTypeLabel = (type: Customer['type']) => {
    const labels = {
      individual: 'Persona Física',
      company: 'Empresa',
      government: 'Gobierno'
    }
    return labels[type] || type
  }

  const getStatusColor = (status: Customer['status']) => {
    const colors = {
      active: 'green',
      inactive: 'gray',
      suspended: 'red'
    }
    return colors[status] || 'gray'
  }

  // Return reactive state and methods
  return {
    // State
    customers: readonly(customers),
    currentCustomer: readonly(currentCustomer),
    pagination: readonly(pagination),
    
    // Computed
    hasCustomers,
    isLoading,
    hasError,
    error: readonly(error),
    
    // Methods
    fetchCustomers,
    fetchCustomer,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError,
    
    // Utilities
    getStatusLabel,
    getTypeLabel,
    getStatusColor
  }
}

export type { Customer, CreateCustomerData, CustomerFilters }
