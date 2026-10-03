import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { promotionAPI } from '../services/api';
import { useAuth } from './AuthContext'; 

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item => item._id === action.payload._id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item._id === action.payload._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };
    }

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item._id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item._id === action.payload._id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };

    case 'CLEAR_CART':
      return { 
        ...state, 
        items: [], 
        appliedPromotion: null, 
        discountAmount: 0,
        promotionError: null 
      };

    case 'LOAD_CART':
      return { ...state, items: action.payload || [] };

    case 'SET_CHECKOUT_DATA':
      return { ...state, checkoutData: action.payload };

    case 'APPLY_PROMOTION':
      return {
        ...state,
        appliedPromotion: action.payload.promotion,
        discountAmount: action.payload.discountAmount,
        promotionError: null
      };

    case 'REMOVE_PROMOTION':
      return {
        ...state,
        appliedPromotion: null,
        discountAmount: 0,
        promotionError: null
      };

    case 'SET_PROMOTION_ERROR':
      return {
        ...state,
        promotionError: action.payload,
        appliedPromotion: null,
        discountAmount: 0
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { 
    items: [],
    checkoutData: null,
    appliedPromotion: null,
    discountAmount: 0,
    promotionError: null
  });
  
  const { user } = useAuth(); 

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (product) => {
    if (!product || !product._id) {
      throw new Error('Invalid product');
    }
    
    if (product.stock < 1) {
      throw new Error('Product out of stock');
    }
    
    const existingItem = state.items.find(item => item._id === product._id);
    if (existingItem && existingItem.quantity >= product.stock) {
      throw new Error('Cannot add more than available stock');
    }
    
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (_id) => dispatch({ type: 'REMOVE_FROM_CART', payload: _id });
  
  const updateQuantity = (_id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(_id);
    } else {
      const product = state.items.find(item => item._id === _id);
      if (product && quantity > product.stock) {
        throw new Error('Cannot set quantity higher than available stock');
      }
      dispatch({ type: 'UPDATE_QUANTITY', payload: { _id, quantity } });
    }
  };

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  
  const getCartSubtotal = () => 
    state.items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
  
  const getShippingCost = () => {
    const subtotal = getCartSubtotal();
    return subtotal > 100 ? 0 : 7;
  };
  
  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const totalBeforeDiscount = subtotal + shipping;
    return Math.max(0, totalBeforeDiscount - (state.discountAmount || 0));
  };
  
  const getCartItemsCount = () => 
    state.items.reduce((count, item) => count + (item.quantity || 0), 0);

  const getItemTotal = (item) => {
    return (item.price || 0) * (item.quantity || 0);
  };

  const getCartDataForOrder = () => {
    const subtotal = getCartSubtotal();
    const shipping = getShippingCost();
    const discount = state.discountAmount || 0;
    const finalTotal = Math.max(0, subtotal + shipping - discount);
    
    console.log('🛒 Cart data calculation:', {
      subtotal,
      shipping,
      discount,
      finalTotal,
      itemsCount: state.items.length
    });

    // Validate we have items
    if (!state.items || state.items.length === 0) {
      throw new Error('Le panier est vide');
    }

    // Create items with ALL required fields for Order model
    const itemsWithTotals = state.items.map((item, index) => {
      // Enhanced validation for each item
      if (!item._id) {
        console.error('❌ Item missing _id:', item);
        throw new Error(`Produit invalide dans le panier (ID manquant) - Article ${index + 1}`);
      }
      if (!item.name) {
        console.error('❌ Item missing name:', item);
        throw new Error(`Produit invalide dans le panier (nom manquant) - Article ${index + 1}`);
      }
      if (!item.price && item.price !== 0) {
        console.error('❌ Item missing price:', item);
        throw new Error(`Produit invalide dans le panier (prix manquant) - Article ${index + 1}`);
      }
      if (!item.quantity) {
        console.error('❌ Item missing quantity:', item);
        throw new Error(`Produit invalide dans le panier (quantité manquant) - Article ${index + 1}`);
      }

      const itemTotal = getItemTotal(item);
      
      console.log(`📦 Item ${index} data:`, {
        product: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemTotal: itemTotal
      });

      // Return exact structure required by Order model
      return {
        product: item._id, // Required by Order model - must be product ID
        name: item.name,   // Required by Order model
        price: Number(item.price.toFixed(2)), // Required by Order model
        quantity: item.quantity, // Required by Order model
        itemTotal: Number(itemTotal.toFixed(2)) // Required by Order model
      };
    });

    // Validate totals are valid numbers
    if (isNaN(subtotal) || isNaN(finalTotal)) {
      throw new Error('Erreur de calcul des totaux');
    }

    const cartData = {
      items: itemsWithTotals,
      subtotal: Number(subtotal.toFixed(2)), // Required by Order model
      shipping: Number(shipping.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2)), // Required by Order model
      appliedPromotion: state.appliedPromotion
    };

    console.log('✅ Final cart data for order:', cartData);
    return cartData;
  };

  const setCheckoutData = (data) => dispatch({ type: 'SET_CHECKOUT_DATA', payload: data });

  const applyPromotion = async (promoCode) => {
    try {
      dispatch({ type: 'SET_PROMOTION_ERROR', payload: null });
      
      if (!promoCode || typeof promoCode !== 'string') {
        throw new Error('Promotion code must be a string');
      }
      
      const code = promoCode.trim().toUpperCase();
      if (!code) {
        throw new Error('Promotion code is required');
      }

      const subtotal = getCartSubtotal();
      
      if (state.items.length === 0) {
        throw new Error('Cart is empty. Add items to apply promotion.');
      }

      const cartItems = state.items.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        itemTotal: getItemTotal(item)
      }));

      const response = await promotionAPI.validatePromotion({
        userId: user?._id,
        code: code,
        cartItems: cartItems,
        totalAmount: subtotal
      });

      const responseData = response.data || response;
      
      if (!responseData) {
        throw new Error('Invalid promotion response from server');
      }

      const promotionData = responseData.data || responseData;
      
      if (!promotionData || !promotionData.promotion) {
        throw new Error('Invalid promotion data received');
      }

      const discountAmount = Number(promotionData.discountAmount) || 0;
      
      if (isNaN(discountAmount)) {
        throw new Error('Invalid discount amount received');
      }

      dispatch({
        type: 'APPLY_PROMOTION',
        payload: {
          promotion: promotionData.promotion,
          discountAmount: discountAmount
        }
      });

      return promotionData;
    } catch (error) {
      console.error('Promotion validation error:', error);
      
      let errorMessage = 'Failed to apply promotion code';
      
      if (error.response) {
        const serverError = error.response.data;
        errorMessage = serverError.message || serverError.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      dispatch({ type: 'SET_PROMOTION_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const removePromotion = () => {
    dispatch({ type: 'REMOVE_PROMOTION' });
  };

  const checkStockAvailability = async () => {
    try {
      const itemsWithStock = state.items.map(item => ({
        productId: item._id,
        name: item.name,
        quantity: item.quantity,
        currentStock: item.stock
      }));

      const outOfStockItems = itemsWithStock.filter(item => item.quantity > item.currentStock);
      
      if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map(item => item.name).join(', ');
        throw new Error(`Insufficient stock for: ${itemNames}`);
      }
      
      return { success: true, items: itemsWithStock };
    } catch (error) {
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{
      items: state.items,
      checkoutData: state.checkoutData,
      appliedPromotion: state.appliedPromotion,
      discountAmount: state.discountAmount,
      promotionError: state.promotionError,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartSubtotal,
      getShippingCost,
      getCartTotal,
      getCartItemsCount,
      getCartDataForOrder,
      setCheckoutData,
      checkStockAvailability,
      applyPromotion,
      removePromotion
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
