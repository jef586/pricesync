import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mantener una referencia global del objeto window, si no, la ventana será
// cerrada automáticamente cuando el objeto JavaScript sea recolectado por el garbage collector.
let mainWindow;

function createWindow() {
  // Crear la ventana del navegador.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../renderer/assets/icon.png'), // Opcional: icono de la app
    show: false // No mostrar hasta que esté lista
  });

  // Cargar la aplicación Vue desde el servidor de desarrollo
  mainWindow.loadURL('http://localhost:5173');

  // Mostrar la ventana cuando esté lista para prevenir el flash visual
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Abrir las DevTools en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitido cuando la ventana es cerrada.
  mainWindow.on('closed', function () {
    // Desreferenciar el objeto window, usualmente guardarías las ventanas
    // en un array si tu app soporta multi ventanas, este es el momento
    // cuando deberías eliminar el elemento correspondiente.
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