const fs = require('fs');
const path = require('path');
const filePath = path.join('src','backend','controllers','SalesController.js');
let s = fs.readFileSync(filePath, 'utf8');

function replaceBlockByMarkers(s, markerStart, forLineMatch) {
  const idx = s.indexOf(markerStart);
  if (idx < 0) return s;
  const startFor = s.indexOf(forLineMatch, idx);
  if (startFor < 0) return s;
  const braceStart = s.indexOf('{', startFor);
  if (braceStart < 0) return s;
  let i = braceStart;
  let depth = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
    i++;
  }
  return { start: idx, end: i };
}

function removeMinPriceCreate() {
  const res = replaceBlockByMarkers(s, '// Validación de precio mínimo por producto', 'for (const item of computedItems)');
  if (res && typeof res.start === 'number') {
    s = s.slice(0, res.start) + '      // Validación de precio mínimo eliminada: artículos no tienen minPrice\n' + s.slice(res.end);
  }
}

function replaceValidationProductsToArticles() {
  const res = replaceBlockByMarkers(s, '// Validar productos', 'for (const item of items)');
  if (res && typeof res.start === 'number') {
    const newBlock = `// Validar artículos (soportando compatibilidad productId -> articleId)\n      for (const item of items) {\n        const refId = item.articleId ?? item.productId;\n        if (refId) {\n          const article = await prisma.article.findFirst({ where: { id: refId, companyId } });\n          if (!article) {\n            return res.status(404).json({ success: false, message: \`Artículo no encontrado: \${refId}\` });\n          }\n          // Si no hay descripción, usar la del artículo\n          if (!item.description) item.description = article.name;\n          // Normalizar ID para el resto del flujo\n          item.articleId = refId;\n        } else {\n          if (!item.description) {\n            return res.status(400).json({ success: false, message: "Descripción requerida cuando no hay articleId" });\n          }\n        }\n      }\n`;
    s = s.slice(0, res.start) + newBlock + s.slice(res.end);
  }
}

function replacePreparedItemsCreate() {
  s = s.replace(/preparedItems\s*\.\s*push\s*\(\s*\{([\s\S]*?)\}\s*\)/, (m) => {
    return m.replace(/productId\s*:\s*item\.productId\s*\|\|\s*null/, 'articleId: item.articleId ?? item.productId ?? null');
  });
}

function replaceItemsCreateMapping() {
  s = s.replace(/create:\s*computedItems\.map\s*\(\s*\(i\)\s*=>\s*\{([\s\S]*?)\}\s*\)/, (m) => {
    return m.replace(/productId\s*:\s*i\.productId\s*\|\|\s*null,/, 'articleId: i.articleId || null,');
  });
}

function replacePreparedItemsUpdate() {
  s = s.replace(/preparedItems\s*\.\s*push\s*\(\s*\{\s*productId\s*:\s*item\.productId\s*\|\|\s*null/, (m) => m.replace(/productId\s*:\s*item\.productId\s*\|\|\s*null/, 'articleId: item.articleId ?? item.productId ?? null'));
}

function removeMinPriceUpdate() {
  const idxPrepared = s.indexOf('if (preparedItems.length)');
  if (idxPrepared < 0) return;
  const idxFor = s.indexOf('for (const item of preparedItems)', idxPrepared);
  if (idxFor < 0) return;
  const braceStart = s.indexOf('{', idxFor);
  let i = braceStart;
  let depth = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
    i++;
  }
  // remove this for-loop entirely (minPrice check)
  s = s.slice(0, idxFor) + s.slice(i);
}

function replaceItemsUpdateCreateMapping() {
  s = s.replace(/salesOrderItem\s*\.\s*create\s*\(\s*\{\s*data\s*:\s*\{([\s\S]*?)\}\s*\}\s*\)/, (m) => {
    return m.replace(/productId\s*:\s*i\.productId\s*\|\|\s*null,/, 'articleId: i.articleId || null,');
  });
}

replaceValidationProductsToArticles();
removeMinPriceCreate();
replacePreparedItemsCreate();
replaceItemsCreateMapping();
replacePreparedItemsUpdate();
removeMinPriceUpdate();
replaceItemsUpdateCreateMapping();

fs.writeFileSync(filePath, s);
console.log('SalesController.js refactored to use articleId');
