// UH-ART-3: Tipos estrictos para Artículos

export type BarcodeType = 'EAN13' | 'EAN8' | 'CODE128' | 'PLU' | null
export type ArticleType = 'PRODUCT' | 'SERVICE'

export interface ArticleDTO {
  id: string
  name: string
  type: ArticleType
  active: boolean
  sku?: string | null
  barcode?: string | null
  barcodeType: BarcodeType
  rubroId: string
  subrubroId?: string | null
  taxRate: number
  cost: number
  gainPct: number
  pricePublic: number
  stock: number
  stockMin: number
  stockMax?: number
  controlStock?: boolean
  description?: string | null
  internalTaxType?: 'FIX' | 'PCT' | null
  internalTaxValue?: number | null
  subjectIIBB: boolean
  subjectGanancias: boolean
  subjectPercIVA: boolean
  pointsPerUnit?: number | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface ArticleFilters {
  q?: string
  rubroId?: string
  active?: boolean
  controlStock?: boolean
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}