import nodeCrypto from 'node:crypto'
// Polyfill for @vitejs/plugin-vue on older Node: add crypto.hash if missing
if (!(nodeCrypto as any).hash) {
  ;(nodeCrypto as any).hash = (alg: string, data: string, encoding: 'hex' | 'base64' | 'latin1') => {
    return nodeCrypto.createHash(alg).update(data).digest(encoding)
  }
}

import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '.',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/backend/**/__tests__/*.{test,spec}.js',
      'src/backend/**/*.{test,spec}.js',
      'src/renderer/src/components/**/__tests__/*.{test,spec}.ts',
      'src/renderer/src/stores/**/__tests__/*.{test,spec}.ts'
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environmentMatchGlobs: [
      ['src/renderer/src/components/**/__tests__/**', 'jsdom'],
      ['src/renderer/src/stores/**/__tests__/**', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/backend/services/**']
    }
  }
})