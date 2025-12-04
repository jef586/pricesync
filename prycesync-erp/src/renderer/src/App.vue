<template>
  <div id="app" class="min-h-screen">
    <transition name="fade">
      <Preloader v-if="isLoading" :visible="isLoading" />
    </transition>
    <main :class="authStore.isAuthenticated ? 'pt-0' : ''">
      <RouterView :key="$route.fullPath" />
    </main>
    <NotificationContainer />
  </div>
  </template>

<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import NotificationContainer from './components/molecules/NotificationContainer.vue'
import { onMounted, ref, watch } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { usePrintingStore } from '@/stores/printing'
import Preloader from '@/components/Preloader.vue'

const authStore = useAuthStore()
const { success } = useNotifications()
const printingStore = usePrintingStore()
const isLoading = ref(true)
const router = useRouter()
const route = useRoute()

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
  try {
    router.isReady().then(() => { isLoading.value = false })
  } catch (_) {
    isLoading.value = false
  }
})

watch(() => route.fullPath, () => { isLoading.value = false })
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
