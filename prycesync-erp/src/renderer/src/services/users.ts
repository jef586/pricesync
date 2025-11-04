import { apiClient } from './api'

export interface UserDTO {
  id: string
  name: string
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'SUPERVISOR' | 'SELLER' | 'TECHNICIAN' | 'admin' | 'manager' | 'user' | 'viewer' | string
  status: 'active' | 'inactive' | 'suspended' | string
  lastLogin?: string | null
  createdAt: string
  deletedAt?: string | null
}

export interface UserFilters {
  q?: string
  role?: string
  status?: string
  page?: number
  size?: number
  sortBy?: 'name' | 'email' | 'role' | 'status' | 'lastLogin' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  deleted?: boolean
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
  if (typeof filters.deleted === 'boolean') params.append('deleted', String(filters.deleted))

  const { data } = await apiClient.get(`/users?${params.toString()}`)
  // La API devuelve { users, pagination }
  return {
    users: Array.isArray(data?.users) ? data.users : [],
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
  }
}

// Eliminar (soft delete)
export async function deleteUser(id: string, reason?: string): Promise<boolean> {
  const { data } = await apiClient.delete(`/users/${id}`, { data: reason ? { reason } : undefined })
  return !!data?.ok
}

// Restaurar usuario
export async function restoreUser(id: string, reason?: string): Promise<boolean> {
  const { data } = await apiClient.patch(`/users/${id}/restore`, reason ? { reason } : undefined)
  return !!data?.ok
}

// Obtener usuario por ID
export async function getUserById(id: string): Promise<UserDTO & { isLastSuperadmin?: boolean } > {
  const { data } = await apiClient.get(`/users/${id}`)
  const u = data?.user || data?.data || data
  return u
}

// Actualizar nombre y rol
export async function updateUser(id: string, payload: { name: string; role: string }): Promise<Pick<UserDTO, 'id' | 'name' | 'role'>> {
  const { data } = await apiClient.put(`/users/${id}`, payload)
  const u = data?.user || data?.data || data
  return u
}

// Actualizar estado
export async function updateStatus(id: string, payload: { status: 'active' | 'inactive' | 'suspended' }): Promise<Pick<UserDTO, 'id' | 'status'>> {
  const { data } = await apiClient.patch(`/users/${id}/status`, payload)
  const u = data?.user || data?.data || data
  return u
}

// Crear usuario (admin)
export interface CreateUserData {
  name: string
  email: string
  role?: 'SUPERADMIN' | 'ADMIN' | 'SUPERVISOR' | 'SELLER' | 'TECHNICIAN' | 'admin' | 'manager' | 'user' | 'viewer' | string
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

// Eliminar usuario por ID
// Reset de contraseña (admin)
export async function resetPassword(userId: string, payload: { notify?: boolean } = {}): Promise<{ ok: boolean; link?: string; message: string }>{
  const { data } = await apiClient.post(`/users/${userId}/reset-password`, payload)
  return { ok: !!data?.ok, link: data?.link, message: data?.message || 'Token generado' }
}
export async function revokeSessions(userId: string): Promise<{ ok: boolean; message: string }> {
  const { data } = await apiClient.post(`/users/${userId}/revoke-sessions`)
  return { ok: !!data?.ok, message: data?.message || 'Sesiones revocadas' }
}


