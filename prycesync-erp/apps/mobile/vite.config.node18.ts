import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Configuración simplificada para Node 18
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Configuración para Node 18
    target: 'es2015',
    minify: 'terser',
    sourcemap: false,
  },
  server: {
    port: 5173,
    host: true,
  },
  // Deshabilitar características que requieren Node 20+
  optimizeDeps: {
    exclude: ['@capacitor/*'],
  },
})