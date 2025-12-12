<template>
  <div id="app" class="min-h-screen">
    <main :class="authStore.isAuthenticated ? 'pt-0' : ''">
      <RouterView :key="$route.fullPath" />
    </main>
    <NotificationContainer />
  </div>
  </template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import NotificationContainer from './components/molecules/NotificationContainer.vue'
import { onMounted, watch } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { usePrintingStore } from '@/stores/printing'

const authStore = useAuthStore()
const { success } = useNotifications()
const printingStore = usePrintingStore()

onMounted(() => {
  try { printingStore.init() } catch (_) {}
  const sys: any = (window as any).system
  if (sys && sys.printQueue && typeof sys.printQueue.onPrintSuccess === 'function') {
    try {
      sys.printQueue.onPrintSuccess((_data: any) => {
        success('Ticket impreso correctamente')
      })
    } catch (_) {}
  }
})

watch(() => authStore.isAuthenticated, (v) => {
  if (v) {
    try { (window as any).windowControls?.maximize?.() } catch {}
  }
})
</script>

<style>
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--ps-bg);
  color: var(--ps-text-primary);
}
#app { height: 100vh; overflow: hidden; }
:root { --ps-header-height: 40px; }
.fade-enter-active, .fade-leave-active { transition: opacity .4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
