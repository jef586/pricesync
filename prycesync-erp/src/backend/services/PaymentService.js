import prisma from '../config/database.js'
import EventEmitter from 'events'
import { MercadoPagoMockProvider } from './providers/MercadoPagoMockProvider.js'
import StockService from './StockService.js'
import LoyaltyService from './LoyaltyService.js'
// Simple event bus for emitting cashbox movements
export const eventBus = new EventEmitter()

const DEFAULT_CONFIG = {
  payments: {
    roundingTolerance: 0.01,
    mercadopago: { enabled: true, mode: 'mock' }
  }
}

function normalizeMethod(method) {
  const m = (method || '').toString().trim().toUpperCase()
  switch (m) {
    case 'CASH':
    case 'EFECTIVO':
      return 'CASH'
    case 'CARD':
    case 'TARJETA':
      return 'CARD'
    case 'TRANSFER':
    case 'TRANSFERENCIA':
      return 'TRANSFER'
    case 'MERCADO_PAGO':
    case 'MP':
    case 'MERCADOPAGO':
      return 'MERCADO_PAGO'
    default:
      return m
  }
}

function getCompanyPaymentsConfig(company) {
  const fiscal = company?.fiscalConfig || {}
  const cfg = fiscal?.payments || {}
  return {
    ...DEFAULT_CONFIG.payments,
    ...cfg
  }
}

export class PaymentService {
  static async getPaymentsSummary(companyId, saleId) {
    const sale = await prisma.salesOrder.findFirst({
      where: { id: saleId, companyId },
      select: { id: true, status: true, totalRounded: true, paidTotal: true }
    })
    if (!sale) return null
    const payments = await prisma.salesPayment.findMany({
      where: { salesOrderId: saleId },
      orderBy: { createdAt: 'asc' }
    })
    const remaining = Number(sale.totalRounded) - Number(sale.paidTotal || 0)
    return { saleId: sale.id, status: sale.status, paid_total: Number(sale.paidTotal || 0), remaining: Number(remaining.toFixed(2)), payments }
  }

  static async addSplitPayments(companyId, saleId, paymentsInput, createdBy) {
    // Load sale and company config
    const [sale, company] = await Promise.all([
      prisma.salesOrder.findFirst({
        where: { id: saleId, companyId },
        select: { id: true, status: true, totalRounded: true, paidTotal: true, updatedAt: true }
      }),
      prisma.company.findUnique({ where: { id: companyId }, select: { id: true, fiscalConfig: true } })
    ])

    if (!sale) {
      return { error: { code: 404, message: 'Venta no encontrada' } }
    }
    if (!['open', 'partially_paid'].includes(sale.status)) {
      return { error: { code: 409, message: 'La venta no permite registrar pagos en su estado actual' } }
    }

    const config = getCompanyPaymentsConfig(company)
    const tolerance = Number(config.roundingTolerance ?? 0.01)

    // Normalize and validate inputs
    const normalizedPayments = (paymentsInput || []).map(p => ({
      method: normalizeMethod(p.method),
      amount: Number(p.amount),
      currency: p.currency || 'ARS',
      methodDetails: p.method_details || p.methodDetails || null
    }))

    if (!normalizedPayments.length) {
      return { error: { code: 400, message: 'Debe enviar al menos un pago' } }
    }

    for (const p of normalizedPayments) {
      if (!['CASH', 'CARD', 'TRANSFER', 'MERCADO_PAGO'].includes(p.method)) {
        return { error: { code: 400, message: `MÃ©todo invÃ¡lido: ${p.method}` } }
      }
      if (!(p.amount > 0)) {
        return { error: { code: 400, message: 'El monto debe ser mayor a 0' } }
      }
    }

    const alreadyPaid = Number(sale.paidTotal || 0)
    const remaining = Number(sale.totalRounded) - alreadyPaid
    const sumInput = normalizedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)

    const delta = Math.abs(remaining - sumInput)
    if (delta > tolerance) {
      return { error: { code: 400, message: `La suma de pagos (${sumInput.toFixed(2)}) no coincide con el restante (${remaining.toFixed(2)})` } }
    }

    // Transaction: create payments, update totals and status
    const result = await prisma.$transaction(async (tx) => {
      const fresh = await tx.salesOrder.findFirst({
        where: { id: saleId, companyId },
        select: { id: true, status: true, totalRounded: true, paidTotal: true }
      })
      if (!fresh || !['open', 'partially_paid'].includes(fresh.status)) {
        throw Object.assign(new Error('Estado invÃ¡lido'), { httpCode: 409 })
      }

      // Create payments records
      const createdPayments = []
      for (const p of normalizedPayments) {
        // Optional provider handling for MercadoPago
        let providerMeta = null
        if (p.method === 'MERCADO_PAGO' && config?.mercadopago?.enabled) {
          const mpProvider = new MercadoPagoMockProvider()
          const vd = mpProvider.validateDetails(p.methodDetails)
          if (!vd.valid) {
            throw Object.assign(new Error(vd.message || 'Detalles de MP invÃ¡lidos'), { httpCode: 400 })
          }
          providerMeta = mpProvider.authorize({ methodDetails: p.methodDetails, amount: p.amount, currency: p.currency })
          p.methodDetails = { ...(p.methodDetails || {}), mp_provider: providerMeta }
        }
        const created = await tx.salesPayment.create({
          data: {
            salesOrderId: saleId,
            method: p.method,
            amount: p.amount,
            currency: p.currency,
            paidAt: new Date(),
            methodDetails: p.methodDetails || undefined
          }
        })
        createdPayments.push(created)

        // Emit cashbox movement for methods with caja
        if (['CASH', 'CARD', 'TRANSFER', 'MERCADO_PAGO'].includes(p.method)) {
          eventBus.emit('cashbox:movement', {
            type: 'sale_payment',
            saleId,
            method: p.method,
            amount: p.amount,
            currency: p.currency,
            meta: p.methodDetails || {}
          })
        }
      }

      const newPaidTotal = Number(fresh.paidTotal || 0) + sumInput
      const newRemaining = Number(fresh.totalRounded) - newPaidTotal
      const newStatus = newRemaining <= tolerance ? 'paid' : 'partially_paid'

      const updatedSale = await tx.salesOrder.update({
        where: { id: saleId },
        data: {
          paidTotal: newPaidTotal,
          status: newStatus
        },
        select: { id: true, status: true, totalRounded: true, paidTotal: true }
      })

      // Trigger SALE_OUT stock movements when sale becomes fully paid
      if (newStatus === 'paid') {
        try {
          await StockService.createSaleOutForOrder(tx, {
            companyId,
            saleId,
            createdBy: createdBy || 'system'
          })
          
          // Award loyalty points for this sale (idempotent)
          try {
            await LoyaltyService.awardForSale(tx, { companyId, saleId, createdBy: createdBy || 'system' })
          } catch (loyErr) {
            console.warn('Loyalty award failed:', loyErr?.message || loyErr)
          }
        } catch (err) {
          // If stock fails, abort transaction
          throw Object.assign(err, { httpCode: err?.httpCode || 500 })
        }
      }

      return {
        sale: updatedSale,
        createdPayments
      }
    })

    return {
      saleId: result.sale.id,
      status: result.sale.status,
      paid_total: Number(result.sale.paidTotal || 0),
      remaining: Number((Number(result.sale.totalRounded) - Number(result.sale.paidTotal || 0)).toFixed(2)),
      payments: result.createdPayments
    }
  }
}

export default PaymentService





