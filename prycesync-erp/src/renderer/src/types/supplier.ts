// Tipos para proveedores

export interface Supplier {
  id: string
  code: string
  name: string
  email: string
  phone: string
  taxId: string
  address: string
  status: 'active' | 'inactive'
  contactEmail?: string
  contactPhone?: string
  lastListName?: string
  lastListDate?: string
  importedProductsCount?: number
  lastImportDate?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface SupplierFilters {
  // Búsqueda rápida por nombre, código, email o teléfono
  q?: string
  // Filtro por estado
  status?: 'active' | 'inactive'
  // Ordenamiento
  sort?: 'name' | 'updated_at' | 'code'
  order?: 'asc' | 'desc'
  // Paginación
  page?: number
  limit?: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SupplierCreateDTO {
  code: string
  name: string
  email: string
  phone: string
  taxId: string
  address: string
  status: 'active' | 'inactive'
  contactEmail?: string
  contactPhone?: string
}

export interface SupplierUpdateDTO {
  code?: string
  name?: string
  email?: string
  phone?: string
  taxId?: string
  address?: string
  status?: 'active' | 'inactive'
  contactEmail?: string
  contactPhone?: string
}