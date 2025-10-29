import prisma from '../config/database.js'
import Decimal from 'decimal.js'

const QTY_SCALE = 3
const PRICE_SCALE = 2

function toDecimal(n) { return new Decimal(n || 0) }

export default class UomService {
  static parseUom(u) {
    const val = String(u || 'UN').toUpperCase()
    const allowed = ['UN','BU','KG','LT']
    if (!allowed.includes(val)) {
      throw Object.assign(new Error(`UoM inválida: ${u}`), { httpCode: 400 })
    }
    return val
  }

  static isDecimal(uom) {
    const u = String(uom || '').toUpperCase()
    return u === 'KG' || u === 'LT'
  }

  static normalizeQtyInput(uom, qty) {
    const u = UomService.parseUom(uom)
    const q = toDecimal(qty)
    if (q.lessThanOrEqualTo(0)) {
      throw Object.assign(new Error('qty debe ser mayor a 0'), { httpCode: 400 })
    }
    if (UomService.isDecimal(u)) {
      return q.toDecimalPlaces(QTY_SCALE)
    }
    // UN/BU deben ser enteras
    if (!q.isInteger()) {
      throw Object.assign(new Error('cantidad debe ser entera para UoM UN/BU'), { httpCode: 400 })
    }
    return q
  }

  static async getFactor(articleId, uom) {
    const u = UomService.parseUom(uom)
    if (u === 'UN') return new Decimal(1)
    const found = await prisma.articleUom.findFirst({ where: { articleId, uom: u } })
    return found?.factor ? new Decimal(found.factor) : new Decimal(1)
  }

  static async convertToUN(articleId, uom, qty) {
    const norm = UomService.normalizeQtyInput(uom, qty)
    const factor = await UomService.getFactor(articleId, uom)
    return norm.mul(factor).toDecimalPlaces(QTY_SCALE)
  }

  static async priceFor(articleId, uom, basePrice, taxRate = 21) {
    const u = UomService.parseUom(uom)
    const found = await prisma.articleUom.findFirst({ where: { articleId, uom: u } })
    const net = found?.priceOverride != null
      ? toDecimal(found.priceOverride).toDecimalPlaces(PRICE_SCALE)
      : toDecimal(basePrice).mul(await UomService.getFactor(articleId, u)).toDecimalPlaces(PRICE_SCALE)
    const gross = net.mul(new Decimal(1).add(toDecimal(taxRate).div(100))).toDecimalPlaces(PRICE_SCALE)
    return { net, gross }
  }

  static async listArticleUoms(articleId) {
    return prisma.articleUom.findMany({ where: { articleId }, orderBy: { uom: 'asc' } })
  }

  static async upsertArticleUom(articleId, uom, factor, priceOverride = null) {
    const u = UomService.parseUom(uom)
    const f = toDecimal(u === 'UN' ? 1 : factor)
    if (f.lessThanOrEqualTo(0)) {
      throw Object.assign(new Error('factor debe ser > 0'), { httpCode: 400 })
    }

    const existing = await prisma.articleUom.findFirst({ where: { articleId, uom: u } })
    const data = { articleId, uom: u, factor: f.toDecimalPlaces(6).toNumber(), priceOverride: priceOverride != null ? toDecimal(priceOverride).toDecimalPlaces(PRICE_SCALE).toNumber() : null }
    if (existing) {
      return prisma.articleUom.update({ where: { id: existing.id }, data })
    }
    return prisma.articleUom.create({ data })
  }

  static async ensureUnBase(articleId) {
    const existing = await prisma.articleUom.findFirst({ where: { articleId, uom: 'UN' } })
    if (!existing) {
      await prisma.articleUom.create({ data: { articleId, uom: 'UN', factor: 1 } })
    }
    return true
  }
}