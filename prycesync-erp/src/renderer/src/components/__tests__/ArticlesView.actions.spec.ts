import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ArticlesView from '@/views/ArticlesView.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('@/components/organisms/DashboardLayout.vue', () => ({ default: { template: '<div><slot/></div>' } }))
vi.mock('@/components/molecules/FilterBar.vue', () => ({ default: { template: '<div><slot name="advanced" :updateFilter="() => {}"></slot></div>' } }))
vi.mock('@/components/atoms/DataTable.vue', () => ({
  default: {
    props: ['data','columns'],
    template: '<div><slot name="actions" :item="data && data[0] ? data[0] : {}" :index="0"></slot></div>'
  }
}))

vi.mock('@/components/atoms/BaseButton.vue', () => ({
  default: {
    props: ['variant','size','disabled','ariaLabel','title'],
    template: '<button :disabled="disabled" :title="title" :aria-label="ariaLabel" @click="$emit(\'click\')"><slot/></button>'
  }
}))

vi.mock('@/components/atoms/ConfirmModal.vue', () => ({
  default: {
    props: ['modelValue','title','message','confirmText','variant'],
    emits: ['update:modelValue','confirm','cancel'],
    template: '<div v-if="modelValue"><button class="confirm" @click="$emit(\'confirm\')">Confirmar</button><button class="cancel" @click="$emit(\'cancel\')">Cancelar</button></div>'
  }
}))

const mockStore = {
  items: [
    { id: 'a1', name: 'Prod X', active: true, pricePublic: 100, stock: 5, stockMin: 2, barcode: '123', sku: 'SKU-1' }
  ],
  pageSize: 10,
  loading: false,
  list: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
  create: vi.fn(async () => {})
}

vi.mock('@/stores/articles', () => ({ useArticleStore: () => mockStore }))

vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ hasAnyRole: () => true }) }))
vi.mock('@/composables/useSuppliers', () => ({ useSuppliers: () => ({ suppliers: { value: [] }, fetchSuppliers: vi.fn(async () => {}) }) }))

describe('ArticlesView acciones como íconos con tooltips y confirmaciones', () => {
  beforeEach(() => {
    mockStore.update.mockClear()
    mockStore.remove.mockClear()
    mockStore.create.mockClear()
  })

  it('renderiza íconos de acciones con title y aria-label', async () => {
    const wrapper = mount(ArticlesView)
    await flushPromises()
    const buttons = wrapper.findAll('button')
    // Esperamos al menos 4 botones de acciones en la fila
    const titles = buttons.map(b => b.attributes('title')).filter(Boolean)
    expect(titles).toContain('Editar')
    expect(titles).toContain('Duplicar')
    expect(titles).toContain('Desactivar')
    expect(titles).toContain('Eliminar')
    const ariaLabels = buttons.map(b => b.attributes('aria-label')).filter(Boolean)
    expect(ariaLabels).toContain('Editar')
  })

  it('Eliminar abre confirmación y dispara remove al confirmar', async () => {
    const wrapper = mount(ArticlesView)
    await flushPromises()
    const deleteBtn = wrapper.find('button[title="Eliminar"]')
    await deleteBtn.trigger('click')
    const confirm = wrapper.find('button.confirm')
    expect(confirm.exists()).toBe(true)
    await confirm.trigger('click')
    expect(mockStore.remove).toHaveBeenCalledWith('a1')
  })

  it('Desactivar muestra confirmación y llama a update(active=false)', async () => {
    const wrapper = mount(ArticlesView)
    await flushPromises()
    const toggleBtn = wrapper.find('button[title="Desactivar"]')
    await toggleBtn.trigger('click')
    const confirm = wrapper.findAll('button.confirm')[1]
    expect(confirm.exists()).toBe(true)
    await confirm.trigger('click')
    expect(mockStore.update).toHaveBeenCalledWith('a1', { active: false })
  })

  it('Activar no pide confirm y llama a update(active=true)', async () => {
    mockStore.items = [{ id: 'a2', name: 'Prod Y', active: false, pricePublic: 50, stock: 0, stockMin: 1 }]
    const wrapper = mount(ArticlesView)
    await flushPromises()
    const toggleBtn = wrapper.find('button[title="Activar"]')
    await toggleBtn.trigger('click')
    expect(mockStore.update).toHaveBeenCalledWith('a2', { active: true })
  })
})
