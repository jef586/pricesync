import { ref, type Ref } from 'vue'

export interface ListenerSettings {
  enabled: boolean
  windowMsMin: number // default 50
  interKeyTimeout: number // default 200
  minLength: number // default 6
  suffix: 'Enter' | 'Tab' | 'none' // default 'Enter'
  preventInInputs: boolean // default true
  forceFocus?: boolean
  autoSelectSingle?: boolean
}

type ScanCallback = (code: string) => void

const DEFAULT_SETTINGS: ListenerSettings = {
  enabled: true,
  windowMsMin: 50,
  interKeyTimeout: 200,
  minLength: 6,
  suffix: 'Enter',
  preventInInputs: true,
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

export function useBarcodeListener(settings?: Partial<ListenerSettings>): {
  start(): void
  stop(): void
  onScan(cb: ScanCallback): () => void
  isRunning: Ref<boolean>
} {
  const cfg: ListenerSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) }
  const isRunning = ref(false)
  const callbacks = new Set<ScanCallback>()

  let buffer: string[] = []
  let timestamps: number[] = []
  let lastTs: number | null = null
  let isBurstActive = false
  let inactivityTimer: number | null = null

  const reset = () => {
    if (inactivityTimer != null) {
      clearTimeout(inactivityTimer)
      inactivityTimer = null
    }
    buffer = []
    timestamps = []
    lastTs = null
    isBurstActive = false
  }

  const emitCode = (code: string, target: EventTarget | null) => {
    callbacks.forEach((cb) => {
      try { cb(code) } catch (_) {}
    })
  }

  const handler = (e: KeyboardEvent) => {
    if (!cfg.enabled) return

    const key = e.key
    const now = Date.now()
    const inEditable = isEditableTarget(e.target)

    // If huge pause, consider ending previous burst when suffix is 'none'
    if (lastTs != null && now - lastTs > cfg.interKeyTimeout) {
      if (cfg.suffix === 'none') {
        const lenOk = buffer.length >= cfg.minLength
        const timingOk = (() => {
          if (timestamps.length <= 1) return false
          for (let i = 1; i < timestamps.length; i++) {
            const dt = timestamps[i] - timestamps[i - 1]
            if (dt < cfg.windowMsMin || dt > cfg.interKeyTimeout) return false
          }
          return true
        })()
        if (lenOk && timingOk) {
          const code = buffer.join('')
          if (inEditable && cfg.preventInInputs) { e.preventDefault() }
          emitCode(code, e.target)
        }
      }
      reset()
    }

    const isSuffix = key === cfg.suffix && cfg.suffix !== 'none'
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
        const minBound = cfg.suffix === 'none' ? 0 : cfg.windowMsMin
        for (let i = 1; i < timestamps.length; i++) {
          const dt = timestamps[i] - timestamps[i - 1]
          if (dt < minBound || dt > cfg.interKeyTimeout) return false
        }
        return true
      })()

      if (lenOk && timingOk) {
        const code = buffer.join('')
        if (inEditable && cfg.preventInInputs) { e.preventDefault() }
        emitCode(code, e.target)
      }
      reset()
      return
    }

    // Printable character
    const tsOk = lastTs != null ? now - lastTs >= (cfg.suffix === 'none' ? 0 : cfg.windowMsMin) && now - lastTs <= cfg.interKeyTimeout : false
    if (lastTs == null) {
      // First key of a potential burst
      buffer.push(key)
      timestamps.push(now)
      lastTs = now
      if (cfg.suffix === 'none') {
        if (inactivityTimer != null) { clearTimeout(inactivityTimer) }
        inactivityTimer = window.setTimeout(() => {
          const lenOk = buffer.length >= cfg.minLength
          const timingOk = (() => {
            if (timestamps.length <= 1) return false
            const minBound = cfg.suffix === 'none' ? 0 : cfg.windowMsMin
            for (let i = 1; i < timestamps.length; i++) {
              const dt = timestamps[i] - timestamps[i - 1]
              if (dt < minBound || dt > cfg.interKeyTimeout) return false
            }
            return true
          })()
          if (lenOk && timingOk) {
            const code = buffer.join('')
            if (inEditable && cfg.preventInInputs) { /* no-op here */ }
            emitCode(code, e.target)
          }
          reset()
        }, cfg.interKeyTimeout)
      }
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
      if (cfg.suffix === 'none') {
        if (inactivityTimer != null) { clearTimeout(inactivityTimer) }
        inactivityTimer = window.setTimeout(() => {
          const lenOk = buffer.length >= cfg.minLength
          const timingOk = (() => {
            if (timestamps.length <= 1) return false
            const minBound = cfg.suffix === 'none' ? 0 : cfg.windowMsMin
            for (let i = 1; i < timestamps.length; i++) {
              const dt = timestamps[i] - timestamps[i - 1]
              if (dt < minBound || dt > cfg.interKeyTimeout) return false
            }
            return true
          })()
          if (lenOk && timingOk) {
            const code = buffer.join('')
            if (inEditable && cfg.preventInInputs) { /* no-op here */ }
            emitCode(code, e.target)
          }
          reset()
        }, cfg.interKeyTimeout)
      }
    } else {
      // Timing out of range; human typing or invalid burst
      // If suffix is 'none' and we have a valid burst, emit before resetting
      if (cfg.suffix === 'none') {
        const lenOk = buffer.length >= cfg.minLength
        const timingOk = (() => {
          if (timestamps.length <= 1) return false
          for (let i = 1; i < timestamps.length; i++) {
            const dt = timestamps[i] - timestamps[i - 1]
            if (dt < cfg.windowMsMin || dt > cfg.interKeyTimeout) return false
          }
          return true
        })()
        if (lenOk && timingOk) {
          const code = buffer.join('')
          if (inEditable && cfg.preventInInputs) { e.preventDefault() }
          emitCode(code, e.target)
        }
      }
      // Reset and treat this key as new start
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
