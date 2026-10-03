const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Replace direct string literals
  content = content.replace(/\"http:\/\/localhost:5000\/api(.*?)\"/g, '\`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}$1\`');
  content = content.replace(/\'http:\/\/localhost:5000\/api(.*?)\'/g, '\`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}$1\`');
  
  // Replace inside existing template literals
  content = content.replace(/http:\/\/localhost:5000\/api/g, '${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}');
  
  // Fix the image helper which just uses the base url
  if (filePath.includes('imageHelper.js')) {
    content = content.replace(/const baseUrl = \'http:\/\/localhost:5000\';/, "const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';");
  }

  // Fix ChatContext API_URL
  if (filePath.includes('ChatContext.jsx')) {
    content = content.replace(/import.meta.env.VITE_API_URL \|\| \"http:\/\/localhost:5000\"/, "import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'");
  }

  // Double check if I missed api.js replacements which already has it right
  if (filePath.includes('api.js') || filePath.includes('App.jsx') || filePath.includes('fix-urls.js')) {
     // skip if unnecessary, wait api.js line 4 is fine.
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
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
console.log('Replacement complete.');
