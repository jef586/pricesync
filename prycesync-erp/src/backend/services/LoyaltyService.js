import prisma from '../config/database.js'
import Decimal from 'decimal.js'
import UomService from './UomService.js'

function toDec(n) { return new Decimal(n || 0) }

export default class LoyaltyService {
  static QTY_SCALE = 3

  // Ensure account exists for customer
  static async ensureAccount(tx, customerId) {
    const existing = await tx.loyaltyAccount.findFirst({ where: { customerId } })
    if (existing) return existing
    return tx.loyaltyAccount.create({ data: { customerId, pointsBalance: 0 } })
  }

  // Compute total points for a sale using qty in base UN * article.pointsPerUnit
  static async computeSalePoints(tx, { saleId }) {
    const items = await tx.salesOrderItem.findMany({
      where: { salesOrderId: saleId },
      select: {
        id: true,
        quantity: true,
        uom: true,
        articleId: true,
        article: { select: { id: true, type: true, pointsPerUnit: true } }
      },
      orderBy: { createdAt: 'asc' }
    })
    let total = new Decimal(0)
    let componentsTotal = new Decimal(0)
    for (const it of items) {
      const art = it.article
      if (!art) continue
      if (art.type === 'SERVICE') continue
      const uom = it.uom || 'UN'
      const qtyUn = await UomService.convertToUN(it.articleId, uom, it.quantity)
      const ppu = toDec(art.pointsPerUnit || 0)
      const pts = qtyUn.mul(ppu)
      total = total.add(pts)
    }
    return total.toDecimalPlaces(LoyaltyService.QTY_SCALE)
  }

  // Award points for sale when becomes paid. Idempotent by (saleId, type='EARN').
  static async awardForSale(tx, { companyId, saleId, createdBy = 'system' }) {
    // Load sale with customer
    const sale = await tx.salesOrder.findFirst({
      where: { id: saleId, companyId },
      select: { id: true, customerId: true, status: true }
    })
    if (!sale) throw Object.assign(new Error('Venta no encontrada'), { httpCode: 404 })
    const customerId = sale.customerId
    if (!customerId) return { ok: false, skipped: true, reason: 'NO_CUSTOMER' }

    // Idempotency: if already awarded for this sale, skip
    const exists = await tx.loyaltyMovement.findFirst({ where: { saleId, type: 'EARN' } })
    if (exists) {
      return { ok: true, skipped: true, reason: 'ALREADY_AWARDED', movement: exists }
    }

    const points = await LoyaltyService.computeSalePoints(tx, { saleId })
    if (points.lte(0)) return { ok: true, skipped: true, reason: 'ZERO_POINTS' }

    await LoyaltyService.ensureAccount(tx, customerId)
    const mov = await tx.loyaltyMovement.create({
      data: {
        customerId,
        saleId,
        type: 'EARN',
        points: points.toNumber(),
        reason: 'SALE_PAID'
      }
    })
    const acc = await tx.loyaltyAccount.findFirst({ where: { customerId } })
    const newBal = toDec(acc?.pointsBalance || 0).add(points).toDecimalPlaces(LoyaltyService.QTY_SCALE)
    await tx.loyaltyAccount.update({ where: { id: acc.id }, data: { pointsBalance: newBal.toNumber() } })

    return { ok: true, movement: mov, points: points.toNumber() }
  }

  // Reverse points previously awarded for a sale when sale is cancelled.
  static async reverseForSale(tx, { companyId, saleId, createdBy = 'system' }) {
    const sale = await tx.salesOrder.findFirst({
      where: { id: saleId, companyId },
      select: { id: true, customerId: true }
    })
    if (!sale) throw Object.assign(new Error('Venta no encontrada'), { httpCode: 404 })
    const customerId = sale.customerId
    if (!customerId) return { ok: false, skipped: true, reason: 'NO_CUSTOMER' }

    // If already reversed, skip
    const alreadyReversed = await tx.loyaltyMovement.findFirst({ where: { saleId, type: 'REVERSE' } })
    if (alreadyReversed) return { ok: true, skipped: true, reason: 'ALREADY_REVERSED' }

    const earn = await tx.loyaltyMovement.findFirst({ where: { saleId, type: 'EARN' } })
    if (!earn) return { ok: true, skipped: true, reason: 'NO_EARN_FOUND' }

    const points = toDec(earn.points || 0)
    if (points.lte(0)) return { ok: true, skipped: true, reason: 'ZERO_POINTS' }

    await LoyaltyService.ensureAccount(tx, customerId)
    const mov = await tx.loyaltyMovement.create({
      data: {
        customerId,
        saleId,
        type: 'REVERSE',
        points: points.toNumber(),
        reason: 'SALE_CANCELLED'
      }
    })
    const acc = await tx.loyaltyAccount.findFirst({ where: { customerId } })
    const newBal = toDec(acc?.pointsBalance || 0).sub(points).toDecimalPlaces(LoyaltyService.QTY_SCALE)
    await tx.loyaltyAccount.update({ where: { id: acc.id }, data: { pointsBalance: newBal.toNumber() } })

    return { ok: true, movement: mov, reversed: points.toNumber() }
  }

  static async getAccountSummary(customerId) {
    const acc = await prisma.loyaltyAccount.findFirst({ where: { customerId } })
    const points = toDec(acc?.pointsBalance || 0).toDecimalPlaces(LoyaltyService.QTY_SCALE)
    const lastMovements = await prisma.loyaltyMovement.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' }, take: 20 })
    return { points: points.toNumber(), lastMovements }
  }
}