import prisma from '../config/database.js'
import Decimal from 'decimal.js'
import UomService from './UomService.js'

function toDecimal(n) { return new Decimal(n || 0) }

export default class KardexService {
  static async getArticleKardex({ companyId, articleId, from, to, warehouseId = null, page = 1, limit = 100 }) {
    if (!articleId) throw Object.assign(new Error('articleId es requerido'), { httpCode: 400 })

    const dateFrom = from ? new Date(from) : null
    const dateTo = to ? new Date(to) : null

    // Build where clause
    const where = {
      companyId,
      articleId,
      ...(warehouseId !== null ? { warehouseId } : {}),
      ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {})
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [movements, total, balanceRow, article] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: Number(skip),
        take: Number(limit)
      }),
      prisma.stockMovement.count({ where }),
      prisma.stockBalance.findFirst({ where: { companyId, articleId, warehouseId } }),
      prisma.article.findFirst({ where: { id: articleId, companyId } })
    ])

    const currentOnHandUn = toDecimal(balanceRow?.onHandUn || 0)

    // Compute running balance (in UN) from earliest movement in page
    // To get page-level starting balance, compute prior sum if needed
    let startingUn
    if (skip > 0 || dateFrom) {
      const wherePrior = {
        companyId,
        articleId,
        ...(warehouseId !== null ? { warehouseId } : {}),
        ...(dateFrom ? { createdAt: { lt: new Date(dateFrom) } } : {})
      }
      const prior = await prisma.stockMovement.findMany({
        where: wherePrior,
        select: { qtyUn: true, direction: true },
      })
      const priorDelta = prior.reduce((acc, m) => acc.add(m.direction === 'IN' ? m.qtyUn : new Decimal(m.qtyUn).mul(-1)), new Decimal(0))

      // starting = currentOnHand - deltaAfter
      // Easier: compute balance at beginning of filter window by summing all prior deltas from zero
      startingUn = priorDelta
    } else {
      startingUn = new Decimal(0)
    }

    let runningUn = new Decimal(startingUn)
    const rows = movements.map((m) => {
      const qtyUn = toDecimal(m.qtyUn)
      runningUn = runningUn.add(m.direction === 'IN' ? qtyUn : qtyUn.mul(-1))
      return {
        id: m.id,
        createdAt: m.createdAt,
        documentType: m.documentType,
        documentId: m.documentId,
        reason: m.reason,
        uom: m.uom,
        qty: Number(m.qty),
        qtyUn: Number(m.qtyUn),
        direction: m.direction,
        balanceUn: Number(runningUn.toDecimalPlaces(3))
      }
    })

    return {
      article: article ? { id: article.id, name: article.name, sku: article.sku } : null,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      currentOnHandUn: Number(currentOnHandUn.toDecimalPlaces(3)),
      startingOnHandUn: Number(startingUn.toDecimalPlaces(3)),
      items: rows
    }
  }

  static async exportKardex({ companyId, articleId, from, to, warehouseId = null, format = 'csv' }) {
    const data = await KardexService.getArticleKardex({ companyId, articleId, from, to, warehouseId, page: 1, limit: 10000 })

    if (format === 'csv') {
      const header = ['Fecha','TipoDoc','NroDoc','Motivo','UoM','Cantidad','Cantidad (UN)','Dirección','Saldo (UN)']
      const lines = [header.join(',')]
      for (const r of data.items) {
        lines.push([
          new Date(r.createdAt).toISOString(),
          r.documentType || '',
          r.documentId || '',
          r.reason,
          r.uom,
          r.qty,
          r.qtyUn,
          r.direction,
          r.balanceUn
        ].join(','))
      }
      return { mime: 'text/csv', filename: `kardex_${articleId}.csv`, content: lines.join('\n') }
    }

    if (format === 'json') {
      return { mime: 'application/json', filename: `kardex_${articleId}.json`, content: JSON.stringify(data) }
    }

    // default unsupported -> csv
    const fallback = await KardexService.exportKardex({ companyId, articleId, from, to, warehouseId, format: 'csv' })
    return fallback
  }
}