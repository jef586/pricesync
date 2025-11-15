export type RubroStatus = 'activo' | 'inactivo' | 'eliminado'

export interface RubroDTO {
  id: string
  name: string
  description?: string | null
  parentId?: string | null
  level: number
  path?: string | null
  isActive: boolean
  marginRate?: number
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  parent?: { id: string; name: string } | null
  _count?: { children: number; articles: number }
}

export interface RubroNode extends RubroDTO {
  children?: RubroNode[]
  loaded?: boolean
  loading?: boolean
}

export interface RubroFilters {
  q?: string
  status?: 'active' | 'inactive' | 'deleted' | 'all'
  parentId?: string | null
  sort?: 'name' | 'level' | 'createdAt'
  order?: 'asc' | 'desc'
}

export interface RubroListParams extends RubroFilters {
  page?: number
  size?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
  filters?: RubroFilters
}
