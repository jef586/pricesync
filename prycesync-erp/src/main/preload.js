import { contextBridge, ipcRenderer } from 'electron'

// Expose minimal, secure API to renderer
contextBridge.exposeInMainWorld('pos', {
  scan: (code) => ipcRenderer.invoke('pos:scan', code)
})