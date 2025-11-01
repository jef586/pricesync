﻿import { apiClient } from './api'
import type { ArticleDTO, ArticleFilters, Paginated } from '@/types/article'

// UH-ART-3: Servicio HTTP para Artículos (/api/articles)

function normalizePagination<T>(
  data: any,
  fallbackItems: T[]
): Paginated<T> {
  const rawPagination = data?.pagination || data?.meta?.pagination || null
  const items: T[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.articles)
    ? data.articles
    : fallbackItems

  const pageSize = rawPagination?.limit ?? rawPagination?.pageSize ?? 10
  const total = rawPagination?.total ?? items.length
  const pages = rawPagination?.pages ?? rawPagination?.totalPages ?? Math.ceil(total / (pageSize || 10))

  return {
    items,
    page: rawPagination?.page ?? 1,
    pageSize,
    total,
    totalPages: pages
  }
}

export async function listArticles(filters: ArticleFilters = {}): Promise<Paginated<ArticleDTO>> {
  const params = new URLSearchParams()
  // Compat: mapear filtros del store a los esperados por el backend
  // q -> search
  if ((filters as any).search) params.append('search', String((filters as any).search))
  else if (filters.q) params.append('search', String(filters.q))
  // rubroId -> categoryId
  if (filters.rubroId) params.append('categoryId', String(filters.rubroId))
  // type (si existiera)
  if ((filters as any).type) params.append('type', String((filters as any).type))
  // active
  if (typeof filters.active === 'boolean') params.append('active', String(filters.active))
  // controlStock (si aplica)
  if (typeof filters.controlStock === 'boolean') params.append('controlStock', String(filters.controlStock))
  // pagination
  if (filters.page) params.append('page', String(filters.page))
  if (filters.pageSize) {
    // Enviar ambos por compatibilidad
    params.append('pageSize', String(filters.pageSize))
    params.append('limit', String(filters.pageSize))
  }
  // sorting opcional
  const sortBy = (filters as any).sortBy
  const sortOrder = (filters as any).sortOrder
  if (sortBy) params.append('sortBy', String(sortBy))
  if (sortOrder) params.append('sortOrder', String(sortOrder))

  const resp = await apiClient.get(`/articles?${params.toString()}`)
  const payload = resp.data
  const rawItems: any[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.articles)
    ? payload.articles
    : Array.isArray(payload)
    ? payload
    : []

  // Map view helper fields
  const items: ArticleDTO[] = rawItems.map((a: any) => ({
    ...a,
    categoryName: a?.category?.name,
    barcodesCount: a?._count?.barcodes ?? 0
  }))

  return normalizePagination<ArticleDTO>(payload, items)
}

export async function getArticle(id: string): Promise<ArticleDTO> {
  const resp = await apiClient.get(`/articles/${id}`)
  const data = resp.data?.data || resp.data
  return data as ArticleDTO
}

export async function createArticle(payload: Partial<ArticleDTO>): Promise<ArticleDTO> {
  const resp = await apiClient.post('/articles', payload)
  const data = resp.data?.data || resp.data
  return data as ArticleDTO
}

export async function updateArticle(id: string, payload: Partial<ArticleDTO>): Promise<ArticleDTO> {
  const resp = await apiClient.put(`/articles/${id}`, payload)
  const data = resp.data?.data || resp.data
  return data as ArticleDTO
}

export async function removeArticle(id: string): Promise<void> {
  await apiClient.delete(`/articles/${id}`)
}

// Vinculación de proveedores al artículo
export async function addArticleSupplierLink(
  articleId: string,
  supplierId: string,
  options: { supplierSku?: string; isPrimary?: boolean } = {}
): Promise<any> {
  const payload = {
    supplierId,
    supplierSku: options.supplierSku,
    isPrimary: options.isPrimary
  }
  const resp = await apiClient.post(`/articles/${articleId}/suppliers`, payload)
  return resp.data?.data || resp.data
}

// Obtener vínculos de proveedores de un artículo
export async function getArticleSuppliers(articleId: string): Promise<any[]> {
  const resp = await apiClient.get(`/articles/${articleId}/suppliers`)
  return resp.data?.data || resp.data || []
}

// Actualizar un vínculo proveedor-artículo
export async function updateArticleSupplierLink(
  articleId: string,
  linkId: string,
  payload: { supplierSku?: string; isPrimary?: boolean }
): Promise<any> {
  const resp = await apiClient.put(`/articles/${articleId}/suppliers/${linkId}`, payload)
  return resp.data?.data || resp.data
}

// Eliminar un vínculo proveedor-artículo
export async function deleteArticleSupplierLink(articleId: string, linkId: string): Promise<void> {
  await apiClient.delete(`/articles/${articleId}/suppliers/${linkId}`)
}

// --- Subrecursos: códigos de barras secundarios ---
export async function getArticleBarcodes(articleId: string): Promise<Array<{ id: string; code: string }>> {
  const resp = await apiClient.get(`/articles/${articleId}/barcodes`)
  const rows = resp.data?.data || resp.data || []
  // Normalize to minimal shape expected by form
  return rows.map((r: any) => ({ id: r.id, code: r.code }))
}

export async function addArticleBarcode(articleId: string, code: string, type: string | null = null): Promise<{ id: string; code: string }> {
  const payload: any = { code }
  if (type) payload.type = type
  const resp = await apiClient.post(`/articles/${articleId}/barcodes`, payload)
  const r = resp.data?.data || resp.data
  return { id: r.id, code: r.code }
}

export async function deleteArticleBarcode(articleId: string, barcodeId: string): Promise<void> {
  await apiClient.delete(`/articles/${articleId}/barcodes/${barcodeId}`)
}

// Resolver artículo por barcode/sku o equivalencia de proveedor
export async function resolveArticle(params: {
  barcode?: string
  sku?: string
  supplierId?: string
  supplierSku?: string
}): Promise<ArticleDTO | null> {
  const query = new URLSearchParams()
  if (params.barcode) query.append('barcode', params.barcode)
  if (params.sku) query.append('sku', params.sku)
  if (params.supplierId) query.append('supplierId', params.supplierId)
  if (params.supplierSku) query.append('supplierSku', params.supplierSku)

  try {
    const resp = await apiClient.get(`/articles/resolve?${query.toString()}`)
    return (resp.data?.data || resp.data) as ArticleDTO
  } catch (err: any) {
    if (err?.response?.status === 404) return null
    throw err
  }
}

// --- Subrecurso: imagen principal del artículo ---
export async function uploadArticleImage(articleId: string, file: File): Promise<{ imageUrl: string; thumbnailUrl?: string }> {
  const form = new FormData()
  form.append('image', file)
  const resp = await apiClient.post(`/articles/${articleId}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  const data = resp.data?.data || resp.data
  return { imageUrl: data?.imageUrl, thumbnailUrl: data?.thumbnailUrl }
}

export async function deleteArticleImage(articleId: string): Promise<void> {
  await apiClient.delete(`/articles/${articleId}/image`)
}
