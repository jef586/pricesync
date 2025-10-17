// UH-ART-3: Alias temporal DEPRECATED para Product → Article
// Reexporta tipos de Article y advierte en consola. Se puede desactivar con VITE_FEATURE_PRODUCTS_ALIAS=true

const viteEnv = (import.meta as any)?.env || {}
const aliasDisabled = String(viteEnv.VITE_FEATURE_PRODUCTS_ALIAS ?? 'false') === 'true'

if (aliasDisabled) {
  // Romper en tiempo de ejecución para detectar usos residuales cuando se active el flag
  // Nota: No es error de compilación de TS, pero evita su uso en runtime.
  // Para entorno que no sea Vite, import.meta.env puede no existir; este bloque será un no-op.
  // eslint-disable-next-line no-console
  console.error('[DEPRECATED] types/product.ts alias deshabilitado por VITE_FEATURE_PRODUCTS_ALIAS=true. Usar types/article.ts.')
  throw new Error('types/product.ts alias disabled by VITE_FEATURE_PRODUCTS_ALIAS')
}

// eslint-disable-next-line no-console
console.warn('[DEPRECATED] Importar desde types/product.ts está deprecado. Usar types/article.ts. Este alias será removido en la próxima versión.')

export * from './article'