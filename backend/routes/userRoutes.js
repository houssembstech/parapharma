import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js'; // Correct import

const router = express.Router();

// Protect all routes: user must be logged in AND admin
router.use(protect);
router.use(admin);

// Get all users
router.get('/', getUsers);

// Get single user by ID
router.get('/:id', getUser);

// Update user by ID
router.put('/:id', updateUser);

// Delete user by ID
router.delete('/:id', deleteUser);

export default router;
