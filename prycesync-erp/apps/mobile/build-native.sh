#!/bin/bash

# Script para construir app nativa sin Docker
# Este script usa Node 18 y construye la app web, luego prepara los archivos para Android

echo "🚀 Iniciando construcción de app nativa..."

# 1. Construir la app web
echo "📦 Construyendo app web..."
npm run build

# 2. Sincronizar con Capacitor
echo "🔄 Sincronizando con Capacitor..."
npx capacitor sync android

# 3. Verificar que exista el directorio Android
if [ ! -d "android" ]; then
    echo "❌ Directorio Android no encontrado. Ejecutando add android..."
    npx capacitor add android
fi

# 4. Preparar archivos de salida
echo "📁 Preparando archivos de salida..."
mkdir -p dist/native-output

# 5. Copiar archivos importantes
cp -r android/app/src/main/assets/public dist/native-output/ 2>/dev/null || true
cp -r android/app/build/outputs dist/native-output/ 2>/dev/null || true

# 6. Crear archivo de instrucciones
cat > dist/native-output/BUILD_INSTRUCTIONS.md << 'EOF'
# Instrucciones para construir APK

## Opción 1: Usar Android Studio
1. Abrir Android Studio
2. Importar el proyecto desde la carpeta `android/`
3. Conectar un dispositivo o usar emulador
4. Hacer clic en "Run" o "Build > Build Bundle(s) / APK(s)"

## Opción 2: Usar línea de comandos
1. Asegurarse de tener Android SDK instalado
2. Navegar a la carpeta `android/`
3. Ejecutar: `./gradlew assembleDebug` (para debug APK)
4. Ejecutar: `./gradlew assembleRelease` (para release APK)

## Archivos generados:
- APK Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- APK Release: `android/app/build/outputs/apk/release/app-release.apk`
EOF

echo "✅ Proceso completado!"
echo "📱 Para generar el APK, sigue las instrucciones en: dist/native-output/BUILD_INSTRUCTIONS.md"
echo "🔧 O abre Android Studio y carga el proyecto desde la carpeta 'android/'"

# Mostrar información del proyecto
echo ""
echo "📋 Información del proyecto:"
echo "   - Nombre: PryceSync Mobile"
echo "   - ID: com.prycesync.mobile"
echo "   - Versión: 1.0.0"
echo "   - Plataforma: Android"
echo ""
echo "🎯 La app está lista para ser compilada en Android Studio!"