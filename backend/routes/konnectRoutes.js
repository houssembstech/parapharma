import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";
import konnectService from "../services/konnectService.js";

const router = express.Router();

// @desc   Create Konnect payment for order
// @route  POST /api/konnect/create-payment
// @access Private
router.post("/create-payment", protect, async (req, res) => {
  try {
    const { orderId, customerPhoneNumber } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log('💳 Creating Konnect payment for order:', orderId);

    // Find the existing order
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate order
    if (!order.finalTotal) {
      return res.status(400).json({ error: "Order is missing final total" });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: "Order is already paid" });
    }

    // Prepare Konnect payment data
    const paymentData = {
      amount: Math.round(order.finalTotal), // Konnect expects integer amount
      description: `Payment for order ${order.orderNumber}`,
      firstName: order.user.name.split(' ')[0],
      lastName: order.user.name.split(' ').slice(1).join(' ') || order.user.name.split(' ')[0],
      customerEmail: order.user.email,
      customerPhoneNumber: customerPhoneNumber || order.user.phone || '+21600000000',
      returnUrl: `${process.env.FRONTEND_URL}/payment-success?orderId=${order._id}&paymentMethod=konnect`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment-cancel?orderId=${order._id}&paymentMethod=konnect`,
      webhook: `${process.env.BACKEND_URL}/api/konnect/webhook`
    };

    console.log('💰 Creating Konnect payment:', paymentData);

    // Create Konnect payment
    const konnectResponse = await konnectService.createPayment(paymentData);

    // Update order with Konnect payment details
    order.konnectPaymentId = konnectResponse._id;
    order.konnectPayUrl = konnectResponse.payUrl;
    order.paymentMethod = 'konnect';
    await order.save();

    console.log('✅ Konnect payment created:', konnectResponse._id);

    res.json({
      paymentId: konnectResponse._id,
      payUrl: konnectResponse.payUrl,
      orderId: order._id
    });

  } catch (error) {
    console.error("❌ Konnect payment error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @desc   Konnect payment webhook
// @route  POST /api/konnect/webhook
// @access Public
router.post("/webhook", express.json(), async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('📥 Konnect webhook received:', webhookData);

    // Verify webhook signature (you should implement this)
    // const signature = req.headers['x-konnect-signature'];
    // if (!verifySignature(webhookData, signature)) {
    //   return res.status(401).send('Invalid signature');
    // }

    const paymentId = webhookData.paymentRef;
    const status = webhookData.status;

    if (status === 'completed') {
      // Find order by Konnect payment ID
      const order = await Order.findOne({ konnectPaymentId: paymentId });
      
      if (order && order.paymentStatus !== 'paid') {
        // Mark order as paid (stock will auto-decrement via pre-save hook)
        order.paymentStatus = 'paid';
        order.transactionId = paymentId;
        order.paymentDetails = webhookData;
        await order.save();
        
        console.log(`✅ Konnect payment confirmed and stock updated for order: ${order._id}`);
      } else {
        console.log(`ℹ️ Order not found or already paid for payment: ${paymentId}`);
      }
    } else if (status === 'failed') {
      const order = await Order.findOne({ konnectPaymentId: paymentId });
      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
        console.log(`❌ Konnect payment failed for order: ${order._id}`);
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('❌ Konnect webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// @desc   Check Konnect payment status
// @route  GET /api/konnect/payment-status/:paymentId
// @access Private
router.get("/payment-status/:paymentId", protect, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentStatus = await konnectService.getPaymentStatus(paymentId);
    
    res.json(paymentStatus);
  } catch (error) {
    console.error("❌ Konnect status check error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// @desc   Manual Konnect payment confirmation
// @route  POST /api/konnect/confirm-payment
// @access Private
router.post("/confirm-payment", protect, async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: "Order already paid" });
    }

    // Verify payment with Konnect
    const paymentStatus = await konnectService.getPaymentStatus(paymentId);
    
    if (paymentStatus.status === 'completed') {
      // Mark as paid (stock will auto-decrement via pre-save hook)
      order.paymentStatus = 'paid';
      order.transactionId = paymentId;
      order.paymentDetails = paymentStatus;
      await order.save();

      res.json({ 
        message: "Konnect payment confirmed successfully", 
        order 
      });
    } else {
      res.status(400).json({ 
        error: `Payment not completed. Current status: ${paymentStatus.status}` 
      });
    }
  } catch (error) {
    console.error("Konnect payment confirmation error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;