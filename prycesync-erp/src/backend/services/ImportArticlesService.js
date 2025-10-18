import prisma from '../config/database.js'
import ExcelJS from 'exceljs'
import { getCompanyPricing, directPricing, inversePricing } from './PricingService.js'

function normalizeHeader(h) {
  return (h || '').toString().trim().toLowerCase()
}

function buildHeaderIndex(worksheet) {
  const headerRow = worksheet.getRow(1)
  const map = new Map()
  for (let col = 1; col <= headerRow.cellCount; col++) {
    const header = normalizeHeader(headerRow.getCell(col).value)
    if (header) map.set(header, col)
  }
  return map
}

const FIELD_SYNONYMS = {
  sku: ['sku', 'codigo', 'código', 'code', 'cod', 'item', 'referencia', 'ref'],
  name: ['nombre', 'name', 'producto', 'artículo', 'titulo', 'título'],
  description: ['descripcion', 'descripción', 'description', 'detalle'],
  barcode: ['barcode', 'barra', 'codigo barra', 'código barra', 'ean', 'upc'],
  cost: ['costo', 'cost', 'precio costo', 'pcosto', 'neto'],
  gainPct: ['margen', 'ganancia', 'gain', 'margin', 'markup', '%'],
  pricePublic: ['precio venta', 'precio público', 'price', 'sale price', 'pventa', 'ppublico'],
  taxRate: ['iva', 'tax', 'vat'],
  stock: ['stock', 'cantidad', 'qty'],
  stockMin: ['stock min', 'minimo', 'mínimo', 'minstock'],
  stockMax: ['stock max', 'maximo', 'máximo', 'maxstock'],
  category: ['categoria', 'categoría', 'category'],
  imageUrl: ['imagen', 'image', 'image url', 'foto', 'photo']
}

function findColumnForField(field, headerIndex, presetMapping) {
  // Prefer preset mapping if provided
  if (presetMapping && presetMapping[field]) {
    const h = normalizeHeader(presetMapping[field])
    if (headerIndex.has(h)) return headerIndex.get(h)
  }
  const candidates = FIELD_SYNONYMS[field] || []
  for (const cand of candidates) {
    const h = normalizeHeader(cand)
    if (headerIndex.has(h)) return headerIndex.get(h)
  }
  return null
}

function cellString(row, col) {
  if (!col) return undefined
  const v = row.getCell(col).value
  if (v == null) return undefined
  return v.toString().trim()
}

function cellNumber(row, col) {
  if (!col) return undefined
  const v = row.getCell(col).value
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

async function upsertArticle(companyId, payload) {
  const { sku, barcode } = payload
  const existing = await prisma.article.findFirst({
    where: {
      companyId,
      deletedAt: null,
      OR: [
        ...(sku ? [{ sku }] : []),
        ...(barcode ? [{ barcode }] : [])
      ]
    },
    select: { id: true }
  })

  if (existing) {
    const updated = await prisma.article.update({
      where: { id: existing.id },
      data: payload
    })
    return { action: 'updated', article: updated }
  } else {
    const created = await prisma.article.create({ data: payload })
    return { action: 'created', article: created }
  }
}

async function getPreset(presetId, companyId) {
  if (!presetId) return null
  const preset = await prisma.supplierPreset.findFirst({ where: { id: presetId, companyId } })
  return preset
}

const ImportArticlesService = {
  async processExcel({ jobId, buffer, companyId, presetId, supplierId, isDryRun, startedBy }) {
    // Cargar Excel
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) throw Object.assign(new Error('Excel sin hoja válida'), { jobId })

    const headerIndex = buildHeaderIndex(worksheet)
    const preset = await getPreset(presetId, companyId)
    const mapping = preset?.mapping || {}

    // Resolver columnas
    const col = {}
    for (const f of Object.keys(FIELD_SYNONYMS)) {
      col[f] = findColumnForField(f, headerIndex, mapping)
    }

    const pricing = await getCompanyPricing(companyId)

    let totalRows = Math.max(worksheet.rowCount - 1, 0)
    let processedRows = 0
    let createdCount = 0
    let skippedCount = 0
    let errorCount = 0
    let warningCount = 0

    const preview = []

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber)
      processedRows++

      try {
        const name = cellString(row, col.name) || cellString(row, col.description)
        const description = cellString(row, col.description)
        const sku = cellString(row, col.sku)
        const barcode = cellString(row, col.barcode)
        const taxRate = cellNumber(row, col.taxRate) ?? 21
        const cost = cellNumber(row, col.cost)
        const gainPct = cellNumber(row, col.gainPct)
        const pricePublicRaw = cellNumber(row, col.pricePublic)
        const stock = cellNumber(row, col.stock) ?? 0
        const stockMin = cellNumber(row, col.stockMin)
        const stockMax = cellNumber(row, col.stockMax)
        const imageUrl = cellString(row, col.imageUrl)

        const issues = []
        if (!name) issues.push('Nombre faltante')
        if (cost == null || cost < 0) issues.push('Costo faltante o inválido')
        if (stockMin != null && stockMax != null && stockMax < stockMin) issues.push('StockMax < StockMin')

        // Determinar pricing final
        let finalGain = gainPct != null ? gainPct : pricing.defaultMarginPercent
        let finalPricePublic
        if (pricePublicRaw != null) {
          const inv = inversePricing({ pricePublic: pricePublicRaw, cost: cost ?? 0, taxRate })
          finalGain = inv.gainPct
          finalPricePublic = inv.pricePublic
        } else {
          const dir = directPricing({ cost: cost ?? 0, gainPct: finalGain, taxRate })
          finalPricePublic = dir.pricePublic
        }

        const payload = {
          name: (name || '').trim(),
          description: description?.trim() || null,
          type: 'PRODUCT',
          active: true,
          sku: sku?.trim() || null,
          barcode: barcode?.trim() || null,
          taxRate: taxRate,
          cost: cost ?? 0,
          gainPct: finalGain,
          pricePublic: finalPricePublic,
          stock: Math.max(0, parseInt(stock) || 0),
          stockMin: stockMin != null ? parseInt(stockMin) : null,
          stockMax: stockMax != null ? parseInt(stockMax) : null,
          controlStock: (stockMin != null || stockMax != null) ? true : false,
          imageUrl: imageUrl || null,
          companyId
        }

        const isValid = issues.length === 0
        if (!isValid) {
          skippedCount++
          errorCount += issues.length
        } else if (!isDryRun) {
          const { action } = await upsertArticle(companyId, payload)
          if (action === 'created') createdCount++
        }

        // Preview limitado
        if (preview.length < 50) {
          preview.push({ row: rowNumber, sku, name, barcode, cost, taxRate, gainPct: finalGain, pricePublic: finalPricePublic, stock, issues })
        }
      } catch (err) {
        errorCount++
        if (preview.length < 50) preview.push({ row: rowNumber, issues: [err.message || 'Error procesando fila'] })
      }
    }

    const finishedAt = new Date()

    const updatedJob = await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        totalRows,
        processedRows,
        createdCount,
        skippedCount,
        errorCount,
        warningCount,
        previewJson: preview,
        finishedAt
      }
    })

    return updatedJob
  }
}

export default ImportArticlesService