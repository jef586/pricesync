type RetryOptions = { printerName?: string | null }

const STORAGE_KEY = 'print_queue_pending'

export function getPendingCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.length : 0
  } catch {
    return 0
  }
}

export async function getPendingCountAsync(): Promise<number> {
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.getPendingCount === 'function') {
    try {
      const count = await sys.printQueue.getPendingCount()
      return typeof count === 'number' ? count : getPendingCount()
    } catch {
      return getPendingCount()
    }
  }
  return getPendingCount()
}

export function addPending(job: { invoiceId: string; html: string }) {
  // localStorage backup
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    arr.push(job)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {}

  // IPC-backed queue
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.addPending === 'function') {
    try { sys.printQueue.addPending(job.invoiceId, job.html) } catch {}
  }
}

export async function retryAll(opts?: RetryOptions): Promise<{ attempted: number; success: number; failed: number }> {
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.retryPending === 'function') {
    try {
      const res = await sys.printQueue.retryPending(opts || {})
      // Sync local backup by clearing items that succeeded is handled in main via event
      return res
    } catch {}
  }

  // Fallback: attempt printing via browser (not silent)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr: Array<{ invoiceId: string; html: string }> = raw ? JSON.parse(raw) : []
    let success = 0
    for (const item of arr) {
      const doc = window.open('', '_blank')
      if (!doc) continue
      doc.document.write(item.html)
      doc.document.close()
      await new Promise<void>((resolve) => setTimeout(resolve, 300))
      try { doc.print() } catch {}
      success += 1
      doc.close()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    return { attempted: arr.length, success, failed: Math.max(0, arr.length - success) }
  } catch {
    return { attempted: 0, success: 0, failed: 0 }
  }
}