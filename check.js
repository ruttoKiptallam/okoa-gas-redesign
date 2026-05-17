const fs = require('fs');
const c = fs.readFileSync('C:/Users/user/okoa-gas-redesign/frontend/src/App.js', 'utf8');
let depth = 0;
let inTemplate = false;
let inJSX = false;
c.split('\n').forEach((l, i) => {
  let j = 0;
  while (j < l.length) {
    const ch = l[j];
    if (ch === '`') inTemplate = !inTemplate;
    if (!inTemplate) {
      if (ch === '{' && l[j-1] !== ':') depth++;
      if (ch === '}') depth--;
    }
    j++;
  }
  if (i >= 818 && i <= 835) {
    console.log((i + 1) + ': depth=' + depth + ' ' + l.substring(0, 80));
  }
});