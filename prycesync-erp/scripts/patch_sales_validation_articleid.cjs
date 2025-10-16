const fs = require('fs');
const path = require('path');
const filePath = path.join('src','backend','middleware','salesValidation.js');
let s = fs.readFileSync(filePath, 'utf8');

// Add articleId optional to SaleItemSchema, preserve productId
s = s.replace(
  /const\s+SaleItemSchema\s*=\s*z\.object\(\{([\s\S]*?)\}\)\.refine\(/,
  (m, inner) => {
    // Insert articleId after productId
    let updated = inner.replace(/productId:\s*z\.string\(\)\.cuid\(\)\.optional\(\),?/, match => match + '\n  articleId: z.string().cuid().optional(),');
    return m.replace(inner, updated);
  }
);

fs.writeFileSync(filePath, s);
console.log('salesValidation.js updated to accept articleId');
