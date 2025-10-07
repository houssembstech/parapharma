import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const PromotionContext = createContext();

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
};

export const PromotionProvider = ({ children }) => {
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validatePromotion = async (code, cartItems, totalAmount) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/promotions/validate', {
        code,
        cartItems,
        totalAmount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppliedPromotion(response.data.data);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to validate promotion code';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const removePromotion = () => {
    setAppliedPromotion(null);
    setError(null);
  };

  const value = {
    appliedPromotion,
    loading,
    error,
    validatePromotion,
    removePromotion,
    setError
  };

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  );
};