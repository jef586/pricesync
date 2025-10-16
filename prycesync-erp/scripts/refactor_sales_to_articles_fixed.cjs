const fs = require('fs');
const path = require('path');
const filePath = path.join('src','backend','controllers','SalesController.js');
let s = fs.readFileSync(filePath, 'utf8');

function blockByMarkers(content, markerStart, forLine) {
  const idx = content.indexOf(markerStart);
  if (idx < 0) return null;
  const startFor = content.indexOf(forLine, idx);
  if (startFor < 0) return null;
  const braceStart = content.indexOf('{', startFor);
  if (braceStart < 0) return null;
  let i = braceStart;
  let depth = 0;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
    i++;
  }
  return { start: idx, end: i };
}

try {
  // Replace validation block
  const b1 = blockByMarkers(s, '// Validar productos', 'for (const item of items)');
  if (b1) {
    const newBlock =
'// Validar artículos (soportando compatibilidad productId -> articleId)\n' +
'      for (const item of items) {\n' +
'        const refId = item.articleId ?? item.productId;\n' +
'        if (refId) {\n' +
'          const article = await prisma.article.findFirst({ where: { id: refId, companyId } });\n' +
'          if (!article) {\n' +
'            return res.status(404).json({ success: false, message: "Artículo no encontrado: " + refId });\n' +
'          }\n' +
'          if (!item.description) item.description = article.name;\n' +
'          item.articleId = refId;\n' +
'        } else {\n' +
'          if (!item.description) {\n' +
'            return res.status(400).json({ success: false, message: "Descripción requerida cuando no hay articleId" });\n' +
'          }\n' +
'        }\n' +
'      }\n';
    s = s.slice(0, b1.start) + newBlock + s.slice(b1.end);
  }

  // Remove minPrice check in create
  const b2 = blockByMarkers(s, '// Validación de precio mínimo por producto', 'for (const item of computedItems)');
  if (b2) {
    s = s.slice(0, b2.start) + '      // Validación de precio mínimo eliminada: artículos no tienen minPrice\n' + s.slice(b2.end);
  }

  // Update preparedItems push (create and update)
  s = s.replace(/productId\s*:\s*item\.productId\s*\|\|\s*null/g, 'articleId: item.articleId ?? item.productId ?? null');

  // Update items create mapping (create and update)
  s = s.replace(/productId\s*:\s*i\.productId\s*\|\|\s*null,/g, 'articleId: i.articleId || null,');

  // Remove minPrice check loop in update
  const idxPrepared = s.indexOf('if (preparedItems.length)');
  if (idxPrepared >= 0) {
    const idxFor = s.indexOf('for (const item of preparedItems)', idxPrepared);
    if (idxFor >= 0) {
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
      s = s.slice(0, idxFor) + s.slice(i);
    }
  }

  fs.writeFileSync(filePath, s);
  console.log('Refactor applied successfully');
} catch (e) {
  console.error('Refactor error:', e);
  process.exit(1);
}
