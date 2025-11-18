import { groqJsonComplete } from '../integrations/ai/groqProvider.js'

const FIELD_KEYS = [
  'supplier_sku',
  'name',
  'cost_price',
  'list_price',
  'brand',
  'category_name',
  'tax_rate',
  'unit'
]

function clampConfidence(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function sanitizeLog(obj) {
  try {
    return JSON.stringify(obj).slice(0, 5000)
  } catch {
    return '[unserializable]'
  }
}

export class SupplierMappingService {
  /**
   * @param {Object} params
   * @param {string} params.supplierId
   * @param {string} params.supplierName
   * @param {{ index: number, label: string }[]} params.columns
   * @param {string[][]} params.sampleRows
   * @param {boolean} params.hasHeader
   * @returns {Promise<Record<string, { columnIndex: number|null, confidence: number }>>}
   */
  async suggestMapping({ supplierId, supplierName, columns, sampleRows, hasHeader }) {
    const maxTokens = Number(process.env.AI_MAX_TOKENS || 1200)
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 12000)

    const systemPrompt = [
      'Eres una IA que ayuda a mapear columnas de listas de precios de proveedores a campos internos del ERP.',
      'Debes analizar nombres de columnas y muestras de filas y devolver un JSON estricto con tu sugerencia y confianza (0–1) para cada campo.',
      'Campos internos y significado:',
      '- supplier_sku: Código del producto según el proveedor (string).',
      '- name: Nombre o descripción del producto (string).',
      '- cost_price: Precio de costo del proveedor (número, puede incluir decimales).',
      '- list_price: Precio de lista del proveedor (número).',
      '- brand: Marca del producto (string).',
      '- category_name: Categoría o rubro del producto (string).',
      '- tax_rate: Alícuota IVA (porcentaje, típicamente 0, 10.5, 21, 27).',
      '- unit: Unidad de medida (por ejemplo UN, KG, LT).',
      'Si no puedes identificar alguna columna, usa columnIndex = null y confidence cercana a 0.',
      'Responde exclusivamente con un objeto JSON usando las claves anteriores.'
    ].join('\n')

    const userPrompt = [
      `Proveedor: ${supplierName} (id: ${supplierId})`,
      `Hay encabezado: ${hasHeader ? 'sí' : 'no'}`,
      'Columnas:',
      ...columns.map(c => `- [${c.index}] ${c.label}`),
      'Muestra de filas (primeras):',
      ...sampleRows.map(r => `- ${JSON.stringify(r)}`),
      'Devuelve un JSON con este formato exacto:',
      '{"supplier_sku":{"columnIndex":number|null,"confidence":number},"name":{"columnIndex":number|null,"confidence":number},"cost_price":{"columnIndex":number|null,"confidence":number},"list_price":{"columnIndex":number|null,"confidence":number},"brand":{"columnIndex":number|null,"confidence":number},"category_name":{"columnIndex":number|null,"confidence":number},"tax_rate":{"columnIndex":number|null,"confidence":number},"unit":{"columnIndex":number|null,"confidence":number}}'
    ].join('\n')

    const inputForLog = { supplierId, supplierName, columns, sampleRowsCount: sampleRows.length, hasHeader }
    console.info('[AI mapping] request', sanitizeLog(inputForLog))

    const aiResp = await groqJsonComplete({ systemPrompt, userPrompt, maxTokens, timeoutMs })

    const result = {}
    const maxIndex = columns.reduce((m, c) => Math.max(m, c.index), -1)
    for (const key of FIELD_KEYS) {
      const raw = aiResp?.[key]
      let idx = null
      let conf = 0
      if (raw && typeof raw === 'object') {
        const ci = raw.columnIndex
        const cf = raw.confidence
        if (Number.isInteger(ci) && ci >= 0 && ci <= maxIndex) idx = ci
        conf = clampConfidence(cf)
      }
      result[key] = { columnIndex: idx, confidence: conf }
    }

    console.info('[AI mapping] response', sanitizeLog(result))
    return result
  }
}

