import { apiClient } from './api'

export interface UserDTO {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'user' | 'viewer' | string
  status: 'active' | 'inactive' | 'suspended' | string
  lastLogin?: string | null
  createdAt: string
}

export interface UserFilters {
  q?: string
  role?: string
  status?: string
  page?: number
  size?: number
  sortBy?: 'name' | 'email' | 'role' | 'status' | 'lastLogin' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface UsersResponse {
  users: UserDTO[]
  pagination: Pagination
}

// Lista usuarios con filtros compatibles con backend /api/users
export async function listUsers(filters: UserFilters = {}): Promise<UsersResponse> {
  const params = new URLSearchParams()
  if (filters.q) params.append('q', filters.q)
  if (filters.role) params.append('role', filters.role)
  if (filters.status) params.append('status', filters.status)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.size) params.append('size', String(filters.size))
  if (filters.sortBy || filters.sortOrder) {
    const sort = `${filters.sortBy || 'createdAt'}:${filters.sortOrder || 'desc'}`
    params.append('sort', sort)
  }

  const { data } = await apiClient.get(`/users?${params.toString()}`)
  // La API devuelve { users, pagination }
  return {
    users: Array.isArray(data?.users) ? data.users : [],
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
  }
}

// Crear usuario (admin)
export interface CreateUserData {
  name: string
  email: string
  role?: 'admin' | 'manager' | 'user' | 'viewer' | string
  status?: 'active' | 'inactive' | 'suspended' | string
}

export async function createUser(payload: CreateUserData): Promise<UserDTO> {
  const { data } = await apiClient.post('/users', payload)
  return data?.user || data
}

// Enviar invitación al usuario
export async function sendInvite(userId: string): Promise<{ ok: boolean; message: string }>
{
  const { data } = await apiClient.post(`/users/${userId}/send-invite`)
  return { ok: !!data?.ok, message: data?.message || 'Invitación enviada' }
}

// Listar roles disponibles
export async function listRoles(): Promise<string[]> {
  const { data } = await apiClient.get('/roles')
  return Array.isArray(data?.roles) ? data.roles : []
}