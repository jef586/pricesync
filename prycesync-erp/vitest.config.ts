import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Fuerza la raíz a /app (proyecto completo), no al renderer
  root: '.',
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/backend/**/__tests__/*.{test,spec}.js',
      'src/backend/**/*.{test,spec}.js'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/renderer/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/backend/services/**']
    }
  }
})