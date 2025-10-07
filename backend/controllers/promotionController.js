import Promotion from '../models/Promotion.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// ✅ PUBLIC: Get active promotions
export const getActivePromotions = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    })
    .select('-internalNotes -createdBy -updatedBy')
    .populate('applicableProducts', 'name image price')
    .populate('applicableCategories', 'name')
    .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      data: promotions,
      count: promotions.length,
      message: 'Active promotions retrieved successfully'
    });
  } catch (error) {
    console.error('Get active promotions error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Error fetching active promotions" 
    });
  }
};

// ✅ PUBLIC: Validate promotion code
export const validatePromotion = async (req, res) => {
  try {
    const { code, userId, cartItems, totalAmount } = req.body;

    // Vérifier que l'utilisateur est fourni
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required to validate promotion" 
      });
    }

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    })
    .populate('applicableProducts', 'name category price')
    .populate('applicableCategories', 'name');

    if (!promotion) {
      return res.status(404).json({ 
        success: false, 
        error: "Code promotion invalide ou expiré" 
      });
    }

    // ✅ VÉRIFICATION: L'utilisateur a-t-il déjà utilisé ce code?
    if (promotion.hasUserUsedCode && promotion.hasUserUsedCode(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Vous avez déjà utilisé ce code promotion. Un seul usage autorisé par utilisateur." 
      });
    }

    // Vérifier la limite d'utilisation globale
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      return res.status(400).json({ 
        success: false, 
        error: "Ce code promotion a atteint sa limite d'utilisation maximale" 
      });
    }

    // Vérifier le montant minimum de commande
    if (totalAmount < promotion.minimumOrder) {
      return res.status(400).json({ 
        success: false, 
        error: `Montant minimum de commande requis: ${promotion.minimumOrder} DT` 
      });
    }

    // Vérifier si la promotion s'applique aux articles du panier
    if (promotion.applicableProducts.length > 0 || promotion.applicableCategories.length > 0) {
      const applicable = await isPromotionApplicable(promotion, cartItems);
      if (!applicable) {
        return res.status(400).json({ 
          success: false, 
          error: "Ce code promotion n'est pas applicable aux articles de votre panier" 
        });
      }
    }

    // Calculer le montant de la réduction
    const discountAmount = promotion.calculateDiscount ? 
      promotion.calculateDiscount(totalAmount) : 
      calculateDiscountAmount(promotion, totalAmount);

    res.json({
      success: true,
      data: {
        promotion: {
          _id: promotion._id,
          code: promotion.code,
          description: promotion.description,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          minimumOrder: promotion.minimumOrder,
          startDate: promotion.startDate,
          endDate: promotion.endDate,
          usageLimit: promotion.usageLimit,
          usedCount: promotion.usedCount,
          applicableProducts: promotion.applicableProducts,
          applicableCategories: promotion.applicableCategories
        },
        discountAmount,
        finalAmount: totalAmount - discountAmount
      },
      message: 'Promotion code validated successfully'
    });

  } catch (error) {
    console.error('Promotion validation error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Erreur lors de la validation du code promotion" 
    });
  }
};

