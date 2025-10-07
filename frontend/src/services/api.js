import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirecting = false;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.warn('Admin access required for this action');
      if (window.showToast) {
        window.showToast('Access denied: Admin privileges required', 'error');
      }
    }
    return Promise.reject(error);
  }
);

window.addEventListener('load', () => {
  isRedirecting = false;
});

// Message/Chat API
export const messageAPI = {
  // Send a message
  sendMessage: (receiverId, content) => 
    API.post('/messages/send', { receiverId, content }),
  
  // Get messages for a specific chat
  getMessages: (userId) => API.get(`/messages/${userId}`),
  
  // Get all chats for current user
  getChats: () => API.get('/messages/chats'),
  
  // Get unread messages count
  getUnreadCount: () => API.get('/messages/unread-count'),
  
  // Mark messages as read
  markAsRead: (chatId) => API.put(`/messages/${chatId}/read`),
  
  // Delete a message
  deleteMessage: (messageId) => API.delete(`/messages/${messageId}`),
};

// Promotion API with separate public/admin endpoints
export const promotionAPI = {
  // ✅ PUBLIC endpoints - no admin required
  getActivePromotions: () => API.get('/promotions/public/active'),
  validatePromotion: (data) => API.post('/promotions/public/validate', data),
  
  // ✅ ADMIN endpoints - require admin access
  getAllPromotions: () => API.get('/promotions'),
  createPromotion: (data) => API.post('/promotions', data),
  updatePromotion: (id, data) => API.put(`/promotions/${id}`, data),
  deletePromotion: (id) => API.delete(`/promotions/${id}`),
  getPromotionStats: () => API.get('/promotions/admin/stats'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (range = 'today') => API.get(`/admin/dashboard?range=${range}`),
  getOverview: () => API.get('/admin/dashboard/overview'),
  getStockStatus: () => API.get('/stock/products/admin/stock-status'),
  getLowStockProducts: () => API.get('/stock/products/admin/low-stock'),
  updateStock: (productId, stockData) => API.put(`/stock/products/${productId}/stock`, stockData),
  checkStockAvailability: (items) => API.post('/stock/check-availability', { items }),
  getRecentOrders: (limit = 5, page = 1) => API.get(`/orders?limit=${limit}&page=${page}`),
  getPromotionStats: () => API.get('/admin/dashboard/promotion-stats'),
  getChatStats: () => API.get('/admin/dashboard/chat-stats'), // New chat stats
};

// Order API
export const orderAPI = {
  createOrder: (orderData) => {
    console.log('🛒 Creating order with data:', orderData);
    
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must have items');
    }
    if (!orderData.subtotal && orderData.subtotal !== 0) {
      throw new Error('Order must have subtotal');
    }
    if (!orderData.finalTotal && orderData.finalTotal !== 0) {
      throw new Error('Order must have finalTotal');
    }
    if (!orderData.shippingAddress) {
      throw new Error('Order must have shipping address');
    }
    
    return API.post('/orders', {
      ...orderData,
      promotionCode: orderData.promotionCode || null
    });
  },
  getOrder: (orderId) => API.get(`/orders/${orderId}`),
  getMyOrders: () => API.get('/orders/myorders'),
  getAllOrders: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return API.get(`/orders/admin/all?${params.toString()}`);
  },
  updateOrderStatus: (orderId, status) => API.put(`/orders/${orderId}/status`, { status }),
  payOrder: (orderId, paymentData) => {
    console.log('💰 Paying order:', orderId, paymentData);
    return API.put(`/orders/${orderId}/pay`, paymentData);
  },
  cancelOrder: (orderId) => API.put(`/orders/${orderId}/cancel`),
};

// Payment API
export const paymentAPI = {
  createPaymentIntent: (paymentData) => {
    console.log('💳 Creating payment intent with data:', paymentData);
    
    if (!paymentData.orderId) {
      console.error('❌ Missing orderId in payment data:', paymentData);
      throw new Error('Order ID is required for payment');
    }

    const validatedData = {
      orderId: paymentData.orderId,
      currency: paymentData.currency || "usd"
    };

    console.log('✅ Sending validated payment data:', validatedData);
    return API.post('/payment/create-payment-intent', validatedData);
  },
  
  confirmPayment: (paymentData) => {
    console.log('✅ Confirming payment:', paymentData);
    return API.post('/payment/confirm-payment', paymentData);
  },
};

// Admin API
export const adminAPI = {
  // User management
  getUsers: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return API.get(`/admin/users?${params.toString()}`);
  },
  getUser: (userId) => API.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => API.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => API.delete(`/admin/users/${userId}`),
  updateUserStatus: (userId, status) => API.patch(`/admin/users/${userId}`, { status }),
  
  // Chat management
  getChatAnalytics: () => API.get('/admin/chat-analytics'),
  getActiveChats: () => API.get('/admin/chats/active'),
  exportChats: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return API.get(`/admin/chats/export?${params.toString()}`, {
      responseType: 'blob'
    });
  },
};

// Product API
export const productAPI = {
  getProducts: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return API.get(`/products?${params.toString()}`);
  },
  getProduct: (productId) => API.get(`/products/${productId}`),
  createProduct: (productData) => API.post('/products', productData),
  updateProduct: (productId, productData) => API.put(`/products/${productId}`, productData),
  deleteProduct: (productId) => API.delete(`/products/${productId}`),
  uploadImage: (formData) => API.post('/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Category API
export const categoryAPI = {
  getCategories: () => API.get('/categories'),
  createCategory: (categoryData) => API.post('/categories', categoryData),
  updateCategory: (categoryId, categoryData) => API.put(`/categories/${categoryId}`, categoryData),
  deleteCategory: (categoryId) => API.delete(`/categories/${categoryId}`),
};

// Enhanced utility functions
export const apiUtils = {
  // Handle API errors consistently
  handleError: (error, defaultMessage = 'An error occurred') => {
    const message = error.response?.data?.message || error.message || defaultMessage;
    
    if (window.showToast) {
      window.showToast(message, 'error');
    }
    
    console.error('API Error:', error);
    return { error: message, details: error };
  },
  
  // Success handler
  handleSuccess: (message = 'Operation completed successfully') => {
    if (window.showToast) {
      window.showToast(message, 'success');
    }
  },
  
  // File download helper
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  
  // Pagination helper
  createPaginationParams: (page, limit, filters = {}) => {
    return {
      page: page || 1,
      limit: limit || 10,
      ...filters
    };
  }
};

export default API;