import mongoose from 'mongoose';

const stockSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5, // alert if stock below this number
    },
    reserved: {
      type: Number,
      default: 0, // quantity reserved for pending orders
    }
  },
  { timestamps: true }
);

// Virtual for available stock (quantity - reserved)
stockSchema.virtual('available').get(function() {
  return Math.max(0, this.quantity - this.reserved);
});

// Ensure virtuals are serialized
stockSchema.set('toJSON', { virtuals: true });

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;