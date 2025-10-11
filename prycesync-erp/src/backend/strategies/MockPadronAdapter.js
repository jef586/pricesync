import seed from './mock-padron.json' assert { type: 'json' }

export default class MockPadronAdapter {
  async lookupByCuit(cuit) {
    const entry = seed[cuit]
    if (!entry) return null
    return {
      razonSocial: entry.name,
      ivaCondition: entry.ivaCondition,
      domicilio: {
        calle: entry.address?.street || '',
        localidad: entry.address?.city || '',
        provincia: entry.address?.state || '',
        cp: entry.address?.zip || ''
      },
      source: 'MOCK'
    }
  }
}