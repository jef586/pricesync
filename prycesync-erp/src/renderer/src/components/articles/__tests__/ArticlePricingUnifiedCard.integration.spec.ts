import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ArticlePricingUnifiedCard from '@/components/articles/ArticlePricingUnifiedCard.vue'
import * as api from '@/services/api'

describe('ArticlePricingUnifiedCard integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('carga precios fijos y aplica recálculo desbloqueado', async () => {
    const getSpy = vi.spyOn(api, 'apiClient', 'get')
    const client: any = api.apiClient
    vi.spyOn(client, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/articles/ART-1/prices-fixed')) {
        return { data: { data: { l1MarginPct: 10, l1FinalPrice: null, l1Locked: false, l2MarginPct: 20, l2FinalPrice: null, l2Locked: true, l3MarginPct: 0, l3FinalPrice: 150, l3Locked: false } } }
      }
      if (url.includes('/pricing/preview')) {
        return { data: { data: { baseUnitPrice: 100, finalUnitPrice: 90, appliedPromo: null } } }
      }
      if (url.includes('/articles/ART-1/quantity-promo')) {
        return { data: { id: 'PROMO-1', active: true, exclusive: false, priceListIds: ['LISTA-1'] } }
      }
      if (url.includes('/articles/ART-1/quantity-promo/tiers')) {
        return { data: [{ id: 'T1', minQtyUn: 5, pricePerUnit: 80, percentOff: null, sort: 0 }] }
      }
      return { data: {} }
    })

    const wrapper = shallowMount(ArticlePricingUnifiedCard, { props: { articleId: 'ART-1', vatPct: 21 }, global: { stubs: { BaseButton: true, BaseSelect: true } } })
    const vm: any = wrapper.vm as any
    vm.base.cost = 100
    vm.base.internalTaxAmount = 0
    vm.base.internalTaxPct = 0
    await new Promise(r => setTimeout(r, 0))
    const row1 = vm.rowsEditable[0]
    const row2 = vm.rowsEditable[1]
    const row3 = vm.rowsEditable[2]
    expect(row1.marginPct).toBe(10)
    expect(row2.locked).toBe(true)
    expect(row3.finalPrice).toBe(150)
    vm.applyUnlocked()
    expect(row1.finalPrice).toBeDefined()
    expect(row2.finalPrice).toBeDefined()
  })
})
