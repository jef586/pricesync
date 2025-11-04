import { defineStore } from 'pinia'
import type { UserDTO, UserFilters } from '@/services/users'
import { listUsers, getUserById, updateUser as apiUpdateUser, updateStatus as apiUpdateStatus, deleteUser as apiDeleteUser, restoreUser as apiRestoreUser, resetPassword as apiResetPassword } from '@/services/users'

export const useUsersStore = defineStore('users', {
  state: () => ({
    items: [] as UserDTO[],
    total: 0,
    page: 1,
    pageSize: 20,
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
      this.pageSize = 20
      this.error = null
      this.filters = { q: '', role: undefined, status: undefined, sortBy: 'createdAt', sortOrder: 'desc', deleted: false }
    }
  }
})