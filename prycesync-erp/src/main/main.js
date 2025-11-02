import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

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