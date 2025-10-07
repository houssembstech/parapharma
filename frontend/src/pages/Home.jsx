import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { useProducts } from "../context/ProductContext";
import { promotionAPI } from "../services/api";
import ProductCard from "../components/Products/ProductCard";
import CategoryFilter from "../components/Products/CategoryFilter";
import SearchBar from '../components/Common/SearchBar';
import PromoBanner from '../components/PromoBanner';
import { getImageUrl } from "../utils/imageHelper";
import { 
  FiSearch, 
  FiRefreshCw, 
  FiFilter, 
  FiTrendingUp, 
  FiStar, 
  FiShoppingCart,
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
  FiChevronsLeft,
  FiChevronsRight,
  FiPackage,
  FiClipboard,
  FiUser,
  FiMail,
  FiSettings,
  FiLogOut,
  FiActivity,
  FiSliders,
  FiArchive,
  FiLayers,
  FiShoppingCart as FiCart,
  FiDollarSign,
  FiTrendingDown,
  FiClock as FiTime
} from "react-icons/fi";

const Home = () => {
  const { products, loading } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [priceRange, setPriceRange] = useState([0, 9999]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activePromos, setActivePromos] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Calculate active filter count
  useEffect(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (priceRange[0] > 0 || priceRange[1] < 500) count++;
    if (sortBy) count++;
    if (searchTerm) count++;
  }, [selectedCategory, priceRange, sortBy, searchTerm]);

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
   // In your fetchActivePromotions function in Home.jsx:
