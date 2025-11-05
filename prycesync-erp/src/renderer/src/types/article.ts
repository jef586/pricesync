// UH-ART-3: Tipos estrictos para ArtÃ­culos

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
  internalTaxType?: 'NONE' | 'FIXED' | 'PERCENT' | null
  internalTaxValue?: number | null
  subjectIIBB: boolean
  subjectGanancias: boolean
  subjectPercIVA: boolean
  pointsPerUnit?: number | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  // Extended view fields
  barcodesCount?: number
  categoryName?: string
  subcategoryName?: string
  supplierName?: string
  // Optional image fields (backend may include these)
  imageUrl?: string | null
  imageId?: string | null
  image?: {
    id?: string
    imageUrl?: string
    thumbnailUrl?: string
    width?: number
    height?: number
    mimeType?: string
    sizeBytes?: number
  } | null
}

export interface ArticleFilters {
  // Búsqueda rápida
  q?: string
  // Compat: nombre de rubro en frontend
  rubroId?: string
  // Estado
  active?: boolean
  // Control de stock (listado simple)
  controlStock?: boolean
  // Avanzados (para /articles/search)
  name?: string
  description?: string
  ean?: string
  supplierSku?: string
  categoryId?: string
  subcategoryId?: string
  supplierId?: string
  manufacturerId?: string
  vatRate?: number
  internalCode?: string
  stockState?: 'all' | 'low' | 'zero' | 'nocontrol'
  // Paginación y orden
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
