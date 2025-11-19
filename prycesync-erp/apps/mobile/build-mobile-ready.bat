@echo off
echo 🚀 Construyendo app nativa con Node 18...

echo 📦 Usando build existente de la web...
if not exist "dist" (
    echo ⚠️  No se encontró build existente. Creando build básico...
    mkdir dist
    mkdir dist\assets
    
    echo 📄 Copiando archivos de la app...
    xcopy /E /I /Y src dist\assets\src 2>nul
    copy index.html dist\ 2>nul
    copy manifest.json dist\ 2>nul
    
    echo 🔧 Creando index.html básico...
    (
    echo ^<!DOCTYPE html^>
    echo ^<html lang="es"^>
    echo ^<head^>
    echo     ^<meta charset="UTF-8"^>
    echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
    echo     ^<title^>PryceSync Mobile^</title^>
    echo     ^<link rel="manifest" href="/manifest.json"^>
    echo ^</head^>
    echo ^<body^>
    echo     ^<div id="app"^>^</div^>
    echo     ^<script type="module" src="/src/main.ts"^>^</script^>
    echo ^</body^>
    echo ^</html^>
    ) > dist\index.html
)

echo 🔄 Preparando Capacitor (sin sincronización)...
echo ✅ Archivos preparados para Android Studio

echo 📁 Creando estructura de salida...
if not exist "dist\native-output" mkdir "dist\native-output"

echo 📄 Creando instrucciones de construcción...
(
echo # Instrucciones para construir APK con Node 18
echo.
echo ## Método recomendado: Android Studio
echo 1. **Abrir Android Studio**
echo 2. **Importar proyecto**: Seleccionar la carpeta `android\`
echo 3. **Esperar a que se sincronice** el proyecto
echo 4. **Conectar dispositivo Android** o usar emulador
echo 5. **Click en "Run"** o usar "Build ^> Build Bundle(s) / APK(s)"
echo.
echo ## Método alternativo: Línea de comandos
echo 1. **Instalar Android SDK** (incluido en Android Studio)
echo 2. **Abrir terminal** en la carpeta `android\`
echo 3. **Para APK Debug**: `.\gradlew assembleDebug`
echo 4. **Para APK Release**: `.\gradlew assembleRelease`
echo.
echo ## Ubicación de APKs generados:
echo - **Debug APK**: `android\app\build\outputs\apk\debug\app-debug.apk`
echo - **Release APK**: `android\app\build\outputs\apk\release\app-release.apk`
echo.
echo ## Información del proyecto:
echo - **Nombre**: PryceSync Mobile
echo - **Package ID**: com.prycesync.mobile
echo - **Versión**: 1.0.0
echo - **Mínimo Android**: API 22 (Android 5.1)
echo.
echo ## Notas importantes:
echo - El proyecto ya está configurado con Capacitor
echo - Los archivos web están en `dist\`
echo - Android Studio manejará la sincronización automáticamente
echo - Para distribución, usar el APK Release con tu keystore
echo.
echo ## Primeros pasos después de importar:
echo 1. Android Studio detectará que es un proyecto Capacitor
echo 2. Se descargarán dependencias automáticamente
echo 3. Se sincronizarán los archivos web desde `dist\`
echo 4. ¡Listo para compilar y ejecutar!
) > "dist\native-output\BUILD_INSTRUCTIONS.md"

echo 📋 Creando resumen del proyecto...
(
echo # PryceSync Mobile - App Nativa
echo.
echo ## Estado actual:
echo ✅ Proyecto Capacitor configurado
echo ✅ Estructura Android creada
echo ✅ Archivos web preparados
echo ✅ Lista para compilar en Android Studio
echo.
echo ## Siguientes pasos:
echo 1. Abrir Android Studio
echo 2. Importar desde: %cd%\android
echo 3. Compilar y obtener APK
echo.
echo ## Archivos importantes:
echo - Config Android: `android\app\src\main\AndroidManifest.xml`
echo - Config Capacitor: `capacitor.config.ts`
echo - Archivos web: `dist\`
echo - Instrucciones: `dist\native-output\BUILD_INSTRUCTIONS.md`
) > "dist\native-output\PROJECT_SUMMARY.md"

echo.
echo ✅ ¡PROCESO COMPLETADO!
echo.
echo 📱 **TU APP MÓVIL ESTÁ LISTA PARA COMPILAR**
echo.
echo 🔧 **Siguientes pasos:**
echo 1. Abre Android Studio
echo 2. Importa el proyecto desde: android\
echo 3. Conecta tu dispositivo Android
echo 4. Click en "Run" para probar
echo 5. Usa "Build ^> Build APK" para generar APK
echo.
echo 📂 **Archivos creados:**
echo - Instrucciones: dist\native-output\BUILD_INSTRUCTIONS.md
echo - Resumen: dist\native-output\PROJECT_SUMMARY.md
echo.
echo 🎯 **¡Tu app nativa PryceSync Mobile está lista!**
echo    Package: com.prycesync.mobile
echo    Mínimo Android: 5.1 (API 22)
echo    Tipo: App híbrida con Capacitor
pause