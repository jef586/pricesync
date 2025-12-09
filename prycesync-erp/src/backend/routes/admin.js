import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import SalesService from '../services/SalesService.js'

const router = express.Router()

router.use(authenticate)

router.post('/sales/backfill-human-codes', async (req, res) => {
  try {
    if (String(process.env.NODE_ENV || 'development') === 'production') {
      return res.status(403).json({ success: false, message: 'Endpoint disponible solo en entorno de desarrollo' })
    }
    const companyId = req.user?.company?.id
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Empresa no determinada para el usuario' })
    }

    const missing = await prisma.salesOrder.findMany({
      where: { companyId, OR: [{ humanCode: null }, { humanCode: '' }] },
      select: { id: true, createdAt: true, branchId: true }
    })

    let updated = 0
    for (const s of missing) {
      const year = new Date(s.createdAt).getFullYear()
      const branchId = s.branchId || null
      const seqRow = await prisma.$transaction(async (tx) => {
        return tx.salesSequence.upsert({
          where: { companyId_branchId_year: { companyId, branchId, year } },
          update: { next: { increment: 1 } },
          create: { companyId, branchId, year, next: 2 }
        })
      })
      const assignedSeq = Number(seqRow.next) - 1
      const humanCode = SalesService.formatSaleCode(companyId, branchId, year, assignedSeq)
      await prisma.salesOrder.update({ where: { id: s.id }, data: { humanCode } })
      updated++
    }

    return res.json({ success: true, updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || 'Error en backfill' })
  }
})

export default router

