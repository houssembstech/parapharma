import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Product Context
const ProductContext = createContext();

// Custom hook to use the ProductContext
export const useProducts = () => useContext(ProductContext);

// ProductProvider component
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from backend
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/api/products'); // Update backend URL if needed
      if (response.data?.products) {
        setProducts(response.data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products from the server.');
      setProducts([]); // fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Optional: function to refresh products manually
  const refreshProducts = () => fetchProducts();

  return (
    <ProductContext.Provider value={{ products, loading, error, refreshProducts }}>
      {children}
    </ProductContext.Provider>
  );
};
