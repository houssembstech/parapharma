import asyncHandler from 'express-async-handler';
import Stock from '../models/Stock.js';
import Product from '../models/Product.js';

// @desc    Create stock for a product
// @route   POST /api/stock
// @access  Private/Admin
export const createStock = asyncHandler(async (req, res) => {
  const { productId, quantity, lowStockThreshold } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const stockExists = await Stock.findOne({ product: productId });
  if (stockExists) {
    res.status(400);
    throw new Error('Stock already exists for this product');
  }

  const stock = await Stock.create({
    product: productId,
    quantity,
    lowStockThreshold,
  });

  res.status(201).json(stock);
});

// @desc    Get stock for all products
// @route   GET /api/stock
// @access  Private/Admin
export const getAllStock = asyncHandler(async (req, res) => {
  const stocks = await Stock.find().populate('product', 'name price');
  res.json(stocks);
});

// @desc    Update stock quantity by stock ID
// @route   PUT /api/stock/:id
// @access  Private/Admin
export const updateStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const stock = await Stock.findById(req.params.id);

  if (!stock) {
    res.status(404);
    throw new Error('Stock not found');
  }

  stock.quantity = quantity;
  await stock.save();

  res.json(stock);
});

// @desc    Update stock quantity by product ID (NEW FUNCTION)
// @route   PUT /api/products/:productId/stock-quantity
// @access  Private/Admin
export const updateStockByProductId = asyncHandler(async (req, res) => {
  const { stock } = req.body; // Expecting { stock: newStockValue }
  const { productId } = req.params;

  // Find the product first
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Find or create stock record for this product
  let stockRecord = await Stock.findOne({ product: productId });
  
  if (!stockRecord) {
    // Create stock record if it doesn't exist
    stockRecord = await Stock.create({
      product: productId,
      quantity: stock,
      lowStockThreshold: product.lowStockAlert || 10,
    });
  } else {
    // Update existing stock record
    stockRecord.quantity = stock;
    await stockRecord.save();
  }

  // Also update the product's stock field for quick access
  product.stock = stock;
  await product.save();

  res.json({
    success: true,
    product: {
      _id: product._id,
      name: product.name,
      stock: product.stock,
    },
    stock: stockRecord
  });
});

// @desc    Get low stock products
// @route   GET /api/stock/low
// @access  Private/Admin
export const getLowStock = asyncHandler(async (req, res) => {
  const lowStocks = await Stock.find({ 
    $expr: { $lt: ['$quantity', '$lowStockThreshold'] } 
  }).populate('product', 'name price images category lowStockAlert');
  
  res.json(lowStocks);
});

// @desc    Get stock by product ID
// @route   GET /api/stock/product/:productId
// @access  Private/Admin
export const getStockByProductId = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const stock = await Stock.findOne({ product: productId })
    .populate('product', 'name price images category');
    
  if (!stock) {
    res.status(404);
    throw new Error('Stock not found for this product');
  }

  res.json(stock);
});