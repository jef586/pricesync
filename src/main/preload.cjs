const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload CJS] Loaded and exposing APIs');

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
  close: () => ipcRenderer.send('window:close')
});

contextBridge.exposeInMainWorld('pos', {
  scan: (code) => ipcRenderer.invoke('pos:scan', code)
});

contextBridge.exposeInMainWorld('system', {
  listPrinters: () => ipcRenderer.invoke('system:list-printers'),
  printTest: (payload) => ipcRenderer.invoke('system:print-test', payload),
  printTicket: (payload) => ipcRenderer.invoke('system:print-ticket', payload),
  printQueue: {
    addPending: (payload) => ipcRenderer.invoke('print:queue:add', payload),
    retryPending: (payload) => ipcRenderer.invoke('print:queue:retry', payload),
    clearSuccess: () => ipcRenderer.invoke('print:queue:clear-success'),
    getPendingCount: () => ipcRenderer.invoke('print:queue:get-pending-count'),
    onPrintSuccess: (cb) => ipcRenderer.on('print:success', (_event, data) => cb(data))
  },
  retry: (payload) => ipcRenderer.send('print:retry', payload)
});

// Fallback: definir también en window para dev
try {
  window.windowControls = {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
    close: () => ipcRenderer.send('window:close')
  };
  console.log('[Preload CJS] windowControls definido en window (fallback)');
} catch (e) {
  console.error('[Preload CJS] Error definiendo windowControls:', e);
}