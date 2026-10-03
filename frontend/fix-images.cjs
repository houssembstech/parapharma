const fs = require('fs');
const files = [
  'src/utils/imageHelper.js',
  'src/pages/ProductDetail.jsx',
  'src/pages/CategoryDetail.jsx',
  'src/pages/Categories.jsx',
  'src/pages/Admin/ProductManagement.jsx',
  'src/pages/Admin/ProductForm.jsx',
  'src/components/Products/ProductCard.jsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/https:\/\/placehold\.co\/[\s\S]*?\=Image/g, 'https://placehold.co/400x400?text=Image'); 
  fs.writeFileSync(f, content);
  console.log(`Updated ${f}`);
});
