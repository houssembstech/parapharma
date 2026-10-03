// src/components/Categories/CategoryCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiPackage, FiStar, FiShoppingBag, FiArrowRight, FiHeart } from 'react-icons/fi';
import { productAPI } from '../../services/api';

const CategoryCard = ({ category }) => {
  const {
    _id,
    name,
    description,
    image,
    thumbnail,
    productCount: initialProductCount = 0,
    featured = false,
    type,
    slug
  } = category;

  const [isHovered, setIsHovered] = useState(false);
  const [actualProductCount, setActualProductCount] = useState(initialProductCount);
  const [loadingProductCount, setLoadingProductCount] = useState(false);

  const categoryUrl = `/categories/${slug || _id}`;

  // Récupérer le vrai nombre de produits
  useEffect(() => {
    const fetchRealProductCount = async () => {
      // Si le productCount initial est déjà correct (pas 50), on l'utilise
      if (initialProductCount !== 50 && initialProductCount > 0) {
        return;
      }

      try {
        setLoadingProductCount(true);
        const response = await productAPI.getProducts({ 
          category: _id, 
          limit: 1 
        });
        
        const totalProducts = response.data?.total || 
                            response.data?.totalProducts || 
                            response.data?.products?.length || 
                            0;
        
        setActualProductCount(totalProducts);
      } catch (error) {
        console.error(`Error fetching product count for category ${_id}:`, error);
        // Si erreur, on utilise 0 plutôt que 50
        setActualProductCount(0);
      } finally {
        setLoadingProductCount(false);
      }
    };

    fetchRealProductCount();
  }, [_id, initialProductCount]);

  // Utiliser le vrai compte ou l'initial si différent de 50
  const displayProductCount = initialProductCount !== 50 ? 
    initialProductCount : 
    (loadingProductCount ? '...' : actualProductCount);

  return (
    <div 
      className="category-card-enhanced position-relative h-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card border-0 shadow-sm h-100 overflow-hidden bg-transparent">
        {/* Image Container */}
        <div className="position-relative overflow-hidden rounded-top-4 category-image-container" 
             style={{ height: '200px', background: '#f8f9fa' }}>
          
          {/* Image */}
          {image && (
            <img
              src={image}
              alt={name}
              className="category-image w-100 h-100"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="image-gradient-overlay"></div>
          
          {/* Badges */}
          {featured && (
            <div className="position-absolute top-0 start-0 m-3">
              <span className="badge featured-badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
                <FiStar className="me-1" size={14} />
                <span className="fw-bold">Vedette</span>
              </span>
            </div>
          )}
          
          {type && (
            <div className="position-absolute top-0 end-0 m-3">
              <span className="badge type-badge bg-primary bg-opacity-90 text-white px-3 py-2 rounded-pill shadow-sm">
                <span className="fw-semibold">{type}</span>
              </span>
            </div>
          )}
          
          {/* Product Count Badge */}
          <div className="position-absolute bottom-0 start-0 m-3">
            <span className="badge count-badge bg-dark bg-opacity-85 text-white px-3 py-2 rounded-pill d-flex align-items-center shadow">
              <FiPackage className="me-2" size={14} />
              <span className="fw-semibold">
                {loadingProductCount ? '...' : displayProductCount}
              </span>
            </span>
          </div>

          {/* Hover Overlay */}
          <div className={`hover-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center ${isHovered ? 'show' : ''}`}>
            <div className="hover-content text-center">
              <div className="action-buttons d-flex gap-3">
                <Link
                  to={categoryUrl}
                  className="btn btn-light btn-lg rounded-circle p-3 shadow action-btn"
                  title="Explorer la catégorie"
                >
                  <FiEye size={20} />
                </Link>
                
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body d-flex flex-column p-4">
          <div className="flex-grow-1">
            <h5 className="card-title fw-bold text-dark mb-3 fs-6 category-name">
              {name}
            </h5>
            
            <p className="card-text text-muted small mb-3 category-description">
              {description || 'Découvrez notre sélection de produits premium dans cette catégorie.'}
            </p>

            {/* Meta Information */}
            <div className="category-meta mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small d-flex align-items-center">
                  <FiPackage className="me-2" size={16} />
                  <span className="fw-semibold">
                    {displayProductCount} produit{displayProductCount !== 1 ? 's' : ''}
                  </span>
                </span>
                {featured && (
                  <span className="text-warning small d-flex align-items-center">
                    <FiStar size={14} />
                    <span className="ms-1">Populaire</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Link
              to={categoryUrl}
              className="btn btn-primary w-100 d-flex align-items-center justify-content-between py-3 px-4 rounded-pill shadow-sm action-button"
            >
              <span className="d-flex align-items-center">
                <FiShoppingBag className="me-2" size={18} />
                Explorer
              </span>
              <FiArrowRight size={16} className={`arrow-icon ${isHovered ? 'animated' : ''}`} />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .category-card-enhanced {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .category-card-enhanced:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
        }
        
        .category-image-container {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        
        .category-image {
          transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          filter: brightness(0.95);
        }
        
        .category-card-enhanced:hover .category-image {
          transform: scale(1.08);
          filter: brightness(1.05);
        }
        
        .image-gradient-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50%;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .category-card-enhanced:hover .image-gradient-overlay {
          opacity: 1;
        }
        
        .hover-overlay {
          background: rgba(102, 126, 234, 0.9);
          opacity: 0;
          transition: all 0.3s ease;
          transform: translateY(10px);
        }
        
        .hover-overlay.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        .action-btn {
          transform: scale(0.8);
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .hover-overlay.show .action-btn {
          transform: scale(1);
          opacity: 1;
        }
        
        .action-btn:hover {
          transform: scale(1.1) !important;
          background: #fff !important;
          color: #667eea !important;
        }
        
        .featured-badge, .type-badge, .count-badge {
          animation: slideIn 0.5s ease forwards;
        }
        
        @keyframes slideIn {
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
  );
};

export default CategoryCard;
