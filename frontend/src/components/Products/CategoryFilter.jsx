// src/components/Products/CategoryFilter.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaFilter, FaSpinner, FaTimesCircle, FaSync, FaTag, FaChevronDown, FaChevronUp } from "react-icons/fa";

const CategoryFilter = ({
  selectedCategory,
  onCategoryChange,
  selectedPriceRange,
  onPriceRangeChange,
  products = []
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  // Price ranges
  const priceRanges = [
    { label: "Tous les prix", value: "", min: 0, max: 9999 },
    { label: "Moins de 50 DT", value: "0-50", min: 0, max: 50 },
    { label: "50 DT - 100 DT", value: "50-100", min: 50, max: 100 },
    { label: "100 DT - 200 DT", value: "100-200", min: 100, max: 200 },
    { label: "200 DT - 500 DT", value: "200-500", min: 200, max: 500 },
    { label: "Plus de 500 DT", value: "500-9999", min: 500, max: 9999 }
  ];

  // Calculate product counts based on actual products data
  const calculateProductCounts = () => {
    if (!products || products.length === 0) {
      // If no products provided, use category productCount or 0
      return categories.reduce((acc, category) => {
        acc[category._id] = category.productCount || 0;
        return acc;
      }, {});
    }

    // Count products per category from actual products data
    const counts = products.reduce((acc, product) => {
      let categoryId;
      
      if (!product.category) {
        categoryId = 'uncategorized';
      } else if (typeof product.category === 'object') {
        categoryId = product.category._id || product.category.id || product.category.name;
      } else {
        categoryId = product.category;
      }
      
      if (categoryId) {
        acc[categoryId] = (acc[categoryId] || 0) + 1;
      }
      return acc;
    }, {});

    // Also count uncategorized products
    const uncategorizedCount = products.filter(product => !product.category).length;
    if (uncategorizedCount > 0) {
      counts['uncategorized'] = uncategorizedCount;
    }

    return counts;
  };

  // Calculate statistics
  const calculateStats = () => {
    const productCounts = calculateProductCounts();
    const totalCategories = categories.length;
    const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0);

    return {
      totalCategories,
      totalProducts,
      productCounts
    };
  };

  const stats = calculateStats();

  // Fallback categories for offline/dev mode
  const fallbackCategories = [
    { _id: "skincare", name: "Soins de la peau", productCount: 45 },
    { _id: "vitamins", name: "Vitamines & Compléments", productCount: 32 },
    { _id: "baby", name: "Bébé & Maman", productCount: 28 },
    { _id: "hygiene", name: "Hygiène & Beauté", productCount: 67 },
    { _id: "medical", name: "Matériel médical", productCount: 23 },
    { _id: "pharmacy", name: "Pharmacie", productCount: 89 },
  ];

  const fetchCategories = async (isRetry = false) => {
    try {
      if (!isRetry) setLoading(true);
      setError(null);

      const response = await axios.get("http://localhost:5000/api/categories", {
        timeout: 10000,
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
      });

      const categoriesData = response.data.categories || response.data.data || response.data;

      if (Array.isArray(categoriesData)) {
        // Ensure each category has a productCount property
        const categoriesWithCounts = categoriesData.map(category => ({
          ...category,
          productCount: category.productCount || 0
        }));
        setCategories(categoriesWithCounts);
      } else {
        console.warn("Unexpected API response:", response.data);
        setCategories(fallbackCategories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories(fallbackCategories);

      if (axios.isCancel(err)) {
        setError("Request cancelled");
      } else if (err.code === "NETWORK_ERROR" || !navigator.onLine) {
        setError("Network error. Please check your connection.");
      } else if (err.response?.status === 404) {
        setError("Categories endpoint not found. Using demo data.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to load categories. Using demo data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setRetryCount((prev) => prev + 1);
    fetchCategories(true);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (error && error.includes("Network error")) {
        retryFetch();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [error]);

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    onCategoryChange(categoryId);
  };

  // Handle price range change
  const handlePriceRangeChange = (rangeValue) => {
    onPriceRangeChange(rangeValue);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    onCategoryChange("");
    onPriceRangeChange("");
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (categoryId === 'uncategorized') return 'Non catégorisé';
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  return (
    <div className="category-filter-container">
      {/* Header with Stats */}
      <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded-3">
        <h5 className="mb-0 d-flex align-items-center text-primary">
          <FaFilter className="me-2" />
          Filtres
        </h5>
        {!loading && !error && (
          <div className="text-muted small">
            <span className="badge bg-primary me-2">{stats.totalCategories} catégories</span>
            <span className="badge bg-success">{stats.totalProducts} produits</span>
          </div>
        )}
      </div>

      {/* Category Filter Section - Collapsible */}
      <div className="filter-section mb-4">
        <button
          className="filter-section-header w-100 d-flex justify-content-between align-items-center p-3 bg-light border-0 rounded-3"
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
        >
          <div className="d-flex align-items-center">
            <FaFilter className="me-2 text-success" />
            <span className="fw-bold text-dark">Catégories</span>
            {selectedCategory && (
              <span className="badge bg-success ms-2">1</span>
            )}
          </div>
          <div className="d-flex align-items-center">
            {!loading && (
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={(e) => {
                  e.stopPropagation();
                  retryFetch();
                }}
                title="Refresh categories"
              >
                <FaSync size={12} />
              </button>
            )}
            {isCategoryOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </button>
        
        <div className={`filter-section-content ${isCategoryOpen ? 'show' : 'hide'}`}>
          <div className="p-3 border border-top-0 rounded-bottom-3">
            {loading ? (
              <div className="text-center py-3">
                <FaSpinner className="spinner spinner-border-sm me-2" />
                <span>Chargement des catégories...</span>
              </div>
            ) : error ? (
              <div className="alert alert-warning d-flex align-items-center mb-3" role="alert">
                <FaTimesCircle className="me-2" />
                <div className="small">
                  {error}
                  {error.includes("Network error") && (
                    <button
                      className="btn btn-link btn-sm p-0 ms-1"
                      onClick={retryFetch}
                    >
                      Réessayer
                    </button>
                  )}
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="alert alert-info mb-3">
                <small>Aucune catégorie disponible pour le moment.</small>
              </div>
            ) : null}

            {/* All Categories Option */}
            {!loading && categories.length > 0 && (
              <>
                <div 
                  className="form-check mb-3 p-2 rounded hover-category"
                  onClick={() => handleCategoryClick("")}
                  style={{cursor: 'pointer'}}
                >
                  <input
                    className="form-check-input"
                    type="radio"
                    name="category"
                    id="category-all"
                    checked={selectedCategory === ""}
                    onChange={() => {}}
                  />
                  <label className="form-check-label d-flex justify-content-between w-100" htmlFor="category-all" style={{cursor: 'pointer'}}>
                    <span className="fw-semibold">Toutes les catégories</span>
                    <span className="text-muted">({stats.totalProducts})</span>
                  </label>
                </div>

                {/* Category List */}
                <div className="categories-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {categories.map((category) => (
                    <div 
                      key={category._id} 
                      className="form-check mb-2 p-2 rounded hover-category"
                      onClick={() => handleCategoryClick(category._id)}
                      style={{cursor: 'pointer'}}
                    >
                      <input
                        className="form-check-input"
                        type="radio"
                        name="category"
                        id={`category-${category._id}`}
                        value={category._id}
                        checked={selectedCategory === category._id}
                        onChange={() => {}}
                      />
                      <label className="form-check-label d-flex justify-content-between w-100" htmlFor={`category-${category._id}`} style={{cursor: 'pointer'}}>
                        <span className="d-flex align-items-center text-truncate">
                          <FaTag className="me-2 text-muted" size={12} />
                          {category.name}
                        </span>
                        <span className="text-muted ms-2">({stats.productCounts[category._id] || 0})</span>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Selected Category Info */}
                {selectedCategory && (
                  <div className="mt-3 p-2 bg-success bg-opacity-10 rounded-2">
                    <small className="text-success">
                      <strong>{getCategoryName(selectedCategory)}</strong>
                      {' '} - {stats.productCounts[selectedCategory] || 0} produit(s)
                    </small>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Price Range Filter Section - Collapsible */}
      <div className="filter-section">
        <button
          className="filter-section-header w-100 d-flex justify-content-between align-items-center p-3 bg-light border-0 rounded-3"
          onClick={() => setIsPriceOpen(!isPriceOpen)}
        >
          <div className="d-flex align-items-center">
            <FaFilter className="me-2 text-primary" />
            <span className="fw-bold text-dark">Gamme de Prix</span>
            {selectedPriceRange && (
              <span className="badge bg-primary ms-2">1</span>
            )}
          </div>
          {isPriceOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        
        <div className={`filter-section-content ${isPriceOpen ? 'show' : 'hide'}`}>
          <div className="p-3 border border-top-0 rounded-bottom-3">
            {/* Price Range Options */}
            <div className="price-ranges-list">
              {priceRanges.map((range) => (
                <div key={range.value} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="priceRange"
                    id={`price-${range.value}`}
                    value={range.value}
                    checked={selectedPriceRange === range.value}
                    onChange={() => handlePriceRangeChange(range.value)}
                  />
                  <label className="form-check-label w-100" htmlFor={`price-${range.value}`} style={{cursor: 'pointer'}}>
                    {range.label}
                  </label>
                </div>
              ))}
            </div>

            {/* Selected Price Range Info */}
            {selectedPriceRange && (
              <div className="mt-3 p-2 bg-primary bg-opacity-10 rounded-2">
                <small className="text-primary">
                  <strong>
                    {priceRanges.find(range => range.value === selectedPriceRange)?.label}
                  </strong>
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategory || selectedPriceRange) && (
        <div className="d-grid mt-3">
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleClearFilters}
          >
            <FaTimesCircle className="me-2" />
            Effacer les filtres
          </button>
        </div>
      )}

      <style>{`
        .filter-section-content {
          transition: all 0.3s ease-in-out;
          overflow: hidden;
        }
        
        .filter-section-content.show {
          max-height: 500px;
          opacity: 1;
        }
        
        .filter-section-content.hide {
          max-height: 0;
          opacity: 0;
        }
        
        .filter-section-header {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .filter-section-header:hover {
          background-color: #e9ecef !important;
        }
        
        .categories-list::-webkit-scrollbar {
          width: 4px;
        }
        
        .categories-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 2px;
        }
        
        .categories-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }
        
        .categories-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .hover-category:hover {
          background-color: rgba(0, 123, 255, 0.1);
          cursor: pointer;
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;
