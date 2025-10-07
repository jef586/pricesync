import { ref, computed, readonly } from 'vue'
import axios from 'axios'

// Types
interface Invoice {
  id: string
  number: string
  type: 'A' | 'B' | 'C'
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: string
  dueDate?: string
  paidDate?: string
  subtotal: number
  taxAmount: number
  total: number
  notes?: string
  customer: {
    id: string
    name: string
    email?: string
    taxId?: string
    type: string
  }
  items: InvoiceItem[]
  company: {
    id: string
    name: string
    taxId: string
  }
  createdAt: string
  updatedAt: string
}

interface InvoiceItem {
  id: string
  productId?: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  subtotal: number
  taxAmount: number
  total: number
  product?: {
    id: string
    name: string
    code: string
    description?: string
  }
}

interface CreateInvoiceData {
  customerId: string
  type: 'A' | 'B' | 'C'
  dueDate?: string
  notes?: string
  items: {
    productId?: string
    description?: string
    quantity: number
    unitPrice: number
    discount?: number
    taxRate?: number
  }[]
}

interface InvoiceFilters {
  search?: string
  status?: string
  type?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
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
    console.log('🚨 API Error in useInvoices:', error.response?.status, error.response?.data)
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

export function useInvoices() {
  // State
  const invoices = ref<Invoice[]>([])
  const currentInvoice = ref<Invoice | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Computed
  const hasInvoices = computed(() => invoices.value.length > 0)
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

  // Fetch invoices with filters
  const fetchInvoices = async (filters: InvoiceFilters = {}) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await apiClient.get(`/invoices?${params.toString()}`)

      if (response.data?.success) {
        const payload = response.data?.data || {}
        const list = Array.isArray(payload.invoices) ? payload.invoices : []
        const pag = payload.pagination || {}

        invoices.value = list
        pagination.value = {
          page: Number(pag.page) || Number(filters.page) || 1,
          limit: Number(pag.limit) || Number(filters.limit) || 10,
          total: Number(pag.total) || list.length,
          totalPages: Number(pag.pages) || Number(pag.totalPages) || Math.max(1, Math.ceil((Number(pag.total) || list.length) / (Number(pag.limit) || Number(filters.limit) || 10)))
        }
      } else {
        throw new Error(response.data?.message || 'Error al cargar facturas')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar facturas'
      invoices.value = []
    } finally {
      setLoading(false)
    }
  }

  // Fetch single invoice
  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await apiClient.get(`/invoices/${id}`)
      
      if (response.data.success) {
        currentInvoice.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Error al cargar factura')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al cargar factura'
      currentInvoice.value = null
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Create invoice
  const createInvoice = async (data: CreateInvoiceData) => {
    try {
      setLoading(true)
      
      const response = await apiClient.post('/invoices', data)
      
      if (response.data.success) {
        const newInvoice = response.data.data
        invoices.value.unshift(newInvoice)
        return newInvoice
      } else {
        throw new Error(response.data.message || 'Error al crear factura')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al crear factura'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update invoice
  const updateInvoice = async (id: string, data: Partial<CreateInvoiceData>) => {
    try {
      setLoading(true)
      
      const response = await apiClient.put(`/invoices/${id}`, data)
      
      if (response.data.success) {
        const updatedInvoice = response.data.data
        const index = invoices.value.findIndex(inv => inv.id === id)
        if (index !== -1) {
          invoices.value[index] = updatedInvoice
        }
        if (currentInvoice.value?.id === id) {
          currentInvoice.value = updatedInvoice
        }
        return updatedInvoice
      } else {
        throw new Error(response.data.message || 'Error al actualizar factura')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al actualizar factura'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await apiClient.delete(`/invoices/${id}`)
      
      if (response.data.success) {
        invoices.value = invoices.value.filter(inv => inv.id !== id)
        if (currentInvoice.value?.id === id) {
          currentInvoice.value = null
        }
        return true
      } else {
        throw new Error(response.data.message || 'Error al eliminar factura')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al eliminar factura'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Duplicate invoice
  const duplicateInvoice = async (id: string) => {
    try {
      setLoading(true)
      
      const response = await apiClient.post(`/invoices/${id}/duplicate`)
      
      if (response.data.success) {
        const duplicatedInvoice = response.data.data
        invoices.value.unshift(duplicatedInvoice)
        return duplicatedInvoice
      } else {
        throw new Error(response.data.message || 'Error al duplicar factura')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al duplicar factura'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Update invoice status
  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      setLoading(true)
      
      const response = await apiClient.patch(`/invoices/${id}/status`, { status })
      
      if (response.data.success) {
        const updatedInvoice = response.data.data
        const index = invoices.value.findIndex(inv => inv.id === id)
        if (index !== -1) {
          invoices.value[index] = updatedInvoice
        }
        if (currentInvoice.value?.id === id) {
          currentInvoice.value = updatedInvoice
        }
        return updatedInvoice
      } else {
        throw new Error(response.data.message || 'Error al actualizar estado')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Error al actualizar estado'
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(date))
  }

  // Get status color
  const getStatusColor = (status: Invoice['status']) => {
    const colors = {
      draft: 'gray',
      sent: 'blue',
      paid: 'green',
      overdue: 'red',
      cancelled: 'red'
    }
    return colors[status] || 'gray'
  }

  // Get status label
  const getStatusLabel = (status: Invoice['status']) => {
    const labels = {
      draft: 'Borrador',
      sent: 'Enviada',
      paid: 'Pagada',
      overdue: 'Vencida',
      cancelled: 'Cancelada'
    }
    return labels[status] || status
  }

  // Get type label
  const getTypeLabel = (type: Invoice['type']) => {
    const labels = {
      A: 'Factura A',
      B: 'Factura B',
      C: 'Factura C'
    }
    return labels[type] || type
  }

  return {
    // State
    invoices: readonly(invoices),
    currentInvoice: readonly(currentInvoice),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),

    // Computed
    hasInvoices,
    isLoading,
    hasError,

    // Methods
    clearError,
    fetchInvoices,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    updateInvoiceStatus,

    // Utilities
    formatCurrency,
    formatDate,
    getStatusColor,
    getStatusLabel,
    getTypeLabel
  }
}

export type { Invoice, InvoiceItem, CreateInvoiceData, InvoiceFilters }