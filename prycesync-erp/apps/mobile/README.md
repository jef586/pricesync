# PryceSync Mobile - App Nativa

Aplicación móvil nativa para el equipo de ventas de PryceSync ERP, construida con Vue 3, Ionic y Capacitor.

## 🚀 Características

- **Multiplataforma**: Funciona en Android e iOS
- **Diseño responsive**: Adaptado para móviles y tablets
- **Funciona offline**: Almacenamiento local cuando no hay conexión
- **Integración ERP**: Conecta con el sistema PryceSync ERP
- **Notificaciones push**: Soporte para notificaciones (configurable)

## 📱 Tecnologías

- **Vue 3** con Composition API
- **Ionic Vue** para componentes móviles
- **Capacitor** para acceso nativo
- **TypeScript** para type safety
- **Pinia** para manejo de estado

## 🛠️ Instalación y Desarrollo

### Requisitos previos

- Node.js 20+ (para Capacitor CLI)
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS - solo macOS)

### Instalación

```bash
cd prycesync-erp/apps/mobile
npm install
```

### Desarrollo Web

```bash
npm run dev
```

La app estará disponible en `http://localhost:5174`

### Construir para Producción

```bash
# Construir aplicación web
npm run build

# Sincronizar con plataformas nativas
npm run capacitor:sync

# Construir APK Android
npm run android:build

# Construir APK de desarrollo
npm run android:build:dev
```

## 📱 Construcción de App Nativa

### Android

1. **Configurar Android Studio**:
   - Instalar Android Studio
   - Configurar SDK y herramientas de build
   - Crear keystore para firma (opcional)

2. **Construir APK**:
   ```bash
   npm run android:build
   ```

3. **APK generada en**:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Instalar en dispositivo**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

### iOS (solo macOS)

1. **Abrir en Xcode**:
   ```bash
   npm run capacitor:open:ios
   ```

2. **Configurar y construir** desde Xcode

## 🔧 Configuración

### Variables de entorno

Crear archivo `.env` basado en `.env.example`:

```env
VITE_API_BASE_URL=https://api.prycesync.com
VITE_COMPANY_ID=your-company-id
VITE_TENANT_ID=your-tenant-id
```

### Capacitor

Configuración en `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'com.prycesync.mobile',
  appName: 'PryceSync Mobile',
  webDir: 'dist',
  // ... más configuración
}
```

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo web con hot reload |
| `npm run build` | Construir para producción |
| `npm run capacitor:sync` | Sincronizar cambios con plataformas |
| `npm run capacitor:open:android` | Abrir proyecto en Android Studio |
| `npm run capacitor:open:ios` | Abrir proyecto en Xcode |
| `npm run android:build` | Construir APK de release |
| `npm run android:build:dev` | Construir APK de desarrollo |

## 🌐 Modo Web vs Nativo

La app detecta automáticamente si está ejecutándose como:

- **Web**: A través de un navegador
- **Nativo**: Como app instalada en Android/iOS

Esto permite:
- Funciones nativas cuando está instalada
- Fallback a APIs del navegador cuando es web
- Diseño adaptativo según plataforma

## 🔌 Plugins de Capacitor

Plugins instalados y configurados:

- **Device**: Información del dispositivo
- **Network**: Estado de conexión
- **Storage**: Almacenamiento persistente
- **SplashScreen**: Pantalla de bienvenida

## 🚀 Despliegue

### Docker (Web)

```bash
docker-compose up mobile-app
```

### App Store / Google Play

1. Construir versión de release
2. Firmar el APK/IPA
3. Subir a tiendas correspondientes
4. Configurar metadatos y capturas de pantalla

## 📞 Soporte

Para problemas o preguntas:
- Verificar logs del dispositivo con `adb logcat` (Android)
- Usar Safari Web Inspector (iOS)
- Revisar consola del navegador (modo web)

## 📄 Licencia

Este proyecto es parte del sistema PryceSync ERP.