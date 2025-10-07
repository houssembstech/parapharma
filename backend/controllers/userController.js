import User from '../models/User.js';
import asyncHandler from 'express-async-handler';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password'); // exclude password
  res.json({ users });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw new Error('Utilisateur non trouvé');
  res.json(user);
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new Error('Utilisateur non trouvé');

  const { name, email, phone, role, status } = req.body;

  user.name = name || user.name;
  user.email = email || user.email;
  user.phone = phone || user.phone;
  user.role = role || user.role;
  user.status = status || user.status;

  const updatedUser = await user.save();
  res.json(updatedUser);
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new Error('Utilisateur non trouvé');

  await user.remove();
  res.json({ message: 'Utilisateur supprimé' });
});
