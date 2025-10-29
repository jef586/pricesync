// Tipos de Kardex y Stock para el frontend

export type StockDirection = 'IN' | 'OUT'

export interface KardexItem {
  id: string
  createdAt: string
  documentType: string | null
  documentId: string | null
  reason: string
  uom: string
  qty: number
  qtyUn: number
  direction: StockDirection
  balanceUn: number
}

export interface KardexArticleInfo {
  id: string
  name: string
  sku: string
}

export interface KardexPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface KardexResponse {
  article: KardexArticleInfo | null
  pagination: KardexPagination
  currentOnHandUn: number
  startingOnHandUn: number
  items: KardexItem[]
}

export interface KardexFilters {
  articleId: string
  from?: string
  to?: string
  warehouseId?: string | null
  page?: number
  limit?: number
}

export type KardexExportFormat = 'csv' | 'json'