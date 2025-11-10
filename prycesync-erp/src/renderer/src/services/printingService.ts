import { apiClient } from './api'

export async function printTicket(invoiceId: string, opts?: { printerName?: string | null; branchId?: string | null; paperWidth?: number; paymentMethod?: string | null; generatePdf?: boolean }) {
  const params: any = {}
  if (opts?.printerName != null) params.printerName = opts.printerName
  if (opts?.branchId != null) params.branchId = opts.branchId
  if (opts?.paperWidth != null) params.paperWidth = opts.paperWidth
  if (opts?.paymentMethod != null) params.paymentMethod = opts.paymentMethod
  params.generatePdf = opts?.generatePdf === true ? 'true' : 'false'

  const { data } = await apiClient.get(`/print/ticket/${invoiceId}`, { params })
  const payload = data?.data || data

  const sys = (window as any).system
  if (sys && typeof sys.printTicket === 'function') {
    const res = await sys.printTicket({ html: payload.html, pdfBase64: payload.pdfBase64, printerName: params.printerName || null })
    return res
  }
  // Fallback: open HTML in a new window and trigger print
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (w) {
    w.document.write(payload.html)
    w.document.close()
    w.focus()
    w.print()
    setTimeout(() => w.close(), 1500)
  }
  return { ok: true, fallback: true }
}

export async function getTicketHtml(invoiceId: string): Promise<string> {
  const { data } = await apiClient.get(`/print/ticket/${invoiceId}`, { params: { htmlOnly: 'true' } })
  const payload = data?.data || data
  return payload.html
}