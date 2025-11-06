import { apiClient } from './api'

export interface ArticleQuantityPromotionDto {
  id?: string
  articleId?: string
  active: boolean
  exclusive: boolean
  priceListIds: string[]
  startsAt?: string | null
  endsAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ArticleQuantityPromoTierDto {
  id?: string
  promotionId?: string
  minQtyUn: number
  pricePerUnit?: number | null
  percentOff?: number | null
  sort?: number
  createdAt?: string
  updatedAt?: string
}

export async function getPromotion(articleId: string): Promise<ArticleQuantityPromotionDto | null> {
  const { data } = await apiClient.get(`/articles/${articleId}/quantity-promo`)
  return data || null
}

export async function createPromotion(articleId: string, payload: ArticleQuantityPromotionDto): Promise<ArticleQuantityPromotionDto> {
  const { data } = await apiClient.post(`/articles/${articleId}/quantity-promo`, payload)
  return data
}

export async function updatePromotion(articleId: string, payload: Partial<ArticleQuantityPromotionDto>): Promise<ArticleQuantityPromotionDto> {
  const { data } = await apiClient.put(`/articles/${articleId}/quantity-promo`, payload)
  return data
}

export async function deletePromotion(articleId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/articles/${articleId}/quantity-promo`)
  return data
}

export async function listTiers(articleId: string): Promise<ArticleQuantityPromoTierDto[]> {
  const { data } = await apiClient.get(`/articles/${articleId}/quantity-promo/tiers`)
  return Array.isArray(data) ? data : []
}

export async function createTier(articleId: string, tier: ArticleQuantityPromoTierDto): Promise<ArticleQuantityPromoTierDto> {
  const { data } = await apiClient.post(`/articles/${articleId}/quantity-promo/tiers`, tier)
  return data
}

export async function updateTier(articleId: string, tierId: string, tier: Partial<ArticleQuantityPromoTierDto>): Promise<ArticleQuantityPromoTierDto> {
  const { data } = await apiClient.put(`/articles/${articleId}/quantity-promo/tiers/${tierId}`, tier)
  return data
}

export async function deleteTier(articleId: string, tierId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/articles/${articleId}/quantity-promo/tiers/${tierId}`)
  return data
}