import { getTicketHtml } from '@/services/printingService'
import { addPending } from '@/services/printQueue'

type PrintOptions = { printerName?: string | null }

export async function printTicketOrQueue(invoiceId: string, opts?: PrintOptions) {
  const sys: any = (window as any).system
  try {
    const html = await getTicketHtml(invoiceId)
    if (sys && typeof sys.printTicket === 'function') {
      await sys.printTicket({ invoiceId, html, printerName: opts?.printerName || null })
      return { ok: true }
    }
    // No IPC available: try browser print fallback
    const doc = window.open('', '_blank')
    if (doc) {
      doc.document.write(html)
      doc.document.close()
      await new Promise<void>((resolve) => setTimeout(resolve, 300))
      try { doc.print() } catch {}
      doc.close()
      return { ok: true }
    }
    // Could not print; queue
    addPending({ invoiceId, html })
    return { ok: false, queued: true }
  } catch (err) {
    // Generate HTML and queue on failure
    try {
      const html = await getTicketHtml(invoiceId)
      addPending({ invoiceId, html })
    } catch {}
    return { ok: false, error: String(err) }
  }
}