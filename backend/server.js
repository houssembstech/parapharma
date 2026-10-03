import 'dotenv/config';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from './routes/userRoutes.js';
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import paymentRoutes from "./routes/payment.js";
import messageRoutes from "./routes/messageRoutes.js";
import stockRoutes from './routes/stockRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import promotionRoutes from "./routes/promotionRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import konnectRoutes from './routes/konnectRoutes.js';
import { protect } from './middleware/auth.js';


const app = express();
const httpServer = createServer(app);

// Enhanced CORS configuration for Express
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // React dev server
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.CLIENT_URL
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control', // Add this line
    'cache-control'  // Add this line (lowercase version)
  ]
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Enhanced Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000', // React dev server
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL
      ].filter(Boolean);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('Socket.io CORS blocked for origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'cache-control']
  },
  // Additional configuration for better compatibility
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect DB
connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app');

// Middleware
app.use(express.json()); // parse json

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use('/api/admin/users', userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/promotions", promotionRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/konnect', konnectRoutes);

// Health check endpoint with CORS headers
app.get("/", (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.send("Parapharmacie API is running");
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join user to their personal room
  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });

  // Handle sending messages
  socket.on('send_message', async (messageData) => {
    try {
      const { senderId, receiverId, content, chatId } = messageData;
      
      console.log('📨 Sending message:', { senderId, receiverId, content, chatId });
      
      // Import Message model
      const Message = (await import('./models/Message.js')).default;
      
      // Save message to database
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content,
        chatId
      });

      await message.save();
      
      // Populate sender info
      await message.populate('sender', 'name email');
      await message.populate('receiver', 'name email');

      console.log('💾 Message saved to database:', message._id);

      // Emit to sender and receiver
      io.to(receiverId).emit('receive_message', message);
      socket.emit('message_sent', message);

      // Update chat list for both users
      io.to(senderId).emit('chat_updated', { chatId, lastMessage: content });
      io.to(receiverId).emit('chat_updated', { chatId, lastMessage: content });

      console.log('📤 Message delivered to users');

    } catch (error) {
      console.error('❌ Message send error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    console.log('⌨️ Typing started:', data);
    socket.to(data.receiverId).emit('user_typing', {
      senderId: data.senderId,
      isTyping: true
    });
  });

  socket.on('typing_stop', (data) => {
    console.log('💤 Typing stopped:', data);
    socket.to(data.receiverId).emit('user_typing', {
      senderId: data.senderId,
      isTyping: false
    });
  });

  // Handle message read status
  socket.on('mark_messages_read', async (data) => {
    try {
      const Message = (await import('./models/Message.js')).default;
      const { chatId, userId } = data;
      
      console.log('📖 Marking messages as read:', data);
      
      await Message.updateMany(
        { 
          chatId, 
          receiver: userId, 
          isRead: false 
        },
        { 
          $set: { isRead: true } 
        }
      );

      // Notify the sender that messages were read
      socket.to(data.senderId).emit('messages_read', { chatId, readerId: userId });

    } catch (error) {
      console.error('❌ Mark messages read error:', error);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
  });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for: http://localhost:5173, http://localhost:3000`);
  console.log(`🔌 Socket.io server ready`);
});

export { io };