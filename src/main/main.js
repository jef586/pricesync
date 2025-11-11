import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import printQueueService, { init as initPrintQueue, addPending as addPendingToQueue, retryPending as retryPendingQueue, clearSuccess as clearQueueSuccess, getPendingCount as getQueueCount } from './printQueueService.js'

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mantener una referencia global del objeto window, si no, la ventana será
// cerrada automáticamente cuando el objeto JavaScript sea recolectado por el garbage collector.
let mainWindow;

function getActiveWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || mainWindow;
}

function createWindow() {
  // Crear la ventana del navegador.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: process.platform === 'darwin' ? true : false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
    minimizable: true,
    maximizable: true,
    closable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../renderer/assets/icon.png'),
    show: false
  });

  console.log('[Electron] Preload path:', path.join(__dirname, 'preload.cjs'));
  console.log('[Electron] Loading URL:', 'http://localhost:5173');
  mainWindow.loadURL('http://localhost:5173');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
// Algunas APIs pueden usarse solo después de que este evento ocurra.
app.whenReady().then(async () => {
  initPrintQueue()
  createWindow()
  // Intentar reintentar pendientes al iniciar (no bloqueante)
  setTimeout(() => {
    try {
      retryPendingQueue({})
    } catch (_) {}
  }, 1500)
});

// Salir cuando todas las ventanas estén cerradas.
app.on('window-all-closed', function () {
  // En macOS es común para las aplicaciones y su barra de menú
  // que se mantengan activas hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // En macOS es común re-crear una ventana en la app cuando el
  // icono del dock es clickeado y no hay otras ventanas abiertas.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// En este archivo puedes incluir el resto del código específico del proceso principal
// de tu aplicación. También puedes ponerlo en archivos separados y requerirlos aquí.

// IPC handler para pos:scan (retorna OK; el agregado se maneja en renderer via store)
ipcMain.handle('pos:scan', async (_event, code) => {
  try {
    // En caso de necesitar reenviar al renderer activo, podría emitirse un evento.
    // Por ahora solo confirmamos recepción.
    return { ok: true, code }
  } catch (err) {
    return { ok: false, error: (err && err.message) || 'unknown' }
  }
});

// IPC: Controles de ventana (Minimizar / Cerrar / Toggle Maximize)
ipcMain.on('window:minimize', () => {
  console.log('[IPC] window:minimize')
  const win = getActiveWindow();
  if (win) win.minimize();
});

ipcMain.on('window:close', () => {
  console.log('[IPC] window:close')
  const win = getActiveWindow();
  if (win) win.close();
});

ipcMain.on('window:toggleMaximize', () => {
  console.log('[IPC] window:toggleMaximize')
  const win = getActiveWindow();
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

// IPC: List printers available in the active window (Electron)
ipcMain.handle('system:list-printers', async () => {
  try {
    const win = getActiveWindow()
    if (!win) return { ok: false, error: 'No active window' }
    const printers = await win.webContents.getPrintersAsync()
    return { ok: true, printers }
  } catch (err) {
    return { ok: false, error: (err && err.message) || 'unknown' }
  }
});

// IPC: Print test page to a selected printer
ipcMain.handle('system:print-test', async (_event, payload) => {
  try {
    const win = getActiveWindow()
    if (!win) return { ok: false, error: 'No active window' }

    const text = (payload && payload.text) || 'Test de impresión PryceSync ERP'
    const deviceName = payload && payload.printerName

    // Create a minimal about:blank window, render simple HTML and print silently
    const temp = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })
    await temp.loadURL('about:blank')
    await temp.webContents.executeJavaScript(`
      document.body.style.fontFamily = 'sans-serif';
      document.body.style.margin = '24px';
      document.body.innerHTML = '<h2>Impresión de prueba</h2><p>' + ${JSON.stringify(text)} + '</p>';
    `)

    await new Promise((resolve, reject) => {
      temp.webContents.print({ silent: true, deviceName }, (success, failureReason) => {
        if (!success) return reject(new Error(failureReason || 'print-failed'))
        resolve()
      })
    })

    temp.destroy()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err && err.message) || 'unknown' }
  }
});

// IPC: Print a ticket given HTML or PDF base64
ipcMain.handle('system:print-ticket', async (_event, payload) => {
  try {
    const win = getActiveWindow()
    if (!win) return { ok: false, error: 'No active window' }

    const deviceName = payload && payload.printerName
    const html = payload && payload.html
    const pdfBase64 = payload && payload.pdfBase64

    const temp = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    if (html && typeof html === 'string' && html.length > 0) {
      await temp.loadURL('about:blank')
      await temp.webContents.executeJavaScript(`document.open();document.write(${JSON.stringify(html)});document.close();`)
    } else if (pdfBase64 && typeof pdfBase64 === 'string' && pdfBase64.length > 0) {
      const dataUrl = `data:application/pdf;base64,${pdfBase64}`
      await temp.loadURL(dataUrl)
    } else {
      temp.destroy()
      return { ok: false, error: 'No content provided' }
    }

    await new Promise((resolve, reject) => {
      temp.webContents.print({ silent: true, deviceName }, (success, failureReason) => {
        if (!success) return reject(new Error(failureReason || 'print-failed'))
        resolve()
      })
    })

    temp.destroy()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err && err.message) || 'unknown' }
  }
});

// IPC: Print Queue service (file-backed)
ipcMain.handle('print:queue:add', async (_event, payload) => {
  try {
    const { invoiceId, buffer, timestamp } = payload || {}
    return addPendingToQueue({ invoiceId, buffer, timestamp })
  } catch (e) {
    return { ok: false, error: e?.message || 'queue-add-error' }
  }
});

ipcMain.handle('print:queue:get-pending-count', async () => {
  try {
    return { ok: true, count: getQueueCount() }
  } catch (e) {
    return { ok: false, error: e?.message || 'queue-count-error' }
  }
});

ipcMain.handle('print:queue:retry', async (_event, payload) => {
  try {
    const { printerName } = payload || {}
    const res = await retryPendingQueue({ printerName })
    return res
  } catch (e) {
    return { ok: false, error: e?.message || 'queue-retry-error' }
  }
});

ipcMain.handle('print:queue:clear-success', async () => {
  try {
    return clearQueueSuccess()
  } catch (e) {
    return { ok: false, error: e?.message || 'queue-clear-error' }
  }
});

// IPC channel to trigger retry explicitly (printer reconnection)
ipcMain.on('print:retry', async (_event, payload) => {
  try {
    const { printerName } = payload || {}
    await retryPendingQueue({ printerName })
  } catch (e) {
    console.error('[IPC] print:retry error:', e)
  }
});