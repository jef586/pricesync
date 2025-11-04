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
  catalog?: RoleCatalogItem[]
}

export interface RolesMatrixResponse {
  permissions: PermissionCatalogItem[]
  roles: string[]
  matrix: Array<{ role: string; permissions: string[] }>
}

export async function getRolesCatalog(): Promise<RolesResponse> {
  const { data } = await apiClient.get('/roles')
  // Backend puede devolver { roles, catalog }
  return {
    roles: Array.isArray(data?.roles) ? data.roles : [],
    catalog: Array.isArray(data?.catalog) ? data.catalog : undefined
  }
}

export async function getRolesMatrix(): Promise<RolesMatrixResponse> {
  const { data } = await apiClient.get('/roles/matrix')
  // Normalizar estructura
  const permissions: PermissionCatalogItem[] = Array.isArray(data?.permissions)
    ? data.permissions
    : []
  const roles: string[] = Array.isArray(data?.roles)
    ? data.roles
    : []
  const rawMatrix = Array.isArray(data?.matrix) ? data.matrix : []
  const matrix: Array<{ role: string; permissions: string[] }> = rawMatrix.map((row: any) => ({
    role: String(row.role),
    permissions: Array.isArray(row.permissions) ? row.permissions : []
  }))
  return { permissions, roles, matrix }
}