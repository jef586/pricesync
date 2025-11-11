import prisma from '../config/database.js'
import PDFDocument from 'pdfkit'

function mmToPt(mm) {
  return Math.round(mm * 2.83465)
}

export function buildTicketHtml({ invoice, company, settings, posNumber, paymentMethod, fiscalLegend }) {
  const widthMm = Number(settings?.paperWidth || 80)
  const fontSize = Number(settings?.fontSize || 12)
  const margins = {
    top: Number(settings?.marginTop || 5),
    right: Number(settings?.marginRight || 5),
    bottom: Number(settings?.marginBottom || 5),
    left: Number(settings?.marginLeft || 5)
  }

  const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : new Date()
  const dateStr = issueDate.toLocaleDateString('es-AR')
  const timeStr = issueDate.toLocaleTimeString('es-AR')

  const itemsHtml = (Array.isArray(invoice.items) ? invoice.items : [])
    .map(it => {
      const name = it.description || it.articleName || 'Item'
      const qty = Number(it.quantity || 0).toFixed(2)
      const price = Number(it.unitPrice || 0).toFixed(2)
      const total = Number(it.total || (Number(it.quantity || 0) * Number(it.unitPrice || 0))).toFixed(2)
      return `<div class="item"><div class="name">${name}</div><div class="qty">${qty}</div><div class="price">$ ${price}</div><div class="total">$ ${total}</div></div>`
    })
    .join('')

  const legend = fiscalLegend || 'Documento no válido como factura fiscal (modo prueba)'
  const companyName = company?.name || company?.legal_name || 'Empresa'
  const companyTaxId = company?.taxId || company?.cuit || ''
  const companyAddr = [company?.address, company?.city, company?.state].filter(Boolean).join(' - ')
  const pos = posNumber != null ? String(posNumber) : 'N/A'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { size: ${widthMm}mm auto; margin: 0; }
    html, body { padding: 0; margin: 0; }
    .ticket {
      width: ${widthMm}mm;
      box-sizing: border-box;
      padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif;
      font-size: ${fontSize}px;
      color: #111;
    }
    .header { text-align: center; border-bottom: 1px dashed #aaa; padding-bottom: 8px; margin-bottom: 8px; }
    .header .title { font-weight: 600; }
    .meta { margin-top: 4px; font-size: ${Math.max(fontSize - 2, 8)}px; color: #333; }
    .items { margin: 8px 0; }
    .item { display: grid; grid-template-columns: 1fr 40px 60px 70px; gap: 6px; padding: 2px 0; }
    .item .name { overflow-wrap: anywhere; }
    .totals { border-top: 1px dashed #aaa; padding-top: 8px; }
    .totals .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .footer { margin-top: 10px; text-align: center; font-size: ${Math.max(fontSize - 2, 8)}px; color: #444; }
  </style>
  <title>Ticket ${invoice.number || invoice.id}</title>
  </head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="title">${companyName}</div>
      <div class="meta">CUIT: ${companyTaxId || '—'}</div>
      <div class="meta">${companyAddr || ''}</div>
      <div class="meta">PV: ${pos} • Nº: ${invoice.number || '—'}</div>
      <div class="meta">Fecha: ${dateStr} ${timeStr}</div>
    </div>
    <div class="items">${itemsHtml}</div>
    <div class="totals">
      <div class="row"><span>Subtotal</span><strong>$ ${Number(invoice.subtotal || 0).toFixed(2)}</strong></div>
      <div class="row"><span>Impuestos</span><strong>$ ${Number(invoice.taxAmount || 0).toFixed(2)}</strong></div>
      <div class="row"><span>Total</span><strong>$ ${Number(invoice.total || 0).toFixed(2)}</strong></div>
      <div class="row"><span>Medio de pago</span><strong>${paymentMethod || 'N/A'}</strong></div>
    </div>
    <div class="footer">${legend}</div>
  </div>
  </body>
</html>`

  return html
}

export async function generatePdfBufferFromHtml(html, { widthMm = 80 } = {}) {
  // Try Puppeteer first (if installed). Fall back to PDFKit.
  try {
    const puppeteer = await import('puppeteer').then(m => m.default || m)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    const browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ printBackground: true, preferCSSPageSize: true })
    await browser.close()
    return pdfBuffer
  } catch (err) {
    // Fallback: simple PDF rendering via PDFKit
    const doc = new PDFDocument({ size: [mmToPt(widthMm), mmToPt(297)], margin: mmToPt(5) })
    const chunks = []
    return await new Promise((resolve) => {
      doc.on('data', (d) => chunks.push(d))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.fontSize(12).text('Ticket (render HTML → PDF no disponible en este entorno).', { align: 'left' })
      doc.moveDown()
      doc.fontSize(8).text('Contenido HTML:', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(7).text(html.substring(0, 5000))
      doc.end()
    })
  }
}

export async function logPrint({ invoiceId, printerName, status, message, attempts = 1, userId = null, companyId = null, branchId = null }) {
  const normalizedStatus = String(status || 'success').toLowerCase()
  try {
    // Try Prisma model first (may target public.print_logs depending on schema config)
    await prisma.printLog.create({
      data: {
        invoiceId,
        printerName: printerName || null,
        status: normalizedStatus,
        attempts,
        userId: userId || null,
        companyId: companyId || null,
        branchId: branchId || null,
        message: message || null
      }
    })
  } catch (e) {
    // Fallback to fully-qualified schema write to ensure logs are captured
    try {
      await prisma.$executeRawUnsafe(
        'INSERT INTO core_reports.print_logs (invoice_id, printer_name, status, attempts, user_id, company_id, branch_id, message) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        invoiceId,
        printerName || null,
        normalizedStatus,
        attempts,
        userId || null,
        companyId || null,
        branchId || null,
        message || null
      )
    } catch (ignore) {
      // swallow
    }
  }
}

export async function resolvePrintingSettings(companyId, branchId = null) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { fiscalConfig: true } })
  const fiscal = company?.fiscalConfig || {}
  const printingRoot = fiscal.printing || {}
  const defaults = {
    defaultPrinter: null,
    paperWidth: 80,
    marginTop: 5,
    marginRight: 5,
    marginBottom: 5,
    marginLeft: 5,
    fontSize: 12,
    autoPrintAfterSale: false,
    branchId: branchId || null
  }
  const base = { ...defaults, ...(printingRoot.default || printingRoot || {}) }
  if (branchId && printingRoot.branches && typeof printingRoot.branches === 'object') {
    const override = printingRoot.branches[branchId]
    if (override) return { ...base, ...override, branchId }
  }
  return base
}