#!/bin/bash

# Script de construcción simplificado para Node 18

echo "🚀 Construyendo PryceSync Mobile (Node 18 compatible)..."

# Limpiar directorio de construcción anterior
rm -rf dist

# Construir con Vite directamente (sin vue-tsc)
echo "📦 Construyendo con Vite..."
npx vite build --config vite.config.build.ts

# Verificar si la construcción fue exitosa
if [ -d "dist" ]; then
    echo "✅ Construcción web completada!"
    echo "📁 Archivos generados en: dist/"
    echo "📊 Tamaño del build:"
    du -sh dist/
else
    echo "❌ Error en la construcción"
    exit 1
fi

# Preparar para Capacitor si existe
if [ -d "android" ]; then
    echo "📱 Preparando para Android..."
    echo "✅ Listo para sincronizar con Capacitor"
    echo "   Ejecuta: npx cap sync android (requiere Node 20+)"
fi

echo "🎉 ¡Construcción finalizada!"
echo ""
echo "Próximos pasos:"
echo "1. Para desarrollo web: npm run dev"
echo "2. Para app nativa: Actualizar a Node 20+ y ejecutar npx cap sync android"