import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mantener una referencia global del objeto window, si no, la ventana será
// cerrada automáticamente cuando el objeto JavaScript sea recolectado por el garbage collector.
let mainWindow;

function getActiveWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || mainWindow;
}

async function waitForUrl(url, { timeoutMs = 30000, intervalMs = 1000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch (err) {
      // ignore and retry
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
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
  const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  console.log('[Electron] Loading URL:', DEV_URL);

  waitForUrl(DEV_URL, { timeoutMs: 30000 }).then(async (ok) => {
    if (ok) {
      await mainWindow.loadURL(DEV_URL);
    } else {
      console.error('[Electron] Dev server no disponible en', DEV_URL);
      // Mantener la ventana oculta si no hay servidor disponible
    }
  });

  // Mostrar solo cuando el contenido terminó de cargar, eliminando cualquier pantalla intermedia
  mainWindow.webContents.once('did-finish-load', () => {
    if (mainWindow) mainWindow.show();
  });

  // DevTools deshabilitado para evitar efectos de recarga/flicker

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
// Algunas APIs pueden usarse solo después de que este evento ocurra.
app.whenReady().then(createWindow);

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

ipcMain.on('window:maximize', () => {
  console.log('[IPC] window:maximize')
  const win = getActiveWindow();
  if (win) win.maximize();
});

ipcMain.on('window:setFullScreen', (_e, flag) => {
  console.log('[IPC] window:setFullScreen', flag)
  const win = getActiveWindow();
  if (win) win.setFullScreen(!!flag);
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
})
