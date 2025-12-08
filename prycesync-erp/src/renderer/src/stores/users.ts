import { defineStore } from 'pinia'
import type { UserDTO, UserFilters } from '@/services/users'
import { listUsers, getUserById, updateUser as apiUpdateUser, updateStatus as apiUpdateStatus, deleteUser as apiDeleteUser, restoreUser as apiRestoreUser, resetPassword as apiResetPassword } from '@/services/users'
import { getRolesCatalog, getRolesMatrix, updateRolePermissions, type RolesResponse, type RolesMatrixResponse } from '@/services/roles'

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [] as UserDTO[],
    total: 0,
    page: 1,
    pageSize: 8,
    loading: false,
    error: null as string | null,
    loadingIds: [] as string[],
    filters: {
      q: '',
      role: undefined as string | undefined,
      status: undefined as string | undefined,
      sortBy: 'createdAt' as UserFilters['sortBy'],
      sortOrder: 'desc' as UserFilters['sortOrder'],
      deleted: false
    } as UserFilters
  }),

  getters: {
    byId: (state) => (id: string) => state.items.find((u) => u.id === id),
  },

  actions: {
    async list(filters?: Partial<UserFilters>) {
      try {
        this.loading = true
        this.error = null
        const merged: UserFilters = {
          q: filters?.q ?? this.filters.q,
          role: filters?.role ?? this.filters.role,
          status: filters?.status ?? this.filters.status,
          page: filters?.page ?? this.page,
          size: filters?.size ?? this.pageSize,
          sortBy: filters?.sortBy ?? this.filters.sortBy,
          sortOrder: filters?.sortOrder ?? this.filters.sortOrder,
          deleted: typeof filters?.deleted === 'boolean' ? filters!.deleted! : this.filters.deleted
        }
        const { users, pagination } = await listUsers(merged)
        this.items = users
        this.total = pagination.total
        this.page = pagination.page
        this.pageSize = pagination.limit
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al cargar usuarios'
        this.items = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    async getById(id: string) {
      try {
        this.loading = true
        this.error = null
        const existing = this.items.find(u => u.id === id)
        if (existing) return existing
        const user = await getUserById(id)
        // Normalize lastLogin field name if needed
        const mapped = { ...user, lastLogin: (user as any).lastLogin ?? (user as any).lastLoginAt }
        this.items.push(mapped as UserDTO)
        return mapped as UserDTO
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al cargar usuario'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateUser(id: string, payload: { name: string; role: string }) {
      try {
        this.loading = true
        this.error = null
        const updated = await apiUpdateUser(id, payload)
        const index = this.items.findIndex(u => u.id === id)
        if (index !== -1) {
          this.items[index] = { ...this.items[index], ...updated }
        }
        return updated
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al actualizar usuario'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
      try {
        this.error = null
        if (!this.loadingIds.includes(id)) this.loadingIds.push(id)
        const updated = await apiUpdateStatus(id, { status })
        const index = this.items.findIndex(u => u.id === id)
        if (index !== -1) {
          this.items[index] = { ...this.items[index], ...updated }
        }
        return updated
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al actualizar estado'
        throw err
      } finally {
        this.loadingIds = this.loadingIds.filter(x => x !== id)
      }
    },

    setFilters(partial: Partial<UserFilters>) {
      this.filters = { ...this.filters, ...partial }
      this.page = 1
    },

    setSort(sortBy: UserFilters['sortBy'], sortOrder: UserFilters['sortOrder'] = 'asc') {
      this.filters.sortBy = sortBy
      this.filters.sortOrder = sortOrder
      this.page = 1
    },

    setPage(page: number) {
      this.page = Math.max(1, page)
    },

    async removeUser(id: string, reason?: string) {
      try {
        if (!this.loadingIds.includes(id)) this.loadingIds.push(id)
        const ok = await apiDeleteUser(id, reason)
        if (ok) {
          if (!this.filters.deleted) {
            this.items = this.items.filter(u => u.id !== id)
            this.total = Math.max(0, this.total - 1)
          } else {
            await this.list()
          }
        }
        return ok
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al eliminar usuario'
        return false
      } finally {
        this.loadingIds = this.loadingIds.filter(x => x !== id)
      }
    },

    async restoreUser(id: string, reason?: string) {
      try {
        if (!this.loadingIds.includes(id)) this.loadingIds.push(id)
        const ok = await apiRestoreUser(id, reason)
        if (ok) {
          if (this.filters.deleted) {
            this.items = this.items.filter(u => u.id !== id)
            this.total = Math.max(0, this.total - 1)
          } else {
            await this.list()
          }
        }
        return ok
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al restaurar usuario'
        return false
      } finally {
        this.loadingIds = this.loadingIds.filter(x => x !== id)
      }
    },

    async resetPassword(id: string, opts?: { notify?: boolean }) {
      try {
        if (!this.loadingIds.includes(id)) this.loadingIds.push(id)
        const result = await apiResetPassword(id, opts || {})
        return result
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error creando reset de contraseña'
        throw err
      } finally {
        this.loadingIds = this.loadingIds.filter(x => x !== id)
      }
    },

    reset() {
      this.items = []
      this.total = 0
      this.page = 1
      this.pageSize = 8
      this.error = null
      this.filters = { q: '', role: undefined, status: undefined, sortBy: 'createdAt', sortOrder: 'desc', deleted: false }
    }
  }
})

// Store de Roles y Permisos (integrado en módulo de usuarios)
export const useRolesStore = defineStore('roles', {
  state: () => ({
    roles: [] as string[],
    catalog: [] as { code: string; label: string; description?: string }[],
    permissions: [] as { code: string; label: string; group?: string }[],
    matrix: [] as Array<{ role: string; permissions: string[] }>,
    draftMatrix: [] as Array<{ role: string; permissions: string[] }>,
    loading: false,
    error: null as string | null,
    editing: false,
    saving: false,
    selectedRole: '' as string,
    selectedGroup: '' as string,
    search: '' as string,
  }),

  getters: {
    groups(state) {
      const set = new Set<string>()
      for (const p of state.permissions) {
        if (p.group) set.add(p.group)
      }
      return Array.from(set)
    },
    filteredPermissions(state) {
      const q = state.search.trim().toLowerCase()
      const group = state.selectedGroup.trim()
      const base = state.permissions.filter(p => {
        const matchesSearch = !q || p.code.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)
        const matchesGroup = !group || p.group === group
        return matchesSearch && matchesGroup
      })
      if (!state.selectedRole) return base
      // Si hay rol seleccionado, no filtramos permisos; el rol se aplica en la vista para columnas
      return base
    },
    roleHas: (state) => (role: string, perm: string) => {
      const row = state.matrix.find(r => r.role === role)
      return !!row && row.permissions.includes(perm)
    }
  },

  actions: {
    async fetchAll() {
      await Promise.all([this.fetchRoles(), this.fetchMatrix()])
    },
    async fetchRoles() {
      try {
        this.loading = true
        this.error = null
        const res: RolesResponse = await getRolesCatalog()
        this.roles = res.roles || []
        this.catalog = res.catalog || []
        // Seleccionar primer rol por defecto si existe
        if (!this.selectedRole && this.roles.length) this.selectedRole = this.roles[0]
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al cargar roles'
        this.roles = []
        this.catalog = []
      } finally {
        this.loading = false
      }
    },
    async fetchMatrix() {
      try {
        this.loading = true
        this.error = null
        const res: RolesMatrixResponse = await getRolesMatrix()
        this.permissions = res.permissions || []
        this.matrix = res.matrix || []
        // Si aún no tenemos roles del catálogo, usar los de la matriz
        if (this.roles.length === 0 && Array.isArray(res.roles)) {
          this.roles = res.roles
          if (!this.selectedRole && this.roles.length) this.selectedRole = this.roles[0]
        }
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al cargar matriz de permisos'
        this.permissions = []
        this.matrix = []
      } finally {
        this.loading = false
      }
    },
    startEdit() {
      this.editing = true
      // Clonar matriz actual a draft
      this.draftMatrix = this.matrix.map(r => ({ role: r.role, permissions: [...r.permissions] }))
    },
    cancelEdit() {
      this.editing = false
      this.draftMatrix = []
    },
    applyDraft(draft: Array<{ role: string; permissions: string[] }>) {
      // Reemplaza el draft con el parámetro
      const map = new Map(draft.map(r => [r.role, new Set(r.permissions)]))
      this.draftMatrix = this.roles.map(role => ({ role, permissions: Array.from(map.get(role) || new Set()) }))
    },
    computeDiff(original: Array<{ role: string; permissions: string[] }>, draft: Array<{ role: string; permissions: string[] }>) {
      const byRole = (arr: Array<{ role: string; permissions: string[] }>) => {
        const m = new Map<string, Set<string>>()
        for (const r of arr) m.set(r.role, new Set(r.permissions))
        return m
      }
      const o = byRole(original)
      const d = byRole(draft)
      const result: Record<string, { added: string[]; removed: string[] }> = {}
      for (const role of this.roles) {
        const oSet = o.get(role) || new Set<string>()
        const dSet = d.get(role) || new Set<string>()
        const added = Array.from(dSet).filter(p => !oSet.has(p))
        const removed = Array.from(oSet).filter(p => !dSet.has(p))
        result[role] = { added, removed }
      }
      return result
    },
    async saveRole(role: string, permissions: string[]) {
      try {
        this.saving = true
        this.error = null
        const res = await updateRolePermissions(role, permissions)
        // Optimistic update: aplicar a matriz base si éxito
        const idx = this.matrix.findIndex(r => r.role === role)
        if (idx !== -1) {
          this.matrix[idx] = { role, permissions: [...permissions] }
        } else {
          this.matrix.push({ role, permissions: [...permissions] })
        }
        return res
      } catch (err: any) {
        this.error = err?.response?.data?.error || err?.message || 'Error al guardar permisos del rol'
        throw err
      } finally {
        this.saving = false
      }
    },
    async saveAllChanges() {
      // Guarda por rol en secuencia para mantener respuesta clara; mantenerlo simple
      const original = this.matrix
      const draft = this.draftMatrix
      const diffByRole = this.computeDiff(original, draft)
      try {
        this.saving = true
        this.error = null
        for (const role of this.roles) {
          const target = draft.find(r => r.role === role)
          if (!target) continue
          const changes = diffByRole[role]
          // Si no hay cambios, saltar
          if (!changes || (changes.added.length === 0 && changes.removed.length === 0)) continue
          await this.saveRole(role, target.permissions)
        }
        // Terminar edición
        this.editing = false
        this.draftMatrix = []
        return diffByRole
      } catch (err) {
        throw err
      } finally {
        this.saving = false
      }
    },
    setSearch(q: string) {
      this.search = q
    },
    setSelectedRole(role: string) {
      this.selectedRole = role
    },
    setSelectedGroup(group: string) {
      this.selectedGroup = group
    },
    reset() {
      this.roles = []
      this.catalog = []
      this.permissions = []
      this.matrix = []
      this.draftMatrix = []
      this.loading = false
      this.error = null
      this.editing = false
      this.saving = false
      this.selectedRole = ''
      this.selectedGroup = ''
      this.search = ''
    }
  }
})
