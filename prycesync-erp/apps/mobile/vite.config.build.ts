# Build script compatible con Node 18
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@ui': resolve(__dirname, '../../../src/renderer/src/components'),
      '@tokens': resolve(__dirname, '../../../src/renderer/src/styles'),
      '@shared': resolve(__dirname, '../../../src/shared')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          ionic: ['@ionic/vue'],
          router: ['vue-router']
        }
      }
    }
  }
})