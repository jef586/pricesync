// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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
    mount(SaleSuccessModal, {
      props: { saleId: 'sale-123', open: true, onClose: vi.fn() }
    })
    // Teleported content is in document.body
    const title = document.body.querySelector('h3')
    expect(title?.textContent || '').toContain('¡Venta registrada!')
    const buttons = Array.from(document.body.querySelectorAll('button'))
    expect(buttons.some(b => b.textContent?.includes('Exportar PDF'))).toBe(true)
    expect(buttons.some(b => b.textContent?.includes('Enviar email'))).toBe(true)
    expect(buttons.some(b => b.textContent?.includes('Imprimir'))).toBe(true)
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
    mount(SaleSuccessModal, { props: { saleId: 'sale-1', open: true, onClose } })
    // BaseModal renders overlay with class .modal-overlay (teleported to body)
    const overlay = document.body.querySelector('.modal-overlay') as HTMLElement
    expect(overlay).toBeTruthy()
    overlay.click()
    expect(onClose).toHaveBeenCalled()
  })

  it('disables other buttons while loading an action', async () => {
    // Make the HTTP call resolve after a small timeout to keep loading state
    const api = await import('@/services/api')
    api.apiClient.get = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({ data: new Blob(['pdf'], { type: 'application/pdf' }) }), 50)))

    mount(SaleSuccessModal, { props: { saleId: 'sale-lo', open: true, onClose: vi.fn() } })
    // Teleported content: read buttons from body
    const buttons = Array.from(document.body.querySelectorAll('button'))
    const exportBtn = buttons.find(b => b.textContent?.includes('Exportar PDF'))!
    const emailBtn = buttons.find(b => b.textContent?.includes('Enviar email'))!
    const printBtn = buttons.find(b => b.textContent?.includes('Imprimir'))!

    // Trigger the export
    exportBtn.click()
    // Wait for Vue to apply reactive updates
    await nextTick()

    // disabled is a boolean property on native button
    expect(exportBtn.disabled).toBe(true)
    expect(emailBtn.disabled).toBe(true)
    expect(printBtn.disabled).toBe(true)
  })
})