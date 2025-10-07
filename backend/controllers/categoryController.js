// controllers/categoryController.js
import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
import mongoose from "mongoose";
import slugify from "slugify";

// Centralized error handling
const handleValidationError = (error, res) => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({ message: messages.join(", ") });
  }
  if (error.code === 11000) {
    return res.status(400).json({ message: "Duplicate category name" });
  }
  return res.status(500).json({ message: "Server error", error: error.message });
};

// @desc   Get all categories (with search + pagination)
// @route  GET /api/categories
// @access Public
export const getCategories = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    const searchQuery = req.query.search
      ? { name: { $regex: req.query.search, $options: "i" }, isActive: true }
      : { isActive: true };

    const categories = await Category.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
      .lean();

    const totalCategories = await Category.countDocuments(searchQuery);

    res.json({
      categories,
      currentPage: page,
      totalPages: Math.ceil(totalCategories / limit),
      totalCategories,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

// @desc   Create category
// @route  POST /api/categories
// @access Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Category name must be at least 2 characters long" });
    }

    const normalizedName = name.trim();
    const slug = slugify(normalizedName, { lower: true, strict: true });

    const categoryExists = await Category.findOne({
      slug: slug,
    });

    if (categoryExists) {
      return res.status(400).json({
        message: "A category with this name already exists",
      });
    }

    const category = await Category.create({
      name: normalizedName,
      slug,
      description: description ? description.trim() : "",
    });

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

// @desc   Update category
// @route  PUT /api/categories/:id
// @access Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) {
      if (name.trim().length < 2) {
        return res
          .status(400)
          .json({ message: "Category name must be at least 2 characters long" });
      }

      const normalizedName = name.trim();
      const slug = slugify(normalizedName, { lower: true, strict: true });

      const existingCategory = await Category.findOne({
        slug,
        _id: { $ne: category._id },
      });

      if (existingCategory) {
        return res.status(400).json({
          message: "A category with this name already exists",
        });
      }

      category.name = normalizedName;
      category.slug = slug;
    }

    category.description = description
      ? description.trim()
      : category.description;

    const updatedCategory = await category.save();

    res.json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

// @desc   Delete category (soft delete)
// @route  DELETE /api/categories/:id
// @access Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isActive = false;
    await category.save();

    res.json({
      message: "Category deactivated successfully",
      deletedCategory: category,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

// @desc   Search categories (autocomplete)
// @route  GET /api/categories/search?query=...
// @access Public
export const searchCategories = asyncHandler(async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const categories = await Category.find({
      name: { $regex: query, $options: "i" },
      isActive: true,
    })
      .limit(10)
      .lean();

    res.json(categories);
  } catch (error) {
    handleValidationError(error, res);
  }
});
