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
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4174,
    strictPort: true
  }
})