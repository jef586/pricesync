import prisma from '../config/database.js'
import Decimal from 'decimal.js'
import UomService from './UomService.js'

const EPSILON = new Decimal(0.0001)
const QTY_SCALE = 3
const AVG_SCALE = 4

function toDec(n) { return new Decimal(n || 0) }
function roundQty(d) { return toDec(d).toDecimalPlaces(QTY_SCALE, Decimal.ROUND_HALF_UP) }
function roundAvg(d) { return toDec(d).toDecimalPlaces(AVG_SCALE, Decimal.ROUND_HALF_UP) }

async function getSettings(companyId, supplierId) {
  // Prefer supplier scope, fallback to global
  const [bySupplier, global] = await Promise.all([
    supplierId
      ? prisma.stockEstimatorSettings.findFirst({ where: { companyId, scope: 'SUPPLIER', scopeId: String(supplierId) } })
      : Promise.resolve(null),
    prisma.stockEstimatorSettings.findFirst({ where: { companyId, scope: 'GLOBAL', scopeId: null } })
  ])
  const s = bySupplier || global
  return {
    leadTimeDays: s?.leadTimeDays ?? 5,
    safetyStockDays: s?.safetyStockDays ?? 3,
    coverageDays: s?.coverageDays ?? 14
  }
}

async function sumOnHandUn(companyId, articleId) {
  const balances = await prisma.stockBalance.findMany({
    where: { companyId, articleId },
    select: { onHandUn: true }
  })
  return balances.reduce((acc, b) => acc.add(toDec(b.onHandUn || 0)), new Decimal(0))
}

async function sumQtyUnForWindow(companyId, articleId, days, now) {
  const from = new Date(now)
  from.setUTCDate(from.getUTCDate() - days)
  // Traer ítems de ventas, excluyendo canceladas
  const items = await prisma.salesOrderItem.findMany({
    where: {
      articleId,
      salesOrder: {
        companyId,
        status: { notIn: ['cancelled'] },
        createdAt: { gte: from }
      }
    },
    include: { salesOrder: { select: { createdAt: true } } }
  })
  let total = new Decimal(0)
  for (const it of items) {
    const uom = it.uom || 'UN'
    const qty = toDec(it.quantity)
    const qtyUn = await UomService.convertToUN(articleId, uom, qty)
    total = total.add(qtyUn)
  }
  return total
}

async function computeVolatilityIndex(companyId, articleId, days, now) {
  // Serie diaria sobre los últimos `days` días, incluyendo ceros
  const from = new Date(now)
  from.setUTCDate(from.getUTCDate() - days)
  const items = await prisma.salesOrderItem.findMany({
    where: {
      articleId,
      salesOrder: {
        companyId,
        status: { notIn: ['cancelled'] },
        createdAt: { gte: from }
      }
    },
    include: { salesOrder: { select: { createdAt: true } } }
  })

  // Agregar por día
  const daily = new Map()
  for (const it of items) {
    const dateKey = it.salesOrder?.createdAt ? it.salesOrder.createdAt.toISOString().slice(0, 10) : it.createdAt.toISOString().slice(0, 10)
    const uom = it.uom || 'UN'
    const qty = toDec(it.quantity)
    const qtyUn = await UomService.convertToUN(articleId, uom, qty)
    daily.set(dateKey, toDec(daily.get(dateKey) || 0).add(qtyUn))
  }

  // Construir serie completa con ceros
  const series = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    series.push(toDec(daily.get(key) || 0))
  }
  if (series.length === 0) return new Decimal(0)

  const mean = series.reduce((a, v) => a.add(v), new Decimal(0)).div(series.length)
  if (mean.equals(0)) return new Decimal(0)
  const variance = series.reduce((a, v) => a.add(v.sub(mean).pow(2)), new Decimal(0)).div(series.length)
  const stddev = variance.sqrt()
  return stddev.div(mean).toDecimalPlaces(AVG_SCALE, Decimal.ROUND_HALF_UP)
}

