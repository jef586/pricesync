import { describe, it, expect, vi } from 'vitest'

// Capture registered handlers
const handles: Record<string, Function> = {}
const onEvents: Record<string, Function[]> = {}

vi.mock('electron', () => {
  return {
    app: {
      whenReady: () => ({ then: (_cb: any) => {/* do not call to avoid creating windows */} })
    },
    BrowserWindow: vi.fn(() => ({
      loadURL: vi.fn(async () => {}),
      once: vi.fn(),
      show: vi.fn(),
      destroy: vi.fn(),
      webContents: {
        openDevTools: vi.fn(),
        getPrintersAsync: vi.fn(async () => [{ name: 'MockPrinter' }]),
        executeJavaScript: vi.fn(async () => {}),
        print: vi.fn((_opts, cb) => cb(true))
      },
      isMaximized: vi.fn(() => false),
      minimize: vi.fn(),
      maximize: vi.fn(),
      unmaximize: vi.fn()
    })),
    ipcMain: {
      handle: vi.fn((channel: string, handler: Function) => { handles[channel] = handler }),
      on: vi.fn((channel: string, handler: Function) => {
        onEvents[channel] = onEvents[channel] || []
        onEvents[channel].push(handler)
      })
    }
  }
})

// Import main after mocking
import '../../src/main/main.js'

describe('Electron IPC registrations', () => {
  it('registers system:list-printers handler', () => {
    expect(handles['system:list-printers']).toBeTypeOf('function')
  })

  it('registers system:print-test handler', () => {
    expect(handles['system:print-test']).toBeTypeOf('function')
  })
})