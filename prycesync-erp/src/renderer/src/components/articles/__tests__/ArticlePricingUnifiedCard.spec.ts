import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ArticlePricingUnifiedCard from '@/components/articles/ArticlePricingUnifiedCard.vue'

function findRow(wrapper: any, idx: number) {
  return wrapper.findAll('tbody tr')[idx]
}

describe('ArticlePricingUnifiedCard', () => {
  it('calcula directo: costo+imp → margen → precio final', async () => {
    const wrapper = shallowMount(ArticlePricingUnifiedCard, { props: { vatPct: 21 }, global: { stubs: { BaseButton: true, BaseSelect: true } } })
    const vm: any = wrapper.vm as any
    vm.base.cost = 100
    vm.base.internalTaxAmount = 10
    vm.base.internalTaxPct = 0
    const row = vm.rowsEditable[0]
    row.mode = 'direct'
    row.marginPct = 20
    vm.onRowInput(row, 'marginPct')
    const neto = vm.computeNet(row)
    const final = vm.applyVat(neto)
    expect(neto).toBeCloseTo(132, 2) // (100+10)*1.2 = 132
    expect(final).toBeCloseTo(159.72, 2) // 132*1.21
    expect(row.finalPrice).toBeCloseTo(final, 2)
  })

  it('calcula inverso: precio final → margen %', async () => {
    const wrapper = shallowMount(ArticlePricingUnifiedCard, { props: { vatPct: 21 }, global: { stubs: { BaseButton: true, BaseSelect: true } } })
    const vm: any = wrapper.vm as any
    vm.base.cost = 100
    vm.base.internalTaxAmount = 10
    vm.base.internalTaxPct = 0
    const row = vm.rowsEditable[1]
    row.mode = 'inverse'
    row.finalPrice = 159.72
    vm.onRowInput(row, 'finalPrice')
    expect(row.marginPct).toBeCloseTo(20, 2)
  })

  it('respeta locks al cambiar base', async () => {
    const wrapper = shallowMount(ArticlePricingUnifiedCard, { props: { vatPct: 21 }, global: { stubs: { BaseButton: true, BaseSelect: true } } })
    const vm: any = wrapper.vm as any
    vm.base.cost = 100
    vm.base.internalTaxAmount = 0
    vm.base.internalTaxPct = 0
    vm.rowsEditable.forEach((r: any) => { r.mode = 'direct'; r.marginPct = 10; vm.forceRecalc(r) })
    const before = vm.rowsEditable.map((r: any) => r.finalPrice)
    vm.rowsEditable[1].locked = true
    vm.base.cost = 200
    await wrapper.vm.$nextTick()
    const after = vm.rowsEditable.map((r: any) => r.finalPrice)
    expect(after[0]).not.toEqual(before[0])
    expect(after[1]).toEqual(before[1])
    expect(after[2]).not.toEqual(before[2])
  })

  it('redondeo UP/DOWN/HALF_UP', async () => {
    const wrapper = shallowMount(ArticlePricingUnifiedCard, { props: { vatPct: 21 }, global: { stubs: { BaseButton: true, BaseSelect: true } } })
    const vm: any = wrapper.vm as any
    vm.base.cost = 1
    vm.base.internalTaxAmount = 0
    vm.base.internalTaxPct = 0
    const row = vm.rowsEditable[0]
    row.mode = 'direct'; row.marginPct = 0
    vm.base.rounding = 'HALF_UP'; vm.forceRecalc(row)
    const half = vm.applyVat(vm.computeNet(row))
    vm.base.rounding = 'UP'; vm.forceRecalc(row)
    const up = vm.applyVat(vm.computeNet(row))
    vm.base.rounding = 'DOWN'; vm.forceRecalc(row)
    const down = vm.applyVat(vm.computeNet(row))
    expect(up >= half).toBe(true)
    expect(down <= half).toBe(true)
  })
})
