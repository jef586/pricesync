import { defineStore } from 'pinia'
import type { ArticleDTO, ArticleFilters, Paginated } from '@/types/article'
import { listArticles, getArticle, createArticle, updateArticle, removeArticle } from '@/services/articles'

// UH-ART-3: Store Pinia para Artículos

export const useArticleStore = defineStore('articles', {
  state: () => ({
    items: [] as ArticleDTO[],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null as string | null,
    filters: {
      q: '',
      rubroId: undefined as string | undefined,
      active: undefined as boolean | undefined,
      controlStock: undefined as boolean | undefined
    } as ArticleFilters
  }),

  getters: {
    byId: (state) => (id: string) => state.items.find((a) => a.id === id),
    activeItems: (state) => state.items.filter((a) => a.active),
    lowStock: (state) => state.items.filter((a) => typeof a.stockMin === 'number' && a.stock <= (a.stockMin ?? 0))
  },

  actions: {
    async list(params: ArticleFilters = {}) {
      try {
        this.loading = true
        this.error = null
        // merge filters and pagination
        this.filters = {
          ...this.filters,
          ...params
        }
        const effective: ArticleFilters = {
          q: this.filters.q,
          rubroId: this.filters.rubroId,
          active: this.filters.active,
          controlStock: this.filters.controlStock,
          page: params.page ?? this.page,
          pageSize: params.pageSize ?? this.pageSize
        }
        const res: Paginated<ArticleDTO> = await listArticles(effective)
        this.items = res.items
        this.page = res.page
        this.pageSize = res.pageSize
        this.total = res.total
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al listar artículos'
        this.items = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    async get(id: string): Promise<ArticleDTO> {
      try {
        this.loading = true
        this.error = null
        const art = await getArticle(id)
        return art
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al obtener artículo'
        throw err
      } finally {
        this.loading = false
      }
    },

    async create(payload: Partial<ArticleDTO>): Promise<ArticleDTO> {
      try {
        this.loading = true
        this.error = null
        const created = await createArticle(payload)
        // Actualizar lista local si estamos en primera página
        this.items = [created, ...this.items]
        this.total += 1
        return created
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al crear artículo'
        throw err
      } finally {
        this.loading = false
      }
    },

    async update(id: string, payload: Partial<ArticleDTO>): Promise<ArticleDTO> {
      try {
        this.loading = true
        this.error = null
        const updated = await updateArticle(id, payload)
        this.items = this.items.map((it) => (it.id === id ? updated : it))
        return updated
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al actualizar artículo'
        throw err
      } finally {
        this.loading = false
      }
    },

    async remove(id: string): Promise<void> {
      try {
        this.loading = true
        this.error = null
        await removeArticle(id)
        this.items = this.items.filter((it) => it.id !== id)
        this.total = Math.max(0, this.total - 1)
      } catch (err: any) {
        this.error = err?.response?.data?.message || err?.message || 'Error al eliminar artículo'
        throw err
      } finally {
        this.loading = false
      }
    },

    setFilters(f: ArticleFilters) {
      this.filters = { ...this.filters, ...f }
      // Al cambiar filtros, resetear página
      this.page = 1
    },

    setPage(p: number) {
      this.page = Math.max(1, p)
    },

    reset() {
      this.items = []
      this.total = 0
      this.page = 1
      this.pageSize = 10
      this.loading = false
      this.error = null
      this.filters = { q: '', rubroId: undefined, active: undefined, controlStock: undefined }
    }
  }
})