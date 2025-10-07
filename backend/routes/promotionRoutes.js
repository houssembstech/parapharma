import express from 'express';
import {
  createPromotion,
  getAllPromotions,
  getActivePromotions,
  validatePromotion,
  updatePromotion,
  deletePromotion
} from '../controllers/promotionController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ✅ PUBLIC ROUTES - No authentication required
router.get('/public/active', getActivePromotions);
router.post('/public/validate', validatePromotion);

// ✅ ADMIN ROUTES - Require admin authentication
router.route('/')
  .post(protect, admin, createPromotion)
  .get(protect, admin, getAllPromotions);

router.route('/:id')
  .put(protect, admin, updatePromotion)
  .delete(protect, admin, deletePromotion);

export default router;