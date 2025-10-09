import PaymentService from '../services/PaymentService.js'
import prisma from '../config/database.js'

class PaymentController {
  static async addPayments(req, res) {
    try {
      const companyId = req.user?.company?.id
      const { id: saleId } = req.params
      const { payments } = req.body

      if (!companyId) {
        return res.status(403).json({ success: false, message: 'Empresa no determinada para el usuario' })
      }

      // Validar existencia y estado de la venta (OPEN o PARTIALLY_PAID)
      const sale = await prisma.salesOrder.findFirst({ where: { id: saleId, companyId }, select: { id: true, status: true } })
      if (!sale) {
        return res.status(404).json({ success: false, message: 'Venta no encontrada' })
      }
      if (!['open', 'partially_paid'].includes(sale.status)) {
        return res.status(409).json({ success: false, message: 'Conflicto: la venta no admite pagos en su estado actual' })
      }

      const result = await PaymentService.addSplitPayments(companyId, saleId, payments)
      if (result?.error) {
        return res.status(result.error.code).json({ success: false, message: result.error.message })
      }

      return res.status(200).json({ success: true, data: result })
    } catch (error) {
      const httpCode = error?.httpCode || 500
      console.error('Error registrando split payments:', error)
      return res.status(httpCode).json({ success: false, message: 'Error interno registrando pagos' })
    }
  }

  static async listPayments(req, res) {
    try {
      const companyId = req.user?.company?.id
      const { id: saleId } = req.params
      if (!companyId) {
        return res.status(403).json({ success: false, message: 'Empresa no determinada para el usuario' })
      }

      const summary = await PaymentService.getPaymentsSummary(companyId, saleId)
      if (!summary) {
        return res.status(404).json({ success: false, message: 'Venta no encontrada' })
      }
      return res.json({ success: true, data: summary })
    } catch (error) {
      console.error('Error obteniendo pagos de venta:', error)
      return res.status(500).json({ success: false, message: 'Error interno obteniendo pagos' })
    }
  }
}

export default PaymentController