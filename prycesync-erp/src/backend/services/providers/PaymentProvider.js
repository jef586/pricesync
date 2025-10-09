export class PaymentProvider {
  authorize(_payment) {
    throw new Error('Not implemented')
  }
  validateDetails(_details) {
    return { valid: true }
  }
  refund(_paymentId, _amount) {
    throw new Error('Not implemented')
  }
}

export default PaymentProvider