// Simple local print queue persisted in localStorage with IPC-backed file queue when available
// API:
// - addPending({ invoiceId, html, ts })
// - retryAll({ printerName?, delayMs? })
// - remove(id)
// - getAll()
// - getPendingCount() and getPendingCountAsync()

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
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.getPendingCount === 'function') {
    // Synchronous variant returns cached local count; for precise use async below
    return loadAll().length
  }
  return loadAll().length
}

export async function getPendingCountAsync(): Promise<number> {
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.getPendingCount === 'function') {
    const res = await sys.printQueue.getPendingCount()
    return res?.ok ? Number(res.count || 0) : 0
  }
  return loadAll().length
}

export function addPending(job: { invoiceId: string; html: string; ts?: number }): PendingPrintJob {
  const sys: any = (window as any).system
  const ts = typeof job.ts === 'number' ? job.ts : Date.now()
  const id = `${job.invoiceId}-${ts}`
  // Prefer IPC-file queue when available
  if (sys && sys.printQueue && typeof sys.printQueue.addPending === 'function') {
    try {
      sys.printQueue.addPending({ invoiceId: job.invoiceId, buffer: job.html, timestamp: ts })
    } catch (_) {}
  }
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

// Retry all pending jobs using IPC if available; otherwise fallback.
export async function retryAll(opts?: { printerName?: string | null; delayMs?: number }): Promise<{ tried: number; succeeded: number; failed: number }>
{
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.retryPending === 'function') {
    try {
      const res = await sys.printQueue.retryPending({ printerName: opts?.printerName || null })
      return { tried: Number(res?.tried || 0), succeeded: Number(res?.succeeded || 0), failed: Number(res?.failed || 0) }
    } catch (_) {}
  }

  const delayMs = typeof opts?.delayMs === 'number' ? opts!.delayMs! : 500
  let list = loadAll()
  const tried = list.length
  let succeeded = 0
  let failed = 0

  for (const job of list) {
    try {
      const sysAny: any = (window as any).system
      if (sysAny && typeof sysAny.printTicket === 'function') {
        const res = await sysAny.printTicket({ html: job.html, printerName: opts?.printerName || null })
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