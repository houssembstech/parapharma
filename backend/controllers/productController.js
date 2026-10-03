import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

// @desc   Create product (admin)
// @route  POST /api/products
// @access Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    slug, 
    description, 
    shortDescription, 
    price, 
    stock, 
    category, 
    images,
    mainImage,
    sku,
    lowStockAlert 
  } = req.body;

  // Ensure category exists if provided
  if (category) {
    const cat = await Category.findById(category);
    if (!cat) {
      res.status(400);
      throw new Error("Invalid category");
    }
  }

  // Handle file uploads
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    imageUrls = req.files.map(file => file.path);
  } else if (images && images.length > 0) {
    imageUrls = Array.isArray(images) ? images : [images];
  }

  const product = await Product.create({ 
    name, 
    slug, 
    description, 
    shortDescription, 
    price, 
    stock: stock || 0,
    lowStockAlert: lowStockAlert || 10,
    sku,
    category, 
    images: imageUrls,
    mainImage: mainImage || (imageUrls.length > 0 ? imageUrls[0] : '')
  });
  
  res.status(201).json(product);
});

// @desc   Update product (admin)
// @route  PUT /api/products/:id
// @access Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const updates = req.body;

  // Handle file uploads
  if (req.files && req.files.length > 0) {
    const newImageUrls = req.files.map(file => file.path);
    const existingImages = updates.images ? (Array.isArray(updates.images) ? updates.images : [updates.images]) : product.images;
    updates.images = [...existingImages, ...newImageUrls];
  } else if (updates.images) {
    updates.images = Array.isArray(updates.images) ? updates.images : [updates.images];
  }

  // Ensure mainImage is valid and syncs with the first image if not explicitly provided
  if (!updates.mainImage && updates.images && updates.images.length > 0) {
    updates.mainImage = updates.images[0];
  } else if (!updates.images && product.images && product.images.length > 0 && !product.mainImage) {
    updates.mainImage = product.images[0];
  }

  Object.assign(product, updates);
  const updated = await product.save();
  
  res.json(updated);
});

// @desc   Delete product (admin)
// @route  DELETE /api/products/:id
// @access Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Soft delete by setting isActive to false
  product.isActive = false;
  await product.save();
  
  res.json({ message: "Product deactivated" });
});

// @desc   Get product by id
// @route  GET /api/products/:id
// @access Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name slug");
  
  if (product && product.isActive) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc   Get all products with search, filter, pagination
// @route  GET /api/products
// @access Public
export const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const search = req.query.search ? { name: { $regex: req.query.search, $options: "i" } } : {};
  const category = req.query.category ? { category: req.query.category } : {};
  const min = req.query.min ? { price: { $gte: Number(req.query.min) } } : {};
  const max = req.query.max ? { price: { $lte: Number(req.query.max) } } : {};
  const inStock = req.query.inStock === 'true' ? { stock: { $gt: 0 } } : {};

  // Only show active products
  const filter = { 
    isActive: true, 
    ...search, 
    ...category, 
    ...min, 
    ...max,
    ...inStock 
  };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category", "name slug")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

// @desc   Get related products
// @route  GET /api/products/:id/related
// @access Public
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Find products in the same category (excluding the current product)
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true
  }).limit(6);

  res.json({ products: related });
});

// @desc   Search products
// @route  GET /api/products/search
// @access Public
export const searchProducts = asyncHandler(async (req, res) => {
  const { q, limit = 5 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Le paramètre de recherche "q" est requis et doit contenir au moins 2 caractères'
    });
  }

  try {
    // Search in active products only
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    })
    .limit(parseInt(limit))
    .populate('category', 'name')
    .select('name description brand category price images stock')
    .lean();

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de produits',
      error: error.message
    });
  }
});

// @desc   Update product stock (admin)
// @route  PUT /api/products/:id/stock
// @access Private/Admin
export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock, operation } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let newStock = product.stock;
  
  switch (operation) {
    case 'add':
      newStock += Number(stock);
      break;
    case 'subtract':
      newStock = Math.max(0, product.stock - Number(stock));
      break;
    case 'set':
      newStock = Number(stock);
      break;
    default:
      res.status(400);
      throw new Error('Invalid operation. Use "add", "subtract", or "set"');
  }

  product.stock = newStock;
  await product.save();

  res.json({
    message: 'Stock updated successfully',
    product: {
      id: product._id,
      name: product.name,
      stock: product.stock,
      stockStatus: product.stockStatus
    }
  });
});

// @desc   Get low stock products (admin)
// @route  GET /api/products/admin/low-stock
// @access Private/Admin
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  
  // Find products where stock is less than or equal to lowStockAlert
  const lowStockProducts = await Product.find({
    stock: { $lte: '$lowStockAlert' },
    isActive: true
  })
  .populate('category', 'name')
  .sort({ stock: 1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);

  const total = await Product.countDocuments({
    stock: { $lte: '$lowStockAlert' },
    isActive: true
  });

  res.json({
    products: lowStockProducts,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  });
});

// @desc   Check product availability
// @route  POST /api/products/check-availability
// @access Public
export const checkAvailability = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const available = product.stock >= quantity;
  const availableStock = product.stock;

  res.json({
    available,
    availableStock,
    requestedQuantity: quantity,
    canFulfill: availableStock >= quantity,
    stockStatus: product.stockStatus
  });
});

// @desc   Get products by stock status (for admin dashboard)
// @route  GET /api/products/admin/stock-status
// @access Private/Admin
export const getProductsByStockStatus = asyncHandler(async (req, res) => {
  const outOfStock = await Product.countDocuments({ 
    stock: 0, 
    isActive: true 
  });
  
  const lowStock = await Product.countDocuments({ 
    stock: { $gt: 0, $lte: 10 }, // Assuming lowStockAlert default is 10
    isActive: true 
  });
  
  const inStock = await Product.countDocuments({ 
    stock: { $gt: 10 }, 
    isActive: true 
  });

  res.json({
    outOfStock,
    lowStock,
    inStock,
    total: outOfStock + lowStock + inStock
  });
});