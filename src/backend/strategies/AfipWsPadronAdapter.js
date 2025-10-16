import pkgAfip from '@afipsdk/afip.js'

const Afip = pkgAfip?.default || pkgAfip

export default class AfipWsPadronAdapter {
  constructor({ certPath, keyPath, cuit, env = 'test', service = 'ws_sr_padron_a5' } = {}) {
    this.certPath = certPath
    this.keyPath = keyPath
    this.cuit = cuit
    this.env = env
    this.service = service
  }

  async lookupByCuit(cuit) {
    if (!this.certPath || !this.keyPath || !this.cuit) {
      const err = new Error('AFIP directo no configurado (cert/key/CUIT)')
      err.code = 502
      throw err
    }

    const cleanCuit = parseInt(String(cuit).replace(/[^0-9]/g, ''), 10)
    const companyCuit = parseInt(String(this.cuit).replace(/[^0-9]/g, ''), 10)
    const production = ['prod', 'production'].includes(String(this.env || '').toLowerCase())

    try {
      const afip = new Afip({
        cert: this.certPath,
        key: this.keyPath,
        CUIT: companyCuit,
        production
      })

      let data
      const svc = String(this.service || '').toLowerCase()
      if (svc.includes('a10') || svc.includes('registerscopeten')) {
        data = await afip.RegisterScopeTen.getTaxpayerDetails(cleanCuit)
      } else {
        // Por defecto usamos A5
        data = await afip.RegisterScopeFive.getTaxpayerDetails(cleanCuit)
      }

      if (!data || Object.keys(data).length === 0) return null

      // Intentar mapear los campos comunes con tolerancia a variaciones
      const razonSocial =
        data.denomination ||
        data.nombre ||
        data.name ||
        data.razonSocial ||
        data.persona?.nombre ||
        ''

      const addr = Array.isArray(data.address)
        ? data.address[0]
        : data.address || data.domicilio || data.persona?.domicilios?.[0] || {}

      const domicilio = {
        calle: addr.street || addr.calle || addr.direccion || '',
        localidad: addr.city || addr.localidad || '',
        provincia: addr.state || addr.provincia || '',
        cp: addr.zip || addr.cp || addr.codigoPostal || ''
      }

      const ivaCond = data.ivaCondition || data.condicionIva || data.iva || ''

      return {
        razonSocial,
        ivaCondition: ivaCond,
        domicilio,
        source: 'AFIP_WS_DIRECT'
      }
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase()
      if (msg.includes('not found') || msg.includes('inexistente')) return null
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