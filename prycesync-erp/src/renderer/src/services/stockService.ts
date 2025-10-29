import { apiClient } from './api'
import type { KardexFilters, KardexResponse, KardexExportFormat } from '@/types/stock'

// Normaliza respuestas que vienen envueltas en { data }
function unwrap<T = any>(respData: any): T {
  return (respData?.data ?? respData) as T
}

export async function getKardex(filters: KardexFilters): Promise<KardexResponse> {
  if (!filters?.articleId) throw new Error('articleId es requerido')

  const params = new URLSearchParams()
  params.append('articleId', String(filters.articleId))
  if (filters.from) params.append('from', String(filters.from))
  if (filters.to) params.append('to', String(filters.to))
  if (typeof filters.warehouseId !== 'undefined' && filters.warehouseId !== null) {
    params.append('warehouseId', String(filters.warehouseId))
  }
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))

  const res = await apiClient.get(`/stock/kardex?${params.toString()}`)
  const payload = unwrap<KardexResponse>(res.data)
  return payload
}

export async function exportKardex(
  filters: KardexFilters,
  format: KardexExportFormat = 'csv'
): Promise<{ blob: Blob; filename: string; mime: string }> {
  if (!filters?.articleId) throw new Error('articleId es requerido')

  const params = new URLSearchParams()
  params.append('articleId', String(filters.articleId))
  if (filters.from) params.append('from', String(filters.from))
  if (filters.to) params.append('to', String(filters.to))
  if (typeof filters.warehouseId !== 'undefined' && filters.warehouseId !== null) {
    params.append('warehouseId', String(filters.warehouseId))
  }
  params.append('format', String(format))

  const res = await apiClient.get(`/stock/kardex/export?${params.toString()}`, { responseType: 'blob' })

  // Intentar obtener filename de Content-Disposition
  const disposition = (res.headers?.['content-disposition'] || res.headers?.['Content-Disposition']) as string | undefined
  let filename = `kardex_${filters.articleId}.${format}`
  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/i)
    if (match?.[1]) filename = match[1]
  }

  const mime = (res.headers?.['content-type'] || res.headers?.['Content-Type'] || (format === 'csv' ? 'text/csv' : 'application/json')) as string
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: mime })
  return { blob, filename, mime }
}