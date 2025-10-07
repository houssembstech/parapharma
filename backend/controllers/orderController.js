import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Stock from "../models/Stock.js";
import Promotion from "../models/Promotion.js";

// @desc   Create order
// @route  POST /api/orders
// @access Private
export const createOrder = asyncHandler(async (req, res) => {
  console.log('📥 Received order creation request');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  const { items, shippingAddress, paymentMethod, taxAmount = 0, shippingFee = 0, discountAmount = 0, promotionCode } = req.body;

  // Get promotion by code if provided
  let promotion = null;
  if (promotionCode && promotionCode.trim() !== '') {
    promotion = await Promotion.findOne({ 
      code: promotionCode.toUpperCase().trim(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    if (!promotion) {
      console.log(`❌ Promotion not found or inactive: ${promotionCode}`);
      res.status(400);
      throw new Error(`Code promotion "${promotionCode}" est invalide ou expiré`);
    }
    
    // ✅ VÉRIFICATION: L'utilisateur a-t-il déjà utilisé ce code?
    if (promotion.hasUserUsedCode(req.user._id)) {
      res.status(400);
      throw new Error(`Vous avez déjà utilisé le code promotion "${promotionCode}". Un seul usage autorisé par utilisateur.`);
    }
    
    // Check usage limit
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      console.log(`❌ Promotion usage limit reached: ${promotionCode}`);
      res.status(400);
      throw new Error(`Code promotion "${promotionCode}" a atteint sa limite d'utilisation`);
    }
    
    console.log(`✅ Promotion found: ${promotion.code} (${promotion._id})`);
  }

  // Enhanced validation with detailed error messages
  if (!items || items.length === 0) {
    console.log('❌ No order items provided');
    res.status(400);
    throw new Error("Aucun article dans la commande");
  }

  // Validate required fields
  const requiredFields = {
    shippingAddress: "Adresse de livraison",
    subtotal: "Sous-total",
    finalTotal: "Total final"
  };

  for (const [field, message] of Object.entries(requiredFields)) {
    if (!req.body[field] && req.body[field] !== 0) {
      res.status(400);
      throw new Error(`${message} est requis`);
    }
  }

  // Validate shipping address fields
  const addressFields = {
    address: 'Adresse',
    city: 'Ville', 
    postalCode: 'Code postal',
    country: 'Pays'
  };

  for (const [field, message] of Object.entries(addressFields)) {
    if (!shippingAddress?.[field]) {
      res.status(400);
      throw new Error(`Adresse de livraison: ${message} est requis`);
    }
  }

  // Log each item for debugging
  console.log('🔍 Items received:', items.length);
  items.forEach((item, index) => {
    console.log(`   Item ${index}:`, {
      product: item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      itemTotal: item.itemTotal
    });

    // Validate each item
    const itemFields = {
      product: 'ID du produit',
      name: 'nom du produit', 
      price: 'prix',
      quantity: 'quantité',
      itemTotal: 'total de l\'article'
    };

    for (const [field, message] of Object.entries(itemFields)) {
      if (!item[field] && item[field] !== 0) {
        res.status(400);
        throw new Error(`Article ${index + 1}: ${message} est requis`);
      }
    }
  });

  console.log('🏠 Shipping address:', shippingAddress);
  console.log('💰 Financials:', {
    subtotal: req.body.subtotal,
    finalTotal: req.body.finalTotal,
    shippingFee,
    discountAmount,
    taxAmount
  });

  try {
    // Check product existence and stock availability
    let calculatedSubtotal = 0;
    const enrichedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.log(`❌ Product not found: ${item.product}`);
        res.status(400);
        throw new Error(`Produit non trouvé: ${item.product}`);
      }
      
      // Check stock availability
      if (product.stock < item.quantity) {
        console.log(`❌ Insufficient stock for ${product.name}: Available ${product.stock}, Requested ${item.quantity}`);
        res.status(400);
        throw new Error(
          `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}, Demandé: ${item.quantity}`
        );
      }

      // Use provided item total or calculate it
      const itemTotal = item.itemTotal || (product.price * item.quantity);
      enrichedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        itemTotal: itemTotal
      });
      calculatedSubtotal += itemTotal;
    }

    // Use provided totals or calculate them
    const finalTotal = req.body.finalTotal || (calculatedSubtotal + taxAmount + shippingFee - discountAmount);
    const subtotal = req.body.subtotal || calculatedSubtotal;

    console.log('✅ Calculated totals:', {
      calculatedSubtotal,
      providedSubtotal: req.body.subtotal,
      calculatedFinalTotal: finalTotal,
      providedFinalTotal: req.body.finalTotal
    });

    // Build appliedPromotion object correctly - code should be string, not array
    const appliedPromotion = promotion ? {
      code: promotion.code, // Store as string
      promotionId: promotion._id, // Reference to the promotion document
      discountAmount: Number(discountAmount.toFixed(2)),
      promotionName: promotion.name,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue
    } : undefined;

    // Create order with validated data
    const orderData = {
      user: req.user._id,
      items: enrichedItems,
      shippingAddress,
      paymentMethod: paymentMethod || "stripe",
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      shippingFee: Number(shippingFee.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2)),
      total: Number(finalTotal.toFixed(2)), // Keep total for backward compatibility
      ...(appliedPromotion && { appliedPromotion }) // Only include if promotion exists
    };

    console.log('✅ Creating order with data:', JSON.stringify(orderData, null, 2));

    const order = await Order.create(orderData);

    // ✅ NOUVEAU: Marquer le code promo comme utilisé par cet utilisateur
    if (promotion) {
      const usageAdded = promotion.addUserUsage(req.user._id);
      if (usageAdded) {
        await promotion.save();
        console.log(`✅ Promotion usage recorded for user ${req.user._id}`);
      } else {
        console.log(`⚠️ User ${req.user._id} already used this promotion`);
      }
    }

    // Populate order data for response
    await order.populate("user", "name email");
    await order.populate("items.product", "name image");
    
    console.log('✅ Order created successfully:', order._id);
    
    res.status(201).json({
      success: true,
      data: order,
      message: "Commande créée avec succès"
    });
    
  } catch (error) {
    console.error('❌ Order creation error:', error);
    
    if (error.name === 'ValidationError') {
      // Handle Mongoose validation errors
      const errors = Object.values(error.errors).map(err => ({
        path: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.error('🔍 Detailed validation errors:', errors);
      
      res.status(400).json({
        success: false,
        error: `Erreur de validation: ${errors.map(e => e.message).join(', ')}`,
        details: errors
      });
    } else if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Une commande avec cet identifiant existe déjà'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
});

// @desc   Mark order as paid & deduct stock
// @route  PUT /api/orders/:orderId/pay
// @access Private
export const payOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentDetails, transactionId } = req.body;

  const order = await Order.findById(orderId).populate("items.product");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentStatus === 'paid') {
    res.status(400);
    throw new Error("Order already paid");
  }

  // Update payment status and deduct stock
  order.paymentStatus = 'paid';
  order.transactionId = transactionId;
  order.paymentDetails = paymentDetails;
  order.paidAt = Date.now();
  
  // Deduct stock for each item
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock -= item.quantity;
      await product.save();
    }
  }
  
  await order.save();

  res.json({ 
    message: "Order paid successfully", 
    order 
  });
});

