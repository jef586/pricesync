import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiClient } from '../../services/api'

export interface PadronResult {
  name: string
  taxId: string
  ivaCondition?: 'Consumidor Final' | 'Monotributista' | 'Resp.Inscripto' | 'Exento'
  address?: string
  city?: string
  state?: string
  country?: string
}

const normalizeCuitInput = (raw: string) => (raw || '').replace(/[^0-9]/g, '')

export const usePadronStore = defineStore('padron', () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<PadronResult | null>(null)

  // Simple session cache to avoid duplicate lookups while navigating
  const sessionCache = new Map<string, PadronResult | null>()

  const enrichByCuit = async (cuitRaw: string): Promise<PadronResult | null> => {
    const cuit = normalizeCuitInput(cuitRaw)
    if (!cuit || cuit.length < 11) {
      error.value = 'CUIT/CUIL inválido'
      return null
    }

    // Cache short-circuit
    if (sessionCache.has(cuit)) {
      const cached = sessionCache.get(cuit) ?? null
      lastResult.value = cached
      return cached
    }

    try {
      isLoading.value = true
      error.value = null

      const resp = await apiClient.get('/customers/enrich', { params: { cuit } })

      if (resp.status === 200 && resp.data) {
        // Backend already normalizes IVA condition strings; ensure mapping to UI labels
        const iva = (resp.data.ivaCondition || resp.data.iva || '').trim()
        const ivaMap: Record<string, PadronResult['ivaCondition']> = {
          'Consumidor Final': 'Consumidor Final',
          'Monotributista': 'Monotributista',
          'Responsable Inscripto': 'Resp.Inscripto',
          'Resp.Inscripto': 'Resp.Inscripto',
          'Exento': 'Exento'
        }
        const result: PadronResult = {
          name: resp.data.name || resp.data.razon_social || resp.data.businessName || '',
          taxId: cuit,
          ivaCondition: ivaMap[iva] ?? 'Consumidor Final',
          address: resp.data.address || resp.data.domicilio || resp.data.street,
          city: resp.data.city || resp.data.localidad,
          state: resp.data.state || resp.data.provincia,
          country: resp.data.country || 'Argentina'
        }
        lastResult.value = result
        sessionCache.set(cuit, result)
        return result
      }

      if (resp.status === 204) {
        lastResult.value = null
        sessionCache.set(cuit, null)
        return null
      }

      error.value = 'No se pudo enriquecer datos (estado inesperado)'
      return null
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 400) error.value = 'CUIT inválido'
      else if (status === 429) error.value = 'Límite de consultas alcanzado'
      else if (status === 502) error.value = 'Proveedor de padrón no disponible'
      else error.value = e?.message || 'Error consultando padrón'
      lastResult.value = null
      return null
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, error, lastResult, enrichByCuit }
})