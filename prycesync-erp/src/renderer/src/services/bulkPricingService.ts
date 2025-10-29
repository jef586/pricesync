import { apiClient } from './api'

export type BulkPriceMode = 'UNIT_PRICE' | 'PERCENT_OFF'

export interface BulkPricingRule {
  id?: string
  articleId?: string
  uom: 'UN' | 'BU' | 'KG' | 'LT'
  minQty: number
  mode: BulkPriceMode
  unitPrice?: number | null
  percentOff?: number | null
  priority?: number
  active?: boolean
  validFrom?: string | null
  validTo?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ResolveBulkInput {
  articleId: string
  uom: 'UN' | 'BU' | 'KG' | 'LT'
  qty: number
  basePrice: number
}

export interface ResolveBulkOutput {
  appliedRule: BulkPricingRule | null
  finalUnitPrice: number
}

export async function listArticleRules(articleId: string, uom?: string): Promise<BulkPricingRule[]> {
  const params = new URLSearchParams()
  if (uom) params.append('uom', uom)
  const res = await apiClient.get(`/articles/${articleId}/bulk-pricing?${params.toString()}`)
  return res.data
}

export async function createArticleRule(articleId: string, rule: BulkPricingRule): Promise<BulkPricingRule> {
  const res = await apiClient.post(`/articles/${articleId}/bulk-pricing`, rule)
  return res.data
}

export async function updateArticleRule(articleId: string, ruleId: string, patch: Partial<BulkPricingRule>): Promise<BulkPricingRule> {
  const res = await apiClient.put(`/articles/${articleId}/bulk-pricing/${ruleId}`, patch)
  return res.data
}

export async function deleteArticleRule(articleId: string, ruleId: string): Promise<void> {
  await apiClient.delete(`/articles/${articleId}/bulk-pricing/${ruleId}`)
}

export async function resolveBulk(input: ResolveBulkInput): Promise<ResolveBulkOutput> {
  const res = await apiClient.post('/pricing/resolve-bulk', input)
  // Backend returns { success, data }
  return res.data.data || res.data
}