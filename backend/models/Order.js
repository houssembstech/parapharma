import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: [true, "Product ID is required"] 
  },
  name: { 
    type: String, 
    required: [true, "Product name is required"] 
  },
  price: { 
    type: Number, 
    required: [true, "Price is required"],
    min: 0
  },
  quantity: { 
    type: Number, 
    required: [true, "Quantity is required"], 
    default: 1,
    min: 1
  },
  itemTotal: {
    type: Number,
    required: [true, "Item total is required"],
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "User is required"] 
  },
  orderNumber: { 
    type: String, 
    unique: true, 
    default: function() {
      return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    } 
  },
  items: {
    type: [orderItemSchema],
    required: [true, "Order items are required"],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: "Order must have at least one item"
    }
  },
  shippingAddress: { 
    type: {
      address: { type: String, required: [true, "Address is required"] },
      city: { type: String, required: [true, "City is required"] },
      postalCode: { type: String, required: [true, "Postal code is required"] },
      country: { type: String, required: [true, "Country is required"] },
      phone: String
    },
    required: [true, "Shipping address is required"]
  },
  paymentMethod: { 
    type: String, 
    enum: ["COD", "stripe", "paypal", "dinar", "konnect"], 
    default: "stripe" 
  },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed", "refunded"], 
    default: "pending" 
  },
  
  // Price breakdown fields
  subtotal: { 
    type: Number, 
    required: [true, "Subtotal is required"],
    min: 0 
  },
  taxAmount: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  shippingFee: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalTotal: { 
    type: Number, 
    required: [true, "Final total is required"],
    min: 0 
  },
  
  // Keep total for backward compatibility
  total: { 
    type: Number, 
    required: [true, "Total is required"],
    min: 0 
  },

  status: { 
    type: String, 
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"], 
    default: "pending" 
  },

  // FIXED: appliedPromotion structure - code as string, not array
  appliedPromotion: {
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    promotionName: String,
    discountType: String,
    discountValue: Number
  },

  // Payment fields
  stripePaymentIntentId: String,
  konnectPaymentId: String,
  konnectPayUrl: String,
  transactionId: String,
  paymentDetails: { type: mongoose.Schema.Types.Mixed, default: null },
  
  // Timestamp fields
  paidAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date
}, { 
  timestamps: true 
});

// Virtual for calculating final total
orderSchema.virtual('calculatedFinalTotal').get(function() {
  return this.subtotal + this.taxAmount + this.shippingFee - this.discountAmount;
});

// Pre-save middleware to ensure calculated fields are consistent
orderSchema.pre('save', function(next) {
  // Ensure finalTotal is calculated correctly
  if (this.isModified(['subtotal', 'taxAmount', 'shippingFee', 'discountAmount'])) {
    this.finalTotal = this.subtotal + this.taxAmount + this.shippingFee - this.discountAmount;
    this.total = this.finalTotal; // Keep total synchronized
  }
  
  // Update timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'shipped':
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case 'delivered':
        if (!this.deliveredAt) this.deliveredAt = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }

  // Update paidAt timestamp when payment status changes to paid
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  
  next();
});

// Automatically update status when payment is confirmed and decrement stock
orderSchema.pre('save', async function(next) {
  try {
    // If payment status changed to paid and was not paid before
    if (this.paymentStatus === 'paid' && this.isModified('paymentStatus')) {
      this.status = 'confirmed';
      this.paidAt = new Date();
      
      // Decrement stock for all items in the order
      const Product = mongoose.model('Product');
      const Stock = mongoose.model('Stock');
      
      for (const item of this.items) {
        // Update product stock
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
        
        // Update separate stock collection if exists
        try {
          await Stock.findOneAndUpdate(
            { product: item.product },
            { $inc: { quantity: -item.quantity } }
          );
        } catch (stockError) {
          console.log('Stock collection not found or error updating stock:', stockError);
        }
      }
      
      console.log(`Stock decremented for order ${this._id}`);
      
      // Update promotion usage count if promotion was applied
      if (this.appliedPromotion && this.appliedPromotion.promotionId) {
        const Promotion = mongoose.model('Promotion');
        await Promotion.findByIdAndUpdate(
          this.appliedPromotion.promotionId,
          { $inc: { usedCount: 1 } }
        );
        console.log(`Promotion usage count updated for order ${this._id}`);
      }
    }
    
    // If order is cancelled and was paid, restore stock
    if (this.status === 'cancelled' && this.isModified('status') && this.paymentStatus === 'paid') {
      const Product = mongoose.model('Product');
      const Stock = mongoose.model('Stock');
      
      for (const item of this.items) {
        // Restore product stock
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
        
        // Restore separate stock collection if exists
        try {
          await Stock.findOneAndUpdate(
            { product: item.product },
            { $inc: { quantity: item.quantity } }
          );
        } catch (stockError) {
          console.log('Stock collection not found or error restoring stock:', stockError);
        }
      }
      
      console.log(`Stock restored for cancelled order ${this._id}`);
      
      // Decrement promotion usage count if promotion was applied
      if (this.appliedPromotion && this.appliedPromotion.promotionId) {
        const Promotion = mongoose.model('Promotion');
        await Promotion.findByIdAndUpdate(
          this.appliedPromotion.promotionId,
          { $inc: { usedCount: -1 } }
        );
        console.log(`Promotion usage count reverted for cancelled order ${this._id}`);
      }
    }
  } catch (error) {
    console.error('Error in order pre-save middleware:', error);
    // Don't stop the save process, just log the error
  }
  
  next();
});

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'confirmed'];
  return cancellableStatuses.includes(this.status) && this.paymentStatus !== 'paid';
};

// Instance method to get order summary
orderSchema.methods.getOrderSummary = function() {
  return {
    orderNumber: this.orderNumber,
    itemsCount: this.items.reduce((sum, item) => sum + item.quantity, 0),
    finalTotal: this.finalTotal,
    status: this.status,
    paymentStatus: this.paymentStatus,
    createdAt: this.createdAt
  };
};

// Static method to get orders by user
orderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId })
    .populate('items.product', 'name image')
    .populate('appliedPromotion.promotionId', 'code name discountType discountValue')
    .sort({ createdAt: -1 });
};

// Static method to get total sales
orderSchema.statics.getTotalSales = async function() {
  const result = await this.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$finalTotal' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$finalTotal' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { 
    totalSales: 0, 
    totalOrders: 0, 
    averageOrderValue: 0 
  };
};

// Static method to get sales by period
orderSchema.statics.getSalesByPeriod = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        status: { $ne: 'cancelled' },
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$finalTotal' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$finalTotal' }
      }
    }
  ]);
};

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'appliedPromotion.promotionId': 1 });

// Transform output to include virtuals and remove sensitive data
orderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Remove sensitive payment details from JSON output
    if (ret.paymentDetails && ret.paymentDetails.card) {
      delete ret.paymentDetails.card;
    }
    return ret;
  }
});

// Add query helpers
orderSchema.query.byStatus = function(status) {
  return this.where({ status });
};

orderSchema.query.byPaymentStatus = function(paymentStatus) {
  return this.where({ paymentStatus });
};

orderSchema.query.byUser = function(userId) {
  return this.where({ user: userId });
};

export default mongoose.model("Order", orderSchema);