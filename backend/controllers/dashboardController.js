import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Promotion from "../models/Promotion.js" ;
// @desc   Get dashboard statistics
// @route  GET /api/admin/dashboard
// @access Private/Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { range = 'today' } = req.query;
  
  // Calculate date range
  let startDate = new Date();
  let endDate = new Date();
  
  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
  }

  try {
    // Get total counts
    const totalProducts = await Product.countDocuments({ isActive: true });
   const totalCustomers = await User.countDocuments({ role: { $ne: 'admin' } });
    
    // Get orders based on date range
    const orderFilter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    const totalOrders = await Order.countDocuments(orderFilter);
    
    // Calculate total revenue from orders in the date range
    const revenueData = await Order.aggregate([
      { $match: orderFilter },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
    ]);
    console.log(revenueData);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Get stock status
    const stockStatus = await getStockStatus();

    res.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      stockStatus,
      range,
      startDate,
      endDate
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Error fetching dashboard data: ${error.message}`);
  }
});

// @desc   Get dashboard overview with charts data
// @route  GET /api/admin/dashboard/overview
// @access Private/Admin
export const getDashboardOverview = asyncHandler(async (req, res) => {
  try {
    // Last 7 days orders data for chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // Order status distribution
    const orderStatus = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      dailyOrders,
      topProducts,
      orderStatus
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Error fetching dashboard overview: ${error.message}`);
  }
});

// Helper function to get stock status
const getStockStatus = async () => {
  const outOfStock = await Product.countDocuments({ 
    stock: 0, 
    isActive: true 
  });
  
  const lowStock = await Product.countDocuments({ 
    stock: { $gt: 0, $lte: 10 }, // Using 10 as default low stock threshold
    isActive: true 
  });
  
  const inStock = await Product.countDocuments({ 
    stock: { $gt: 10 }, 
    isActive: true 
  });

  return {
    outOfStock,
    lowStock,
    inStock,
    total: outOfStock + lowStock + inStock
  };
};
// @desc   Get recent orders
// @route  GET /api/admin/dashboard/recent-orders
// @access Private/Admin
export const getRecentOrders = asyncHandler(async (req, res) => {
  const { limit = 5, page = 1 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext: orders.length === parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Error fetching recent orders: ${error.message}`);
  }
});

// @desc   Get promotion statistics
// @route  GET /api/admin/dashboard/promotion-stats
// @access Private/Admin
export const getPromotionStats = asyncHandler(async (req, res) => {
  try {
    // Calculate promotion stats from orders
    const promotionStats = await Order.aggregate([
      {
        $match: {
          'appliedPromotion': { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          totalDiscounts: { $sum: '$discountAmount' },
          usedPromotions: { $sum: 1 },
          // Count unique promotion codes used
          uniquePromotions: { $addToSet: '$appliedPromotion' }
        }
      }
    ]);

    // For active promotions count, you might need a Promotion model
    // For now, we'll use a fixed count or calculate from unique codes
    
    const now = new Date();

let activePromotions = await Promotion.countDocuments({
  isActive: true,
  startDate: { $lte: now },
  endDate: { $gte: now },
 
});
console.log(promotionStats);
    const result = promotionStats.length > 0 ? {
      activePromotions,
      totalDiscounts: promotionStats[0].totalDiscounts || 0,
      usedPromotions: promotionStats[0].usedPromotions || 0
    } : {
      activePromotions: 0,
      totalDiscounts: 0,
      usedPromotions: 0
    };

    res.json(result);
  } catch (error) {
    res.status(500);
    throw new Error(`Error fetching promotion stats: ${error.message}`);
  }
});

