import express from 'express';
import {
  getDashboardStats,
  getDashboardOverview,
  getPromotionStats,
  getRecentOrders, // Add this import
} from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, getDashboardStats);
router.get('/overview', protect, admin, getDashboardOverview);
router.get('/promotion-stats', protect, admin, getPromotionStats);
router.get('/recent-orders', protect, admin, getRecentOrders); // Add this route

export default router;