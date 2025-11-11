import { defineStore } from 'pinia'
import { ref } from 'vue'
import { printTicketOrQueue } from '@/services/printOrQueue'
import { getPendingCount, getPendingCountAsync, retryAll } from '@/services/printQueue'
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
  const isPrinting = ref(false)
  const pendingCount = ref<number>(0)

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

  const printTicket = async (invoiceId: string) => {
    isPrinting.value = true
    try {
      const res = await printTicketOrQueue(invoiceId, { printerName: settings.value.defaultPrinter })
      // Update pending count after any print attempt
      try { pendingCount.value = await getPendingCountAsync() } catch (_) {}
      return res
    } finally {
      isPrinting.value = false
    }
  }

  const retryPrintQueueAll = async () => {
    const res = await retryAll({ printerName: settings.value.defaultPrinter })
    try { pendingCount.value = await getPendingCountAsync() } catch (_) {}
    return res
  }

  const pendingJobs = () => getPendingCount()

  const refreshPendingCount = async () => {
    try {
      pendingCount.value = await getPendingCountAsync()
    } catch (_) {
      pendingCount.value = getPendingCount()
    }
    return pendingCount.value
  }

  // Initialize pending count and listen to main-process success events
  const init = () => {
    refreshPendingCount()
    const sys: any = (window as any).system
    if (sys && sys.printQueue && typeof sys.printQueue.onPrintSuccess === 'function') {
      try {
        sys.printQueue.onPrintSuccess(async (_data: any) => {
          // Update count on successful print
          try { pendingCount.value = await getPendingCountAsync() } catch (_) {}
        })
      } catch (_) {}
    }
  }

  return {
    settings,
    isLoaded,
    isPrinting,
    pendingCount,
    loadFromLocalStorage,
    persistToLocalStorage,
    load,
    save,
    printTicket,
    retryPrintQueueAll,
    pendingJobs,
    refreshPendingCount,
    init
  }
})