// @desc   Get order by id (user or admin)
// @route  GET /api/orders/:id
// @access Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "name image");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (req.user.role !== "admin" && order.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }
  
  res.json(order);
});

// @desc   Get orders for user
// @route  GET /api/orders/myorders
// @access Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.product", "name image")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc   Get all orders (admin)
// @route  GET /api/orders
// @access Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  
  const total = await Order.countDocuments();
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("items.product", "name image")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    orders,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

// @desc   Update order status (admin)
// @route  PUT /api/orders/:id/status
// @access Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const { status } = req.body;
  order.status = status;

  // Update timestamps based on status
  if (status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = Date.now();
  } else if (status === 'shipped' && !order.shippedAt) {
    order.shippedAt = Date.now();
  }

  const updated = await order.save();
  res.json(updated);
});

// @desc   Cancel order (user)
// @route  PUT /api/orders/:id/cancel
// @access Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  if (!['pending', 'confirmed'].includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel order with status: ${order.status}`);
  }

  // Restore stock if order was paid
  if (order.paymentStatus === 'paid') {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }
  }

  // ✅ NOUVEAU: Retirer l'utilisation du code promo si applicable
  if (order.appliedPromotion && order.appliedPromotion.promotionId) {
    const promotion = await Promotion.findById(order.appliedPromotion.promotionId);
    if (promotion) {
      // Retirer l'utilisateur de la liste usedBy
      promotion.usedBy = promotion.usedBy.filter(
        usage => usage.user.toString() !== req.user._id.toString()
      );
      promotion.usedCount = Math.max(0, promotion.usedCount - 1);
      await promotion.save();
      console.log(`✅ Promotion usage removed for cancelled order ${order._id}`);
    }
  }

  order.status = 'cancelled';
  order.cancelledAt = Date.now();
  
  const updated = await order.save();
  res.json(updated);
});

// @desc   Calculate order totals (utility function)
// @route  POST /api/orders/calculate-totals
// @access Private
export const calculateOrderTotals = asyncHandler(async (req, res) => {
  const { items, taxAmount = 0, shippingFee = 0 } = req.body;
  
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items provided");
  }

  let subtotal = 0;
  const calculatedItems = [];
  
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(400);
      throw new Error(`Product not found: ${item.product}`);
    }

    const itemTotal = product.price * item.quantity;
    calculatedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      itemTotal
    });
    subtotal += itemTotal;
  }

  const finalTotal = subtotal + taxAmount + shippingFee;

  res.json({
    items: calculatedItems,
    subtotal,
    taxAmount,
    shippingFee,
    finalTotal
  });
});