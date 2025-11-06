import prisma from '../config/database.js'
import Decimal from 'decimal.js'
import UomService from './UomService.js'

function toDec(n) { return new Decimal(n || 0) }

export default class QuantityPromotionService {
  /**
   * Resolve article quantity promotion tier and compute unit price
   * @param {{ articleId:string, uom:string, quantity:number, baseUnitPrice:number }} lineItem
   * @param {{ priceListId?:string, date?:Date }} context
   * @returns {Promise<{ applied:boolean, exclusive:boolean, unitPrice:number, tier?:any, qtyUn:string }>} 
   */
  static async applyArticleQuantityPromo(lineItem, context = {}) {
    const articleId = String(lineItem.articleId)
    const uom = String(lineItem.uom || 'UN')
    const qty = Number(lineItem.quantity)
    const baseUnitPrice = Number(lineItem.baseUnitPrice)
    const priceListId = context.priceListId || 'Lista 1'
    const date = context.date ? new Date(context.date) : new Date()

    const qtyUnDec = await UomService.convertToUN(articleId, uom, qty)
    const qtyUn = qtyUnDec.toDecimalPlaces(3).toString()

    // Find promotion for the article (active and valid)
    const promotions = await prisma.articleQuantityPromotion.findMany({
      where: { articleId, active: true },
      include: { tiers: true }
    })
    if (!promotions.length) {
      return { applied: false, exclusive: false, unitPrice: baseUnitPrice, qtyUn }
    }

    // Filter by validity and price list
    const validPromos = promotions.filter(p => {
      const starts = p.startsAt ? new Date(p.startsAt) : null
      const ends = p.endsAt ? new Date(p.endsAt) : null
      const within = (!starts || date >= starts) && (!ends || date <= ends)
      const lists = Array.isArray(p.priceListIds) ? p.priceListIds : []
      const matchesList = lists.length === 0 || lists.includes(priceListId)
      return within && matchesList
    })

    if (!validPromos.length) {
      return { applied: false, exclusive: false, unitPrice: baseUnitPrice, qtyUn }
    }

    // Choose the best tier among all valid promos: highest minQtyUn <= qtyUn
    const q = new Decimal(qtyUn)
    let chosen = null
    let promoExclusive = false
    for (const p of validPromos) {
      for (const t of p.tiers) {
        const min = new Decimal(t.minQtyUn)
        if (min.lessThanOrEqualTo(q)) {
          if (!chosen || new Decimal(chosen.minQtyUn).lessThan(min)) {
            chosen = t
            promoExclusive = !!p.exclusive
          }
        }
      }
    }

    if (!chosen) {
      return { applied: false, exclusive: false, unitPrice: baseUnitPrice, qtyUn }
    }

    // Compute unit price by mode
    const base = toDec(baseUnitPrice)
    let unitPriceDec = base
    if (chosen.pricePerUnit != null) {
      unitPriceDec = toDec(chosen.pricePerUnit)
    } else if (chosen.percentOff != null) {
      const pct = toDec(chosen.percentOff)
      unitPriceDec = base.mul(new Decimal(1).minus(pct.div(100)))
    }

    const unitPrice = unitPriceDec.toDecimalPlaces(2).toNumber()
    return { applied: true, exclusive: promoExclusive, unitPrice, tier: chosen, qtyUn }
  }
}