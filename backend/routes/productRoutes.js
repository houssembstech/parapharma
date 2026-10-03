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
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary using .env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for Cloudinary uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'parapharmacie25/products', // Cloudinary folder name
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  },
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