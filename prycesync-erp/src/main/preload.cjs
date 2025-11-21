'use strict'

const { contextBridge, ipcRenderer } = require('electron')

try { console.log('[Preload CJS] Loaded and exposing APIs') } catch (_) {}

// System APIs: printing and devices
contextBridge.exposeInMainWorld('system', {
  listPrinters: () => ipcRenderer.invoke('system:list-printers'),
  printTest: (payload) => ipcRenderer.invoke('system:print-test', payload),
  printTicket: (payload) => ipcRenderer.invoke('system:print-ticket', payload),

  printQueue: {
    onPrintSuccess: (cb) => {
      if (typeof cb !== 'function') return () => {}
      const handler = (_event, data) => { try { cb(data) } catch (_) {} }
      ipcRenderer.on('printQueue:success', handler)
      return () => ipcRenderer.removeListener('printQueue:success', handler)
    }
  }
})

// POS APIs (barcode or external scan integration)
contextBridge.exposeInMainWorld('pos', {
  scan: (code) => ipcRenderer.invoke('pos:scan', code)
})

// Window controls (match ESM naming for compatibility)
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize')
})

// Safe ping to verify preload is active
contextBridge.exposeInMainWorld('app', {
  ping: async () => {
    try { return { ok: true, ts: Date.now() } } catch { return { ok: false } }
  }
})

// Fallback define on window for certain contexts
try {
  Object.defineProperty(window, 'windowControls', {
    value: {
      minimize: () => ipcRenderer.send('window:minimize'),
      close: () => ipcRenderer.send('window:close'),
      toggleMaximize: () => ipcRenderer.send('window:toggleMaximize')
    },
    writable: false,
    configurable: true
  })
  console.log('[Preload CJS] windowControls defined on window')
} catch (_) {}