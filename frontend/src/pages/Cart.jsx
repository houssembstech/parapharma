import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import API, { paymentAPI, orderAPI } from '../services/api';
import { getImageUrl } from '../utils/imageHelper';

// Icons
import { 
  FiShoppingCart, 
  FiTrash2, 
  FiArrowLeft, 
  FiCreditCard, 
  FiTruck, 
  FiShield, 
  FiRefreshCw,
  FiPlus,
  FiMinus,
  FiAlertTriangle,
  FiCheck,
  FiHome,
  FiUser,
  FiMapPin,
  FiPackage,
  FiTag,
  FiArrowRight,
  FiLock,
  FiGift
} from 'react-icons/fi';

const stripePromise = loadStripe("pk_test_51S92VPRpv7iSAxMW65psdidBKEsg3xBaH6bg4k4w2wWBVyNirh1M5j7USPEm5KmlB3AbfoZFOTbzOBsbKg3LcNe600mb1MpuAw");

const CheckoutForm = ({ onCancel, clearCart }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    items, 
    appliedPromotion, 
    discountAmount,
    getCartDataForOrder,
    getCartTotal 
  } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: 'Tunisie'
  });

  const finalTotal = getCartTotal();

  // Enhanced validation for shipping address
  const [addressErrors, setAddressErrors] = useState({});

  useEffect(() => {
    validateShippingAddress();
  }, [shippingAddress]);

  const validateShippingAddress = () => {
    const errors = {};
    
    if (!shippingAddress.address?.trim()) {
      errors.address = "L'adresse est requise";
    } else if (shippingAddress.address.trim().length < 5) {
      errors.address = "L'adresse doit contenir au moins 5 caractères";
    }

    if (!shippingAddress.city?.trim()) {
      errors.city = "La ville est requise";
    }

    if (!shippingAddress.postalCode?.trim()) {
      errors.postalCode = "Le code postal est requis";
    } else if (!/^\d{4}$/.test(shippingAddress.postalCode.trim())) {
      errors.postalCode = "Le code postal doit contenir 4 chiffres";
    }

    if (!shippingAddress.country?.trim()) {
      errors.country = "Le pays est requis";
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ FIX: Get product image with proper URL
  const getProductImage = (item) => {
    if (item.image) {
      return getImageUrl(item.image);
    } else if (item.images && item.images.length > 0) {
      return getImageUrl(item.images[0]);
    } else if (item.mainImage) {
      return getImageUrl(item.mainImage);
    } else {
      return getImageUrl('/images/placeholder-product.jpg');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe n'est pas initialisé");
      setLoading(false);
      return;
    }

    // Enhanced shipping address validation
    if (!validateShippingAddress()) {
      setError("Veuillez corriger les erreurs dans le formulaire d'adresse");
      setLoading(false);
      return;
    }

    // Validate items
    if (!items || items.length === 0) {
      setError("Le panier est vide");
      setLoading(false);
      return;
    }

    try {
      // Check stock availability before payment
      const stockErrors = [];
      for (const item of items) {
        if (item.quantity > item.stock) {
          stockErrors.push(`Stock insuffisant pour ${item.name}. Disponible: ${item.stock}, Demandé: ${item.quantity}`);
        }
      }
      
      if (stockErrors.length > 0) {
        throw new Error(stockErrors.join('; '));
      }

      // Get complete cart data with all required fields
      const cartData = getCartDataForOrder();
      
      console.log('🛒 Cart data for order:', cartData);

      // ENHANCED: Create order data with proper handling for cases without promotion
      const orderData = {
        items: cartData.items.map(item => ({
          product: item.product,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          itemTotal: Number(item.itemTotal)
        })),
        subtotal: Number(cartData.subtotal),
        finalTotal: Number(cartData.finalTotal),
        total: Number(cartData.finalTotal),
        
        // Shipping address with all required fields
        shippingAddress: {
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          postalCode: shippingAddress.postalCode.trim(),
          country: shippingAddress.country.trim()
        },
        
        // ENHANCED: Proper handling for cases without promotion
        paymentMethod: "stripe",
        taxAmount: 0,
        shippingFee: Number(cartData.shipping || 0),
        discountAmount: Number(cartData.discount || 0),
        promotionCode: appliedPromotion?.code || null, // Use null instead of empty string
      };

      // ENHANCED: Clean up undefined/null values
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === undefined || orderData[key] === null) {
          delete orderData[key];
        }
      });

      console.log('📦 Order data being sent to backend:', JSON.stringify(orderData, null, 2));

      // Final validation before sending
      const finalValidationErrors = [];
      
      if (orderData.subtotal === undefined || orderData.subtotal === null) finalValidationErrors.push('subtotal');
      if (orderData.finalTotal === undefined || orderData.finalTotal === null) finalValidationErrors.push('finalTotal');
      if (!orderData.items || orderData.items.length === 0) finalValidationErrors.push('items');
      
      // Validate shipping address
      if (!orderData.shippingAddress?.address) finalValidationErrors.push('shippingAddress.address');
      if (!orderData.shippingAddress?.city) finalValidationErrors.push('shippingAddress.city');
      if (!orderData.shippingAddress?.postalCode) finalValidationErrors.push('shippingAddress.postalCode');
      if (!orderData.shippingAddress?.country) finalValidationErrors.push('shippingAddress.country');
      
      // Validate each item
      orderData.items.forEach((item, index) => {
        if (!item.product) finalValidationErrors.push(`items[${index}].product`);
        if (item.itemTotal === undefined || item.itemTotal === null) finalValidationErrors.push(`items[${index}].itemTotal`);
        if (!item.name) finalValidationErrors.push(`items[${index}].name`);
        if (item.price === undefined || item.price === null) finalValidationErrors.push(`items[${index}].price`);
        if (!item.quantity) finalValidationErrors.push(`items[${index}].quantity`);
      });

      if (finalValidationErrors.length > 0) {
        console.error('❌ Final validation errors:', finalValidationErrors);
        throw new Error(`Données de commande incomplètes. Champs manquants: ${finalValidationErrors.join(', ')}`);
      }

      console.log('✅ All validations passed, creating order...');

      // Create order first
      const orderResponse = await orderAPI.createOrder(orderData);
      
      // DEBUG: Check the response structure
      debugOrderResponse(orderResponse);

      // FIXED: Extract order ID from various possible response structures
      let orderId = extractOrderId(orderResponse);

      if (!orderId) {
        console.error('❌ Could not find order ID in response. Available keys:');
        if (orderResponse.data) {
          console.log('orderResponse.data keys:', Object.keys(orderResponse.data));
          if (orderResponse.data.data) {
            console.log('orderResponse.data.data keys:', Object.keys(orderResponse.data.data));
          }
        }
        throw new Error('La création de la commande a échoué - aucun ID de commande retourné');
      }

      console.log('✅ Order created successfully with ID:', orderId);

      // THEN: Create payment intent for the existing order
      const paymentData = {
        orderId: orderId,
        currency: "usd"
      };

      console.log('💳 Creating payment intent with data:', paymentData);

      // Create payment intent with validated data
      const { data: paymentResponse } = await paymentAPI.createPaymentIntent(paymentData);

      if (!paymentResponse || !paymentResponse.clientSecret) {
        throw new Error('Réponse invalide du serveur de paiement - clientSecret manquant');
      }

      console.log('✅ Payment intent created successfully');

      // Confirm card payment
      const cardElement = elements.getElement(CardElement);
      const paymentResult = await stripe.confirmCardPayment(paymentResponse.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.name || "Client",
            email: user?.email || "client@example.com",
            address: {
              line1: shippingAddress.address,
              city: shippingAddress.city,
              postal_code: shippingAddress.postalCode,
              country: 'TN',
            }
          }
        }
      });

      if (paymentResult.error) {
        setError(`Erreur de paiement: ${paymentResult.error.message}`);
      } else if (paymentResult.paymentIntent.status === "succeeded") {
        // Payment successful - update order status to paid
        try {
          await orderAPI.payOrder(orderId, {
            paymentDetails: paymentResult.paymentIntent,
            transactionId: paymentResult.paymentIntent.id
          });

          console.log('✅ Order payment status updated to paid');

          clearCart();
          navigate("/orders", { 
            state: { 
              message: "Paiement réussi! Votre commande a été confirmée.",
              orderId: orderId
            }
          });
        } catch (updateError) {
          console.error("❌ Error updating order:", updateError);
          // Even if update fails, payment was successful and order exists
          clearCart();
          navigate("/orders", { 
            state: { 
              message: "Paiement réussi! Votre commande a été confirmée.",
              orderId: orderId
            }
          });
        }
      }
    } catch (err) {
      console.error('❌ Payment process error:', err);
      
      let errorMessage = "Erreur lors du processus de commande";
      
      if (err.response?.data) {
        const serverError = err.response.data;
        
        // Handle specific error cases with more detail
        if (serverError.error && serverError.error.includes('validation failed')) {
          errorMessage = "Erreur de validation des données. Veuillez vérifier vos informations et réessayer.";
          console.error('🔍 Validation error details:', serverError.error);
        } else if (serverError.message) {
          errorMessage = serverError.message;
        } else if (typeof serverError === 'string') {
          errorMessage = serverError;
        } else if (serverError.error) {
          errorMessage = serverError.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }

    setLoading(false);
  }; 

  // ENHANCED: Extract order ID function
  const extractOrderId = (orderResponse) => {
    const possiblePaths = [
      orderResponse.data?._id,
      orderResponse.data?.id,
      orderResponse.data?.data?._id,
      orderResponse.data?.data?.id,
      orderResponse.data?.orderId,
      orderResponse.data?.order?._id,
      orderResponse._id,
      orderResponse.id
    ];

    return possiblePaths.find(id => id !== undefined && id !== null);
  };

  const debugOrderResponse = (response) => {
    console.log('🔍 DEBUG Order Response Structure:');
    console.log('Full response:', response);
    console.log('Response data:', response.data);
    console.log('Response status:', response.status);
    
    if (response.data) {
      console.log('Data keys:', Object.keys(response.data));
      console.log('Has _id:', response.data._id);
      console.log('Has id:', response.data.id);
      console.log('Has orderId:', response.data.orderId);
      console.log('Has order:', response.data.order);
      
      if (response.data.data) {
        console.log('Nested data found:', response.data.data);
        console.log('Nested data _id:', response.data.data._id);
        console.log('Nested data id:', response.data.data.id);
      }
      
      console.log('Stringified data:', JSON.stringify(response.data, null, 2));
    }
  };

  const promotionCode = appliedPromotion?.code || '';
  const promotionDescription = appliedPromotion?.description || '';

  return (
    <div className="container-fluid py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-xxl-10">
          <form id="checkout-form" onSubmit={handleSubmit}>
            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-gradient-primary text-white py-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-1 fw-bold">
                      <FiCreditCard className="me-3" />
                      Finalisation de la commande
                    </h2>
                    <p className="mb-0 opacity-75">Paiement sécurisé - Processus 100% crypté</p>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-light btn-lg d-flex align-items-center rounded-3 px-4"
                    onClick={onCancel}
                  >
                    <FiArrowLeft className="me-2" />
                    Retour
                  </button>
                </div>
              </div>
              
              <div className="card-body p-4 p-lg-5">
                <div className="row g-5">
                  <div className="col-lg-8">
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-3">
                          <div className="card-header bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold text-primary d-flex align-items-center">
                              <div className="bg-primary rounded-circle p-2 me-3">
                                <FiMapPin className="text-white" size={20} />
                              </div>
                              Informations de livraison
                            </h5>
                          </div>
                          <div className="card-body p-4">
                            <div className="row g-3">
                              <div className="col-12">
                                <label className="form-label fw-semibold text-dark">Adresse complète *</label>
                                <input
                                  type="text"
                                  name="address"
                                  value={shippingAddress.address}
                                  onChange={handleAddressChange}
                                  className={`form-control ${addressErrors.address ? 'is-invalid' : ''}`}
                                  placeholder="Numéro, rue, appartement..."
                                  required
                                />
                                {addressErrors.address && (
                                  <div className="invalid-feedback">{addressErrors.address}</div>
                                )}
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold text-dark">Ville *</label>
                                <input
                                  type="text"
                                  name="city"
                                  value={shippingAddress.city}
                                  onChange={handleAddressChange}
                                  className={`form-control ${addressErrors.city ? 'is-invalid' : ''}`}
                                  placeholder="Votre ville"
                                  required
                                />
                                {addressErrors.city && (
                                  <div className="invalid-feedback">{addressErrors.city}</div>
                                )}
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-semibold text-dark">Code postal *</label>
                                <input
                                  type="text"
                                  name="postalCode"
                                  value={shippingAddress.postalCode}
                                  onChange={handleAddressChange}
                                  className={`form-control ${addressErrors.postalCode ? 'is-invalid' : ''}`}
                                  placeholder="0000"
                                  required
                                  maxLength="4"
                                />
                                {addressErrors.postalCode && (
                                  <div className="invalid-feedback">{addressErrors.postalCode}</div>
                                )}
                              </div>
                              <div className="col-12">
                                <label className="form-label fw-semibold text-dark">Pays *</label>
                                <input
                                  type="text"
                                  name="country"
                                  value={shippingAddress.country}
                                  onChange={handleAddressChange}
                                  className={`form-control ${addressErrors.country ? 'is-invalid' : ''}`}
                                  required
                                />
                                {addressErrors.country && (
                                  <div className="invalid-feedback">{addressErrors.country}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-3">
                          <div className="card-header bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                              <div className="bg-success rounded-circle p-2 me-3">
                                <FiCreditCard className="text-white" size={20} />
                              </div>
                              Détails de paiement
                            </h5>
                          </div>
                          <div className="card-body p-4">
                            <div className="mb-4">
                              <CardElement 
                                options={{ 
                                  style: { 
                                    base: { 
                                      fontSize: '16px',
                                      color: '#2d3748',
                                      fontFamily: 'system-ui, sans-serif',
                                      '::placeholder': {
                                        color: '#a0aec0',
                                      },
                                      padding: '12px',
                                    },
                                  },
                                  hidePostalCode: true 
                                }} 
                              />
                            </div>
                            <div className="d-flex align-items-center text-muted small p-3 bg-light rounded-2">
                              <FiLock className="me-2 text-success" />
                              <span>Vos informations de paiement sont cryptées et sécurisées</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-4">
                    <div className="sticky-top" style={{ top: '2rem' }}>
                      <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-header bg-white border-0 py-3">
                          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                            <FiPackage className="me-2 text-primary" />
                            Résumé de la commande
                          </h5>
                        </div>
                        <div className="card-body">
                          <div className="mb-4">
                            <h6 className="fw-semibold text-muted mb-3">Articles ({items.length})</h6>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                              {items.map((item) => (
                                <div key={item._id} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                                  <img
                                    src={getProductImage(item)}
                                    alt={item.name}
                                    className="rounded-2 me-3 flex-shrink-0"
                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.target.src = getImageUrl('/images/placeholder-product.jpg');
                                    }}
                                  />
                                  <div className="flex-grow-1">
                                    <div className="fw-medium text-dark mb-1">{item.name}</div>
                                    <div className="small text-muted mb-1">
                                      {item.quantity} × {item.price?.toFixed(2)} DT
                                    </div>
                                  </div>
                                  <div className="fw-bold text-primary text-end">
                                    {((item.price || 0) * (item.quantity || 0)).toFixed(2)} DT
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* ENHANCED: Better promotion display */}
                          {appliedPromotion && (
                            <div className="alert alert-success p-3 rounded-2 mb-3">
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
                                  <div className="fw-bold d-flex align-items-center">
                                    <FiGift className="me-2" />
                                    Code promo appliqué: {promotionCode}
                                  </div>
                                  {promotionDescription && (
                                    <div className="small mt-1">{promotionDescription}</div>
                                  )}
                                </div>
                                <div className="text-success fw-bold">
                                  -{(discountAmount || 0).toFixed(2)} DT
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="d-flex justify-content-between text-dark">
                              <span>Sous-total</span>
                              <span className="fw-medium">{finalTotal.toFixed(2)} DT</span>
                            </div>
                            
                            {/* ENHANCED: Only show promotion discount if promotion exists */}
                            {appliedPromotion && discountAmount > 0 && (
                              <div className="d-flex justify-content-between text-success">
                                <span>Réduction promotion</span>
                                <span className="fw-bold">-{(discountAmount || 0).toFixed(2)} DT</span>
                              </div>
                            )}
                            
                            <div className="d-flex justify-content-between text-dark">
                              <span>Livraison</span>
                              <span className={finalTotal > 100 ? 'text-success fw-bold' : 'fw-medium'}>
                                {finalTotal > 100 ? 'Gratuite' : '7.00 DT'}
                              </span>
                            </div>
                            
                            {finalTotal < 100 && (
                              <div className="alert alert-info small p-2 rounded-2 mb-0">
                                <div className="d-flex align-items-center">
                                  <FiTag className="me-2 flex-shrink-0" />
                                  <div>
                                    <strong>Livraison gratuite</strong> dès 100 DT d'achat
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <hr className="my-3" />
                            
                            <div className="d-flex justify-content-between align-items-center">
                              <strong className="fs-5 text-dark">Total TTC</strong>
                              <strong className="text-primary fs-4">{finalTotal.toFixed(2)} DT</strong>
                            </div>
                          </div>

                          <div className="mt-4">
                            <button 
                              type="submit"
                              className="btn btn-primary btn-lg w-100 py-3 fw-bold rounded-3 shadow-sm" 
                              disabled={loading || !stripe || Object.keys(addressErrors).length > 0}
                            >
                              {loading ? (
                                <>
                                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                  Traitement en cours...
                                </>
                              ) : (
                                <>
                                  <FiLock className="me-2" />
                                  Payer {finalTotal.toFixed(2)} DT
                                </>
                              )}
                            </button>

                            {error && (
                              <div className="alert alert-danger mt-3 rounded-2">
                                <div className="d-flex align-items-center">
                                  <FiAlertTriangle className="me-2 flex-shrink-0" />
                                  <div className="small">{error}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    getCartSubtotal,
    getShippingCost,
    getCartTotal,
    clearCart,
    appliedPromotion,
    discountAmount,
    promotionError,
    applyPromotion,
    removePromotion
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  const subtotal = getCartSubtotal();
  const shipping = getShippingCost();
  const finalTotal = getCartTotal();

  const promotionCode = appliedPromotion?.code || '';
  const promotionDescription = appliedPromotion?.description || '';

  // ✅ FIX: Get product image with proper URL
  const getProductImage = (item) => {
    if (item.image) {
      return getImageUrl(item.image);
    } else if (item.images && item.images.length > 0) {
      return getImageUrl(item.images[0]);
    } else if (item.mainImage) {
      return getImageUrl(item.mainImage);
    } else {
      return getImageUrl('/images/placeholder-product.jpg');
    }
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      const product = items.find(item => item._id === productId);
      if (product && newQuantity > product.stock) {
        setStockError(`Quantité non disponible. Stock maximum: ${product.stock}`);
        return;
      }
      setStockError(null);
      updateQuantity(productId, newQuantity);
    }
  };

  const handleApplyPromotion = async (e) => {
    e.preventDefault();
    const code = promoCode.trim();
    if (!code) {
      return;
    }

    setApplyingPromo(true);
    setStockError(null); // Clear previous errors
    try {
      await applyPromotion(code);
      setPromoCode(''); // Clear input after successful application
    } catch (error) {
      console.error('Promotion application error:', error);
      setStockError(error.message || 'Erreur lors de l\'application du code promo');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromotion = () => {
    removePromotion();
    setPromoCode('');
    setStockError(null);
  };

  const handleProceedToCheckout = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    if (!items || items.length === 0) {
      setStockError('Votre panier est vide');
      return;
    }

    try {
      // Enhanced stock validation
      const stockIssues = [];
      for (const item of items) {
        if (item.quantity > item.stock) {
          stockIssues.push(`Stock insuffisant pour ${item.name}. Disponible: ${item.stock}`);
        }
        if (item.stock === 0) {
          stockIssues.push(`${item.name} est actuellement en rupture de stock`);
        }
      }

      if (stockIssues.length > 0) {
        throw new Error(stockIssues.join('; '));
      }

      setShowCheckout(true);
      setStockError(null);
    } catch (error) {
      setStockError(error.message);
    }
  };

  const CheckoutComponent = (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        onCancel={() => setShowCheckout(false)}
        clearCart={clearCart}
      />
    </Elements>
  );

  if (items.length === 0 && !showCheckout) {
    return (
      <div className="container-fluid py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-6 text-center py-5">
            <div className="mb-4">
              <div className="bg-white rounded-circle p-5 d-inline-flex shadow-sm">
                <FiShoppingCart size={80} className="text-muted opacity-50" />
              </div>
            </div>
            <h1 className="fw-bold text-dark mb-4">Votre panier est vide</h1>
            <p className="text-muted mb-4 fs-5">
              Explorez nos produits et commencez votre shopping dès maintenant.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Link to="/" className="btn btn-primary btn-lg px-5 py-3 rounded-3 fw-bold d-flex align-items-center">
                <FiArrowLeft className="me-2" />
                Découvrir les produits
              </Link>
              <Link to="/categories" className="btn btn-outline-primary btn-lg px-5 py-3 rounded-3 fw-bold d-flex align-items-center">
                <FiPackage className="me-2" />
                Parcourir les catégories
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return CheckoutComponent;
  }

  return (
    <div className="container-fluid py-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <div className="container">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2 fw-bold text-dark mb-2">
                  <FiShoppingCart className="me-3 text-primary" />
                  Mon Panier
                </h1>
                <div className="d-flex align-items-center text-muted">
                  <span className="badge bg-primary me-2">
                    {items.reduce((sum, item) => sum + (item.quantity || 0), 0)} articles
                  </span>
                  <span>{items.length} produit(s)</span>
                </div>
              </div>
              <button 
                className="btn btn-outline-danger btn-lg d-flex align-items-center rounded-3 px-4"
                onClick={clearCart}
                disabled={items.length === 0}
              >
                <FiTrash2 className="me-2" />
                Vider le panier
              </button>
            </div>
          </div>
        </div>

        {(stockError || promotionError) && (
          <div className="alert alert-warning alert-dismissible fade show rounded-3 shadow-sm mb-4" role="alert">
            <div className="d-flex align-items-center">
              <FiAlertTriangle className="me-3 flex-shrink-0" size={20} />
              <div className="flex-grow-1 fw-medium">{stockError || promotionError}</div>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setStockError(null);
                  // Note: promotionError is managed by the cart context
                }}
              ></button>
            </div>
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                  <FiPackage className="me-2 text-primary" />
                  Articles dans votre panier
                </h5>
              </div>
              <div className="card-body p-0">
                {items.map((item, index) => (
                  <div 
                    key={item._id} 
                    className={`p-4 ${index !== items.length - 1 ? 'border-bottom' : ''}`}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <div className="row align-items-center">
                      <div className="col-md-2 col-3">
                        <div className="position-relative">
                          <img
                            src={getProductImage(item)}
                            alt={item.name}
                            className="img-fluid rounded-3 shadow-sm"
                            style={{ height: '100px', objectFit: 'cover', width: '100%' }}
                            onError={(e) => {
                              e.target.src = getImageUrl('/images/placeholder-product.jpg');
                            }}
                          />
                          {item.stock < 5 && item.stock > 0 && (
                            <span className="position-absolute top-0 start-0 badge bg-warning text-dark m-2 small">
                              Stock faible
                            </span>
                          )}
                          {item.stock === 0 && (
                            <span className="position-absolute top-0 start-0 badge bg-danger m-2 small">
                              Rupture
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-md-4 col-9">
                        <h6 className="fw-bold text-dark mb-2">{item.name}</h6>
                        <div className="small text-muted mb-2">
                          {item.category?.name || item.category || 'Non catégorisé'}
                        </div>
                        
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="d-flex align-items-center mb-2">
                            <span className="text-decoration-line-through text-muted small me-2">
                              {item.originalPrice.toFixed(2)} DT
                            </span>
                            <span className="badge bg-success small">
                              Économie {(item.originalPrice - item.price).toFixed(2)} DT
                            </span>
                          </div>
                        )}
                        
                        <div className={`d-flex align-items-center small ${item.stock === 0 ? 'text-danger' : item.stock < 5 ? 'text-warning' : 'text-success'}`}>
                          <FiCheck className="me-1" size={12} />
                          {item.stock === 0 ? 'Rupture de stock' : `En stock: ${item.stock} unités`}
                        </div>
                      </div>

                      <div className="col-md-3 col-6">
                        <div className="d-flex align-items-center justify-content-center">
                          <button
                            className="btn btn-outline-primary rounded-circle p-2 d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}
                            onClick={() => handleQuantityChange(item._id, (item.quantity || 0) - 1)}
                            disabled={(item.quantity || 0) <= 1 || item.stock === 0}
                          >
                            <FiMinus size={16} />
                          </button>
                          
                          <div className="mx-3">
                            <input
                              type="number"
                              className={`form-control text-center fw-bold ${item.stock === 0 ? 'border-danger' : 'border-primary'}`}
                              value={item.quantity || 0}
                              min="1"
                              max={item.stock}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                handleQuantityChange(item._id, Math.min(value, item.stock));
                              }}
                              style={{ width: '70px' }}
                              disabled={item.stock === 0}
                            />
                            <div className="small text-muted text-center mt-1">Quantité</div>
                          </div>
                          
                          <button
                            className="btn btn-outline-primary rounded-circle p-2 d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}
                            onClick={() => handleQuantityChange(item._id, (item.quantity || 0) + 1)}
                            disabled={(item.quantity || 0) >= item.stock || item.stock === 0}
                          >
                            <FiPlus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="col-md-3 col-6">
                        <div className="text-center">
                          <div className={`fw-bold fs-4 mb-2 ${item.stock === 0 ? 'text-danger' : 'text-primary'}`}>
                            {((item.price || 0) * (item.quantity || 0)).toFixed(2)} DT
                          </div>
                          <small className="text-muted d-block mb-2">
                            {(item.price || 0).toFixed(2)} DT l'unité
                          </small>
                          <button
                            className="btn btn-outline-danger rounded-3 px-3 d-flex align-items-center mx-auto"
                            onClick={() => removeFromCart(item._id)}
                          >
                            <FiTrash2 className="me-1" size={14} />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card border-0 shadow-sm mt-4 rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                  <FiGift className="me-2 text-warning" />
                  Code Promotionnel
                </h5>
              </div>
              <div className="card-body">
                {!appliedPromotion ? (
                  <form onSubmit={handleApplyPromotion} className="d-flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Entrez votre code promo"
                      className="form-control flex-1"
                      disabled={applyingPromo}
                    />
                    <button
                      type="submit"
                      disabled={applyingPromo || !promoCode.trim()}
                      className="btn btn-warning text-white px-4"
                    >
                      {applyingPromo ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                          Application...
                        </>
                      ) : (
                        'Appliquer'
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="alert alert-success d-flex align-items-center justify-content-between">
                    <div>
                      <strong>{promotionCode}</strong> appliqué
                      {promotionDescription && (
                        <div className="small">{promotionDescription}</div>
                      )}
                      {discountAmount > 0 && (
                        <div className="small fw-bold mt-1">
                          Économie: {discountAmount.toFixed(2)} DT
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleRemovePromotion}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
                
                {promotionError && !appliedPromotion && (
                  <div className="alert alert-danger mt-2 mb-0">
                    <div className="d-flex align-items-center">
                      <FiAlertTriangle className="me-2" />
                      {promotionError}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4">
              <Link to="/" className="btn btn-outline-primary btn-lg d-flex align-items-center rounded-3 px-4">
                <FiArrowLeft className="me-2" />
                Continuer les achats
              </Link>
              
              {!user && (
                <div className="alert alert-warning d-flex align-items-center mb-0 py-3 px-4 rounded-3">
                  <FiUser className="me-3 flex-shrink-0" size={20} />
                  <div>
                    <strong>Connectez-vous</strong> pour finaliser votre commande
                    <div className="small mt-1">
                      <Link to="/login" className="alert-link">Se connecter</Link> ou <Link to="/register" className="alert-link">Créer un compte</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: '2rem' }}>
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-gradient-primary text-white py-3 rounded-top-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <FiCreditCard className="me-2" />
                    Résumé de la commande
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted">Sous-total ({items.length} articles)</span>
                      <span className="fw-semibold">{subtotal.toFixed(2)} DT</span>
                    </div>
                    
                    {/* ENHANCED: Only show promotion if it exists and has discount */}
                    {appliedPromotion && discountAmount > 0 && (
                      <div className="d-flex justify-content-between align-items-center mb-3 text-success">
                        <span className="text-muted">Réduction promotion</span>
                        <span className="fw-bold">-{(discountAmount || 0).toFixed(2)} DT</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted">Livraison</span>
                      <span className={shipping === 0 ? 'text-success fw-bold' : 'fw-semibold'}>
                        {shipping === 0 ? (
                          <span className="d-flex align-items-center">
                            <FiCheck className="me-1" />
                            Gratuite
                          </span>
                        ) : (
                          `${shipping.toFixed(2)} DT`
                        )}
                      </span>
                    </div>

                    {subtotal < 100 && shipping > 0 && (
                      <div className="alert alert-info small p-3 rounded-2 mb-3">
                        <div className="d-flex align-items-center">
                          <FiTag className="me-2 flex-shrink-0" />
                          <div>
                            <strong>Livraison gratuite</strong> dès 100 DT d'achat
                            <div className="small mt-1">
                              Plus que <strong>{(100 - subtotal).toFixed(2)} DT</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <hr className="my-3" />

                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="fs-4 text-dark">Total TTC</strong>
                      <strong className="text-primary fs-3">{finalTotal.toFixed(2)} DT</strong>
                    </div>
                  </div>

                  <div className="d-grid">
                    <button 
                      className="btn btn-primary btn-lg py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                      onClick={handleProceedToCheckout}
                      disabled={items.length === 0 || !user || items.some(item => item.stock === 0)}
                    >
                      <FiArrowRight className="me-2" />
                      {user ? 'Procéder au paiement' : 'Connectez-vous pour payer'}
                    </button>

                    {items.some(item => item.stock === 0) && (
                      <div className="alert alert-warning small mt-2 mb-0 p-2 text-center">
                        <FiAlertTriangle className="me-1" size={12} />
                        Certains produits sont en rupture de stock
                      </div>
                    )}

                    <div className="text-center mt-3">
                      <small className="text-muted d-flex align-items-center justify-content-center">
                        <FiShield className="me-1" />
                        Paiement 100% sécurisé
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm mt-3 rounded-3">
                <div className="card-body p-3">
                  <div className="row text-center g-3">
                    <div className="col-4">
                      <div className="bg-light rounded-circle p-3 d-inline-flex mb-2">
                        <FiTruck className="text-primary" size={20} />
                      </div>
                      <div className="small fw-semibold">Livraison rapide</div>
                    </div>
                    <div className="col-4">
                      <div className="bg-light rounded-circle p-3 d-inline-flex mb-2">
                        <FiShield className="text-success" size={20} />
                      </div>
                      <div className="small fw-semibold">Paiement sécurisé</div>
                    </div>
                    <div className="col-4">
                      <div className="bg-light rounded-circle p-3 d-inline-flex mb-2">
                        <FiRefreshCw className="text-info" size={20} />
                      </div>
                      <div className="small fw-semibold">Retours faciles</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 