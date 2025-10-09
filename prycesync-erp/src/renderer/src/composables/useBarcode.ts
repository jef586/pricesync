import { ref, type Ref } from 'vue'

export interface BarcodeSettings {
  enabled: boolean
  windowMsMin: number // default 50
  windowMsMax: number // default 200
  minLength: number // default 6
  suffix: 'Enter' | 'Tab' // default 'Enter'
  preventInInputs: boolean // default true
}

type ScanCallback = (code: string) => void

const DEFAULT_SETTINGS: BarcodeSettings = {
  enabled: true,
  windowMsMin: 50,
  windowMsMax: 200,
  minLength: 6,
  suffix: 'Enter',
  preventInInputs: true
}

// Allowed printable characters
const ALLOWED_RE = /[A-Za-z0-9._-]/

// Helpers
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target as Element)) return false
  const el = target as Element
  const tag = el.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea') return true
  const isContentEditable = (el as HTMLElement).isContentEditable
  return !!isContentEditable
}

declare global {
  interface Window {
    pos?: { scan: (code: string) => Promise<any> }
  }
}

export function useBarcode(settings?: Partial<BarcodeSettings>): {
  start(): void
  stop(): void
  onScan(cb: ScanCallback): () => void
  isRunning: Ref<boolean>
} {
  const cfg: BarcodeSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) }
  const isRunning = ref(false)
  const callbacks = new Set<ScanCallback>()

  let buffer: string[] = []
  let timestamps: number[] = []
  let lastTs: number | null = null
  let isBurstActive = false

  const reset = () => {
    buffer = []
    timestamps = []
    lastTs = null
    isBurstActive = false
  }

  const emitCode = (code: string, target: EventTarget | null) => {
    // Notify local subscribers
    callbacks.forEach((cb) => {
      try {
        cb(code)
      } catch (e) {
        // swallow to not break others
      }
    })
    // IPC to main via secure preload API
    try {
      if (window.pos && typeof window.pos.scan === 'function') {
        window.pos.scan(code).catch(() => {})
      }
    } catch (_) {}
  }

  const handler = (e: KeyboardEvent) => {
    if (!cfg.enabled) return

    const key = e.key
    const now = Date.now()
    const inEditable = isEditableTarget(e.target)

    // If huge pause, reset and consider this as a fresh start
    if (lastTs != null && now - lastTs > cfg.windowMsMax) {
      reset()
    }

    const isSuffix = key === cfg.suffix
    const isPrintable = ALLOWED_RE.test(key)

    // Non-printable and not suffix => reset
    if (!isPrintable && !isSuffix) {
      reset()
      return
    }

    if (isSuffix) {
      // Closing burst: verify constraints
      const lenOk = buffer.length >= cfg.minLength
      const timingOk = (() => {
        if (timestamps.length <= 1) return false
        for (let i = 1; i < timestamps.length; i++) {
          const dt = timestamps[i] - timestamps[i - 1]
          if (dt < cfg.windowMsMin || dt > cfg.windowMsMax) return false
        }
        return true
      })()

      if (lenOk && timingOk) {
        const code = buffer.join('')
        // Prevent default in inputs to avoid adding a newline
        if (inEditable && cfg.preventInInputs) {
          e.preventDefault()
        }
        emitCode(code, e.target)
      }
      reset()
      return
    }

    // Printable character
    const tsOk = lastTs != null ? now - lastTs >= cfg.windowMsMin && now - lastTs <= cfg.windowMsMax : false
    if (lastTs == null) {
      // First key of a potential burst
      buffer.push(key)
      timestamps.push(now)
      lastTs = now
      // Do not mark burst active yet; we need at least two keys with valid delta
    } else if (tsOk) {
      // Valid inter-key timing
      buffer.push(key)
      timestamps.push(now)
      lastTs = now
      if (!isBurstActive && buffer.length >= 2) {
        isBurstActive = true
      }
      // While burst is active and typing in inputs, prevent default to avoid interfering
      if (isBurstActive && inEditable && cfg.preventInInputs) {
        e.preventDefault()
      }
    } else {
      // Timing out of range; human typing or invalid burst => reset and treat this key as new start
      reset()
      buffer.push(key)
      timestamps.push(now)
      lastTs = now
    }
  }

  const start = () => {
    if (isRunning.value) return
    window.addEventListener('keydown', handler, { passive: false })
    isRunning.value = true
  }

  const stop = () => {
    if (!isRunning.value) return
    window.removeEventListener('keydown', handler as EventListener)
    isRunning.value = false
    reset()
  }

  const onScan = (cb: ScanCallback): (() => void) => {
    callbacks.add(cb)
    return () => {
      callbacks.delete(cb)
    }
  }

  return { start, stop, onScan, isRunning }
}