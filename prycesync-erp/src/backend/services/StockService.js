import prisma from '../config/database.js'
import Decimal from 'decimal.js'

function toDecimal(n) { return new Decimal(n || 0) }

export default class StockService {
  static async getUomFactor(articleId, uom) {
    const u = String(uom || 'UN').toUpperCase()
    if (u === 'UN') return new Decimal(1)
    const found = await prisma.articleUom.findFirst({ where: { articleId, uom: u } })
    return found?.factor ? new Decimal(found.factor) : new Decimal(1)
  }

  static async normalizeQtyUn(articleId, uom, qty) {
    const factor = await StockService.getUomFactor(articleId, uom)
    return toDecimal(qty).mul(factor)
  }

  static async upsertBalance(tx, { companyId, articleId, warehouseId = null, deltaUn, override = false }) {
    const delta = toDecimal(deltaUn)
    const existing = await tx.stockBalance.findFirst({ where: { companyId, articleId, warehouseId } })

    let newOnHand
    if (existing) {
      newOnHand = toDecimal(existing.onHandUn).add(delta)
      if (newOnHand.lessThan(0) && !override) {
        throw Object.assign(new Error('Stock insuficiente'), { httpCode: 409 })
      }
      await tx.stockBalance.update({ where: { id: existing.id }, data: { onHandUn: newOnHand.toNumber() } })
    } else {
      if (delta.lessThan(0) && !override) {
        throw Object.assign(new Error('Stock insuficiente'), { httpCode: 409 })
      }
      newOnHand = delta
      await tx.stockBalance.create({ data: { companyId, articleId, warehouseId, onHandUn: newOnHand.toNumber() } })
    }

    // Mantener sincronizado Article.stock (base UN)
    const art = await tx.article.findFirst({ where: { id: articleId }, select: { stock: true } })
    const updatedStock = toDecimal(art?.stock || 0).add(delta)
    if (updatedStock.lessThan(0) && !override) {
      throw Object.assign(new Error('Stock insuficiente (artículo)'), { httpCode: 409 })
    }
    await tx.article.update({ where: { id: articleId }, data: { stock: updatedStock.toNumber() } })

    return { onHandUn: newOnHand.toNumber() }
  }

  static async createMovement(tx, {
    companyId,
    articleId,
    warehouseId = null,
    uom = 'UN',
    qty,
    direction, // 'IN' | 'OUT'
    reason,    // StockReason enum
    documentId = null,
    documentType = null,
    comment = null,
    override = false,
    clientOperationId = null,
    createdBy
  }) {
    const qtyDec = toDecimal(qty)
    const qtyUn = await StockService.normalizeQtyUn(articleId, uom, qtyDec)
    const delta = direction === 'IN' ? qtyUn : qtyUn.mul(-1)

    // Idempotencia por clientOperationId
    if (clientOperationId) {
      const exists = await tx.stockMovement.findFirst({ where: { companyId, clientOperationId } })
      if (exists) {
        return { movement: exists, balance: null, skipped: true }
      }
    }

    const balance = await StockService.upsertBalance(tx, { companyId, articleId, warehouseId, deltaUn: delta, override })

    const movement = await tx.stockMovement.create({
      data: {
        companyId,
        articleId,
        warehouseId,
        uom,
        qty: qtyDec.toNumber(),
        qtyUn: qtyUn.toNumber(),
        direction,
        reason,
        documentId,
        documentType,
        comment,
        override: !!override,
        clientOperationId,
        createdBy
      }
    })

    return { movement, balance }
  }

  static async createSaleOutForOrder(tx, { companyId, saleId, createdBy }) {
    // Cargar items con artículos + componentes de combo
    const sale = await tx.salesOrder.findFirst({
      where: { id: saleId, companyId },
      include: {
        items: true,
        // Se consultan artículos por separado para combos
      }
    })
    if (!sale) throw Object.assign(new Error('Venta no encontrada'), { httpCode: 404 })

    const items = await tx.salesOrderItem.findMany({
      where: { salesOrderId: saleId },
      include: {
        article: {
          include: { bundleComponents: { include: { componentArticle: true } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    let idx = 0
    for (const it of items) {
      idx += 1
      const qty = toDecimal(it.quantity)
      const uom = it.uom || 'UN'
      const article = it.article
      if (!article) continue
      if (article.type === 'SERVICE') continue

      // Combos: consumir componentes
      const components = article.bundleComponents || []
      if (components.length > 0) {
        for (const comp of components) {
          const compQty = toDecimal(comp.qty).mul(qty)
          const clientId = `COMBO_CONSUME:${saleId}:${idx}:${comp.componentArticleId}`
          await StockService.createMovement(tx, {
            companyId,
            articleId: comp.componentArticleId,
            warehouseId: null,
            uom: 'UN',
            qty: compQty.toNumber(),
            direction: 'OUT',
            reason: 'COMBO_CONSUME',
            documentId: saleId,
            documentType: 'SALES_ORDER',
            comment: `Combo consume from ${article.name}`,
            override: false,
            clientOperationId: clientId,
            createdBy
          })
        }
        continue
      }

      // Artículo normal
      const clientId = `SALE_OUT:${saleId}:${idx}`
      await StockService.createMovement(tx, {
        companyId,
        articleId: it.articleId,
        warehouseId: null,
        uom,
        qty: qty.toNumber(),
        direction: 'OUT',
        reason: 'SALE_OUT',
        documentId: saleId,
        documentType: 'SALES_ORDER',
        comment: `Sale ${sale.number} item`,
        override: false,
        clientOperationId: clientId,
        createdBy
      })
    }

    return { ok: true, saleId }
  }
}