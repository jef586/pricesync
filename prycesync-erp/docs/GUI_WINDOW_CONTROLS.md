# GUI Window Controls — Header personalizado y IPC seguro

Este documento describe la implementación del header personalizado con controles de ventana (Minimizar y Cerrar) en la app Electron + Vue, usando IPC seguro y respetando el Design System.

## Objetivos

- Remover la barra nativa en Windows/Linux (`frame: false`).
- Usar `titleBarStyle: "hiddenInset"` en macOS para compatibilidad.
- Exponer solo `windowControls` en `window` (sin acceso directo a Electron desde el renderer).
- Área de drag en el header y botones no‑drag.

## Implementación

### Proceso principal (`src/main/main.js`)

- Configuración de `BrowserWindow`:
  - Windows/Linux: `frame: false`.
  - macOS: `titleBarStyle: 'hiddenInset'`.
  - Mantener `contextIsolation: true`, `nodeIntegration: false`, `preload` asignado.

- IPC:
  - `window:minimize` → `BrowserWindow.getFocusedWindow()?.minimize()`
  - `window:close` → `BrowserWindow.getFocusedWindow()?.close()`
  - `window:toggleMaximize` → alterna entre `maximize()` y `unmaximize()`

### Preload (`src/main/preload.js`)

```js
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  toggleMaximize: () => ipcRenderer.send('window:toggleMaximize')
})
```

### UI del Header (Vue)

- `src/renderer/src/components/layout/AppHeader.vue`:
  - Contenedor `header` con clases: `h-10 flex items-center justify-between px-3 select-none app-region-drag`.
  - Texto a la izquierda (`truncate`), controles a la derecha (`<WindowControls/>`).
  - Tokens: `bg-[var(--ps-bg)]`, `text-[var(--ps-text-primary)]`, `border-default`.

- `src/renderer/src/components/layout/WindowControls.vue`:
  - Botones Minimizar (`—`) y Cerrar (`✕`), `aria-label` + `title`.
  - Focus visible: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ps-primary)]`.
  - Wrapper con `app-region-no-drag`.

- Estilos globales:
  - `src/renderer/src/styles/header.css`:
    - `.app-region-drag { -webkit-app-region: drag; }`
    - `.app-region-no-drag { -webkit-app-region: no-drag; }`
  - Importado en `src/renderer/src/assets/main.css`.

- Integración en layout:
  - `DashboardLayout.vue` incluye `<AppHeader />` al inicio del `<main>`.

## Extender a Maximizar/Restaurar (Opcional)

1. Ya está el método `toggleMaximize` en preload + main.
2. Para mostrar el botón:
   - Añadir un botón al `WindowControls.vue`:
     ```vue
     <button aria-label="Maximizar/Restaurar" title="Maximizar/Restaurar" @click="window.windowControls.toggleMaximize()">▢</button>
     ```
   - Mantener `app-region-no-drag` en el wrapper.
3. Consideraciones UX:
   - Cambiar icono según estado (`isMaximized()` vía evento desde main o polling ligero en renderer si se expone nuevo canal `window:isMaximized`).

## Checklist de Verificación

- [ ] Win/Linux: La ventana inicia sin barra nativa (`frame: false`).
- [ ] macOS: `hiddenInset` activo sin romper menús.
- [ ] Drag desde el header; botones no arrastran.
- [ ] `Minimizar` funciona; `Cerrar` cierra la ventana/app.
- [ ] Sin acceso a Electron directo en renderer (solo `windowControls`).
- [ ] Focus visible y estilos coherentes con DS (light/dark).

## Capturas (agregar)

- Light: header + botones (hover/focus/active).
- Dark: header + botones (hover/focus/active).

## Notas

- Mantener `contextIsolation: true` y `nodeIntegration: false` para seguridad.
- Evitar que tooltips u overlays sean arrastrables: usar `app-region-no-drag` en dichos contenedores.