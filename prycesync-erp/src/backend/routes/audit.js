import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { requirePermission } from '../middleware/permissions.js'
import { prisma } from '../config/database.js'

const router = express.Router()

router.use(authenticate)

// GET /api/audit - list audit logs with filters
router.get('/', requirePermission('admin:audit'), async (req, res) => {
  try {
    const actor = req.user
    const isSuperadmin = String(actor.role).toUpperCase() === 'SUPERADMIN'
    const {
      actorId,
      targetId,
      actionType,
      companyId: qCompanyId,
      from,
      to,
      page = '1',
      size = '25'
    } = req.query

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const pageSize = Math.max(1, Math.min(100, parseInt(String(size), 10) || 25))
    const skip = (pageNum - 1) * pageSize

    const where = {}
    // Company scoping: non-superadmin only sees own company
    if (!isSuperadmin) {
      where.companyId = actor.company?.id || null
    } else if (qCompanyId) {
      where.companyId = String(qCompanyId)
    }
    if (actorId) where.actorId = String(actorId)
    if (targetId) where.targetId = String(targetId)
    if (actionType) where.actionType = String(actionType)
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(String(from))
      if (to) where.createdAt.lte = new Date(String(to))
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          actorId: true,
          actorName: true,
          targetId: true,
          targetName: true,
          actionType: true,
          payloadDiff: true,
          companyId: true,
          ip: true,
          userAgent: true,
          createdAt: true
        }
      }),
      prisma.auditLog.count({ where })
    ])

    return res.json({
      items,
      pagination: { page: pageNum, size: pageSize, total, pages: Math.ceil(total / pageSize) }
    })
  } catch (err) {
    console.error('Error listing audit logs:', err)
    return res.status(500).json({ error: 'Error obteniendo auditoría', code: 'GET_AUDIT_FAILED' })
  }
})

export default router