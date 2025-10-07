import express from "express";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create PaymentIntent for existing order
router.post("/create-payment-intent", protect, async (req, res) => {
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });

    const { orderId, currency = "usd" } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log('💳 Creating payment intent for order:', orderId);

    // Find the existing order that was already created
    const order = await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate the order has all required fields
    if (!order.finalTotal) {
      return res.status(400).json({ error: "Order is missing final total" });
    }

    if (!order.subtotal) {
      return res.status(400).json({ error: "Order is missing subtotal" });
    }

    if (!order.shippingAddress) {
      return res.status(400).json({ error: "Order is missing shipping address" });
    }

    // Validate order items
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ error: "Order has no items" });
    }

    for (const item of order.items) {
      if (!item.product) {
        return res.status(400).json({ error: `Order item is missing product ID` });
      }
      if (!item.itemTotal && item.itemTotal !== 0) {
        return res.status(400).json({ error: `Order item is missing item total` });
      }
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: "Order is already paid" });
    }

    // Calculate amount in cents
    const amountInCents = Math.round(order.finalTotal * 100);

    console.log('💰 Creating Stripe payment intent:', {
      orderId: order._id,
      finalTotal: order.finalTotal,
      amountInCents: amountInCents,
      currency: currency
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        orderId: order._id.toString(),
        userId: order.user._id.toString(),
        orderNumber: order.orderNumber
      },
      description: `Payment for order ${order.orderNumber}`,
      shipping: order.shippingAddress ? {
        name: order.user.name,
        address: {
          line1: order.shippingAddress.address,
          city: order.shippingAddress.city,
          postal_code: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
        },
      } : undefined,
      receipt_email: order.user.email,
    });

    console.log('✅ Stripe payment intent created:', paymentIntent.id);

    // Update order with payment intent ID
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error("❌ Stripe error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Webhook route to confirm payment and mark order as paid (stock auto-decremented)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    try {
      // Find order by Stripe payment intent ID and mark as paid
      const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
      
      if (order) {
        order.paymentStatus = "paid";
        order.transactionId = paymentIntent.id;
        order.paymentDetails = paymentIntent;
        await order.save(); // This will trigger stock decrement via pre-save hook
        
        console.log(`✅ Payment confirmed and stock updated for order: ${order._id}`);
      } else {
        console.error(`❌ Order not found for payment intent: ${paymentIntent.id}`);
      }
    } catch (error) {
      console.error(`❌ Error processing webhook for order:`, error);
    }
  }

  res.json({ received: true });
});

// Manual payment confirmation endpoint
router.post("/confirm-payment", protect, async (req, res) => {
  try {
    const { orderId, paymentDetails } = req.body;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: "Order already paid" });
    }

    // Mark as paid (stock will auto-decrement via pre-save hook)
    order.paymentStatus = 'paid';
    order.paymentDetails = paymentDetails;
    await order.save();

    res.json({ 
      message: "Payment confirmed successfully", 
      order 
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;