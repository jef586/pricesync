import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/composables/useSuppliers', () => ({ useSuppliers: () => ({ suppliers: [], fetchSuppliers: vi.fn(), isLoading: false }) }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => ({ success: vi.fn(), notificationError: vi.fn() }) }))
vi.mock('@/composables/useBarcodeListener', () => ({ useBarcodeListener: () => ({ start: vi.fn(), stop: vi.fn(), onScan: () => vi.fn(), isRunning: { value: false } }) }))
vi.mock('@/services/rubros', () => ({ listRubros: vi.fn(async () => ({ items: [{ id: 'r1', name: 'Rubro X', level: 0 }] })) }))
vi.mock('@/services/articles', () => ({
  createArticle: vi.fn(async (payload: any) => ({ id: 'art-1', ...payload })),
  addArticleBarcode: vi.fn(async () => ({ id: 'b1', code: 'AL-1' })),
  resolveArticle: vi.fn()
}))

import ArticleNewView from '@/views/ArticleNewView.vue'

function mountView() {
  return mount(ArticleNewView, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot/></div>' },
        PageHeader: { template: '<div><slot name="actions"></slot></div>' },
        BaseModal: { template: '<div><slot></slot><slot name="footer"></slot></div>' },
        BaseButton: { props: ['variant','loading','disabled'], template: '<button :disabled="disabled" @click="!disabled && $emit(\'click\')"><slot/></button>' }
      }
    }
  })
}

async function selectCategory(wrapper: any, value: string) {
  const selects = wrapper.findAll('select')
  for (const s of selects) {
    if (s.find(`option[value="${value}"]`).exists()) {
      await s.setValue(value)
      return
    }
  }
}

describe('ArticleNewView create', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('guarda artículo mínimo con nombre y rubro', async () => {
    const wrapper = mountView()
    await flushPromises()
    const saveBtn = wrapper.findAll('button').find(b => /Guardar$/.test(b.text()))!
    expect(saveBtn.attributes('disabled')).toBeDefined()
    const nameInput = wrapper.find('input[placeholder="Nombre del artículo"]')
    await nameInput.setValue('Articulo Test')
    await selectCategory(wrapper, 'r1')
    await flushPromises()
    expect(saveBtn.attributes('disabled')).toBeUndefined()
    await saveBtn.trigger('click')
    await flushPromises()
    const services = await import('@/services/articles')
    expect(services.createArticle).toHaveBeenCalled()
    const args = (services.createArticle as any).mock.calls[0][0]
    expect(args.name).toBe('Articulo Test')
    expect(args.categoryId).toBe('r1')
  })

  it('persiste alias al guardar', async () => {
    const wrapper = mountView()
    await flushPromises()
    const nameInput = wrapper.find('input[placeholder="Nombre del artículo"]')
    await nameInput.setValue('Con Alias')
    await selectCategory(wrapper, 'r1')
    const aliasInput = wrapper.find('input[placeholder="Agregar alias"]')
    await aliasInput.setValue('AL-1')
    const addBtn = wrapper.findAll('button').find(b => /Agregar$/.test(b.text()))!
    await addBtn.trigger('click')
    const saveBtn = wrapper.findAll('button').find(b => /Guardar$/.test(b.text()))!
    await saveBtn.trigger('click')
    await flushPromises()
    const services = await import('@/services/articles')
    expect(services.addArticleBarcode).toHaveBeenCalled()
  })
})