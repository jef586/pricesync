import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterBar from '@/components/molecules/FilterBar.vue'
import BaseButton from '@/components/atoms/BaseButton.vue'

vi.mock('@/components/atoms/BaseButton.vue', () => ({ default: { props: ['variant','size'], template: '<button @click="$emit(\'click\')"><slot/></button>' } }))
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(() => {})
} as any)

describe('FilterBar compact + avanzados', () => {
  beforeEach(() => {
    ;(localStorage.getItem as any).mockReset()
    ;(localStorage.setItem as any).mockReset()
  })

  it('renderiza toolbar compacta y aplica búsqueda', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        modelValue: { search: '' },
        debounceMs: 400,
        compact: true
      }
    })
    await wrapper.find('input').setValue('abc')
    await new Promise(r => setTimeout(r, 410))
    const events = wrapper.emitted('search')
    expect(events).toBeTruthy()
    expect(events?.[0]?.[0]).toBe('abc')
  })

  it('toggle de avanzados y persistencia', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        modelValue: {},
        persistKey: 'test_filters'
      }
    })
    await wrapper.findAll('button')[2].trigger('click')
    expect((localStorage.setItem as any).mock.calls.length).toBeGreaterThan(0)
  })

  it('chips de filtros activos y limpiar', async () => {
    const wrapper = mount(FilterBar, {
      props: {
        modelValue: { search: 'x', status: 'active' },
        statusOptions: [{ value: 'active', label: 'Activo' }]
      }
    })
    expect(wrapper.findAll('.filter-tag').length).toBeGreaterThan(0)
    await wrapper.find('button.filter-tag-remove').trigger('click')
    const change = wrapper.emitted('filter-change')
    expect(change).toBeTruthy()
  })

  it('presets aplican filtros', async () => {
    const wrapper = mount(FilterBar, {
      props: { modelValue: {} },
      slots: {
        presets: `<button class="preset-a" @click="applyPreset('solo-activos')">a</button>`
      }
    })
    await wrapper.find('.preset-a').trigger('click')
    const update = wrapper.emitted('update:modelValue')
    expect(update).toBeTruthy()
  })
})
