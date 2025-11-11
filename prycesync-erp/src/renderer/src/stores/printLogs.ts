import { defineStore } from 'pinia'
import { ref, reactive, watch } from 'vue'
import { apiClient } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'

type Status = 'success' | 'error' | 'pending'

export interface PrintLogItem {
  id: string
  printed_at: string
  invoice_full_number: string | null
  printer_name: string | null
  status: Status
  attempts: number
  user_name: string | null
  invoice_id?: string | null
}

export const usePrintLogsStore = defineStore('printLogs', () => {
  const items = ref<PrintLogItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const sort = ref<'printed_at:asc' | 'printed_at:desc'>('printed_at:desc')
  const loading = ref(false)
  const previewHtml = ref<string>('')
  const previewLoading = ref(false)
  const previewVisible = ref(false)
  const previewError = ref<string | null>(null)
  const selectedLog = ref<PrintLogItem | null>(null)

  const filters = reactive({
    dateFrom: null as string | null,
    dateTo: null as string | null,
    status: null as Status | null,
    printerName: '' as string,
    invoiceNumber: '' as string,
    userId: null as string | null,
    branchId: null as string | null
  })

  const { success, error } = useNotifications()

  // Persist filters in sessionStorage
  const SKEY = 'printLogs.filters.v1'
  try {
    const saved = sessionStorage.getItem(SKEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(filters, parsed)
    }
  } catch {}
  watch(filters, (f) => {
    try { sessionStorage.setItem(SKEY, JSON.stringify(f)) } catch {}
  }, { deep: true })

  async function fetch() {
    loading.value = true
    try {
      const { data } = await apiClient.get('/print/logs', {
        params: {
          page: page.value,
          pageSize: pageSize.value,
          sort: sort.value,
          ...filters,
        }
      })
      items.value = data.items || []
      total.value = data.total || 0
    } catch (e: any) {
      console.error('Error fetching print logs', e)
      error('No se pudo cargar el historial de impresiones')
    } finally {
      loading.value = false
    }
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams({
        sort: sort.value,
      } as any)
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
      const url = `${(apiClient.defaults.baseURL || '/api')}/print/logs/export.csv?${params.toString()}`
      const a = document.createElement('a')
      a.href = url
      a.download = 'print_logs.csv'
      a.click()
      success('Exportando historial…')
    } catch (e: any) {
      error('No se pudo exportar el historial', e?.message || '')
    }
  }

  async function preview(log: PrintLogItem) {
    selectedLog.value = log
    previewVisible.value = true
    previewLoading.value = true
    previewError.value = null
    previewHtml.value = ''
    try {
      // We need invoiceId to preview; backend resolves by id param. If not available, this will fallback.
      const invoiceId = (log as any).invoice_id || null
      if (!invoiceId) {
        previewError.value = 'No se puede abrir la vista previa, falta invoiceId'
        return
      }
      const { data } = await apiClient.get(`/print/ticket/${invoiceId}`, { params: { preview: 'true' } })
      const payload = data?.data || data
      previewHtml.value = payload?.html || ''
      if (!previewHtml.value) throw new Error('HTML vacío')
    } catch (e: any) {
      console.error('Error previewing ticket', e)
      previewError.value = 'No se pudo cargar la vista previa'
      error('No se pudo cargar la vista previa')
    } finally {
      previewLoading.value = false
    }
  }

  async function retry(log: PrintLogItem) {
    try {
      const hasIPC = typeof window !== 'undefined' && (window as any).system && typeof (window as any).system.printTicket === 'function'
      if (!hasIPC) {
        // Hide retry in UI else show warning
        error('Reintento no disponible en navegador')
        return
      }

      // Load printing settings to know default printer
      const { data: settingsRes } = await apiClient.get('/settings/printing')
      const cfg = settingsRes?.data || settingsRes
      const printerName = cfg?.defaultPrinter || null
      const invoiceId = (log as any).invoice_id || null
      if (!invoiceId) {
        error('No se puede reintentar: falta invoiceId')
        return
      }

      // Get HTML for the invoice
      const { data: ticketRes } = await apiClient.get(`/print/ticket/${invoiceId}`, { params: { preview: 'true' } })
      const payload = ticketRes?.data || ticketRes
      const html = payload?.html || ''
      if (!html) {
        error('No se pudo obtener el HTML del ticket')
        return
      }

      const res = await (window as any).system.printTicket({ printerName, html })
      if (res?.ok) {
        success('Ticket enviado a la impresora')
        // Create success log and refresh
        await apiClient.post('/print/logs', {
          invoiceId,
          printerName,
          status: 'success',
          attempts: (log.attempts || 1) + 1
        })
      } else {
        error('Error al imprimir el ticket', res?.error || '')
        await apiClient.post('/print/logs', {
          invoiceId,
          printerName,
          status: 'error',
          attempts: (log.attempts || 1) + 1,
          message: res?.error || 'Fallo de impresión al reintentar'
        })
      }
      await fetch()
    } catch (e: any) {
      console.error('Retry print error', e)
      error('No se pudo reintentar la impresión', e?.message || '')
    }
  }

  function setPage(p: number) { page.value = p; fetch() }
  function setPageSize(ps: number) { pageSize.value = ps; fetch() }

  return {
    items, total, page, pageSize, sort, filters, loading,
    fetch, exportCsv, retry, preview,
    previewHtml, previewLoading, previewVisible, previewError,
    selectedLog,
    setPage, setPageSize
  }
})