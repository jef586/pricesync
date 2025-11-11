import { ref, watch } from 'vue'
import { apiClient } from '@/services/api'
import { useNotifications } from '@/composables/useNotifications'

export function useTicketPreview(invoiceId: string) {
  const ticketHtml = ref<string>('')
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const { error: notifyError } = useNotifications()

  const loadPreview = async () => {
    if (!invoiceId) return
    isLoading.value = true
    error.value = null
    try {
      const { data } = await apiClient.get(`/print/ticket/${invoiceId}`, {
        params: { preview: 'true' },
        responseType: 'text'
      })
      if (typeof data === 'string') {
        ticketHtml.value = data
      } else {
        const payload = (data?.data || data) as any
        ticketHtml.value = payload?.html || ''
      }
      if (!ticketHtml.value) {
        throw new Error('HTML vacío')
      }
    } catch (err: any) {
      console.error('Error cargando vista previa del ticket', err)
      error.value = 'No se pudo cargar el ticket'
      notifyError('No se pudo cargar el ticket')
    } finally {
      isLoading.value = false
    }
  }

  watch(() => invoiceId, (id) => { if (id) loadPreview() })

  return {
    ticketHtml,
    isLoading,
    error,
    loadPreview
  }
}