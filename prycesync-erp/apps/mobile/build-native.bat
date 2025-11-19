@echo off
echo 🚀 Iniciando construcción de app nativa...

echo 📦 Construyendo app web...
call npm run build

echo 🔄 Sincronizando con Capacitor...
call npx capacitor sync android

echo 📁 Preparando archivos de salida...
if not exist "dist\native-output" mkdir "dist\native-output"

echo 📄 Creando instrucciones de construcción...
(
echo # Instrucciones para construir APK
echo.
echo ## Opción 1: Usar Android Studio
echo 1. Abrir Android Studio
echo 2. Importar el proyecto desde la carpeta `android\`
echo 3. Conectar un dispositivo o usar emulador
echo 4. Hacer clic en "Run" o "Build ^> Build Bundle(s) / APK(s)"
echo.
echo ## Opción 2: Usar línea de comandos
echo 1. Asegurarse de tener Android SDK instalado
echo 2. Navegar a la carpeta `android\`
echo 3. Ejecutar: `.\gradlew assembleDebug` (para debug APK)
echo 4. Ejecutar: `.\gradlew assembleRelease` (para release APK)
echo.
echo ## Archivos generados:
echo - APK Debug: `android\app\build\outputs\apk\debug\app-debug.apk`
echo - APK Release: `android\app\build\outputs\apk\release\app-release.apk`
) > "dist\native-output\BUILD_INSTRUCTIONS.md"

echo ✅ Proceso completado!
echo 📱 Para generar el APK, sigue las instrucciones en: dist\native-output\BUILD_INSTRUCTIONS.md
echo 🔧 O abre Android Studio y carga el proyecto desde la carpeta 'android\'
echo.
echo 📋 Información del proyecto:
echo    - Nombre: PryceSync Mobile
echo    - ID: com.prycesync.mobile
echo    - Versión: 1.0.0
echo    - Plataforma: Android
echo.
echo 🎯 La app está lista para ser compilada en Android Studio!
pause