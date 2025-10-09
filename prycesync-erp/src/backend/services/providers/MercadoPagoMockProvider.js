import { PaymentProvider } from './PaymentProvider.js'

export class MercadoPagoMockProvider extends PaymentProvider {
  authorize(payment) {
    // Simulate authorization for MP
    return {
      status: 'approved',
      preference_id: `mock_${Math.random().toString(36).slice(2)}`,
      payer_email: payment?.methodDetails?.payer_email || 'mock@payer.local'
    }
  }

  validateDetails(details) {
    if (!details) return { valid: true }
    if (details.payer_email && !String(details.payer_email).includes('@')) {
      return { valid: false, message: 'payer_email inválido' }
    }
    return { valid: true }
  }
}

export default MercadoPagoMockProvider