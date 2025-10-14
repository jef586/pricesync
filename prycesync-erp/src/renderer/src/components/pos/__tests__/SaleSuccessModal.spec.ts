// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SaleSuccessModal from '../SaleSuccessModal.vue'

// Mock apiClient
vi.mock('@/services/api', () => {
  return {
    apiClient: {
      get: vi.fn(async () => ({ data: new Blob(['pdf'], { type: 'application/pdf' }) })),
      post: vi.fn(async () => ({ data: { ok: true } }))
    }
  }
})

describe('SaleSuccessModal', () => {
  beforeEach(() => {
    // Reset any global mocks
    (window as any).pos = undefined
  })

  it('renders title and three action buttons when open', () => {
    const wrapper = mount(SaleSuccessModal, {
      props: { saleId: 'sale-123', open: true, onClose: vi.fn() }
    })
    expect(wrapper.find('h3').text()).toContain('¡Venta registrada!')
    const buttons = wrapper.findAll('button')
    // There are multiple buttons including footer; verify labels
    expect(buttons.some(b => b.text().includes('Exportar PDF'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Enviar email'))).toBe(true)
    expect(buttons.some(b => b.text().includes('Imprimir'))).toBe(true)
  })

  it('ESC key calls onClose', async () => {
    const onClose = vi.fn()
    mount(SaleSuccessModal, { props: { saleId: 'sale-1', open: true, onClose } })
    // Dispatch ESC
    const evt = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(evt)
    expect(onClose).toHaveBeenCalled()
  })

  it('backdrop click calls onClose', async () => {
    const onClose = vi.fn()
    const wrapper = mount(SaleSuccessModal, { props: { saleId: 'sale-1', open: true, onClose } })
    // BaseModal renders overlay with class .modal-overlay
    const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
    expect(overlay).toBeTruthy()
    overlay.click()
    expect(onClose).toHaveBeenCalled()
  })

  it('disables other buttons while loading an action', async () => {
    const wrapper = mount(SaleSuccessModal, { props: { saleId: 'sale-lo', open: true, onClose: vi.fn() } })
    const pdfBtn = wrapper.find('button:contains("Exportar PDF")')
    // Vue Test Utils does not support :contains pseudo; find by text
    const buttons = wrapper.findAll('button')
    const exportBtn = buttons.find(b => b.text().includes('Exportar PDF'))!
    const emailBtn = buttons.find(b => b.text().includes('Enviar email'))!
    const printBtn = buttons.find(b => b.text().includes('Imprimir'))!

    await exportBtn.trigger('click')
    expect(exportBtn.attributes('disabled')).toBeDefined()
    expect(emailBtn.attributes('disabled')).toBeDefined()
    expect(printBtn.attributes('disabled')).toBeDefined()
  })
})