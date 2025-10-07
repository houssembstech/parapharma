import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
  createStock,
  getAllStock,
  updateStock,
  getLowStock,
  updateStockByProductId, // Add this new function
} from '../controllers/stockController.js';
import {
  getLowStockProducts,
  checkAvailability,
  getProductsByStockStatus,
} from '../controllers/productController.js';

const router = express.Router();

/**
 * STOCK ROUTES
 */

// Create stock for a product
router.post('/products/admin/stock', protect, admin, createStock);

// Get all stock
router.get('/products/admin/stock', protect, admin, getAllStock);

// Update stock quantity by stock ID (using stock document ID)
router.put('/products/:id/stock', protect, admin, updateStock);

// Update stock quantity by product ID (NEW ROUTE - Pattern 1)
router.put('/products/:productId/stock-quantity', protect, admin, updateStockByProductId);

// Get products with low stock
router.get('/products/admin/low-stock', protect, admin, getLowStock);

// Get products by stock status
router.get('/products/admin/stock-status', protect, admin, getProductsByStockStatus);

// Check availability for a list of products
router.post('/products/check-availability', checkAvailability);

export default router;