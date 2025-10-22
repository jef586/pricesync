// Response Formatter: formatea resultados para la UI tipo Chat
export function formatResponse(results, meta = {}) {
  // results puede ser array de artículos o balances
  const count = Array.isArray(results) ? results.length : (results ? 1 : 0)
  const payload = {
    type: 'table',
    count,
    data: results,
    meta: {
      ...meta,
      timestamp: new Date().toISOString()
    }
  }
  // Mensaje corto para cabecera de burbuja
  const message = count === 0
    ? 'No se encontraron resultados para la consulta.'
    : `Encontrados ${count} resultado(s).`

  return { message, payload }
}