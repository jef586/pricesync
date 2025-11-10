// Simple local print queue persisted in localStorage
// API:
// - addPending({ invoiceId, html, ts })
// - retryAll({ printerName?, delayMs? })
// - remove(id)
// - getAll()
// - getPendingCount()

export type PendingPrintJob = {
  id: string
  invoiceId: string
  html: string
  ts: number
}

const LS_KEY = 'pendingPrints'

function loadAll(): PendingPrintJob[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((j) => j && j.id && j.invoiceId && j.html && j.ts)
    }
  } catch (_) {
    // ignore
  }
  return []
}

function saveAll(list: PendingPrintJob[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch (_) {
    // ignore
  }
}

export function getAll(): PendingPrintJob[] {
  return loadAll()
}

export function getPendingCount(): number {
  return loadAll().length
}

export function addPending(job: { invoiceId: string; html: string; ts?: number }): PendingPrintJob {
  const ts = typeof job.ts === 'number' ? job.ts : Date.now()
  const id = `${job.invoiceId}-${ts}`
  const list = loadAll()
  const pending: PendingPrintJob = { id, invoiceId: job.invoiceId, html: job.html, ts }
  list.push(pending)
  saveAll(list)
  return pending
}

export function remove(id: string) {
  const list = loadAll()
  const next = list.filter((j) => j.id !== id)
  saveAll(next)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Retry all pending jobs using IPC. If IPC is absent, attempts a browser print fallback.
export async function retryAll(opts?: { printerName?: string | null; delayMs?: number }): Promise<{ tried: number; succeeded: number; failed: number }>
{
  const delayMs = typeof opts?.delayMs === 'number' ? opts!.delayMs! : 500
  let list = loadAll()
  const tried = list.length
  let succeeded = 0
  let failed = 0

  for (const job of list) {
    try {
      const sys: any = (window as any).system
      if (sys && typeof sys.printTicket === 'function') {
        const res = await sys.printTicket({ html: job.html, printerName: opts?.printerName || null })
        if (res?.ok) {
          remove(job.id)
          succeeded += 1
        } else {
          failed += 1
        }
      } else {
        // Fallback: attempt browser print
        const w = window.open('', '_blank', 'noopener,noreferrer')
        if (w) {
          w.document.write(job.html)
          w.document.close()
          w.focus()
          try { w.print() } catch (_) {}
          setTimeout(() => w.close(), 1500)
          remove(job.id)
          succeeded += 1
        } else {
          failed += 1
        }
      }
    } catch (_) {
      failed += 1
    }
    if (delayMs > 0) await sleep(delayMs)
  }

  return { tried, succeeded, failed }
}