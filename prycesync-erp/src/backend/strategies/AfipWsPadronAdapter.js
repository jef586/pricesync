import { getCachedTA } from '../afip/authCache.js'
import { getPersonaA5 } from '../afip/padronA5.js'

export default class AfipWsPadronAdapter {
  constructor({ certPath, keyPath, cuit, env = 'test', service = 'ws_sr_padron_a5' } = {}) {
    this.certPath = certPath
    this.keyPath = keyPath
    this.cuit = cuit
    this.env = env
    this.service = service
  }

  async lookupByCuit(cuit) {
    const cleanCuit = String(cuit).replace(/[^0-9]/g, '')
    const rep = this.cuit || process.env.AFIP_CUIT_REPRESENTADA
    const env = this.env || process.env.AFIP_ENV || 'test'

    try {
      const { token, sign } = await getCachedTA()
      const persona = await getPersonaA5({ token, sign, idPersona: cleanCuit, cuitRepresentada: rep, env })

      const razonSocial = persona?.denominacion || ''
      const df = persona?.domicilioFiscal || {}
      const domicilio = {
        calle: df.calle || '',
        localidad: df.localidad || '',
        provincia: df.provincia || '',
        cp: df.codPostal || ''
      }

      // Inferir condición IVA simple desde impuestos/regímenes
      let ivaCond = ''
      const regs = Array.isArray(persona?.regimenes) ? persona.regimenes : []
      const imps = Array.isArray(persona?.impuestos) ? persona.impuestos : []
      if (regs.some(r => String(r).toUpperCase().includes('MONOTRIB'))) {
        ivaCond = 'MONOTRIBUTO'
      } else if (imps.some(i => String(i).toUpperCase().includes('IVA'))) {
        ivaCond = 'RI'
      } else {
        ivaCond = 'CF'
      }

      return {
        razonSocial,
        ivaCondition: ivaCond,
        domicilio,
        source: 'AFIP_A5_DIRECT'
      }
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase()
      // Mapear mensajes de falta de persona desde distintos textos posibles
      if (
        msg.includes('not found') ||
        msg.includes('inexistente') ||
        msg.includes('no existe persona') ||
        msg.includes('no existe persona con ese id')
      ) {
        return null
      }
      if (err?.code === 429) {
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