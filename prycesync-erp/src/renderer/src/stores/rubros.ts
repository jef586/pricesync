import { defineStore } from 'pinia'
import type { RubroDTO, RubroNode, RubroFilters, Paginated, RubroListParams } from '@/types/rubro'
import { listRubros, getRubroChildren, createRubro, updateRubro, deleteRubro, restoreRubro, moveRubro, fetchRubrosList, getRubroTree } from '@/services/rubros'

export const useRubrosStore = defineStore('rubros', {
  state: () => ({
    tree: [] as RubroNode[],
    selectedNode: null as RubroNode | null,
    items: [] as RubroDTO[],
    filters: { q: '', status: 'active', sort: 'name', order: 'asc' } as RubroFilters,
    pagination: { page: 1, size: 20, total: 0, pages: 0 },
    loading: false,
    error: null as string | null
  }),

  getters: {
    filteredItems: (state) => {
      let res = state.items
      if (state.filters.q) {
        const q = state.filters.q.toLowerCase()
        res = res.filter((it) => it.name.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q))
      }
      if (state.filters.status === 'active') {
        res = res.filter((it) => !it.deletedAt && it.isActive)
      } else if (state.filters.status === 'inactive') {
        res = res.filter((it) => !it.deletedAt && !it.isActive)
      } else if (state.filters.status === 'deleted') {
        res = res.filter((it) => !!it.deletedAt)
      }
      return res
    },
    totalActive: (state) => state.items.filter((it) => !it.deletedAt && it.isActive).length,
    totalInactive: (state) => state.items.filter((it) => !it.deletedAt && !it.isActive).length,
    totalDeleted: (state) => state.items.filter((it) => !!it.deletedAt).length
  },

  actions: {
    async fetchTree() {
      try {
        this.loading = true
        this.error = null
        const treeData = await getRubroTree()
        this.tree = treeData.map((it) => ({ ...it, loaded: true, loading: false }))
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al cargar rubros raíz'
        this.tree = []
      } finally {
        this.loading = false
      }
    },

    async fetchList(params: RubroListParams = {}) {
      try {
        this.loading = true
        this.error = null
        
        // Merge with current filters and pagination
        const mergedParams: RubroListParams = {
          page: params.page ?? this.pagination.page,
          size: params.size ?? this.pagination.size,
          q: params.q ?? this.filters.q,
          parentId: params.parentId ?? this.filters.parentId,
          status: params.status ?? this.filters.status,
          sort: params.sort ?? this.filters.sort,
          order: params.order ?? this.filters.order
        }
        
        const res: Paginated<RubroDTO> = await fetchRubrosList(mergedParams)
        this.items = res.items
        this.pagination.total = res.total
        this.pagination.pages = res.pages
        this.pagination.page = res.page
        this.pagination.size = res.size
        
        // Update filters from response if available
        if (res.filters) {
          this.filters = { ...this.filters, ...res.filters }
        }
        
        return res
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al cargar rubros'
        this.items = []
        this.pagination = { page: 1, size: this.pagination.size, total: 0, pages: 0 }
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchChildren(parentId: string | null, filters?: RubroFilters) {
      try {
        this.loading = true
        this.error = null
        if (filters) this.setFilters(filters)
        const res: Paginated<RubroDTO> = await getRubroChildren(parentId, { 
          page: this.pagination.page, 
          size: this.pagination.size, 
          q: this.filters.q, 
          status: this.filters.status,
          sort: this.filters.sort,
          order: this.filters.order
        })
        this.items = res.items
        this.pagination.total = res.total
        this.pagination.pages = res.pages
        this.pagination.page = res.page
        this.pagination.size = res.size
        if (parentId) {
          const node = this.findNode(parentId)
          if (node) {
            node.children = res.items.map((it) => ({ ...it, children: [], loaded: false, loading: false }))
            node.loaded = true
            node.loading = false
          }
        }
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al cargar subrubros'
        this.items = []
        this.pagination = { page: 1, size: this.pagination.size, total: 0, pages: 0 }
      } finally {
        this.loading = false
      }
    },

    async expandNode(nodeId: string) {
      const node = this.findNode(nodeId)
      if (!node) return
      if (node.loaded) return
      node.loading = true
      try {
        const res = await getRubroChildren(nodeId, { page: 1, size: 50, status: this.filters.status })
        node.children = res.items.map((it) => ({ ...it, children: [], loaded: false, loading: false }))
        node.loaded = true
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al expandir nodo'
      } finally {
        node.loading = false
      }
    },

    async selectNode(node: RubroNode | null) {
      this.selectedNode = node
      await this.fetchChildren(node?.id ?? null)
    },

    setFilters(filters: RubroFilters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1
    },

    setSort(sort: 'name' | 'level' | 'createdAt', order: 'asc' | 'desc') {
      this.filters.sort = sort
      this.filters.order = order
      this.pagination.page = 1
    },

    setPage(page: number) {
      this.pagination.page = Math.max(1, page)
      return this.fetchChildren(this.selectedNode?.id ?? null)
    },

    setPageSize(size: number) {
      this.pagination.size = Math.max(5, size)
      this.pagination.page = 1
      return this.fetchChildren(this.selectedNode?.id ?? null)
    },

    clearCache() {
      this.tree = []
      this.items = []
      this.selectedNode = null
      this.pagination = { page: 1, size: 10, total: 0, pages: 0 }
      this.error = null
    },

    async createSubrubro(parentId: string | null, payload: Partial<RubroDTO>) {
      const created = await createRubro({ ...payload, parentId })
      await this.fetchChildren(parentId ?? null)
      return created
    },

    async updateRubro(id: string, payload: Partial<RubroDTO>) {
      const updated = await updateRubro(id, payload)
      this.items = this.items.map((it) => (it.id === id ? updated : it))
      const node = this.findNode(id)
      if (node) Object.assign(node, updated)
      return updated
    },

    async removeRubro(id: string) {
      await deleteRubro(id)
      this.items = this.items.filter((it) => it.id !== id)
      this.pagination.total = Math.max(0, this.pagination.total - 1)
    },

    async restoreRubro(id: string) {
      const restored = await restoreRubro(id)
      this.items = this.items.map((it) => (it.id === id ? restored : it))
      return restored
    },

    async moveRubro(id: string, newParentId: string | null) {
      const moved = await moveRubro(id, newParentId)
      await this.fetchChildren(this.selectedNode?.id ?? null)
      return moved
    },

    findNode(id: string): RubroNode | null {
      const dfs = (nodes: RubroNode[]): RubroNode | null => {
        for (const n of nodes) {
          if (n.id === id) return n
          const found = n.children && n.children.length ? dfs(n.children) : null
          if (found) return found
        }
        return null
      }
      return dfs(this.tree)
    }
  }
})
