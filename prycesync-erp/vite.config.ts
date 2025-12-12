import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const isTesting = mode === 'test' || !!process.env.VITEST

  const plugins = [vue()]
  if (!isTesting) {
    const vueDevTools = (await import('vite-plugin-vue-devtools')).default
    plugins.push(vueDevTools())
  }

  return {
    root: 'src/renderer',
    server: {
      host: '0.0.0.0',
      port: 5173,
      hmr: false,
      watch: {
        // Evita que Vite observe cambios y dispare recargas
        usePolling: false,
        ignored: ['**/*']
      }
    },
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url))
      },
    },
    optimizeDeps: {
      entries: ['src/main.ts'],
      include: [
        'axios',
        'chart.js',
        'vue-chartjs',
        'lodash-es',
        '@heroicons/vue/24/outline'
      ]
    }
  }
})