const fetchActivePromotions = async () => {
  try {
    setPromosLoading(true);
    
    // ✅ Use the public endpoint - no admin required
    const response = await promotionAPI.getActivePromotions();
    const responseData = response.data;
    
    let allPromotions = [];

    if (responseData.success && Array.isArray(responseData.data)) {
      allPromotions = responseData.data;
    } else if (Array.isArray(responseData)) {
      allPromotions = responseData;
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

  // Calculate product counts for each category
  const calculateCategoryCounts = () => {
    const counts = {};
    
    products.forEach(product => {
      const categoryId = getCategoryId(product);
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      }
    });
    
    return counts;
  };

  // Helper function to get category ID from product
  const getCategoryId = (product) => {
    if (!product.category) return null;
    
    if (typeof product.category === 'object') {
      return product.category._id || product.category.id || product.category.name;
    }
    
    return product.category;
  };

  // Helper function to get category name from product
  const getCategoryName = (product) => {
    if (!product.category) return 'Non catégorisé';
    
    if (typeof product.category === 'object') {
      return product.category.name || product.category._id || 'Non catégorisé';
    }
    
    return product.category;
  };

  const categoryCounts = calculateCategoryCounts();

  // Calculate statistics for display
  const calculateStats = () => {
    const totalProducts = products.length;
    const uniqueCategories = new Set();
    
    products.forEach(product => {
      const categoryId = getCategoryId(product);
      if (categoryId) {
        uniqueCategories.add(categoryId);
      }
    });
    
    const totalCategories = uniqueCategories.size;
    const featuredProducts = products.filter(p => p.featured || p.rating >= 4.5).length;
    
    return { totalProducts, totalCategories, featuredProducts };
  };

  const stats = calculateStats();

  // Enhanced Filtering + Sorting + Search with debouncing
  useEffect(() => {
    setIsFiltering(true);
    
    const filterTimeout = setTimeout(() => {
      let filtered = [...products];

      // Search filtering
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(product => 
          product.name?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          getCategoryName(product).toLowerCase().includes(term)
        );
      }

      // Category filtering
      if (selectedCategory) {
        filtered = filtered.filter((product) => {
          const productCategoryId = getCategoryId(product);
          return productCategoryId === selectedCategory;
        });
      }

      // Price range filtering
      if (priceRange) {
        filtered = filtered.filter(
          (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
        );
      }

      // Sorting
      if (sortBy === "price-low") filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === "price-high") filtered.sort((a, b) => b.price - a.price);
      else if (sortBy === "rating")
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      else if (sortBy === "newest")
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      else if (sortBy === "popular")
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      setFilteredProducts(filtered);
      setIsFiltering(false);
    }, 300);

    return () => clearTimeout(filterTimeout);
  }, [products, selectedCategory, priceRange, sortBy, searchTerm]);

  // Get category name for display
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return '';
    
    const productInCategory = products.find(product => 
      getCategoryId(product) === selectedCategory
    );
    
    return productInCategory ? getCategoryName(productInCategory) : selectedCategory;
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedPriceRange("");
    setPriceRange([0, 9999]);
    setSortBy("");
    setSearchTerm("");
  };

  // Quick filter actions
  const applyQuickFilter = (type, value) => {
    switch (type) {
      case 'category':
        setSelectedCategory(value);
        break;
      case 'price':
        setPriceRange(value);
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

  // Quick filter presets
  const quickFilters = [
    {
      id: 'featured',
      label: 'Produits Populaires',
      icon: FiStar,
      action: () => applyQuickFilter('sort', 'popular')
    },
    {
      id: 'new',
      label: 'Nouveautés',
      icon: FiZap,
      action: () => applyQuickFilter('sort', 'newest')
    },
    {
      id: 'budget',
      label: 'Moins de 100 DT',
      icon: FiTrendingUp,
      action: () => applyQuickFilter('price', [0, 100])
    },
    {
      id: 'premium',
      label: 'Premium 200+ DT',
      icon: FiAward,
      action: () => applyQuickFilter('price', [200, 500])
    }
  ];

  // Calculate active filter count
  const activeFilterCount = [
    selectedCategory,
    priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0,
    sortBy,
    searchTerm
  ].filter(Boolean).length;

  if (loading)
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-success" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted fs-5">Chargement des produits...</p>
        </div>
      </div>
    );

  return (
    <div className="min-vh-100 bg-light">
      {/* Promo Banner */}
      <PromoBanner />

      {/* Enhanced Hero Section */}
      <section className="hero-section position-relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div className="container">
          <div className="row align-items-center min-vh-100 py-5">
            <div className="col-lg-6">
              <div className="hero-content">
                {/* Badge */}
                <div className="badge bg-success bg-opacity-10 text-success fs-6 fw-semibold px-3 py-2 rounded-pill mb-3">
                  <FiZap className="me-1" />
                  Nouvelle Collection 2024
                </div>
                
                <h1 className="display-4 fw-bold text-dark mb-4">
                  Découvrez l'
                  <span style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>Excellence</span> 
                  dans Chaque Achat
                </h1>
                
                <p className="lead text-muted mb-4 fs-5">
                  Explorez nos {stats.totalProducts} produits premium avec des promotions exclusives. 
                  Expérience shopping premium avec livraison express et paiement 100% sécurisé.
                </p>
                
                {/* Enhanced Search Bar */}
                <div className="row mb-4">
                  <div className="col-12">
                    <SearchBar 
                      onSearch={handleSearch}
                      placeholder="Rechercher des produits, marques, catégories..."
                      products={products}
                      size="large"
                    />
                  </div>
                </div>

                {/* Quick Filters Bar */}
                <div className="quick-filters mb-4">
                  <div className="d-flex flex-wrap gap-2">
                    {quickFilters.map((filter) => {
                      const IconComponent = filter.icon;
                      return (
                        <button
                          key={filter.id}
                          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2 rounded-pill"
                          onClick={filter.action}
                        >
                          <IconComponent size={14} />
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Statistics */}
                <div className="stats-section mb-4">
                  <div className="row g-3">
                    <div className="col-auto">
                      <div className="stat-card bg-white shadow-sm rounded-3 p-3 text-center">
                        <div className="text-success fs-4 fw-bold">{stats.totalProducts}+</div>
                        <small className="text-muted">Produits</small>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="stat-card bg-white shadow-sm rounded-3 p-3 text-center">
                        <div className="text-primary fs-4 fw-bold">{stats.totalCategories}+</div>
                        <small className="text-muted">Catégories</small>
                      </div>
                    </div>
                    <div className="col-auto">
                      <div className="stat-card bg-white shadow-sm rounded-3 p-3 text-center">
                        <div className="text-warning fs-4 fw-bold">{stats.featuredProducts}+</div>
                        <small className="text-muted">Premium</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced CTA Buttons */}
                <div className="hero-actions d-flex flex-column flex-sm-row gap-3">
                
                  <Link to="/products" className="btn btn-outline-dark btn-lg px-4 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center">
                    <FiShoppingBag className="me-2" />
                    Voir Tous les Produits
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 text-center mt-5 mt-lg-0">
              <div className="hero-visual position-relative">
                {/* Main Visual */}
                <div className="main-visual rounded-4 p-5 shadow-lg position-relative overflow-hidden" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
                  transition: 'transform 0.3s ease'
                }}>
                  <div className="position-relative z-3">
                    <FiAward size={140} className="text-white opacity-75" />
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="position-absolute top-0 start-0 mt-4 ms-4">
                    <div className="floating-badge bg-success text-white rounded-3 p-2 shadow" style={{
                      animation: 'float 3s ease-in-out infinite'
                    }}>
                      <FiStar className="me-1" />
                      Premium
                    </div>
                  </div>
                  
                  <div className="position-absolute bottom-0 end-0 mb-4 me-4">
                    <div className="floating-badge bg-warning text-dark rounded-3 p-2 shadow" style={{
                      animation: 'float 3s ease-in-out infinite 1s'
                    }}>
                      <FiGift className="me-1" />
                      Promo
                    </div>
                  </div>
                </div>
                
                {/* Floating Cards */}
                <div className="position-absolute top-0 end-0 mt-3 me-3">
                  <div className="floating-card bg-white rounded-3 p-3 shadow-lg" style={{
                    animation: 'float 3s ease-in-out infinite'
                  }}>
                    <div className="text-success fs-6 fw-bold">⭐ 4.9/5</div>
                    <small className="text-muted">Avis clients</small>
                  </div>
                </div>
                
                <div className="position-absolute bottom-0 start-0 mb-3 ms-3">
                  <div className="floating-card bg-white rounded-3 p-3 shadow-lg" style={{
                    animation: 'float 3s ease-in-out infinite 1.5s'
                  }}>
                    <div className="text-primary fs-6 fw-bold">🚚 24h</div>
                    <small className="text-muted">Livraison</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Enhanced Products Section with Top Filters */}
      <section className="py-5 bg-white position-relative">
        <div className="container-fluid">
          <div className="row">
            {/* Main Products Content */}
            <div className="products-content full-width">
              
              {/* Enhanced Products Header */}
              <div className="products-header mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center flex-wrap gap-3">
                      <h2 className="h3 fw-bold text-dark mb-0">
                        {selectedCategory ? 
                          `Produits "${getSelectedCategoryName()}"` 
                          : searchTerm ?
                          `Résultats pour "${searchTerm}"`
                          : "Tous les Produits"
                        }
                      </h2>
                      
                      {/* Active Filter Badges */}
                      {activeFilterCount > 0 && (
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary">
                            {activeFilterCount} filtre(s) actif(s)
                          </span>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={resetFilters}
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-muted mb-0 mt-2">
                      {isFiltering ? (
                        <span className="text-warning">
                          <FiRefreshCw className="me-1 spin" />
                          Recherche en cours...
                        </span>
                      ) : (
                        `${filteredProducts.length} produit(s) trouvé(s)`
                      )}
                      {selectedCategory && ` • ${categoryCounts[selectedCategory] || 0} dans cette catégorie`}
                    </p>
                  </div>
                  
                  {/* Controls */}
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    {/* View Mode Toggle */}
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Vue grille"
                      >
                        <FiGrid size={16} />
                      </button>
                      <button
                        type="button"
                        className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="Vue liste"
                      >
                        <FiList size={16} />
                      </button>
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                      className="btn btn-primary d-flex align-items-center gap-2"
                      onClick={() => setShowFilterPanel(!showFilterPanel)}
                    >
                      <FiSliders size={16} />
                      Filtres
                      {activeFilterCount > 0 && (
                        <span className="badge bg-light text-dark rounded-pill">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>

                    {/* Search Bar */}
                    <div className="search-container" style={{ minWidth: '250px' }}>
                      <SearchBar 
                        onSearch={handleSearch}
                        placeholder="Rechercher produits..."
                        size="small"
                        value={searchTerm}
                        showButton={true}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilterPanel && (
                <div className="filter-panel card border-0 shadow-lg mb-4">
                  <div className="card-body p-4">
                    <div className="row g-4">
                      {/* Category Filter */}
                      <div className="col-md-4">
                        <div className="filter-section">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                            <FiLayers className="me-2" />
                            Catégories
                          </h6>
                          <CategoryFilter
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            selectedPriceRange={selectedPriceRange}
                            onPriceRangeChange={setSelectedPriceRange}
                            products={products}
                            categoryCounts={categoryCounts}
                            totalProducts={products.length}
                            compact={true}
                          />
                        </div>
                      </div>

                      {/* Price Range */}
                      <div className="col-md-4">
                        <div className="filter-section">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                            <FiTrendingUp className="me-2" />
                            Prix
                          </h6>
                          <div className="price-range-container">
                            <div className="price-display bg-light rounded-3 p-3 mb-3 text-center">
                              <div className="fs-5 fw-bold text-primary">
                                {priceRange[0]} - {priceRange[1]} DT
                              </div>
                              <small className="text-muted">
                                {filteredProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]).length} produits
                              </small>
                            </div>
                            
                            <div className="sliders-container px-2">
                              <input
                                type="range"
                                className="form-range custom-slider mb-3"
                                min="0"
                                max="500"
                                step="10"
                                value={priceRange[0]}
                                onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                              />
                              <input
                                type="range"
                                className="form-range custom-slider"
                                min="0"
                                max="500"
                                step="10"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                              />
                            </div>
                            
                            {/* Quick Price Buttons */}
                            <div className="quick-prices mt-3">
                              <div className="d-flex flex-wrap gap-2">
                                {[
                                  { range: [0, 50], icon: FiTrendingDown, label: "Budget" },
                                  { range: [50, 100], icon: FiDollarSign, label: "Standard" },
                                  { range: [100, 200], icon: FiTrendingUp, label: "Premium" },
                                  { range: [200, 500], icon: FiAward, label: "Luxe" }
                                ].map(({ range: [min, max], icon: Icon, label }) => (
                                  <button
                                    key={`${min}-${max}`}
                                    className="btn btn-outline-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                    onClick={() => setPriceRange([min, max])}
                                  >
                                    <Icon size={12} />
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sort Options */}
                      <div className="col-md-4">
                        <div className="filter-section">
                          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                            <FiArrowUp className="me-2" />
                            Trier par
                          </h6>
                          <select
                            className="form-select border-primary"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                          >
                            <option value="">Par défaut</option>
                            <option value="newest">Nouveautés</option>
                            <option value="popular">Plus populaires</option>
                            <option value="price-low">Prix croissant</option>
                            <option value="price-high">Prix décroissant</option>
                            <option value="rating">Meilleures notes</option>
                          </select>

                          {/* Reset Filters Button */}
                          <div className="mt-4">
                            <button
                              className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center py-2 rounded-3"
                              onClick={resetFilters}
                              disabled={activeFilterCount === 0}
                            >
                              <FiRefreshCw className="me-2" size={14} />
                              Réinitialiser tous les filtres
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Grid/List */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                  <div className="card shadow-lg border-0 rounded-4">
                    <div className="card-body py-5">
                      <div className="empty-state-icon mb-4">
                        <FiSearch size={60} className="text-muted opacity-50" />
                      </div>
                      <h3 className="text-muted mb-3">
                        {searchTerm ? `Aucun résultat pour "${searchTerm}"` : "Aucun produit trouvé"}
                      </h3>
                      <p className="text-muted mb-4 lead">
                        {products.length > 0 
                          ? "Essayez de modifier vos critères de recherche ou de filtres."
                          : "Notre catalogue sera bientôt disponible."
                        }
                      </p>
                      {products.length > 0 && (
                        <div className="d-flex gap-3 justify-content-center flex-wrap">
                          <button
                            className="btn btn-primary btn-lg d-inline-flex align-items-center px-4"
                            onClick={resetFilters}
                          >
                            <FiRefreshCw className="me-2" /> 
                            Afficher tous les produits
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Results Summary */}
                  <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded-3">
                    <small className="text-muted">
                      📱 Affichage de {Math.min(filteredProducts.length, 12)} sur {filteredProducts.length} produits
                    </small>
                    <small className="text-muted">
                      🔄 Tri: {sortBy ? 
                        { 
                          newest: 'Nouveautés', 
                          popular: 'Populaires', 
                          'price-low': 'Prix croissant', 
                          'price-high': 'Prix décroissant', 
                          rating: 'Meilleures notes' 
                        }[sortBy] 
                        : 'Par défaut'
                      }
                    </small>
                  </div>

                  {/* Products Display */}
                  {viewMode === 'grid' ? (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                      {filteredProducts.map((product) => (
                        <div key={product._id} className="col">
                          <div className="product-card-wrapper h-100">
                            <ProductCard product={product} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="products-list-container">
                      <div className="row g-4">
                        {filteredProducts.map((product) => (
                          <div key={product._id} className="col-12">
                            <div className="card product-list-card border-0 shadow-sm h-100 transition-all">
                              <div className="row g-0 h-100">
                                <div className="col-md-3">
                                  <div className="position-relative h-100">
                                    <img 
                                      src={getImageUrl(product.mainImage || product.images?.[0])}
                                      className="card-img h-100 rounded-start"
                                      alt={product.name}
                                      style={{ objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.src = '/api/placeholder/300/300';
                                      }}
                                    />
                                    {product.featured && (
                                      <div className="position-absolute top-0 start-0 m-2">
                                        <span className="badge bg-warning text-dark">
                                          <FiStar className="me-1" size={12} />
                                          Populaire
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="col-md-9">
                                  <div className="card-body d-flex flex-column h-100 p-4">
                                    <div className="flex-grow-1">
                                      <h5 className="card-title fw-bold text-dark mb-2">
                                        {product.name}
                                      </h5>
                                      <p className="card-text text-muted small mb-3">
                                        {product.description || 'Description non disponible'}
                                      </p>
                                      
                                      <div className="product-meta mb-3">
                                        <div className="d-flex flex-wrap gap-3 align-items-center">
                                          {product.category && (
                                            <span className="badge bg-primary bg-opacity-10 text-primary">
                                              {getCategoryName(product)}
                                            </span>
                                          )}
                                          {product.rating > 0 && (
                                            <div className="d-flex align-items-center gap-1">
                                              <FiStar className="text-warning" size={14} />
                                              <small className="text-muted">
                                                {product.rating} ({product.reviewCount || 0} avis)
                                              </small>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div className="price-section">
                                        <span className="h4 fw-bold text-dark">
                                          {product.price} DT
                                        </span>
                                      </div>
                                      
                                      <div className="action-buttons d-flex gap-2">
                                        <button className="btn btn-outline-primary btn-sm">
                                          <FiEye className="me-1" />
                                          Voir
                                        </button>
                                        <button className="btn btn-primary btn-sm">
                                          <FiShoppingCart className="me-1" />
                                          Ajouter
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Load More */}
                  {filteredProducts.length > 12 && (
                    <div className="text-center mt-5">
                      <button className="btn btn-primary btn-lg px-5 py-3 rounded-pill shadow-lg">
                        Charger plus de produits 
                        <span className="badge bg-light text-dark ms-2">
                          {filteredProducts.length - 12}
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced CSS Styles */}
        <style jsx>{`
          .products-content {
            transition: all 0.3s ease-in-out;
            min-height: 600px;
          }
          
          .products-header {
            padding: 20px 0;
          }
          
          .custom-slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #28a745;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }
          
          .custom-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #28a745;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          }

          .product-list-card {
            transition: all 0.3s ease;
          }

          .product-list-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
          }

          .product-card-wrapper {
            transition: all 0.3s ease;
          }

          .product-card-wrapper:hover {
            transform: translateY(-5px);
          }
          
          .spin {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .transition-all {
            transition: all 0.3s ease;
          }

          .filter-panel {
            border-radius: 1rem;
          }

          @media (max-width: 768px) {
            .filter-panel .row {
              flex-direction: column;
            }
            
            .filter-panel .col-md-4 {
              margin-bottom: 1.5rem;
            }
          }
        `}</style>
      </section>

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
                    Suivi en temps réel et notifications push.
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
                Prêt à vivre l'expérience ?
              </h3>
              <p className="lead text-white-50 mb-0">
                Rejoignez notre communauté de clients satisfaits et découvrez 
                un nouveau standard de shopping en ligne.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
              <Link to="/products" className="btn btn-light btn-lg px-5 py-3 fw-bold rounded-pill d-inline-flex align-items-center shadow-lg">
                Explorer la Collection
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

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .floating-badge, .floating-card {
          animation: float 3s ease-in-out infinite;
        }
        
        .promo-slider-container {
          overflow: hidden;
          border-radius: 1rem;
        }
        
        .promo-slider-track {
          transition: transform 0.5s ease-in-out;
        }
        
        .promo-slide {
          flex-shrink: 0;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Home;