import { contextBridge, ipcRenderer } from 'electron'
console.log('[Preload] Loaded and exposing APIs')

// Expose minimal, secure API to renderer
contextBridge.exposeInMainWorld('pos', {
  scan: (code) => ipcRenderer.invoke('pos:scan', code)
})

// Expose system IPC for printers and test printing
contextBridge.exposeInMainWorld('system', {
  listPrinters: () => ipcRenderer.invoke('system:list-printers'),
  printTest: (payload) => ipcRenderer.invoke('system:print-test', payload),
  printTicket: (payload) => ipcRenderer.invoke('system:print-ticket', payload)
})

// Exponer controles de ventana (IPC seguro)
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize')
})

// Fallback para entornos donde el bridge no se refleja correctamente
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
  console.log('[Preload] windowControls definido en window')
} catch (e) {
  console.error('[Preload] Error definiendo windowControls en window:', e)
}