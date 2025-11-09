import { describe, it, expect, vi } from 'vitest'

const exposed: Record<string, any> = {}
vi.mock('electron', () => {
  return {
    contextBridge: {
      exposeInMainWorld: vi.fn((key: string, value: any) => { exposed[key] = value })
    },
    ipcRenderer: {
      invoke: vi.fn(),
      send: vi.fn()
    }
  }
})

import '../../src/main/preload.cjs'

describe('Preload exposures', () => {
  it('exposes system API with listPrinters and printTest', () => {
    expect(exposed.system).toBeDefined()
    expect(typeof exposed.system.listPrinters).toBe('function')
    expect(typeof exposed.system.printTest).toBe('function')
  })
})