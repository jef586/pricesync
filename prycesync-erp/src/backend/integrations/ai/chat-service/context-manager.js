// Context Manager: construye el contexto seguro para el chat IA
export function getChatContext() {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase()
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '300', 10)

  // Mapear nombres esperados por el feature a tablas reales
  const tableMap = {
    products: 'articles',
    inventory: 'stock_balances',
    categories: 'categories'
  }

  return {
    provider,
    maxTokens,
    allowedTables: ['products', 'inventory', 'categories'],
    tableMap
  }
}