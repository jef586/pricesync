import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Fuerza la raíz a /app (proyecto completo), no al renderer
  root: '.',
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/backend/**/__tests__/*.{test,spec}.js',
      'src/backend/**/*.{test,spec}.js',
      // Incluir tests de componentes del renderer (se fuerza jsdom por archivo)
      'src/renderer/src/components/**/__tests__/*.{test,spec}.ts',
      // Incluir tests de stores del renderer
      'src/renderer/src/stores/**/__tests__/*.{test,spec}.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/backend/services/**']
    }
  }
})