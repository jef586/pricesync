import { addPending } from './printQueue'
import { getTicketHtml } from './printingService'

export type PrintResult = {
  ok: boolean
  queued?: boolean
  message?: string
}

export async function printTicketOrQueue(invoiceId: string, opts?: { printerName?: string | null }): Promise<PrintResult> {
  try {
    const html = await getTicketHtml(invoiceId)
    const sys: any = (window as any).system
    if (sys && typeof sys.printTicket === 'function') {
      const res = await sys.printTicket({ html, printerName: opts?.printerName || null })
      if (res?.ok) {
        return { ok: true }
      }
      addPending({ invoiceId, html })
      return { ok: true, queued: true, message: 'Impresión en cola por falta de conexión con la impresora.' }
    }
    addPending({ invoiceId, html })
    return { ok: true, queued: true, message: 'Impresión en cola: no se encontró IPC de impresión.' }
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error inesperado al imprimir.' }
  }
}