import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type PrintingSettings, getPrintingSettings, updatePrintingSettings } from '@/services/settingsService'

const LS_KEY = 'printing_settings'

export const usePrintingStore = defineStore('printing', () => {
  const settings = ref<PrintingSettings>({
    defaultPrinter: null,
    paperWidth: 80,
    marginTop: 5,
    marginRight: 5,
    marginBottom: 5,
    marginLeft: 5,
    fontSize: 12,
    autoPrintAfterSale: false,
    branchId: null
  })
  const isLoaded = ref(false)

  const loadFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          settings.value = { ...settings.value, ...parsed }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const persistToLocalStorage = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings.value))
    } catch (e) {
      // ignore
    }
  }

  const load = async (branchId?: string | null) => {
    const data = await getPrintingSettings({ branchId: branchId || undefined })
    settings.value = data
    isLoaded.value = true
    persistToLocalStorage()
    return data
  }

  const save = async (payload?: Partial<PrintingSettings>) => {
    const updated = await updatePrintingSettings({ ...(payload || settings.value) })
    settings.value = updated
    persistToLocalStorage()
    return updated
  }

  return {
    settings,
    isLoaded,
    loadFromLocalStorage,
    persistToLocalStorage,
    load,
    save
  }
})