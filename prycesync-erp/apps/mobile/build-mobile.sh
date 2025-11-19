#!/bin/bash

# Script para construir la aplicación móvil con Capacitor

echo "🚀 Construyendo PryceSync Mobile..."

# Construir la aplicación web
echo "📦 Construyendo aplicación web..."
npm run build

# Sincronizar con Capacitor
echo "📱 Sincronizando con Capacitor..."
npx cap sync android

# Construir APK de Android
echo "🔨 Construyendo APK Android..."
cd android
./gradlew assembleRelease

# Volver al directorio raíz
cd ..

echo "✅ Construcción completada!"
echo "📱 APK generada en: android/app/build/outputs/apk/release/"
echo "📲 Para instalar: adb install android/app/build/outputs/apk/release/app-release.apk"