async function getLastSaleAt(companyId, articleId) {
  const last = await prisma.salesOrderItem.findFirst({
    where: { articleId, salesOrder: { companyId, status: { notIn: ['cancelled'] } } },
    include: { salesOrder: { select: { createdAt: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return last?.salesOrder?.createdAt || last?.createdAt || null
}

async function getOnOrderUn(/* companyId, articleId, supplierId */) {
  // TODO: integrar con compras cuando existan órdenes de compra
  return new Decimal(0)
}

function chooseWindow(volatility, forcedWindow) {
  if (forcedWindow && ['7', '30', '90'].includes(String(forcedWindow))) {
    return Number(forcedWindow)
  }
  // auto
  if (toDec(volatility).greaterThan(0.6)) return 90
  if (toDec(volatility).greaterThan(0.3)) return 30
  return 7
}

export default class StockEstimatorService {
  static async calc({ companyId, articleId, window = 'auto', supplierId = null, now = new Date() }) {
    if (!companyId || !articleId) throw new Error('companyId y articleId requeridos')

    // Settings
    const settings = await getSettings(companyId, supplierId)

    // Stats de demanda desde cache; si no hay, calcular on-demand
    let stats = await prisma.articleDemandStats.findFirst({ where: { articleId } })
    if (!stats) {
      const [sum7, sum30, sum90, lastSaleAt, vol90] = await Promise.all([
        sumQtyUnForWindow(companyId, articleId, 7, now),
        sumQtyUnForWindow(companyId, articleId, 30, now),
        sumQtyUnForWindow(companyId, articleId, 90, now),
        getLastSaleAt(companyId, articleId),
        computeVolatilityIndex(companyId, articleId, 90, now)
      ])
      stats = {
        avg7: sum7.div(7).toNumber(),
        avg30: sum30.div(30).toNumber(),
        avg90: sum90.div(90).toNumber(),
        lastSaleAt,
        volatilityIndex: vol90.toNumber()
      }
    }

    const volatility = toDec(stats.volatilityIndex || 0)
    const windowUsed = chooseWindow(volatility, window === 'auto' ? null : window)
    const avgDaily = windowUsed === 7 ? toDec(stats.avg7 || 0) : windowUsed === 30 ? toDec(stats.avg30 || 0) : toDec(stats.avg90 || 0)

    const [onHand, onOrder] = await Promise.all([
      sumOnHandUn(companyId, articleId),
      getOnOrderUn(companyId, articleId, supplierId)
    ])

    const denom = Decimal.max(avgDaily, EPSILON)
    const daysOfStock = onHand.div(denom)

    const lead = new Decimal(settings.leadTimeDays)
    const safety = new Decimal(settings.safetyStockDays)
    const coverage = new Decimal(settings.coverageDays)

    const reorderPoint = avgDaily.mul(lead.add(safety))
    const netNeed = avgDaily.mul(lead.add(safety).add(coverage)).sub(onHand.add(onOrder))
    const suggested = netNeed.lessThan(0) ? new Decimal(0) : netNeed
    // Sugerencia en UN base -> entero hacia arriba
    const suggestedQty = suggested.ceil()

    let breakDate = null
    if (avgDaily.greaterThan(0)) {
      const addDays = daysOfStock.floor().toNumber()
      const d = new Date(now)
      d.setUTCDate(d.getUTCDate() + addDays)
      breakDate = d.toISOString().slice(0, 10)
    }

    // Semáforo
    const dos = daysOfStock
    let semaphore = 'GREEN'
    if (dos.lessThanOrEqualTo(lead)) semaphore = 'RED'
    else if (dos.lessThanOrEqualTo(lead.add(safety))) semaphore = 'YELLOW'

    return {
      windowUsed,
      avgDaily: roundAvg(avgDaily).toNumber(),
      daysOfStock: roundAvg(dos).toNumber(),
      reorderPoint: roundQty(reorderPoint).toNumber(),
      onHand: roundQty(onHand).toNumber(),
      onOrder: roundQty(onOrder).toNumber(),
      suggestedQty: suggestedQty.toNumber(),
      breakDate,
      semaphore,
      lastSaleAt: stats.lastSaleAt || null
    }
  }

  static async rebuildDemandStats({ companyId, now = new Date() }) {
    if (!companyId) throw new Error('companyId requerido')
    const articles = await prisma.article.findMany({ where: { companyId }, select: { id: true, type: true } })
    for (const a of articles) {
      if (a.type === 'SERVICE') continue
      const [sum7, sum30, sum90, lastSaleAt, vol90] = await Promise.all([
        sumQtyUnForWindow(companyId, a.id, 7, now),
        sumQtyUnForWindow(companyId, a.id, 30, now),
        sumQtyUnForWindow(companyId, a.id, 90, now),
        getLastSaleAt(companyId, a.id),
        computeVolatilityIndex(companyId, a.id, 90, now)
      ])
      await prisma.articleDemandStats.upsert({
        where: { articleId: a.id },
        create: {
          articleId: a.id,
          avg7: sum7.div(7).toNumber(),
          avg30: sum30.div(30).toNumber(),
          avg90: sum90.div(90).toNumber(),
          lastSaleAt,
          volatilityIndex: vol90.toNumber()
        },
        update: {
          avg7: sum7.div(7).toNumber(),
          avg30: sum30.div(30).toNumber(),
          avg90: sum90.div(90).toNumber(),
          lastSaleAt,
          volatilityIndex: vol90.toNumber()
        }
      })
    }
    return { ok: true, count: articles.length }
  }

  static async getSettings({ companyId, supplierId = null }) {
    const s = await getSettings(companyId, supplierId)
    return s
  }

  static async updateSettings({ companyId, scope, scopeId = null, leadTimeDays, safetyStockDays, coverageDays }) {
    if (!['GLOBAL', 'SUPPLIER'].includes(scope)) throw new Error('scope inválido')
    const rec = await prisma.stockEstimatorSettings.upsert({
      where: {
        companyId_scope_scopeId: {
          companyId,
          scope,
          scopeId
        }
      },
      create: { companyId, scope, scopeId, leadTimeDays, safetyStockDays, coverageDays },
      update: { leadTimeDays, safetyStockDays, coverageDays }
    })
    return rec
  }
}