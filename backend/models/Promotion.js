import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrder: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  // NOUVEAU: Suivi des utilisateurs qui ont utilisé ce code
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Ajouter un index pour les performances
promotionSchema.index({ 'usedBy.user': 1 });
promotionSchema.index({ code: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ isActive: 1 });

// Virtual pour vérifier si la promotion est valide
promotionSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Méthode pour vérifier si un utilisateur a déjà utilisé ce code
promotionSchema.methods.hasUserUsedCode = function(userId) {
  return this.usedBy.some(usage => usage.user.toString() === userId.toString());
};

// Méthode pour ajouter un utilisateur à la liste des utilisateurs
promotionSchema.methods.addUserUsage = function(userId) {
  if (!this.hasUserUsedCode(userId)) {
    this.usedBy.push({ user: userId });
    this.usedCount += 1;
    return true;
  }
  return false;
};

// Méthode pour appliquer la réduction
promotionSchema.methods.calculateDiscount = function(subtotal) {
  if (!this.isValid || subtotal < this.minimumOrder) {
    return 0;
  }

  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  // Appliquer la limite de réduction maximale si définie
  if (this.maximumDiscount && discount > this.maximumDiscount) {
    discount = this.maximumDiscount;
  }

  return Math.min(discount, subtotal); // La réduction ne peut pas dépasser le sous-total
};

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;