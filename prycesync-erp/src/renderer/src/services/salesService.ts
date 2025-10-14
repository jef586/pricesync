import { apiClient } from '@/services/api'

export async function fetchSalePdf(saleId: string): Promise<Blob> {
  const res = await apiClient.get(`/sales/${saleId}/pdf`, { responseType: 'blob' })
  // Axios may already return Blob; ensure Blob type
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' })
  return blob
}

export async function sendSaleEmail(saleId: string, to?: string): Promise<void> {
  const body: any = {}
  if (to) body.to = to
  await apiClient.post(`/sales/${saleId}/email`, body)
}

export async function printSale(saleId: string): Promise<void> {
  const pos = (window as any).pos
  if (pos && typeof pos.print === 'function') {
    await pos.print(saleId)
  } else {
    // Fallback: abrir diálogo de impresión del navegador
    window.print()
  }
}