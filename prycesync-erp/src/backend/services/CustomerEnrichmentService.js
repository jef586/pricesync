import axios from 'axios'
import { getCache, setCache } from '../config/redis.js'
import { isValidCuit, normalizeCuit, inferDocType, normalizeIvaCondition } from '../utils/cuit.js'
import AfipPadronAdapter from '../strategies/AfipPadronAdapter.js'
import MockPadronAdapter from '../strategies/MockPadronAdapter.js'

const TTL_SECONDS = parseInt(process.env.ENRICH_CACHE_TTL_SECONDS || '3600', 10)
const PROVIDER = (process.env.PADRON_PROVIDER || 'mock').toLowerCase()

function getAdapter() {
  if (PROVIDER === 'afip') return new AfipPadronAdapter({
    baseUrl: process.env.TUSFACTURASAPP_API_URL,
    apiKey: process.env.TUSFACTURASAPP_API_KEY,
    timeoutMs: 3000
  })
  return new MockPadronAdapter()
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

export default class CustomerEnrichmentService {
  /**
   * Enriquecimiento de cliente por CUIT/CUIL
   * @param {string} rawCuit
   * @param {{ id: string }} user
   */
  static async enrichByCuit(rawCuit, user = { id: 'system' }) {
    const cuit = normalizeCuit(rawCuit)
    if (!isValidCuit(cuit)) {
      const error = new Error('CUIT inválido')
      error.code = 400
      throw error
    }

    const cacheKey = `padron:${cuit}`
    const fromCache = await getCache(cacheKey)
    if (fromCache) {
      return { ...fromCache, source: fromCache.source || 'CACHE', fetchedAt: new Date().toISOString() }
    }

    const adapter = getAdapter()

    const maxRetries = 3
    const baseDelay = 250
    let lastErr = null
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const data = await adapter.lookupByCuit(cuit)
        if (!data) {
          return null
        }
        const docType = inferDocType(cuit)
        const normalized = {
          id: null,
          docType,
          docNumber: cuit,
          name: data.name || data.razonSocial || '',
          ivaCondition: normalizeIvaCondition(data.ivaCondition) || 'CF',
          address: {
            street: data.address?.street || data.domicilio?.calle || '',
            city: data.address?.city || data.domicilio?.localidad || '',
            state: data.address?.state || data.domicilio?.provincia || '',
            zip: data.address?.zip || data.domicilio?.cp || ''
          },
          source: data.source,
          fetchedAt: new Date().toISOString()
        }

        await setCache(cacheKey, normalized, TTL_SECONDS)
        // Auditoría discreta
        console.log(`[AUDIT] padron lookup by user=${user?.id} cuit=${cuit} at=${new Date().toISOString()} source=${normalized.source}`)
        return normalized
      } catch (err) {
        lastErr = err
        const delay = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 100)
        if (attempt < maxRetries - 1) await sleep(delay)
      }
    }

    // Mapear errores a códigos esperados
    if (lastErr?.code === 429) {
      const e = new Error('Rate limit del proveedor de padrón')
      e.code = 429
      throw e
    }

    const e = new Error('Proveedor de padrón no disponible')
    e.code = 502
    throw e
  }
}