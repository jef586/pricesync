import type { CreateInvoiceData } from './useInvoices'

export type CartItem = {
  tempId: string
  productId: string
  articleId?: string
  name: string
  code: string
  quantity: number
  unitPrice: number
  discount?: number
}

export type Totals = {
  subtotal: number
  tax: number
  total: number
}

export function usePOS() {
  const computeTotals = (items: CartItem[]): Totals => {
    const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice - (it.discount || 0)), 0)
    const taxRate = 0.21 // IVA genérico; el backend definirá correctamente según tipo/comprobante
    const tax = subtotal * taxRate
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const computeInvoicePayload = (items: CartItem[], customerId: string, type: CreateInvoiceData['type'] = 'B'): CreateInvoiceData => {
    return {
      customerId,
      type,
      items: items.map(it => ({
        articleId: it.articleId ?? it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount || 0,
        taxRate: 21
      }))
    }
  }

  return { computeTotals, computeInvoicePayload }
}