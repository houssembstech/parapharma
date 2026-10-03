const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Fix the double nested template literal bug
  content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| \"\$\{import\.meta\.env\.VITE_API_URL \|\| \"http:\/\/localhost:5000\/api\"\}\"\}/g, 
    "${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

function traverseDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  });
}

traverseDir('./src');
console.log('Fix complete.');
