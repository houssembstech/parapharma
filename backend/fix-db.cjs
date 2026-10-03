const mongoose = require('mongoose'); 

mongoose.connect('mongodb://localhost:27017/parapharmacie25').then(async () => {
  const db = mongoose.connection.db; 
  const col = db.collection('products'); 
  const products = await col.find({}).toArray(); 
  for(let p of products) { 
    if(p.images && p.images.length > 0 && (!p.mainImage || !p.images.includes(p.mainImage))) { 
      await col.updateOne({_id: p._id}, {$set: {mainImage: p.images[0]}}); 
      console.log('Fixed', p.name); 
    } 
  } 
  console.log('Done'); 
  process.exit(0); 
}).catch(err => {
  console.error(err);
  process.exit(1);
});
