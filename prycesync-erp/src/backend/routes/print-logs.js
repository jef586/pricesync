import express from 'express'
import prisma from '../config/database.js'
import { z } from 'zod'
import { authenticate } from '../middleware/auth.js'
import { scopeByCompanyId } from '../middleware/scopeByCompanyId.js'
import { mapErrorToHttp } from '../utils/httpError.js'

const router = express.Router()

router.use(authenticate)
router.use(scopeByCompanyId)

const SortEnum = z.enum(['printed_at:asc','printed_at:desc'])
const StatusEnum = z.enum(['success','error','pending'])

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: StatusEnum.optional(),
  userId: z.string().cuid().optional(),
  printerName: z.string().min(1).optional(),
  invoiceNumber: z.string().min(1).optional(),
  branchId: z.string().cuid().optional(),
  sort: SortEnum.default('printed_at:desc')
})

router.get('/', async (req, res) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos', errors: parsed.error.errors })
    }
    const { page, pageSize, dateFrom, dateTo, status, userId, printerName, invoiceNumber, branchId, sort } = parsed.data
    const companyId = req.companyId
    if (!companyId) return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })

    const where = []
    const params = []
    // Company scope mandatory
    params.push(companyId)
    where.push('pl.company_id = $1')
    let p = 2
    if (branchId) { where.push(`pl.branch_id = $${p++}`); params.push(branchId) }
    if (status) { where.push(`pl.status = $${p++}`); params.push(status) }
    if (userId) { where.push(`pl.user_id = $${p++}`); params.push(userId) }
    if (printerName) { where.push(`pl.printer_name ILIKE $${p++}`); params.push(`%${printerName}%`) }
    if (invoiceNumber) { where.push(`inv.full_number ILIKE $${p++}`); params.push(`%${invoiceNumber}%`) }
    if (dateFrom) { where.push(`pl.printed_at >= $${p++}`); params.push(new Date(dateFrom)) }
    if (dateTo) { where.push(`pl.printed_at <= $${p++}`); params.push(new Date(dateTo)) }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const orderSql = sort === 'printed_at:asc' ? 'ORDER BY pl.printed_at ASC' : 'ORDER BY pl.printed_at DESC'
    const offset = (page - 1) * pageSize

    const itemsSql = `
      SELECT pl.id, pl.printed_at, pl.printer_name, pl.status, pl.attempts,
             pl.invoice_id AS invoice_id,
             inv.full_number AS invoice_full_number,
             COALESCE(u.first_name || ' ' || u.last_name, u.name, u.username) AS user_name
      FROM core_reports.print_logs pl
      LEFT JOIN core_billing.invoices inv ON inv.id = pl.invoice_id
      LEFT JOIN core_auth.users u ON u.id = pl.user_id
      ${whereSql}
      ${orderSql}
      LIMIT $${p} OFFSET $${p + 1}
    `
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM core_reports.print_logs pl
      LEFT JOIN core_billing.invoices inv ON inv.id = pl.invoice_id
      ${whereSql}
    `

    const items = await prisma.$queryRawUnsafe(itemsSql, ...params, pageSize, offset)
    const [{ total }] = await prisma.$queryRawUnsafe(countSql, ...params)

    return res.json({ success: true, items, total, page, pageSize })
  } catch (error) {
    const mapped = mapErrorToHttp(error, 'Error obteniendo historial de impresiones')
    return res.status(mapped.status).json(mapped.body)
  }
})

router.get('/export.csv', async (req, res) => {
  try {
    const parsed = ListQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos', errors: parsed.error.errors })
    }
    const { dateFrom, dateTo, status, userId, printerName, invoiceNumber, branchId, sort } = parsed.data
    const companyId = req.companyId
    if (!companyId) return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })

    const where = []
    const params = []
    params.push(companyId)
    where.push('pl.company_id = $1')
    let p = 2
    if (branchId) { where.push(`pl.branch_id = $${p++}`); params.push(branchId) }
    if (status) { where.push(`pl.status = $${p++}`); params.push(status) }
    if (userId) { where.push(`pl.user_id = $${p++}`); params.push(userId) }
    if (printerName) { where.push(`pl.printer_name ILIKE $${p++}`); params.push(`%${printerName}%`) }
    if (invoiceNumber) { where.push(`inv.full_number ILIKE $${p++}`); params.push(`%${invoiceNumber}%`) }
    if (dateFrom) { where.push(`pl.printed_at >= $${p++}`); params.push(new Date(dateFrom)) }
    if (dateTo) { where.push(`pl.printed_at <= $${p++}`); params.push(new Date(dateTo)) }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const orderSql = sort === 'printed_at:asc' ? 'ORDER BY pl.printed_at ASC' : 'ORDER BY pl.printed_at DESC'

    const rows = await prisma.$queryRawUnsafe(`
      SELECT to_char(pl.printed_at, 'YYYY-MM-DD HH24:MI') as fecha,
             inv.full_number as numero,
             COALESCE(pl.printer_name, '-') as impresora,
             pl.status as estado,
             pl.attempts as intentos,
             COALESCE(u.first_name || ' ' || u.last_name, u.name, u.username) as usuario
      FROM core_reports.print_logs pl
      LEFT JOIN core_billing.invoices inv ON inv.id = pl.invoice_id
      LEFT JOIN core_auth.users u ON u.id = pl.user_id
      ${whereSql}
      ${orderSql}
    `, ...params)

    const header = ['Fecha','N° Comprobante','Impresora','Estado','Intentos','Usuario']
    const csvLines = [header.join(';')]
    for (const r of rows) {
      csvLines.push([r.fecha, r.numero, r.impresora, r.estado, String(r.intentos), r.usuario || '-'].map(v => String(v).replaceAll(';', ',')).join(';'))
    }
    const csv = csvLines.join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="print_logs.csv"')
    return res.status(200).send(csv)
  } catch (error) {
    const mapped = mapErrorToHttp(error, 'Error exportando historial de impresiones')
    return res.status(mapped.status).json(mapped.body)
  }
})

// Optional: allow creating a log manually (e.g., from renderer retry path)
const CreateLogSchema = z.object({
  invoiceId: z.string().cuid(),
  printerName: z.string().min(1).optional(),
  status: StatusEnum.default('success'),
  attempts: z.coerce.number().int().min(1).default(1),
  message: z.string().optional(),
  branchId: z.string().cuid().optional(),
  userId: z.string().cuid().optional()
})

router.post('/', async (req, res) => {
  try {
    const parsed = CreateLogSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errors: parsed.error.errors })
    }
    const companyId = req.companyId
    if (!companyId) return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })
    const { invoiceId, printerName, status, attempts, message, branchId, userId } = parsed.data
    await prisma.$executeRawUnsafe(
      'INSERT INTO core_reports.print_logs (invoice_id, printer_name, status, attempts, message, user_id, company_id, branch_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      invoiceId,
      printerName || null,
      status,
      attempts,
      message || null,
      userId || req.user?.id || null,
      companyId,
      branchId || null
    )
    return res.json({ success: true })
  } catch (error) {
    const mapped = mapErrorToHttp(error, 'Error creando log de impresión')
    return res.status(mapped.status).json(mapped.body)
  }
})

export default router