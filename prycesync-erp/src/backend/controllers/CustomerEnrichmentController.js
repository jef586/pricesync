import CustomerEnrichmentService from '../services/CustomerEnrichmentService.js'

class CustomerEnrichmentController {
  static async enrichByCuit(req, res) {
    try {
      const { cuit } = req.query
      const userId = req.user?.id || req.user?.userId || 'unknown'
      if (!cuit) {
        return res.status(400).json({ error: 'Parámetro cuit requerido' })
      }

      const result = await CustomerEnrichmentService.enrichByCuit(cuit, { id: userId })
      if (!result) {
        return res.status(204).send()
      }
      return res.status(200).json(result)
    } catch (err) {
      const code = err?.code || 500
      if ([400, 429, 502].includes(code)) {
        return res.status(code).json({ error: err.message || 'Error' })
      }
      console.error('Error en enrichByCuit:', err)
      return res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
}

export default CustomerEnrichmentController