import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStock } from '../context/StockContext';
import axios from '../services/api';
import ProductCard from '../components/Products/ProductCard';
import { getImageUrl } from '../utils/imageHelper'; // ✅ ADD THIS IMPORT

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { checkAvailability } = useStock();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
  }, [id]);

  useEffect(() => {
    if (product) checkProductAvailability();
  }, [product, quantity]);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const { data } = await axios.get(`/products/${id}/related`);
      setRelatedProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const checkProductAvailability = async () => {
    if (!product) return;
    setStockLoading(true);
    try {
      const result = await checkAvailability(product._id, quantity);
      setAvailability(result);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability({ available: false, availableStock: 0 });
    } finally {
      setStockLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product && availability?.available) {
      for (let i = 0; i < quantity; i++) {
        addToCart({ ...product, image: product.images?.[0] || product.image });
      }
      // Show success feedback
      const btn = document.getElementById('addToCartBtn');
      if (btn) {
        btn.innerHTML = '<i class="bi bi-check2 me-2"></i>Ajouté !';
        btn.classList.add('btn-success');
        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-cart-plus me-2"></i>Ajouter au panier';
          btn.classList.remove('btn-success');
        }, 2000);
      }
    }
  };

  const handleBuyNow = () => {
    if (!availability?.available) return;
    handleAddToCart();
    navigate('/cart');
  };

  const handleQuantityChange = (newQuantity) => {
    const qty = Math.max(1, Math.min(product.stock, newQuantity));
    setQuantity(qty);
  };

  // ✅ FIX: Get product images with proper URLs
  const getProductImages = () => {
    if (!product) return [];
    
    if (product.images && product.images.length > 0) {
      return product.images.map(img => getImageUrl(img));
    } else if (product.image) {
      return [getImageUrl(product.image)];
    } else if (product.mainImage) {
      return [getImageUrl(product.mainImage)];
    } else {
      return [getImageUrl('https://placehold.co/400x400?text=Image')];
    }
  };

  const getStockStatusBadge = () => {
    if (!product) return null;
    if (product.stock === 0) return (
      <span className="badge bg-danger py-2 px-3">
        <i className="bi bi-x-circle me-1"></i>Rupture de stock
      </span>
    );
    if (product.stock <= (product.lowStockAlert || 10)) return (
      <span className="badge bg-warning text-dark py-2 px-3">
        <i className="bi bi-exclamation-triangle me-1"></i>Stock faible
      </span>
    );
    return (
      <span className="badge bg-success py-2 px-3">
        <i className="bi bi-check-circle me-1"></i>En stock
      </span>
    );
  };

  const getStockMessage = () => {
    if (!product) return null;
    if (product.stock === 0) return (
      <div className="alert alert-warning mt-3">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        Ce produit est temporairement indisponible.
      </div>
    );
    if (product.stock <= 5) return (
      <div className="alert alert-info mt-3">
        <i className="bi bi-info-circle-fill me-2"></i>
        Plus que <strong>{product.stock}</strong> unité(s) disponible(s) - Commandez vite !
      </div>
    );
    return (
      <div className="text-success mt-2">
        <i className="bi bi-check2-circle me-2"></i>
        {product.stock} unité(s) disponible(s)
      </div>
    );
  };

  const getAvailabilityMessage = () => {
    if (!availability || stockLoading) return null;
    if (!availability.available) return (
      <div className="alert alert-danger mt-2">
        <i className="bi bi-x-circle-fill me-2"></i>
        Quantité demandée non disponible. Stock actuel: {availability.availableStock}
      </div>
    );
    if (availability.availableStock === availability.requestedQuantity) return (
      <div className="alert alert-warning mt-2">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        Dernières unités disponibles !
      </div>
    );
    return null;
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Chargement du produit...</p>
      </div>
    );

  if (!product)
    return (
      <div className="text-center py-5">
        <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
        <h3 className="mt-3">Produit non trouvé</h3>
        <p className="text-muted">Le produit que vous recherchez n'existe pas.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );

  const discountPercentage =
    product.originalPrice && product.price < product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  // ✅ FIX: Use the getProductImages function
  const productImages = getProductImages();

  return (
    <div className="container py-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <button className="btn btn-link p-0" onClick={() => navigate('/')}>Accueil</button>
          </li>
          <li className="breadcrumb-item text-muted">{product.category?.name || product.category}</li>
          <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      {/* Main Product Card - Combined Image and Description */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="row g-4">
            {/* Images Section */}
            <div className="col-lg-6">
              <div className="position-relative">
                {productImages.length ? (
                  <div className="position-relative">
                    {imageLoading && (
                      <div className="position-absolute top-0 left-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                        <div className="spinner-border text-primary" role="status"></div>
                      </div>
                    )}
                    <img 
                      src={productImages[selectedImage]} 
                      alt={product.name} 
                      className={`img-fluid rounded w-100 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                      style={{ height: '400px', objectFit: 'contain' }}
                      onLoad={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  </div>
                ) : (
                  <div className="img-fluid rounded w-100 d-flex align-items-center justify-content-center bg-light" style={{ height: '400px' }}>
                    <i className="bi bi-image text-muted fs-1"></i>
                  </div>
                )}
                
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                  <span className="position-absolute top-0 start-0 badge bg-danger m-3 fs-6">
                    -{discountPercentage}%
                  </span>
                )}
                
                {/* Stock Status */}
                <div className="position-absolute top-0 end-0 m-3">
                  {getStockStatusBadge()}
                </div>
              </div>

              {/* Image Thumbnails */}
              {productImages.length > 1 && (
                <div className="mt-3">
                  <div className="d-flex gap-2 justify-content-center flex-wrap">
                    {productImages.map((img, i) => (
                      <button
                        key={i}
                        className={`btn p-0 border-2 rounded ${
                          selectedImage === i ? 'border-primary' : 'border-light'
                        }`}
                        onClick={() => {
                          setSelectedImage(i);
                          setImageLoading(true);
                        }}
                        style={{ width: '60px', height: '60px' }}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${i + 1}`}
                          className="img-fluid rounded"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = getImageUrl('https://placehold.co/400x400?text=Image');
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="col-lg-6">
              {/* Category & Brand */}
              <div className="mb-3 d-flex gap-2 flex-wrap">
                <span className="badge bg-light text-dark border">{product.category?.name || product.category}</span>
                {product.brand && <span className="badge bg-light text-dark border">{product.brand}</span>}
                {product.sku && <span className="badge bg-light text-dark border">SKU: {product.sku}</span>}
              </div>

              {/* Name & Rating */}
              <h1 className="h3 mb-3 fw-bold">{product.name}</h1>
              <div className="d-flex align-items-center mb-3">
                <div className="text-warning me-2">
                  {'★'.repeat(Math.floor(product.rating || 0))}
                  {'☆'.repeat(5 - Math.floor(product.rating || 0))}
                </div>
                <span className="text-muted">({product.reviewCount || 0} avis)</span>
              </div>

              {/* Price */}
              <div className="mb-4 p-3 bg-light rounded">
                <div className="d-flex align-items-center gap-3">
                  <span className="h3 text-primary fw-bold">{product.price.toFixed(2)} DT</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="h5 text-muted text-decoration-line-through">{product.originalPrice.toFixed(2)} DT</span>
                  )}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-success small mt-1">
                    Économisez {((product.originalPrice - product.price).toFixed(2))} DT
                  </div>
                )}
              </div>

              {/* Stock Info */}
              <div className="mb-3">
                {getStockMessage()}
              </div>

              {/* Quantity & Actions */}
              {product.stock > 0 && (
                <div className="mb-4">
                  <div className="d-flex gap-2 align-items-center mb-3">
                    <label htmlFor="quantity" className="form-label mb-0 fw-semibold">Quantité:</label>
                    <div className="input-group" style={{ width: '140px' }}>
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button" 
                        onClick={() => handleQuantityChange(quantity - 1)} 
                        disabled={quantity <= 1}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        className="form-control text-center"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button" 
                        onClick={() => handleQuantityChange(quantity + 1)} 
                        disabled={quantity >= product.stock}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                  </div>

                  {getAvailabilityMessage()}

                  <div className="d-flex gap-2">
                    <button 
                      id="addToCartBtn"
                      className="btn btn-primary flex-fill" 
                      onClick={handleAddToCart} 
                      disabled={!availability?.available || stockLoading}
                    >
                      {stockLoading ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Vérification...</>
                      ) : (
                        <><i className="bi bi-cart-plus me-2"></i>Ajouter au panier</>
                      )}
                    </button>
                    <button 
                      className="btn btn-success flex-fill" 
                      onClick={handleBuyNow} 
                      disabled={!availability?.available || stockLoading}
                    >
                      <i className="bi bi-lightning-fill me-2"></i>Acheter maintenant
                    </button>
                  </div>
                </div>
              )}

              {/* Trust Features */}
              <div className="row g-2 text-center mb-3">
                <div className="col-6">
                  <i className="bi bi-truck text-primary d-block mb-1"></i>
                  <small className="text-muted">Livraison gratuite</small>
                </div>
                <div className="col-6">
                  <i className="bi bi-arrow-left-right text-primary d-block mb-1"></i>
                  <small className="text-muted">Retour gratuit</small>
                </div>
              </div>
            </div>
          </div>

          {/* Product Description - Now inside the same card */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="border-top pt-4">
                <h5 className="fw-semibold mb-3">Description du produit</h5>
                {product.shortDescription && (
                  <p className="text-secondary mb-3">{product.shortDescription}</p>
                )}
                {product.description && (
                  <div className="text-muted">
                    {product.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2">{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-4">Produits similaires</h3>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {relatedProducts.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
