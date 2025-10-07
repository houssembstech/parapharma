import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from '../services/api'; // using your axios instance with token

const StockContext = createContext();

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export const StockProvider = ({ children }) => {
  const { user } = useAuth();

  const [stocks, setStocks] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all stock (admin only)
  const fetchStocks = useCallback(async () => {
    if (!user?.isAdmin) return;
    setLoading(true);
    try {
      const { data } = await axios.get('/stock/products/admin/stock');
      setStocks(data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch low-stock products (admin only)
  const fetchLowStockProducts = useCallback(async () => {
    if (!user?.isAdmin) return;
    setLoading(true);
    try {
      const { data } = await axios.get('/stock/products/admin/low-stock');
      setLowStockProducts(data.products || data || []);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update product stock (admin only)
  const updateStock = useCallback(async (productId, stockData) => {
    try {
      const { data } = await axios.put(`/stock/products/${productId}/stock`, stockData);
      return data;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }, []);

  // Check product availability (for checkout)
  const checkAvailability = useCallback(async (productId, quantity) => {
    try {
      const { data } = await axios.post('/stock/products/check-availability', { productId, quantity });
      return data || { available: false, availableStock: 0 };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, availableStock: 0 };
    }
  }, []);

  return (
    <StockContext.Provider
      value={{
        stocks,
        lowStockProducts,
        loading,
        fetchStocks,
        fetchLowStockProducts,
        updateStock,
        checkAvailability,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};
