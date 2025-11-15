import { apiClient } from './api'
import type { Supplier, SupplierFilters, Paginated, SupplierCreateDTO, SupplierUpdateDTO } from '@/types/supplier'

function normalizePagination<T>(
  data: any,
  fallbackItems: T[]
): Paginated<T> {
  const rawPagination = data?.pagination || data?.meta?.pagination || null
  const items: T[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.suppliers)
    ? data.suppliers
    : fallbackItems

  const limit = rawPagination?.limit ?? rawPagination?.pageSize ?? 10
  const total = rawPagination?.total ?? items.length
  const totalPages = rawPagination?.pages ?? rawPagination?.totalPages ?? Math.ceil(total / (limit || 10))

  return {
    items,
    page: rawPagination?.page ?? 1,
    limit,
    total,
    totalPages
  }
}

export async function listSuppliers(filters: SupplierFilters = {}): Promise<Paginated<Supplier>> {
  const params = new URLSearchParams()
  
  // Búsqueda rápida
  if (filters.q) params.append('q', String(filters.q))
  
  // Filtro por estado
  if (filters.status) params.append('status', String(filters.status))
  
  // Ordenamiento
  if (filters.sort) params.append('sort', String(filters.sort))
  if (filters.order) params.append('order', String(filters.order))
  
  // Paginación
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) {
    params.append('limit', String(filters.limit))
    params.append('pageSize', String(filters.limit)) // Compatibilidad
  }

  const resp = await apiClient.get(`/suppliers?${params.toString()}`)
  const payload = resp.data
  const rawItems: any[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.suppliers)
    ? payload.suppliers
    : []

  return normalizePagination<Supplier>(payload, rawItems)
}

export async function getSupplier(id: string): Promise<Supplier> {
  const resp = await apiClient.get(`/suppliers/${id}`)
  const data = resp.data?.data || resp.data?.supplier || resp.data
  return data as Supplier
}

export async function createSupplier(payload: Partial<SupplierCreateDTO>): Promise<Supplier> {
  const resp = await apiClient.post('/suppliers', payload)
  const data = resp.data?.data || resp.data?.supplier || resp.data
  return data as Supplier
}

export async function updateSupplier(id: string, payload: Partial<SupplierUpdateDTO>): Promise<Supplier> {
  const resp = await apiClient.put(`/suppliers/${id}`, payload)
  const data = resp.data?.data || resp.data?.supplier || resp.data
  return data as Supplier
}

export async function removeSupplier(id: string): Promise<void> {
  await apiClient.delete(`/suppliers/${id}`)
}

// Servicio para importar productos de un proveedor
export async function importSupplierProducts(supplierId: string, file: File): Promise<any> {
  const form = new FormData()
  form.append('file', file)
  
  const resp = await apiClient.post(`/suppliers/${supplierId}/products/import/execute`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  
  return resp.data?.data || resp.data
}

// Servicio para obtener el historial de importaciones de un proveedor
export async function getSupplierImports(supplierId: string): Promise<any[]> {
  const resp = await apiClient.get(`/suppliers/${supplierId}/imports`)
  return resp.data?.data || resp.data || []
}