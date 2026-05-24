const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const Parser = acorn.Parser.extend(jsx());

const content = fs.readFileSync('frontend/src/pages/Markets.jsx', 'utf8');
try {
  Parser.parse(content, { sourceType: 'module', ecmaVersion: 2020 });
  console.log('Success');
} catch (e) {
  console.log('Error at line:', e.loc?.line, 'col:', e.loc?.column);
  console.log(e.message);
}
