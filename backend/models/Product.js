import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  description: { 
    type: String 
  },
  shortDescription: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  stock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  lowStockAlert: {
    type: Number,
    default: 10
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category" 
  },
  // Enhanced to support multiple images
  images: [{ 
    type: String 
  }],
  mainImage: {
    type: String
  },
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.lowStockAlert) return 'low-stock';
  return 'in-stock';
});

// Index for better performance
productSchema.index({ stock: 1 });
productSchema.index({ category: 1, stock: 1 });
productSchema.index({ sku: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;