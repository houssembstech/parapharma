import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  searchCategories
} from '../controllers/categoryController.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .put(updateCategory)
  .delete(deleteCategory);

router.get('/search', searchCategories);

export default router;
