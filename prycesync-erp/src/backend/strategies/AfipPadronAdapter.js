import axios from 'axios'

export default class AfipPadronAdapter {
  constructor({ baseUrl, apiKey, timeoutMs = 3000 } = {}) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.timeoutMs = timeoutMs
  }

  async lookupByCuit(cuit) {
    if (!this.baseUrl || !this.apiKey) {
      const err = new Error('TusFacturasApp no configurado')
      err.code = 502
      throw err
    }
    try {
      const res = await axios.get(`${this.baseUrl}/padron/${cuit}`, {
        timeout: this.timeoutMs,
        headers: { Authorization: `Bearer ${this.apiKey}` }
      })
      // Esperamos un payload tipo { razonSocial, condicionIva, domicilio: { calle, localidad, provincia, cp } }
      const data = res.data || {}
      if (!data || Object.keys(data).length === 0) return null
      return {
        razonSocial: data.razonSocial || data.nombre || '',
        ivaCondition: data.condicionIva || data.iva || '',
        domicilio: {
          calle: data.domicilio?.calle || '',
          localidad: data.domicilio?.localidad || '',
          provincia: data.domicilio?.provincia || '',
          cp: data.domicilio?.cp || ''
        },
        source: 'AFIP_PADRON'
      }
    } catch (err) {
      if (err?.response?.status === 404) return null
      if (err?.response?.status === 429) {
        const e = new Error('Rate limit')
        e.code = 429
        throw e
      }
      const e = new Error('Proveedor caído')
      e.code = 502
      throw e
    }
  }
}