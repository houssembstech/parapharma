import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  searchProducts,
  updateStock,
  getLowStockProducts,
  checkAvailability,
  getProductsByStockStatus
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// Public routes
router.route('/')
  .get(getProducts);

router.get('/search', searchProducts);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router.post('/check-availability', checkAvailability);

// Protected admin routes with image upload
router.route('/')
  .post(protect, admin, upload.array('images', 10), createProduct);

router.route('/:id')
  .put(protect, admin, upload.array('images', 10), updateProduct)
  .delete(protect, admin, deleteProduct);

router.put('/:id/stock', protect, admin, updateStock);
router.get('/admin/low-stock', protect, admin, getLowStockProducts);
router.get('/admin/stock-status', protect, admin, getProductsByStockStatus);

export default router;