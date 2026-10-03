import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useCategories } from "../context/CategoryContext";
import { useProducts } from "../context/ProductContext";
import { promotionAPI } from "../services/api";
import CategoryCard from "../components/Categories/CategoryCard";
import ProductCard from "../components/Products/ProductCard";
import SearchBar from '../components/Common/SearchBar';

import { getImageUrl } from "../utils/imageHelper";
import { motion } from "framer-motion";
import { 
  FiSearch, 
  FiRefreshCw, 
  FiFilter, 
  FiTrendingUp, 
  FiStar, 
  FiShoppingBag, 
  FiTruck, 
  FiShield, 
  FiArrowRight,
  FiCheck,
  FiHeart,
  FiTag,
  FiClock,
  FiPercent,
  FiCopy,
  FiCalendar,
  FiAlertCircle,
  FiArrowUp,
  FiZap,
  FiAward,
  FiGift,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiGrid,
  FiList,
  FiEye,
  FiPackage,
  FiLayers,
  FiSliders,
  FiArchive,
  FiDollarSign,
  FiTrendingDown,
  FiShoppingCart
} from "react-icons/fi";

const Home = () => {
  // Add error handling for context hooks
  let enhancedCategories = [];
  let featuredCategories = [];
  let actualCategories = [];
  let categoriesLoading = true;

  try {
    const categoriesContext = useCategories();
    enhancedCategories = categoriesContext.enhancedCategories || [];
    featuredCategories = categoriesContext.featuredCategories || [];
    actualCategories = categoriesContext.categories || []; // Catégories réelles
    categoriesLoading = categoriesContext.loading || false;
  } catch (error) {
    console.warn('CategoryContext not available, using fallback data');
    // Fallback data when context is not available
    enhancedCategories = [];
    featuredCategories = [];
    actualCategories = [];
    categoriesLoading = false;
  }

  const { products = [] } = useProducts();
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activePromos, setActivePromos] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [productsPerSlide, setProductsPerSlide] = useState(4);

  // Get popular products (best sellers)
  const getPopularProducts = () => {
    // Sort products by sales count or views, fallback to featured products
    return (products || [])
      .filter(product => product && product.isActive !== false)
      .sort((a, b) => {
        // Priority: salesCount > views > featured
        const aScore = (a.salesCount || 0) * 10 + (a.views || 0) + (a.featured ? 100 : 0);
        const bScore = (b.salesCount || 0) * 10 + (b.views || 0) + (b.featured ? 100 : 0);
        return bScore - aScore;
      })
      .slice(0, 12);
  };

  const popularProducts = getPopularProducts();

  // Enhanced scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate promo slides
  useEffect(() => {
    if (activePromos.length > 1) {
      const interval = setInterval(() => {
        setCurrentPromoSlide((prev) => (prev + 1) % activePromos.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activePromos.length]);

  // Auto-rotate product slides
  useEffect(() => {
    if (popularProducts.length > productsPerSlide) {
      const interval = setInterval(() => {
        setCurrentProductSlide((prev) => 
          (prev + 1) % Math.ceil(popularProducts.length / productsPerSlide)
        );
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [popularProducts, productsPerSlide]);

  // Responsive products per slide
  useEffect(() => {
    const updateProductsPerSlide = () => {
      if (window.innerWidth < 768) {
        setProductsPerSlide(1);
      } else if (window.innerWidth < 992) {
        setProductsPerSlide(2);
      } else if (window.innerWidth < 1200) {
        setProductsPerSlide(3);
      } else {
        setProductsPerSlide(4);
      }
    };

    updateProductsPerSlide();
    window.addEventListener('resize', updateProductsPerSlide);
    return () => window.removeEventListener('resize', updateProductsPerSlide);
  }, []);

  // Enhanced date parsing function
  const parseDate = (dateInput) => {
    if (!dateInput) return null;
    
    try {
      if (dateInput instanceof Date) {
        return !isNaN(dateInput.getTime()) ? dateInput : null;
      }
      
      if (typeof dateInput === 'number') {
        const date = new Date(dateInput);
        return !isNaN(date.getTime()) ? date : null;
      }
      
      if (typeof dateInput === 'string') {
        let date = new Date(dateInput);
        if (!isNaN(date.getTime())) return date;
        
        date = new Date(dateInput.replace(' ', 'T'));
        if (!isNaN(date.getTime())) return date;
        
        date = new Date(dateInput.split('+')[0]);
        if (!isNaN(date.getTime())) return date;
        
        const timestamp = Date.parse(dateInput);
        if (!isNaN(timestamp)) return new Date(timestamp);
      }
      
      return null;
    } catch (error) {
      console.log('❌ Date parsing error:', error);
      return null;
    }
  };

  // Fetch active promotions from API
  useEffect(() => {
    const fetchActivePromotions = async () => {
      try {
        setPromosLoading(true);
        
        const response = await promotionAPI.getActivePromotions();
        const responseData = response.data;
        
        let allPromotions = [];

        if (responseData.success && Array.isArray(responseData.data)) {
          allPromotions = responseData.data;
        } else if (Array.isArray(responseData)) {
          allPromotions = responseData;
        } else if (responseData && Array.isArray(responseData.promotions)) {
          allPromotions = responseData.promotions;
        }

        // Filter active promotions
        const currentDate = new Date();
        const activePromotions = allPromotions.filter(promo => {
          if (!promo || typeof promo !== 'object') return false;
          if (promo.isActive === false) return false;

          try {
            const startDate = parseDate(promo.startDate);
            const endDate = parseDate(promo.endDate);
            
            if (!startDate || !endDate) return false;
            
            return currentDate >= startDate && currentDate <= endDate;
          } catch (error) {
            return false;
          }
        });

        setActivePromos(activePromotions);
      } catch (error) {
        console.error('❌ Error fetching promotions:', error);
        // Fallback demo promotions
        const demoPromotions = [
          {
            _id: 'demo-1',
            code: "BIENVENUE10",
            discountType: "percentage",
            discountValue: 10,
            description: "10% de réduction sur votre première commande",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            minOrderAmount: 50
          }
        ];
        setActivePromos(demoPromotions);
      } finally {
        setPromosLoading(false);
      }
    };

    fetchActivePromotions();
  }, []);

  // Calculate REAL statistics for display
  const calculateStats = () => {
    // Utiliser les vraies catégories de l'API
    const totalCategories = actualCategories.length;
    const featuredCategoriesCount = featuredCategories.length;
    
    // Compter les produits actifs réels
    const totalProducts = (products || []).filter(product => 
      product && product.isActive !== false
    ).length;
    
    return { totalCategories, featuredCategoriesCount, totalProducts };
  };

  const stats = calculateStats();

  // Enhanced Filtering + Sorting + Search with debouncing
  useEffect(() => {
    setIsFiltering(true);
    
    const filterTimeout = setTimeout(() => {
      let filtered = [...enhancedCategories];

      // Search filtering
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(category => 
          category.name?.toLowerCase().includes(term) ||
          category.description?.toLowerCase().includes(term) ||
          (category.tags && category.tags.some(tag => tag.toLowerCase().includes(term)))
        );
      }

      // Type filtering
      if (selectedType) {
        filtered = filtered.filter((category) => {
          return category.type === selectedType;
        });
      }

      // Sorting
      if (sortBy === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));
      else if (sortBy === "name-desc") filtered.sort((a, b) => b.name.localeCompare(a.name));
      else if (sortBy === "products-high")
        filtered.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
      else if (sortBy === "products-low")
        filtered.sort((a, b) => (a.productCount || 0) - (b.productCount || 0));
      else if (sortBy === "featured")
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

      setFilteredCategories(filtered);
      setIsFiltering(false);
    }, 300);

    return () => clearTimeout(filterTimeout);
  }, [enhancedCategories, selectedType, sortBy, searchTerm]);

  // Get unique category types for filtering
  const getCategoryTypes = () => {
    const types = new Set();
    enhancedCategories.forEach(category => {
      if (category.type) {
        types.add(category.type);
      }
    });
    return Array.from(types);
  };

  const categoryTypes = getCategoryTypes();

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedType("");
    setSortBy("");
    setSearchTerm("");
  };

  // Quick filter actions
  const applyQuickFilter = (type, value) => {
    switch (type) {
      case 'type':
        setSelectedType(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
      default:
        break;
    }
  };

  // Copy promo code to clipboard
  const copyPromoCode = (code) => {
    navigator.clipboard.writeText(code);
    // Show notification
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 start-50 translate-middle-x mt-5 alert alert-success alert-dismissible fade show shadow-lg';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <strong>Succès!</strong> Code <strong>${code}</strong> copié dans le presse-papier.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Get discount text for promotion
  const getDiscountText = (promotion) => {
    if (!promotion) return 'Offre spéciale';
    
    if (promotion.discountType === 'percentage') {
      return `-${promotion.discountValue}%`;
    } else if (promotion.discountType === 'fixed') {
      return `-${promotion.discountValue} DT`;
    } else if (promotion.discountType === 'shipping') {
      return 'Livraison gratuite';
    } else {
      return 'Offre spéciale';
    }
  };

  // Enhanced time remaining calculation
  const getTimeRemaining = (endDate) => {
    const date = parseDate(endDate);
    
    if (!date) {
      return { text: "Date non définie", isExpiring: false, isValid: false };
    }
    
    try {
      const now = new Date();
      const diffTime = date - now;
      
      if (diffTime <= 0) {
        return { text: "Expiré", isExpiring: true, isValid: true, exactDate: date };
      }
      
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      let text = "";
      let isExpiring = false;
      
      if (diffDays === 1) {
        text = "Expire demain";
        isExpiring = true;
      } else if (diffDays <= 3) {
        text = `Expire dans ${diffDays} jours`;
        isExpiring = true;
      } else if (diffDays <= 7) {
        text = `Expire dans ${diffDays} jours`;
      } else if (diffDays <= 30) {
        const weeks = Math.ceil(diffDays / 7);
        text = `Expire dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
      } else {
        const months = Math.ceil(diffDays / 30);
        text = `Expire dans ${months} mois`;
      }
      
      return { text, isExpiring, isValid: true, exactDate: date };
    } catch (error) {
      return { text: "Erreur de date", isExpiring: false, isValid: false };
    }
  };

  // Simple date format for compact display
  const formatSimpleDate = (dateInput) => {
    const date = parseDate(dateInput);
    
    if (!date) {
      return "N/A";
    }
    
    try {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Check if promotion is new
  const isNewPromotion = (startDate) => {
    try {
      const startDateObj = parseDate(startDate);
      if (!startDateObj) return false;
      
      const now = new Date();
      const diffTime = now - startDateObj;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    } catch (error) {
      return false;
    }
  };

  // Promo slider navigation
  const nextPromoSlide = () => {
    setCurrentPromoSlide((prev) => (prev + 1) % activePromos.length);
  };

  const prevPromoSlide = () => {
    setCurrentPromoSlide((prev) => (prev - 1 + activePromos.length) % activePromos.length);
  };

  // Product slider navigation
  const nextProductSlide = () => {
    setCurrentProductSlide((prev) => 
      (prev + 1) % Math.ceil(popularProducts.length / productsPerSlide)
    );
  };

  const prevProductSlide = () => {
    setCurrentProductSlide((prev) => 
      (prev - 1 + Math.ceil(popularProducts.length / productsPerSlide)) % 
      Math.ceil(popularProducts.length / productsPerSlide)
    );
  };

  // Get current slide products
  const getCurrentSlideProducts = () => {
    const startIndex = currentProductSlide * productsPerSlide;
    const endIndex = startIndex + productsPerSlide;
    return popularProducts.slice(startIndex, endIndex);
  };

  // Quick filter presets
  const quickFilters = [
    {
      id: 'featured',
      label: 'Catégories Populaires',
      icon: FiStar,
      action: () => applyQuickFilter('sort', 'featured')
    },
    {
      id: 'products-high',
      label: 'Plus de Produits',
      icon: FiPackage,
      action: () => applyQuickFilter('sort', 'products-high')
    },
    {
      id: 'new',
      label: 'Nouveautés',
      icon: FiZap,
      action: () => applyQuickFilter('sort', 'name-asc')
    }
  ];

  // Calculate active filter count
  const activeFilterCount = [
    selectedType,
    sortBy,
    searchTerm
  ].filter(Boolean).length;

  if (categoriesLoading)
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-success" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted fs-5">Chargement des catégories...</p>
        </div>
      </div>
    );

  return (
    <div className="min-vh-100 bg-light">
      
      

      {/* Enhanced Hero Section with Maximum UI/UX & Animations */}
      <section className="hero-section position-relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)'
      }}>
        {/* Ambient Animated Blobs */}
        <div className="hero-gradient-overlay">
          <div className="ambient-blob blob-1"></div>
          <div className="ambient-blob blob-2"></div>
        </div>

        <div className="container position-relative z-1 pt-5 mt-5">
          <div className="row align-items-center min-vh-100 pb-5">
            <div className="col-lg-6">
              <motion.div 
                className="hero-content"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Badge */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="badge glassmorphism-card text-success fs-6 fw-semibold px-4 py-2 rounded-pill mb-4 shadow-sm"
                >
                  <FiHeart className="me-1" />
                  Santé & Beauté au Quotidien
                </motion.div>
                
                <motion.h1 
                  className="display-4 fw-bold text-dark mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Prenez soin de vous <br/> avec nos
                  <span style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}> gammes expertes</span>
                </motion.h1>
                
                <motion.p 
                  className="lead text-muted mb-5 fs-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  Découvrez une large sélection de soins dermo-cosmétiques, de compléments alimentaires et d'articles d'hygiène pour toute la famille. 
                  Livraison express garantie à domicile.
                </motion.p>
                
                {/* Enhanced Search Bar with Glassmorphism */}
                <motion.div 
                  className="row mb-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <div className="col-12 glassmorphism-card p-3 rounded-4 shadow-sm">
                     <SearchBar 
                      onSearch={handleSearch}
                      placeholder="Rechercher un produit, une marque..."
                      size="large"
                    />
                  </div>
                </motion.div>

                {/* Enhanced CTA Buttons */}
                <motion.div 
                  className="hero-actions d-flex flex-column flex-sm-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  <Link to="/categories" className="btn btn-primary premium-btn-pulse btn-lg px-5 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center shadow-lg border-0" style={{ background: 'linear-gradient(45deg, #10b981, #059669)'}}>
                    <FiShoppingBag className="me-2" />
                    Explorer les Catégories
                  </Link>
                  <Link to="/products" className="btn btn-light btn-lg px-5 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center shadow-sm" style={{ border: '2px solid rgba(16, 185, 129, 0.2)', color: '#059669' }}>
                    <FiPackage className="me-2" />
                    Voir Tous les Produits
                  </Link>
                </motion.div>
              </motion.div>
            </div>
            
            <div className="col-lg-6 text-center mt-5 mt-lg-0">
              <motion.div 
                className="hero-visual position-relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {/* Main Visual */}
                <motion.img 
                  src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80" 
                  alt="Parapharmacie Premium" 
                  className="img-fluid shadow-lg chain-img-hover"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    maxHeight: '500px',
                    objectFit: 'cover',
                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                    border: '8px solid rgba(255,255,255,0.5)'
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <div className="hero-chain-wave text-white">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.33,193.36,104.9,239.31,94.34,281.71,72.48,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
      </section>

      {/* Popular Products Slider Section */}
      {popularProducts.length > 0 && (
        <section className="py-5 bg-white position-relative overflow-hidden">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="text-center mb-5">
                  <div className="badge bg-danger bg-opacity-10 text-danger fs-6 fw-semibold px-3 py-2 rounded-pill mb-3">
                    <FiTrendingUp className="me-2" />
                    Produits Populaires
                  </div>
                  <h2 className="fw-bold text-dark display-5 mb-3">
                    Les Plus Vendus
                  </h2>
                  <p className="text-muted lead">
                    Découvrez nos produits les plus populaires du moment
                  </p>
                </div>

                {/* Products Slider */}
                <div className="position-relative">
                  {/* Navigation Arrows */}
                  {popularProducts.length > productsPerSlide && (
                    <>
                      <button 
                        className="btn btn-primary btn-sm position-absolute top-50 start-0 translate-middle-y z-3 rounded-circle shadow d-none d-md-flex"
                        onClick={prevProductSlide}
                        style={{ width: '50px', height: '50px' }}
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      <button 
                        className="btn btn-primary btn-sm position-absolute top-50 end-0 translate-middle-y z-3 rounded-circle shadow d-none d-md-flex"
                        onClick={nextProductSlide}
                        style={{ width: '50px', height: '50px' }}
                      >
                        <FiChevronRight size={20} />
                      </button>
                    </>
                  )}
                  
                  {/* Products Slider Container */}
                  <div className="products-slider-container overflow-hidden">
                    <div 
                      className="products-slider-track d-flex transition-all"
                      style={{ 
                        transform: `translateX(-${currentProductSlide * 100}%)`,
                        transition: 'transform 0.5s ease-in-out'
                      }}
                    >
                      {Array.from({ length: Math.ceil(popularProducts.length / productsPerSlide) }).map((_, slideIndex) => (
                        <div key={slideIndex} className="products-slide flex-shrink-0 w-100">
                          <div className="row g-4 justify-content-center">
                            {popularProducts
                              .slice(slideIndex * productsPerSlide, (slideIndex + 1) * productsPerSlide)
                              .map((product) => (
                                <div key={product._id} className="col-12 col-sm-6 col-lg-3">
                                  <div className="product-slide-card h-100">
                                    <ProductCard product={product} />
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Slider Indicators */}
                  {popularProducts.length > productsPerSlide && (
                    <div className="text-center mt-4">
                      <div className="slider-indicators d-flex justify-content-center gap-2">
                        {Array.from({ length: Math.ceil(popularProducts.length / productsPerSlide) }).map((_, index) => (
                          <button
                            key={index}
                            className={`btn btn-sm rounded-circle p-0 ${index === currentProductSlide ? 'bg-primary' : 'bg-light'}`}
                            onClick={() => setCurrentProductSlide(index)}
                            style={{ width: '12px', height: '12px' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center mt-5">
                  <Link to="/products" className="btn btn-outline-danger btn-lg px-5">
                    Voir Tous les Produits
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Promo Codes Slider */}
      {!promosLoading && activePromos.length > 0 && (
        <section className="py-5 position-relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        }}>
          <div className="container position-relative z-2">
            <div className="row">
              <div className="col-12">
                {/* Enhanced Header */}
                <div className="text-center mb-5">
                  <div className="badge bg-white bg-opacity-20 text-white fs-6 fw-semibold px-3 py-2 rounded-pill mb-3">
                    <FiTag className="me-2" />
                    Offres Spéciales
                  </div>
                  <h2 className="text-white fw-bold display-5 mb-2">
                    Codes Promo Exclusifs
                  </h2>
                  <p className="text-white-50 lead mb-0">
                    Profitez de nos meilleures offres du moment
                  </p>
                </div>
                
                {/* Promo Slider Container */}
                <div className="position-relative">
                  {/* Navigation Arrows */}
                  {activePromos.length > 1 && (
                    <>
                      <button 
                        className="btn btn-light btn-sm position-absolute top-50 start-0 translate-middle-y z-3 rounded-circle shadow"
                        onClick={prevPromoSlide}
                        style={{ width: '50px', height: '50px' }}
                      >
                        <FiChevronLeft size={20} />
                      </button>
                      <button 
                        className="btn btn-light btn-sm position-absolute top-50 end-0 translate-middle-y z-3 rounded-circle shadow"
                        onClick={nextPromoSlide}
                        style={{ width: '50px', height: '50px' }}
                      >
                        <FiChevronRight size={20} />
                      </button>
                    </>
                  )}
                  
                  {/* Slider */}
                  <div className="promo-slider-container overflow-hidden rounded-4">
                    <div 
                      className="promo-slider-track d-flex transition-all"
                      style={{ 
                        transform: `translateX(-${currentPromoSlide * 100}%)`,
                        transition: 'transform 0.5s ease-in-out'
                      }}
                    >
                      {activePromos.map((promo, index) => {
                        const timeRemaining = getTimeRemaining(promo.endDate);
                        const isNew = isNewPromotion(promo.startDate);
                        const startDate = parseDate(promo.startDate);
                        const endDate = parseDate(promo.endDate);
                        
                        return (
                          <div key={promo._id || promo.id} className="promo-slide flex-shrink-0 w-100">
                            <div className="row justify-content-center">
                              <div className="col-lg-8 col-md-10">
                                <div className="promo-card card border-0 shadow-lg h-100 rounded-4 position-relative overflow-hidden" style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  border: index === 0 ? '2px solid #ffd700' : '2px solid transparent',
                                  transition: 'all 0.3s ease'
                                }}>
                                  {/* Content */}
                                  <div className="card-body position-relative z-2 p-4 text-white">
                                    {/* Header Badges */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                      <div className="d-flex gap-2">
                                        {/* New Badge */}
                                        {isNew && (
                                          <span className="badge bg-warning text-dark rounded-pill">
                                            <FiStar className="me-1" size={12} />
                                            Nouveau
                                          </span>
                                        )}
                                        
                                        {/* Discount Badge */}
                                        {promo.discountType === "percentage" ? (
                                          <span className="badge bg-danger text-white rounded-pill fs-6 px-3 py-2">
                                            {getDiscountText(promo)}
                                          </span>
                                        ) : promo.discountType === "shipping" ? (
                                          <span className="badge bg-primary text-white rounded-pill fs-6 px-3 py-2">
                                            Livraison Offerte
                                          </span>
                                        ) : (
                                          <span className="badge bg-success text-white rounded-pill fs-6 px-3 py-2">
                                            Promo
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* Time Remaining */}
                                      <div className={`time-remaining ${timeRemaining.isExpiring ? 'text-warning' : 'text-white-50'} text-end`}>
                                        <div className="d-flex align-items-center">
                                          <FiClock className="me-1" size={14} />
                                          <span className="fw-bold small">{timeRemaining.text}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Promotion Details */}
                                    <div className="text-center mb-4">
                                      <h5 className="fw-bold text-white mb-2">{promo.description}</h5>
                                      {promo.minOrderAmount > 0 && (
                                        <small className="text-white-50">
                                          Commande minimum: {promo.minOrderAmount} DT
                                        </small>
                                      )}
                                    </div>
                                    
                                    {/* Code Section */}
                                    <div className="code-section mb-3">
                                      <div className="bg-white bg-opacity-10 border border-white border-opacity-25 rounded-3 p-3 position-relative">
                                        <code className="fs-4 fw-bold text-white d-block text-center">
                                          {promo.code}
                                        </code>
                                        <button
                                          className="btn btn-light btn-sm position-absolute top-50 end-0 translate-middle-y me-3 rounded-pill px-3"
                                          onClick={() => copyPromoCode(promo.code)}
                                        >
                                          <FiCopy className="me-1" size={14} />
                                          Copier
                                        </button>
                                      </div>
                                    </div>
                                    
                                    {/* Validity Period */}
                                    <div className="validity-period text-center">
                                      {startDate && endDate ? (
                                        <small className="text-white-50">
                                          <FiCheck className="me-1 text-success" />
                                          Valide du <strong>{formatSimpleDate(startDate)}</strong> au <strong>{formatSimpleDate(endDate)}</strong>
                                        </small>
                                      ) : (
                                        <small className="text-warning">
                                          <FiAlertCircle className="me-1" />
                                          Période de validité non définie
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Slider Indicators */}
                  {activePromos.length > 1 && (
                    <div className="text-center mt-4">
                      <div className="slider-indicators d-flex justify-content-center gap-2">
                        {activePromos.map((_, index) => (
                          <button
                            key={index}
                            className={`btn btn-sm rounded-circle p-0 ${index === currentPromoSlide ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                            onClick={() => setCurrentPromoSlide(index)}
                            style={{ width: '12px', height: '12px' }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Categories Section */}
      {featuredCategories.length > 0 && (
        <section className="py-5 bg-light">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="text-center mb-5">
                  <div className="badge bg-primary bg-opacity-10 text-primary fs-6 fw-semibold px-3 py-2 rounded-pill mb-3">
                    <FiStar className="me-2" />
                    Catégories Vedettes
                  </div>
                  <h2 className="fw-bold text-dark display-5 mb-3">
                    Nos Catégories Populaires
                  </h2>
                  <p className="text-muted lead">
                    Découvrez nos collections les plus populaires
                  </p>
                </div>

                <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
                  {featuredCategories.map((category) => (
                    <div key={category._id} className="col">
                      <CategoryCard category={category} />
                    </div>
                  ))}
                </div>

                <div className="text-center mt-5">
                  <Link to="/categories" className="btn btn-outline-primary btn-lg px-5">
                    Voir Toutes les Catégories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Features Section */}
      <section className="py-5 position-relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="container position-relative z-2">
          <div className="row text-center mb-5">
            <div className="col">
              <div className="badge bg-white bg-opacity-20 text-white fs-6 fw-semibold px-3 py-2 rounded-pill mb-3">
                Pourquoi Nous Choisir ?
              </div>
              <h2 className="fw-bold text-white mb-3 display-5">
                Excellence et Confiance
              </h2>
              <p className="text-white-50 lead">
                Une expérience shopping premium avec des services de qualité supérieure
              </p>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div className="feature-card card border-0 shadow-lg h-100 text-center p-4 rounded-4 position-relative overflow-hidden bg-white">
                <div className="card-body position-relative z-2">
                  <div className="feature-icon bg-primary bg-opacity-10 rounded-3 p-3 d-inline-flex mb-4">
                    <FiTruck size={40} className="text-primary" />
                  </div>
                  <h5 className="fw-bold text-dark mb-3">Livraison Express</h5>
                  <p className="text-muted mb-0">
                    Livraison ultra-rapide sous 24-48h dans toute la Tunisie. 
                    Suivi en temps réel.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div className="feature-card card border-0 shadow-lg h-100 text-center p-4 rounded-4 position-relative overflow-hidden bg-white">
                <div className="card-body position-relative z-2">
                  <div className="feature-icon bg-success bg-opacity-10 rounded-3 p-3 d-inline-flex mb-4">
                    <FiShield size={40} className="text-success" />
                  </div>
                  <h5 className="fw-bold text-dark mb-3">Paiement Sécurisé</h5>
                  <p className="text-muted mb-0">
                    Cryptage SSL avancé et protection des données. 
                    Multiple moyens de paiement avec garantie de remboursement.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6">
              <div className="feature-card card border-0 shadow-lg h-100 text-center p-4 rounded-4 position-relative overflow-hidden bg-white">
                <div className="card-body position-relative z-2">
                  <div className="feature-icon bg-warning bg-opacity-10 rounded-3 p-3 d-inline-flex mb-4">
                    <FiHeart size={40} className="text-warning" />
                  </div>
                  <h5 className="fw-bold text-dark mb-3">Support Premium</h5>
                  <p className="text-muted mb-0">
                    Équipe dédiée disponible 7j/7. Support multilingue 
                    et accompagnement personnalisé pour chaque client.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-5 bg-dark position-relative overflow-hidden">
        <div className="container position-relative z-2">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h3 className="fw-bold text-white mb-3 display-6">
                Prêt à explorer nos catégories ?
              </h3>
              <p className="lead text-white-50 mb-0">
                Rejoignez notre communauté de clients satisfaits et découvrez 
                un nouveau standard de shopping en ligne.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <Link to="/categories" className="btn btn-light btn-lg px-5 py-3 fw-bold rounded-pill d-inline-flex align-items-center shadow-lg">
                Explorer les Catégories
                <FiArrowRight className="ms-2" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Scroll to Top */}
      {isScrolled && (
        <button 
            className="btn btn-primary rounded-circle shadow-lg position-fixed bottom-0 end-0 m-4"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ width: '60px', height: '60px', zIndex: 1000 }}
            title="Retour en haut"
        >
            <FiArrowUp size={20} />
        </button>
      )}

      {/* CSS Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .floating-badge, .floating-card {
          animation: float 3s ease-in-out infinite;
        }
        
        .promo-slider-container, .products-slider-container {
          overflow: hidden;
          border-radius: 1rem;
        }
        
        .promo-slider-track, .products-slider-track {
          transition: transform 0.5s ease-in-out;
        }
        
        .promo-slide, .products-slide {
          flex-shrink: 0;
          width: 100%;
        }

        .category-card-wrapper, .product-slide-card {
          transition: all 0.3s ease;
        }

        .category-card-wrapper:hover, .product-slide-card:hover {
          transform: translateY(-5px);
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .products-slide .col-lg-3 {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }

        @media (min-width: 768px) and (max-width: 992px) {
          .products-slide .col-lg-3 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }

        @media (min-width: 992px) and (max-width: 1200px) {
          .products-slide .col-lg-3 {
            flex: 0 0 33.333%;
            max-width: 33.333%;
          }
        }

        @media (min-width: 1200px) {
          .products-slide .col-lg-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