// ✅ ADMIN: Create new promotion
export const createPromotion = async (req, res) => {
  try {
    const promotion = new Promotion({
      ...req.body,
      createdBy: req.user._id
    });
    await promotion.save();
    
    // Populate for response
    await promotion.populate('applicableProducts', 'name');
    await promotion.populate('applicableCategories', 'name');
    
    res.status(201).json({ 
      success: true, 
      data: promotion,
      message: 'Promotion created successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ✅ ADMIN: Get all promotions
export const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name')
      .populate('usedBy.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
      
    res.json({ 
      success: true, 
      data: promotions,
      count: promotions.length,
      message: 'All promotions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ✅ ADMIN: Update promotion
export const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    )
    .populate('applicableProducts', 'name')
    .populate('applicableCategories', 'name')
    .populate('createdBy', 'name email');
    
    if (!promotion) {
      return res.status(404).json({ 
        success: false, 
        error: 'Promotion not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: promotion,
      message: 'Promotion updated successfully'
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ✅ ADMIN: Delete promotion
export const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({ 
        success: false, 
        error: 'Promotion not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Promotion deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ✅ PUBLIC: Check if user has used a promotion
export const checkPromotionUsage = async (req, res) => {
  try {
    const { code, userId } = req.params;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase()
    });

    if (!promotion) {
      return res.status(404).json({ 
        success: false, 
        error: "Promotion not found" 
      });
    }

    const hasUsed = promotion.hasUserUsedCode ? 
      promotion.hasUserUsedCode(userId) : 
      hasUserUsedPromotion(promotion, userId);

    res.json({
      success: true,
      data: {
        promotion: {
          code: promotion.code,
          description: promotion.description,
          isValid: promotion.isActive && 
                   new Date() >= promotion.startDate && 
                   new Date() <= promotion.endDate
        },
        hasUsed,
        usageCount: promotion.usedCount,
        usageLimit: promotion.usageLimit
      },
      message: 'Promotion usage checked successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// ✅ PUBLIC: Get promotion statistics
export const getPromotionStats = async (req, res) => {
  try {
    const totalPromotions = await Promotion.countDocuments();
    const activePromotions = await Promotion.countDocuments({
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    const expiredPromotions = await Promotion.countDocuments({
      endDate: { $lt: new Date() }
    });
    
    // Get most used promotion
    const mostUsedPromotion = await Promotion.findOne()
      .sort({ usedCount: -1 })
      .select('code description usedCount');
    
    // Get total discount given
    const ordersWithPromotions = await Order.find({ 
      promotionCode: { $exists: true, $ne: null } 
    });
    
    const totalDiscountGiven = ordersWithPromotions.reduce((total, order) => {
      return total + (order.discountAmount || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        totalPromotions,
        activePromotions,
        expiredPromotions,
        mostUsedPromotion,
        totalDiscountGiven,
        usageRate: totalPromotions > 0 ? (activePromotions / totalPromotions) * 100 : 0
      },
      message: 'Promotion statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Promotion stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Error fetching promotion statistics" 
    });
  }
};

// Helper function to check if promotion applies to cart items
const isPromotionApplicable = async (promotion, cartItems) => {
  if (!cartItems || cartItems.length === 0) return false;
  
  const productIds = cartItems.map(item => item.product?.toString() || item.productId?.toString());
  
  // Check if any cart item is in applicable products
  if (promotion.applicableProducts && promotion.applicableProducts.length > 0) {
    const applicableProducts = promotion.applicableProducts.map(id => id.toString());
    const hasApplicableProduct = productIds.some(id => applicableProducts.includes(id));
    if (hasApplicableProduct) return true;
  }

  // Check if any cart item belongs to applicable categories
  if (promotion.applicableCategories && promotion.applicableCategories.length > 0) {
    const products = await Product.find({ _id: { $in: productIds } });
    const hasApplicableCategory = products.some(product => 
      promotion.applicableCategories.some(catId => 
        product.category && product.category.toString() === catId.toString()
      )
    );
    if (hasApplicableCategory) return true;
  }

  // If no specific products or categories are specified, promotion applies to all
  return promotion.applicableProducts.length === 0 && promotion.applicableCategories.length === 0;
};

// Fallback discount calculation
const calculateDiscountAmount = (promotion, totalAmount) => {
  switch (promotion.discountType) {
    case 'percentage':
      return (totalAmount * promotion.discountValue) / 100;
    case 'fixed':
      return Math.min(promotion.discountValue, totalAmount);
    case 'shipping':
      return promotion.discountValue; // Usually 0 for free shipping
    default:
      return 0;
  }
};

// Fallback user usage check
const hasUserUsedPromotion = (promotion, userId) => {
  if (!promotion.usedBy || !Array.isArray(promotion.usedBy)) return false;
  return promotion.usedBy.some(usage => 
    usage.user && usage.user.toString() === userId.toString()
  );
};