import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nativeAppService } from '../services/nativeAppService'

export const useAppStore = defineStore('app', () => {
  const isNative = ref(false)
  const platform = ref('web')
  const isOnline = ref(true)
  const deviceInfo = ref<any>(null)

  const isMobile = computed(() => isNative.value || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))

  async function initializeApp() {
    try {
      // Detectar si es plataforma nativa
      const { Capacitor } = await import('@capacitor/core')
      isNative.value = Capacitor.isNativePlatform()
      platform.value = Capacitor.getPlatform()

      if (isNative.value) {
        // Inicializar servicios nativos
        await nativeAppService.initialize()
        
        // Obtener información del dispositivo
        deviceInfo.value = await nativeAppService.getDeviceInfo()
        
        // Verificar conectividad
        isOnline.value = await nativeAppService.isOnline()
      } else {
        // Modo web - usar APIs del navegador
        deviceInfo.value = {
          platform: 'web',
          model: 'browser',
          manufacturer: 'unknown',
          userAgent: navigator.userAgent
        }
        isOnline.value = navigator.onLine
        
        // Escuchar cambios de conectividad
        window.addEventListener('online', () => isOnline.value = true)
        window.addEventListener('offline', () => isOnline.value = false)
      }
    } catch (error) {
      console.error('Error initializing app:', error)
      // Fallback a modo web
      deviceInfo.value = {
        platform: 'web',
        model: 'browser',
        manufacturer: 'unknown'
      }
    }
  }

  async function checkConnectivity() {
    if (isNative.value) {
      isOnline.value = await nativeAppService.isOnline()
    } else {
      isOnline.value = navigator.onLine
    }
    return isOnline.value
  }

  return {
    isNative,
    platform,
    isOnline,
    deviceInfo,
    isMobile,
    initializeApp,
    checkConnectivity
  }
})