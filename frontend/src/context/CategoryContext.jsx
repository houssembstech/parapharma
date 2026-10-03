// src/context/CategoryContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { categoryAPI, productAPI } from '../services/api';

const CategoryContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [enhancedCategories, setEnhancedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer le vrai nombre de produits par catégorie
  const fetchActualProductCounts = async (categoriesList) => {
    try {
      const categoriesWithRealCounts = await Promise.all(
        categoriesList.map(async (category) => {
          try {
            // Récupérer les produits de cette catégorie pour avoir le vrai compte
            const response = await productAPI.getProducts({ 
              category: category._id,
              limit: 1 // On limite à 1 car on veut seulement le total
            });
            
            const totalProducts = response.data?.total || 
                                response.data?.totalProducts || 
                                response.data?.products?.length || 
                                0;

            return {
              ...category,
              productCount: totalProducts,
              actualProductCount: totalProducts // Backup en cas de besoin
            };
          } catch (error) {
            console.error(`Error fetching products for category ${category._id}:`, error);
            return {
              ...category,
              productCount: 0,
              actualProductCount: 0
            };
          }
        })
      );
      
      return categoriesWithRealCounts;
    } catch (error) {
      console.error('Error fetching product counts:', error);
      return categoriesList.map(category => ({
        ...category,
        productCount: 0,
        actualProductCount: 0
      }));
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoryAPI.getCategories();
      const categoriesData = response.data?.categories || response.data || [];

      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
        
        // Récupérer les vrais comptes de produits
        const categoriesWithRealCounts = await fetchActualProductCounts(categoriesData);
        setEnhancedCategories(categoriesWithRealCounts);
      } else {
        throw new Error('Format de données invalide');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des catégories');
      
      // Fallback avec des données vides
      setCategories([]);
      setEnhancedCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = () => {
    fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const value = {
    categories,
    enhancedCategories,
    loading,
    error,
    refreshCategories,
    fetchActualProductCounts
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};
