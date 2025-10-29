import prisma from '../config/database.js'
import StockService from '../services/StockService.js'
import UomService from '../services/UomService.js'
import KardexService from '../services/KardexService.js'

class StockController {
  static async listBalances(req, res) {
    try {
      const { page = 1, limit = 20, articleId, warehouseId } = req.query
      const companyId = req.user.company.id
      const skip = (Number(page) - 1) * Number(limit)

      const where = {
        companyId,
        ...(articleId ? { articleId } : {}),
        ...(warehouseId ? { warehouseId } : { warehouseId: null })
      }

      const [items, total] = await Promise.all([
        prisma.stockBalance.findMany({
          where,
          include: { article: { select: { id: true, sku: true, name: true, categoryId: true } } },
          orderBy: { updatedAt: 'desc' },
          skip: Number(skip),
          take: Number(limit)
        }),
        prisma.stockBalance.count({ where })
      ])

      res.json({
        success: true,
        data: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      console.error('Error listBalances:', error)
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudieron obtener balances de stock' })
    }
  }

  static async listMovements(req, res) {
    try {
      const { page = 1, limit = 50, articleId, reason, direction, documentId } = req.query
      const companyId = req.user.company.id
      const skip = (Number(page) - 1) * Number(limit)

      const where = {
        companyId,
        ...(articleId ? { articleId } : {}),
        ...(reason ? { reason } : {}),
        ...(direction ? { direction } : {}),
        ...(documentId ? { documentId } : {})
      }

      const [items, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: { article: { select: { id: true, sku: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          skip: Number(skip),
          take: Number(limit)
        }),
        prisma.stockMovement.count({ where })
      ])

      res.json({
        success: true,
        data: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      console.error('Error listMovements:', error)
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudieron obtener movimientos de stock' })
    }
  }

  static async createMovement(req, res) {
    try {
      const companyId = req.user.company.id
      const createdBy = req.user?.id || 'system'
      const {
        articleId,
        warehouseId = null,
        uom = 'UN',
        qty,
        direction, // 'IN' | 'OUT'
        reason,
        documentId = null,
        documentType = null,
        comment = null,
        override = false,
        clientOperationId = null
      } = req.body || {}

      if (!articleId) {
        return res.status(400).json({ success: false, message: 'articleId es requerido' })
      }
      const qtyNumber = Number(qty)
      if (!(qtyNumber > 0)) {
        return res.status(400).json({ success: false, message: 'qty debe ser mayor a 0' })
      }
      const dir = (direction || '').toUpperCase()
      if (!['IN', 'OUT'].includes(dir)) {
        return res.status(400).json({ success: false, message: 'direction debe ser IN u OUT' })
      }
      if (!reason) {
        return res.status(400).json({ success: false, message: 'reason es requerido' })
      }

      // Validar y normalizar cantidad según UoM antes de transaccionar
      let qtyNormalized
      try {
        qtyNormalized = UomService.normalizeQtyInput(uom, qtyNumber).toNumber()
      } catch (e) {
        const code = e?.httpCode || 400
        const msg = e?.message || 'Cantidad/UoM inválida'
        return res.status(code).json({ success: false, message: msg })
      }

      try {
        const result = await prisma.$transaction(async (tx) => {
          const { movement, balance } = await StockService.createMovement(tx, {
            companyId,
            articleId,
            warehouseId,
            uom,
            qty: qtyNormalized,
            direction: dir,
            reason,
            documentId,
            documentType,
            comment,
            override: !!override,
            clientOperationId,
            createdBy
          })
          return { movement, balance }
        })

        res.status(201).json({ success: true, message: 'Movimiento creado', data: result })
      } catch (err) {
        const code = err?.httpCode || 500
        const msg = err?.message || 'Error creando movimiento'
        return res.status(code).json({ success: false, message: msg })
      }
    } catch (error) {
      console.error('Error createMovement:', error)
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo crear el movimiento' })
    }
  }

  static async canFulfill(req, res) {
    try {
      const companyId = req.user.company.id
      const { items = [], warehouseId = null } = req.body || {}

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'items es requerido y no puede estar vacío' })
      }

      const result = await StockService.canFulfill({ companyId, items, warehouseId })
      return res.json({ success: true, data: result })
    } catch (error) {
      console.error('Error canFulfill:', error)
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo verificar disponibilidad de stock' })
    }
  }

  static async getKardex(req, res) {
    try {
      const companyId = req.user.company.id
      const { articleId, from, to, warehouseId = null, page = 1, limit = 100 } = req.query

      if (!articleId) {
        return res.status(400).json({ success: false, message: 'articleId es requerido' })
      }

      const data = await KardexService.getArticleKardex({
        companyId,
        articleId,
        from: from || undefined,
        to: to || undefined,
        warehouseId: warehouseId || null,
        page: Number(page) || 1,
        limit: Number(limit) || 100
      })

      return res.json({ success: true, data })
    } catch (error) {
      console.error('Error getKardex:', error)
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo obtener el Kardex' })
    }
  }

  static async exportKardex(req, res) {
    try {
      const companyId = req.user.company.id
      const { articleId, from, to, warehouseId = null, format = 'csv' } = req.query

      if (!articleId) {
        return res.status(400).json({ success: false, message: 'articleId es requerido' })
      }

      const result = await KardexService.exportKardex({
        companyId,
        articleId,
        from: from || undefined,
        to: to || undefined,
        warehouseId: warehouseId || null,
        format: String(format || 'csv').toLowerCase()
      })

      res.setHeader('Content-Type', result.mime)
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
      return res.send(result.content)
    } catch (error) {
      console.error('Error exportKardex:', error)
      res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo exportar el Kardex' })
    }
  }
}

export default StockController