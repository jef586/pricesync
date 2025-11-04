import { apiClient } from './api'

export interface RoleCatalogItem {
  code: string
  label: string
  description?: string
}

export interface PermissionCatalogItem {
  code: string
  label: string
  group?: string
}

export interface RolesResponse {
  roles: string[]
  catalog: RoleCatalogItem[]
}

export interface RolesMatrixRow {
  role: string
  permissions: string[]
}

export interface RolesMatrixResponse {
  permissions: PermissionCatalogItem[]
  roles: string[]
  matrix: RolesMatrixRow[]
}

export async function getRolesCatalog(): Promise<RolesResponse> {
  const { data } = await apiClient.get('/roles')
  const payload = data?.data || data || {}
  return {
    roles: Array.isArray(payload.roles) ? payload.roles : [],
    catalog: Array.isArray(payload.catalog) ? payload.catalog : []
  }
}

export async function getRolesMatrix(): Promise<RolesMatrixResponse> {
  const { data } = await apiClient.get('/roles/matrix')
  const payload = data?.data || data || {}
  return {
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    roles: Array.isArray(payload.roles) ? payload.roles : [],
    matrix: Array.isArray(payload.matrix) ? payload.matrix : []
  }
}