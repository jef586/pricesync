import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useBarcode } from '../../src/renderer/src/composables/useBarcode'

function typeSequence(keys: string[], delaysMs: number[]) {
  // Dispatch keys with delays between them
  for (let i = 0; i < keys.length; i++) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: keys[i] }))
    const delay = delaysMs[i] || 0
    if (delay > 0) vi.advanceTimersByTime(delay)
  }
}

describe('useBarcode composable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits code once for a valid burst ending with Enter', () => {
    const code = '7791234567891'
    const { start, stop, onScan } = useBarcode({ windowMsMin: 5, windowMsMax: 20, minLength: 6 })
    const scanned: string[] = []
    const unsub = onScan((c) => scanned.push(c))
    start()

    // Type digits with 10ms delay, then Enter
    const keys = [...code.split(''), 'Enter']
    const delays = Array(keys.length).fill(10)
    typeSequence(keys, delays)

    expect(scanned).toEqual([code])
    unsub()
    stop()
  })

  it('supports Tab as terminator when configured', () => {
    const code = 'ABC1234567'
    const { start, stop, onScan } = useBarcode({ windowMsMin: 5, windowMsMax: 20, suffix: 'Tab', minLength: 6 })
    const scanned: string[] = []
    const unsub = onScan((c) => scanned.push(c))
    start()

    const keys = [...code.split(''), 'Tab']
    const delays = Array(keys.length).fill(10)
    typeSequence(keys, delays)

    expect(scanned).toEqual([code])
    unsub()
    stop()
  })

  it('ignores burst if length < minLength', () => {
    const short = '12345'
    const { start, stop, onScan } = useBarcode({ windowMsMin: 5, windowMsMax: 20, minLength: 6 })
    const scanned: string[] = []
    const unsub = onScan((c) => scanned.push(c))
    start()
    const keys = [...short.split(''), 'Enter']
    const delays = Array(keys.length).fill(10)
    typeSequence(keys, delays)
    expect(scanned).toEqual([])
    unsub()
    stop()
  })

  it('resets if a non-printable key appears (not terminator)', () => {
    const code = 'XYZ1234'
    const { start, stop, onScan } = useBarcode({ windowMsMin: 5, windowMsMax: 20, minLength: 6 })
    const scanned: string[] = []
    const unsub = onScan((c) => scanned.push(c))
    start()
    // Insert non-printable like ArrowLeft in the middle
    const keys = ['X', 'Y', 'Z', 'ArrowLeft', '1', '2', '3', '4', 'Enter']
    const delays = Array(keys.length).fill(10)
    typeSequence(keys, delays)
    expect(scanned).toEqual([])
    unsub()
    stop()
  })

  it('does not emit when a pause > windowMsMax occurs', () => {
    const code = '12345678'
    const { start, stop, onScan } = useBarcode({ windowMsMin: 5, windowMsMax: 20, minLength: 6 })
    const scanned: string[] = []
    const unsub = onScan((c) => scanned.push(c))
    start()
    // First few keys within 10ms, then a big pause 120ms, then continue + Enter
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))
    vi.advanceTimersByTime(10)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }))
    vi.advanceTimersByTime(120)
    typeSequence(['3', '4', '5', '6', '7', '8', 'Enter'], Array(8).fill(10))
    expect(scanned).toEqual([])
    unsub()
    stop()
  })
})