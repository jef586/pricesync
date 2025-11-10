import express from 'express'
import prisma from '../config/database.js'
import { authenticate } from '../middleware/auth.js'
import { scopeByCompanyId } from '../middleware/scopeByCompanyId.js'
import { buildTicketHtml, generatePdfBufferFromHtml, logPrint, resolvePrintingSettings } from '../services/TicketPrintService.js'

const router = express.Router()

router.use(authenticate)
router.use(scopeByCompanyId)

// GET /api/print/ticket/:invoiceId
router.get('/ticket/:invoiceId', async (req, res) => {
  const invoiceId = req.params.invoiceId
  const companyId = req.companyId || req.user?.companyId || req.user?.company?.id
  const printerName = req.query.printerName || null
  const branchId = req.query.branchId || null
  const widthMm = Number(req.query.paperWidth || req.query.widthMm || 0) || undefined
  const paymentMethod = req.query.paymentMethod || null

  try {
    if (!companyId) return res.status(401).json({ error: 'Empresa no encontrada en el contexto de usuario' })

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, company: true, customer: true }
    })
    if (!invoice || invoice.companyId !== companyId) {
      return res.status(404).json({ error: 'Factura no encontrada' })
    }

    const settings = await resolvePrintingSettings(companyId, branchId)
    if (widthMm) settings.paperWidth = widthMm

    // Derivar punto de venta si existiera en fiscalConfig.branches
    let posNumber = null
    const fiscal = invoice.company?.fiscalConfig || {}
    const printingRoot = fiscal?.printing || {}
    if (branchId && printingRoot.branches && printingRoot.branches[branchId]) {
      posNumber = printingRoot.branches[branchId]?.afip_point_of_sale || printingRoot.branches[branchId]?.posNumber || null
    } else if (printingRoot.default) {
      posNumber = printingRoot.default?.afip_point_of_sale || printingRoot.default?.posNumber || null
    }

    const html = buildTicketHtml({
      invoice,
      company: invoice.company,
      settings,
      posNumber,
      paymentMethod,
      fiscalLegend: (fiscal?.legend || fiscal?.ticketLegend || null) || 'Documento no válido como factura fiscal (modo prueba)'
    })

    const shouldGeneratePdf = String(req.query.generatePdf || 'false') === 'true'
    let pdfBase64 = null
    let fileName = `ticket_${invoice.number || invoice.id}.pdf`
    if (shouldGeneratePdf) {
      const pdfBuffer = await generatePdfBufferFromHtml(html, { widthMm: settings.paperWidth })
      pdfBase64 = pdfBuffer.toString('base64')
    }

    await logPrint({ invoiceId, printerName, status: 'SUCCESS', message: null })

    return res.json({
      success: true,
      data: {
        type: 'ticket',
        fileName,
        printWidthMm: settings.paperWidth,
        html,
        pdfBase64
      }
    })
  } catch (error) {
    console.error('Error generando ticket:', error)
    try { await logPrint({ invoiceId, printerName, status: 'ERROR', message: String(error?.message || error) }) } catch (_) {}
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
})

export default router