import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../utils/imageHelper'; // ✅ ADD THIS IMPORT

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  
  const cardRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    
    // Enhanced visual feedback
    const btn = e.target.closest('button');
    if (btn) {
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check2 me-2"></i>Ajouté !';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-success', 'pulse-animation');
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('btn-success', 'pulse-animation');
        btn.classList.add('btn-primary');
      }, 1500);
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setShowQuickView(false);
    }, 300);
  };

  // ✅ FIX: Get product image with proper URL
  const getProductImage = () => {
    if (product.mainImage) {
      return getImageUrl(product.mainImage);
    } else if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0]);
    } else if (product.image) {
      return getImageUrl(product.image);
    } else {
      return getImageUrl('/api/placeholder/250/250');
    }
  };

  // Calculate discount percentage
  const discountPercentage = product.originalPrice && product.price < product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Safely get category name
  const categoryName = product.category
    ? typeof product.category === 'object'
      ? product.category.name || 'Autre'
      : product.category
    : 'Autre';

  // Stock status with enhanced logic
  const getStockStatus = () => {
    if (product.stock === 0) return { 
      status: 'out', 
      text: 'Rupture de stock', 
      class: 'bg-dark',
      icon: 'bi-x-circle'
    };
    if (product.stock <= 3) return { 
      status: 'low', 
      text: `Seulement ${product.stock} restant(s)`, 
      class: 'bg-warning text-dark',
      icon: 'bi-exclamation-triangle'
    };
    if (product.stock <= 10) return { 
      status: 'medium', 
      text: 'Stock limité', 
      class: 'bg-info',
      icon: 'bi-info-circle'
    };
    return { 
      status: 'in', 
      text: 'En stock', 
      class: 'bg-success',
      icon: 'bi-check-circle'
    };
  };

  const stockStatus = getStockStatus();

  return (
    <>
      <div 
        className="col" 
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card product-card h-100 position-relative border-0 shadow-sm hover-lift transition-all">
          {/* Enhanced Badges */}
          <div className="position-absolute top-0 start-0 m-2 z-3 d-flex flex-column gap-1">
            {discountPercentage > 0 && (
              <span className="badge bg-danger bg-gradient shadow-sm fw-semibold">
                -{discountPercentage}%
              </span>
            )}
            {product.isNew && (
              <span className="badge bg-success bg-gradient shadow-sm fw-semibold">
                <i className="bi bi-star-fill me-1"></i>Nouveau
              </span>
            )}
            {product.isFeatured && (
              <span className="badge bg-warning bg-gradient text-dark shadow-sm fw-semibold">
                <i className="bi bi-lightning-fill me-1"></i>Populaire
              </span>
            )}
          </div>

          <Link to={`/product/${product._id}`} className="text-decoration-none text-dark">
            {/* Enhanced Image Container */}
            <div className="position-relative overflow-hidden bg-light">
              <div className="position-relative" style={{ height: '220px' }}>
                {/* Loading Skeleton */}
                {!imageLoaded && !imageError && (
                  <div className="position-absolute top-0 left-0 w-100 h-100 d-flex align-items-center justify-content-center">
                    <div className="spinner-grow spinner-grow-sm text-primary" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                  </div>
                )}
                
                {/* Error State */}
                {imageError ? (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-gradient">
                    <i className="bi bi-image text-muted fs-2 mb-2"></i>
                    <small className="text-muted">Image non disponible</small>
                  </div>
                ) : (
                  // ✅ FIX: Use getProductImage function
                  <img
                    src={getProductImage()}
                    className={`card-img-top transition-all ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${
                      isHovered ? 'scale-110' : ''
                    }`}
                    alt={product.name || 'Produit'}
                    style={{ 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'all 0.5s ease-in-out'
                    }}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageError(true);
                      setImageLoaded(true);
                    }}
                  />
                )}
              </div>

              {/* Stock Overlay */}
              {product.stock === 0 && (
                <div className="position-absolute top-0 left-0 w-100 h-100 bg-white bg-opacity-95 d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    <i className="bi bi-x-circle-fill text-dark fs-1 mb-2 d-block"></i>
                    <span className="badge bg-dark bg-gradient fs-6 p-2">Rupture de stock</span>
                  </div>
                </div>
              )}

              {/* Enhanced Stock Status */}
              {product.stock > 0 && (
                <div className="position-absolute bottom-0 start-0 m-2">
                  <span className={`badge ${stockStatus.class} bg-gradient shadow-sm small`}>
                    <i className={`${stockStatus.icon} me-1`}></i>
                    {stockStatus.text}
                  </span>
                </div>
              )}

              {/* Quick Actions Overlay */}
              {isHovered && product.stock > 0 && (
                <div className="position-absolute top-50 start-50 translate-middle d-flex gap-2 z-2">
                  <button
                    className="btn btn-primary btn-sm rounded-circle shadow hover-scale"
                    onClick={handleQuickView}
                    style={{ width: '40px', height: '40px' }}
                    title="Aperçu rapide"
                  >
                    <i className="bi bi-eye-fill"></i>
                  </button>
                  <button
                    className="btn btn-success btn-sm rounded-circle shadow hover-scale"
                    onClick={handleAddToCart}
                    style={{ width: '40px', height: '40px' }}
                    title="Ajouter au panier"
                  >
                    <i className="bi bi-cart-plus"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="card-body d-flex flex-column p-3">
              {/* Category & Brand */}
              <div className="mb-2 d-flex justify-content-between align-items-start">
                <span className="badge bg-primary bg-opacity-10 text-primary border-0 small">
                  {categoryName}
                </span>
                {product.brand && (
                  <small className="text-muted fw-medium">{product.brand}</small>
                )}
              </div>

              {/* Product Name */}
              <h6 className="card-title fw-semibold mb-2 text-dark line-clamp-2" 
                  style={{ fontSize: '0.95rem', minHeight: '2.8rem' }}>
                {product.name || 'Nom non disponible'}
              </h6>

              {/* Rating & Reviews */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  <div className="text-warning small">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(product.rating || 0) ? 'text-warning' : 'text-muted'}>
                        {i < Math.floor(product.rating || 0) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <small className="text-muted ms-1">({product.reviewCount || 0})</small>
                </div>
                {product.soldCount > 0 && (
                  <small className="text-muted">{product.soldCount}+ vendus</small>
                )}
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="card-text text-muted small mb-3 line-clamp-2" 
                   style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {product.shortDescription}
                </p>
              )}

              <div className="mt-auto">
                {/* Enhanced Price Section */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fw-bold text-primary fs-5">
                      {product.price?.toFixed(2) || '0.00'} DT
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-muted text-decoration-line-through small">
                        {product.originalPrice.toFixed(2)} DT
                      </span>
                    )}
                  </div>

                  {/* Savings Badge */}
                  {discountPercentage > 0 && (
                    <div className="text-end">
                      <small className="text-success fw-semibold d-block">
                        Économisez {((product.originalPrice - product.price).toFixed(2))} DT
                      </small>
                    </div>
                  )}
                </div>

                {/* Enhanced Add to Cart Button */}
                <button
                  className={`btn w-100 py-2 fw-semibold transition-all position-relative overflow-hidden ${
                    product.stock > 0 
                      ? 'btn-primary hover-glow' 
                      : 'btn-outline-secondary disabled'
                  }`}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? (
                    <>
                      <i className="bi bi-x-circle me-2"></i>
                      Indisponible
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus me-2"></i>
                      Ajouter au panier
                      <span className="position-absolute top-0 end-0 bg-white bg-opacity-20 w-100 h-100 translate-x-full shimmer"></span>
                    </>
                  )}
                </button>

                {/* Enhanced Quick Actions */}
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <button 
                    className="btn btn-outline-primary btn-sm rounded-pill hover-scale"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Compare functionality
                    }}
                  >
                    <i className="bi bi-shuffle me-1"></i>
                    Comparer
                  </button>
                  <button 
                    className="btn btn-outline-primary btn-sm rounded-pill hover-scale"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Share functionality
                    }}
                  >
                    <i className="bi bi-share me-1"></i>
                    Partager
                  </button>
                </div>
              </div>
            </div>
          </Link>

          {/* Quick View Modal */}
          {showQuickView && (
            <div className="position-absolute top-0 start-0 w-100 h-100 bg-white rounded z-4 p-3 shadow-lg quick-view-modal">
              <div className="h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="fw-bold mb-0 text-truncate">{product.name}</h6>
                  <button 
                    className="btn btn-sm btn-light rounded-circle"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowQuickView(false);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
                
                <div className="flex-grow-1 mb-2">
                  <p className="text-muted small line-clamp-3 mb-2">
                    {product.shortDescription || product.description}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-primary">{product.price?.toFixed(2)} DT</span>
                    {stockStatus.text !== 'En stock' && (
                      <span className={`badge ${stockStatus.class} small`}>
                        {stockStatus.text}
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  className="btn btn-primary btn-sm w-100"
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-cart-plus me-2"></i>
                  Ajouter au panier
                </button>
              </div>
            </div>
          )}

          {/* Enhanced CSS Styles */}
          <style jsx>{`
            .hover-lift {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .hover-lift:hover {
              transform: translateY(-8px);
              box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
            }
            .hover-scale:hover {
              transform: scale(1.05);
            }
            .hover-glow:hover {
              box-shadow: 0 0 20px rgba(var(--bs-primary-rgb), 0.4);
            }
            .line-clamp-2 {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .line-clamp-3 {
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .transition-all {
              transition: all 0.3s ease;
            }
            .scale-110 {
              transform: scale(1.1);
            }
            .pulse-animation {
              animation: pulse 0.6s ease-in-out;
            }
            .shimmer {
              animation: shimmer 2s infinite;
            }
            .quick-view-modal {
              animation: slideUp 0.3s ease-out;
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(10px);
              }
              to { 
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
};

export default ProductCard;