const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'frontend/src');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Rimuovi classi tipo border, border-white/10, border-gray-700, ring-1, ring-white/10
  // La regex deve matchare:
  // - "border" standalone
  // - "border-xxx"
  // - "ring-xxx"
  // e rimuovere lo spazio extra
  
  // Cerchiamo le sequenze className="..." o template string className={`...`}
  
  const classRegex = /\bborder(?:-[a-z0-9/]+(?:-[0-9]+)?)?\b|\bring(?:-[a-z0-9/]+(?:-[0-9]+)?)?\b/g;
  
  content = content.replace(classRegex, '');
  
  // Pulizia spazi extra generati (doppi spazi o spazi prima delle chiusure)
  content = content.replace(/ +(?= )/g, ''); 
  content = content.replace(/ "/g, '"');
  content = content.replace(/" /g, '"');
  content = content.replace(/ `/g, '`');
  content = content.replace(/` /g, '`');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Processed:', filePath);
  }
}

processDirectory(targetDir);
console.log('Done!');
