import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { promotionAPI } from '../services/api';
import { 
  FiTag, 
  FiClock, 
  FiGift, 
  FiChevronRight, 
  FiX,
  FiPercent,
  FiShoppingBag
} from "react-icons/fi";

const PromoBanner = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(true);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  useEffect(() => {
    fetchActivePromotions();
  }, []);

  // Enhanced date parsing function
  const parseDate = (dateInput) => {
    if (!dateInput) {
      console.log('❌ parseDate: dateInput is null or undefined');
      return null;
    }
    
    try {
      console.log('🔧 parseDate input:', dateInput, 'type:', typeof dateInput);
      
      // If it's already a Date object
      if (dateInput instanceof Date) {
        const isValid = !isNaN(dateInput.getTime());
        console.log('📅 Already Date object, valid:', isValid);
        return isValid ? dateInput : null;
      }
      
      // If it's a timestamp
      if (typeof dateInput === 'number') {
        const date = new Date(dateInput);
        const isValid = !isNaN(date.getTime());
        console.log('⏰ Timestamp conversion, valid:', isValid);
        return isValid ? date : null;
      }
      
      // If it's a string
      if (typeof dateInput === 'string') {
        // Try ISO format directly
        let date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          console.log('✅ ISO format success:', date.toISOString());
          return date;
        }
        
        // Try MySQL datetime format (replace space with T)
        date = new Date(dateInput.replace(' ', 'T'));
        if (!isNaN(date.getTime())) {
          console.log('✅ MySQL format success:', date.toISOString());
          return date;
        }
        
        // Try without timezone
        date = new Date(dateInput.split('+')[0]);
        if (!isNaN(date.getTime())) {
          console.log('✅ Without timezone success:', date.toISOString());
          return date;
        }
        
        // Try common date formats
        const timestamp = Date.parse(dateInput);
        if (!isNaN(timestamp)) {
          date = new Date(timestamp);
          console.log('✅ Date.parse success:', date.toISOString());
          return date;
        }
      }
      
      console.log('❌ All date parsing attempts failed for:', dateInput);
      return null;
    } catch (error) {
      console.log('❌ Date parsing error:', error, 'for input:', dateInput);
      return null;
    }
  };

  const fetchActivePromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching promotions from API...');
      const response = await promotionAPI.getPromotions();
      console.log('📦 API Response:', response);
      
      const responseData = response.data;
      console.log('📊 Response data structure:', responseData);
      
      let allPromotions = [];

      if (responseData.success && Array.isArray(responseData.data)) {
        allPromotions = responseData.data;
        console.log('✅ Promotions found in response.data.data:', allPromotions);
      } else if (Array.isArray(responseData)) {
        allPromotions = responseData;
      } else {
        console.warn('⚠️ Unexpected response format');
        allPromotions = [];
      }

      console.log('🎯 Final promotions array:', allPromotions);

      // Debug each promotion's date fields
      allPromotions.forEach((promo, index) => {
        console.log(`🔍 Promotion ${index} (${promo.code}):`, {
          startDate: promo.startDate,  // VOTRE CHAMP
          endDate: promo.endDate,      // VOTRE CHAMP
          validFrom: promo.validFrom,  // Ancien champ
          validTo: promo.validTo,      // Ancien champ
          validityStart: promo.validityStart,
          validityEnd: promo.validityEnd,
          expiresAt: promo.expiresAt,
          createdAt: promo.createdAt
        });
      });

      // Enhanced date validation and filtering - USING YOUR DATABASE FIELDS
      const currentDate = new Date();
      const activePromotions = allPromotions.filter(promo => {
        if (!promo || typeof promo !== 'object') {
          console.log('❌ Invalid promotion object');
          return false;
        }

        // Vérifier si la promotion est active
        if (promo.isActive === false || promo.status === 'inactive') {
          console.log(`❌ Promotion ${promo.code} is not active`);
          return false;
        }

        try {
          // UTILISER VOS CHAMPS DE BASE DE DONNÉES : startDate et endDate
          const startDate = parseDate(promo.startDate);  // VOTRE CHAMP
          const endDate = parseDate(promo.endDate);      // VOTRE CHAMP
          
          console.log(`📅 Promotion ${promo.code} dates:`, {
            startDate: startDate ? startDate.toISOString() : 'INVALID',
            endDate: endDate ? endDate.toISOString() : 'INVALID',
            currentDate: currentDate.toISOString()
          });
          
          if (!startDate || !endDate) {
            console.log(`❌ Invalid dates for promotion ${promo.code}`);
            return false;
          }
          
          const isValid = currentDate >= startDate && currentDate <= endDate;
          console.log(`📅 Promotion ${promo.code}: ${isValid ? 'ACTIVE' : 'INACTIVE'}`);
          
          return isValid;
        } catch (dateError) {
          console.warn('❌ Date error for promotion:', dateError);
          return false;
        }
      });

      console.log('✅ Active promotions after filtering:', activePromotions);
      
      // IMPORTANT: Always use API data if available
      if (activePromotions.length > 0) {
        console.log('🎯 Using API promotions data');
        setPromotions(activePromotions);
      } else {
        console.log('📢 No active promotions from API, using demo data');
        // Use demo data only if API returns nothing
        const demoPromotions = [
          {
            _id: 'demo-1',
            code: "SOLDE2024",
            discountType: "percentage",
            discountValue: 15,
            description: "15% de réduction sur tous les produits",
            startDate: new Date().toISOString(),      // VOTRE CHAMP
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // VOTRE CHAMP
            isActive: true
          }
        ];
        setPromotions(demoPromotions);
      }

    } catch (err) {
      console.error('❌ Error fetching promotions:', err);
      setError(err.message || 'Impossible de charger les promotions');
      
      // Use demo data only in case of real error
      const demoPromotions = [
        {
          _id: 'fallback-1',
          code: "ERREURAPI",
          discountType: "percentage",
          discountValue: 10,
          description: "Promotion spéciale - Réessayez plus tard",
          startDate: new Date().toISOString(),      // VOTRE CHAMP
          endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // VOTRE CHAMP
          isActive: true
        }
      ];
      setPromotions(demoPromotions);
    } finally {
      setLoading(false);
    }
  };

  const nextPromo = () => {
    setCurrentPromoIndex((prev) => 
      prev === promotions.length - 1 ? 0 : prev + 1
    );
  };

  const prevPromo = () => {
    setCurrentPromoIndex((prev) => 
      prev === 0 ? promotions.length - 1 : prev - 1
    );
  };

  const getDiscountText = (promotion) => {
    if (!promotion) return 'Offre spéciale';
    
    console.log('🔍 Promotion data in getDiscountText:', promotion);
    
    if (promotion.discountType === 'percentage') {
      return `-${promotion.discountValue}%`;
    } else if (promotion.discountType === 'fixed') {
      return `-${promotion.discountValue} DT`;
    } else if (promotion.discountType === 'shipping') {
      return 'Livraison gratuite';
    } else {
      // Try to detect type automatically
      if (promotion.discountValue > 0 && promotion.discountValue <= 100) {
        return `-${promotion.discountValue}%`;
      } else if (promotion.discountValue > 100) {
        return `-${promotion.discountValue} DT`;
      }
      return 'Offre spéciale';
    }
  };

  // Enhanced time remaining calculation with exact dates - USING YOUR endDate FIELD
  const getTimeRemaining = (endDate) => {  // CHANGÉ: endDate au lieu de validTo
    console.log('🕒 getTimeRemaining called with endDate:', endDate);
    
    const date = parseDate(endDate);
    console.log('📅 Parsed date:', date);
    
    if (!date) {
      console.log('❌ No valid date found for endDate:', endDate);
      return "Date non définie";
    }
    
    try {
      const now = new Date();
      const diffTime = date - now;
      
      console.log('⏱️ Time calculation:', {
        now: now.toISOString(),
        target: date.toISOString(),
        diffTime: diffTime,
        diffDays: Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      });
      
      if (diffTime <= 0) {
        return "Expire aujourd'hui";
      }
      
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return "Expire demain";
      if (diffDays <= 7) return `Expire dans ${diffDays} jours`;
      if (diffDays <= 30) {
        const weeks = Math.ceil(diffDays / 7);
        return `Expire dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
      }
      const months = Math.ceil(diffDays / 30);
      return `Expire dans ${months} mois`;
    } catch (error) {
      console.log('❌ Error in getTimeRemaining:', error);
      return "Erreur de date";
    }
  };

  // Don't show anything if no promotions or banner closed
  if (!visible) {
    console.log('🚫 Banner not visible');
    return null;
  }

  if (loading) {
    console.log('⏳ Loading state');
    return (
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3">
        <div className="container">
          <div className="text-center d-flex align-items-center justify-content-center">
            <div className="spinner-border spinner-border-sm text-white me-2" role="status"></div>
            Chargement des promotions...
          </div>
        </div>
      </div>
    );
  }

  console.log('🎯 Final promotions state:', promotions);
  console.log('👀 Current promo index:', currentPromoIndex);

  // If no promotions after loading, don't show anything
  if (promotions.length === 0) {
    console.log('❌ No promotions to display');
    return null;
  }

  const currentPromo = promotions[currentPromoIndex];

  if (!currentPromo) {
    console.log('❌ No current promotion');
    return null;
  }

  console.log('🎨 Rendering promotion:', currentPromo);
  console.log('🕒 Current promo endDate value:', currentPromo.endDate); // CHANGÉ: endDate au lieu de validTo

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white relative overflow-hidden shadow-lg" style={{ minHeight: '60px' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      
      <div className="container relative">
        <div className="row align-items-center py-2" style={{ minHeight: '60px' }}>
          {/* Close Button */}
          <div className="col-auto">
            <button
              onClick={() => setVisible(false)}
              className="btn btn-sm btn-outline-light rounded-circle p-1 d-flex align-items-center justify-content-center"
              style={{ width: '24px', height: '24px' }}
              title="Fermer"
            >
              <FiX size={12} />
            </button>
          </div>

          {/* Promotion Content */}
          <div className="col">
            <div className="row align-items-center">
              {/* Discount Badge */}
              <div className="col-auto">
                <div className="bg-white text-orange-600 rounded-2 px-2 py-1 d-flex align-items-center shadow-sm">
                  <FiPercent className="me-1" size={14} />
                  <span className="fw-bold fs-7">{getDiscountText(currentPromo)}</span>
                </div>
              </div>

              {/* Promotion Details */}
              <div className="col">
                <div className="d-flex flex-column flex-md-row align-items-md-center gap-2">
                  <div className="d-flex align-items-center">
                    <FiGift className="me-1" size={14} />
                    <strong className="me-2">{currentPromo.code || "PROMO"}</strong>
                    <span className="small opacity-90">
                      {currentPromo.description || 'Économisez sur votre commande'}
                    </span>
                  </div>
                  
                  <div className="d-flex align-items-center">
                    <FiClock className="me-1" size={12} />
                    <small className="opacity-90">
                      {getTimeRemaining(currentPromo.endDate)} {/* CHANGÉ: endDate au lieu de validTo */}
                    </small>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="col-auto">
                <Link 
                  to="/products"
                  className="btn btn-light btn-sm text-orange-600 fw-bold d-flex align-items-center rounded-2 px-3"
                >
                  Profiter
                  <FiChevronRight className="ms-1" size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Navigation Arrows (if multiple promotions) */}
          {promotions.length > 1 && (
            <>
              <div className="col-auto">
                <button
                  onClick={prevPromo}
                  className="btn btn-sm btn-outline-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                  style={{ width: '24px', height: '24px' }}
                  title="Promotion précédente"
                >
                  ‹
                </button>
              </div>
              <div className="col-auto">
                <button
                  onClick={nextPromo}
                  className="btn btn-sm btn-outline-light rounded-circle p-1 d-flex align-items-center justify-content-center"
                  style={{ width: '24px', height: '24px' }}
                  title="Promotion suivante"
                >
                  ›
                </button>
              </div>
              
              {/* Dots Indicator */}
              <div className="col-auto">
                <div className="d-flex gap-1">
                  {promotions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPromoIndex(index)}
                      className={`btn btn-sm p-0 ${
                        index === currentPromoIndex 
                          ? 'btn-light' 
                          : 'btn-outline-light'
                      } rounded-circle`}
                      style={{ width: '6px', height: '6px' }}
                      title={`Promotion ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Animated border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30">
        <div className="h-full bg-white bg-opacity-50 animate-pulse"></div>
      </div>
    </div>
  );
};

export default PromoBanner;