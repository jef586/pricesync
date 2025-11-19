import { Capacitor } from '@capacitor/core'

export class NativeAppService {
  private static instance: NativeAppService

  static getInstance(): NativeAppService {
    if (!NativeAppService.instance) {
      NativeAppService.instance = new NativeAppService()
    }
    return NativeAppService.instance
  }

  async initialize(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      console.log('Initializing native app services...')
      console.log('Platform:', Capacitor.getPlatform())
      console.log('Device info:', await this.getDeviceInfo())
      
      // Escuchar cambios de conectividad
      window.addEventListener('online', () => {
        console.log('Network status changed: online')
      })
      
      window.addEventListener('offline', () => {
        console.log('Network status changed: offline')
      })
    }
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine
  }

  async getDeviceInfo() {
    if (Capacitor.isNativePlatform()) {
      return {
        platform: Capacitor.getPlatform(),
        isNative: true,
        model: 'native-device',
        manufacturer: 'unknown'
      }
    }
    return {
      platform: 'web',
      isNative: false,
      model: 'browser',
      manufacturer: 'unknown',
      userAgent: navigator.userAgent
    }
  }

  async setStorage(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value)
  }

  async getStorage(key: string): Promise<string | null> {
    return localStorage.getItem(key)
  }

  async removeStorage(key: string): Promise<void> {
    localStorage.removeItem(key)
  }
}

export const nativeAppService = NativeAppService.getInstance()