import type { ArticleFilters } from '@/types/article'

export function mapUiFiltersToQuery(ui: Record<string, any>): ArticleFilters {
  const f: ArticleFilters = {}
  if (ui.search) f.q = ui.search
  if (ui.categoryId) f.categoryId = ui.categoryId
  if (ui.status) f.active = ui.status === 'active' ? true : ui.status === 'inactive' ? false : undefined
  if (ui.name) f.name = ui.name
  if (ui.description) f.description = ui.description
  if (ui.ean) f.ean = ui.ean
  if (ui.supplierSku || ui.supplierCode) f.supplierSku = ui.supplierSku || ui.supplierCode
  if (ui.subcategoryId) f.subcategoryId = ui.subcategoryId
  if (ui.supplierId) f.supplierId = ui.supplierId
  if (ui.manufacturerId) f.manufacturerId = ui.manufacturerId
  if (ui.vatRate != null) f.vatRate = Number(ui.vatRate)
  else if (ui.vatPct != null) f.vatRate = Number(ui.vatPct)
  if (ui.internalCode) f.internalCode = ui.internalCode
  if (ui.stockState) f.stockState = ui.stockState
  return f
}
