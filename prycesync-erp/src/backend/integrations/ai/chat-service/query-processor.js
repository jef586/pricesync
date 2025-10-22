import prisma from '../../../config/database.js'
import { completePrompt } from './provider.js'
import { validateSql } from './sql-validator.js'

function sanitizeText(t) {
  if (!t) return ''
  return String(t).replace(/[\n\r\t]/g, ' ').replace(/[<>\x00-\x1F]/g, '').trim()
}

async function aggregateStockForArticles(articles) {
  const ids = articles.map(a => a.id)
  const balances = await prisma.stockBalance.findMany({
    where: { articleId: { in: ids } },
    select: { articleId: true, onHandUn: true }
  })
  const map = new Map()
  for (const b of balances) {
    const prev = map.get(b.articleId) || 0
    map.set(b.articleId, prev + Number(b.onHandUn))
  }
  return articles.map(a => ({
    id: a.id,
    name: a.name,
    sku: a.sku,
    pricePublic: a.pricePublic,
    categoryId: a.categoryId,
    stockOnHand: map.get(a.id) || 0
  }))
}

async function handlePriceQuery(q) {
  const query = sanitizeText(q)
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { equals: query } },
        { barcode: { equals: query } }
      ]
    },
    select: { id: true, name: true, sku: true, pricePublic: true, categoryId: true }
  })
  return aggregateStockForArticles(articles)
}

async function handleStockQuery(q) {
  // Igual que precio, pero con enfoque en stock
  return handlePriceQuery(q)
}

async function handleCategoryQuery(categoryText) {
  const query = sanitizeText(categoryText)
  const category = await prisma.category.findFirst({
    where: { name: { contains: query, mode: 'insensitive' } },
    select: { id: true, name: true }
  })
  if (!category) return []
  const articles = await prisma.article.findMany({
    where: { categoryId: category.id },
    select: { id: true, name: true, sku: true, pricePublic: true, categoryId: true }
  })
  return aggregateStockForArticles(articles)
}

function parseAiJson(text) {
  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === 'object') return obj
    return null
  } catch (_) {
    return null
  }
}

export async function processQuery(nlText, ctx) {
  const text = sanitizeText(nlText)
  const lower = text.toLowerCase()

  // Heurísticas simples
  if (/precio/.test(lower)) {
    const m = lower.match(/precio\s+(de|del|para)\s+(.+)/)
    const q = m?.[2] || text
    return { results: await handlePriceQuery(q), source: 'heuristic' }
  }
  if (/(stock|disponible|inventario)/.test(lower)) {
    const m = lower.match(/(stock|inventario)\s+(de|del|para)\s+(.+)/)
    const q = m?.[3] || text
    return { results: await handleStockQuery(q), source: 'heuristic' }
  }
  if (/categoria/.test(lower)) {
    const m = lower.match(/categoria\s+(de|del|para)?\s*(.+)/)
    const q = m?.[2] || text
    return { results: await handleCategoryQuery(q), source: 'heuristic' }
  }

  // Fallback IA: Pedir JSON seguro
  const systemPrompt = `Eres un asistente de inventario. Devuelve SOLO JSON con la forma {operation:"price|stock|category", filters:{...}, fields:[...]}. Nunca ejecutes SQL, ni inventes tablas. Campos válidos: name, sku, barcode, categoryName. Tablas: products, inventory, categories.`
  const userPrompt = `Consulta: ${text}. Devuelve SOLO JSON válido.`
  const aiText = await completePrompt({ provider: ctx.provider, systemPrompt, userPrompt, maxTokens: ctx.maxTokens })
  const aiJson = parseAiJson(aiText)
  if (!aiJson) {
    // Respuesta IA no usable
    return { results: [], source: 'ai_invalid', error: 'AI_JSON_INVALID' }
  }
  const op = String(aiJson.operation || '').toLowerCase()
  const filters = aiJson.filters || {}

  if (op === 'price') {
    const q = filters.name || filters.sku || filters.barcode || text
    return { results: await handlePriceQuery(q), source: 'ai_json' }
  }
  if (op === 'stock') {
    const q = filters.name || filters.sku || filters.barcode || text
    return { results: await handleStockQuery(q), source: 'ai_json' }
  }
  if (op === 'category') {
    const q = filters.categoryName || text
    return { results: await handleCategoryQuery(q), source: 'ai_json' }
  }

  // Si el JSON incluye SQL opcional, validarlo pero NO ejecutar si no es seguro
  if (aiJson.sql) {
    const { valid } = validateSql(aiJson.sql, ctx.allowedTables)
    if (!valid) {
      return { results: [], source: 'ai_sql_invalid', error: 'SQL_NOT_ALLOWED' }
    }
  }

  return { results: [], source: 'ai_unknown_op', error: 'UNKNOWN_OPERATION' }
}