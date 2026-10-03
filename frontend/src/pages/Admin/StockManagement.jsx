import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useStock } from '../../context/StockContext';
import AdminSidebar from '../../components/Layout/AdminSidebar';
import AdminMobileHeader from '../../components/Layout/AdminMobileHeader';
import { FiPackage, FiSearch, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiXCircle, FiPlus } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageHelper'; // ✅ IMPORT CORRIGÉ

const StockManagement = () => {
  const {
    stocks: lowStockProducts,
    fetchStocks,
    fetchLowStockProducts,
    updateStock,
    stockLoading,
  } = useStock();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockInputs, setStockInputs] = useState({});

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Stats for sidebar
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 328,
    totalCustomers: 1250,
    recentOrders: [],
    stockStatus: {
      outOfStock: 0,
      lowStock: 0,
      inStock: 0,
      total: 0
    }
  });

  useEffect(() => {
    fetchAllProducts();
    fetchLowStockProducts();
  }, []);

  // ✅ FONCTION CORRIGÉE: Obtenir l'URL de l'image du produit
  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0]);
    } else if (product.image) {
      return getImageUrl(product.image);
    } else if (product.mainImage) {
      return getImageUrl(product.mainImage);
    } else {
      return getImageUrl('/images/placeholder-product.jpg');
    }
  };

  // Fetch all products (with stock)
  const fetchAllProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}"}/products?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const products = response.data.products || [];
      setAllProducts(products);
      
      // Update stats
      setStats({
        totalProducts: products.length,
        stockStatus: {
          outOfStock: products.filter(p => p.stock === 0).length,
          lowStock: products.filter(p => p.stock > 0 && p.stock <= (p.lowStockAlert || 10)).length,
          inStock: products.filter(p => p.stock > (p.lowStockAlert || 10)).length,
          total: products.length
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for stock updates
  const handleInputChange = (productId, value) => {
    setStockInputs(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Update stock handler
  const handleStockUpdate = async (productId, operation) => {
    const value = stockInputs[productId];
    
    if (!value || value < 0) {
      alert('Veuillez entrer une valeur valide');
      return;
    }

    setUpdateLoading(prev => ({ ...prev, [productId]: true }));

    try {
      const currentProduct = allProducts.find(p => p._id === productId);
      let newStockValue;
      
      if (operation === 'set') {
        newStockValue = parseInt(value);
      } else if (operation === 'add') {
        newStockValue = (currentProduct?.stock || 0) + parseInt(value);
      } else if (operation === 'subtract') {
        newStockValue = Math.max(0, (currentProduct?.stock || 0) - parseInt(value));
      }

      await updateStock(productId, newStockValue);
      
      setStockInputs(prev => ({
        ...prev,
        [productId]: ''
      }));
      
      await fetchAllProducts();
      await fetchLowStockProducts();
      
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    } finally {
      setUpdateLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Quick stock actions
  const handleQuickAction = async (productId, action) => {
    setUpdateLoading(prev => ({ ...prev, [productId]: true }));

    try {
      const currentProduct = allProducts.find(p => p._id === productId);
      let newStockValue;

      switch (action) {
        case 'increment':
          newStockValue = (currentProduct?.stock || 0) + 1;
          break;
        case 'decrement':
          newStockValue = Math.max(0, (currentProduct?.stock || 0) - 1);
          break;
        case 'set-min':
          newStockValue = currentProduct?.lowStockAlert || 10;
          break;
        default:
          return;
      }

      await updateStock(productId, newStockValue);
      await fetchAllProducts();
      await fetchLowStockProducts();
      
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    } finally {
      setUpdateLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Filter and search
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    switch (filter) {
      case 'low':
        return matchesSearch && product.stock > 0 && product.stock <= (product.lowStockAlert || 10);
      case 'out':
        return matchesSearch && product.stock === 0;
      case 'in':
        return matchesSearch && product.stock > (product.lowStockAlert || 10);
      default:
        return matchesSearch;
    }
  });

  const getStockStatus = (product) => {
    if (product.stock === 0) return { label: 'Rupture', class: 'danger', icon: FiXCircle };
    if (product.stock <= (product.lowStockAlert || 10)) return { label: 'Faible', class: 'warning', icon: FiAlertTriangle };
    return { label: 'En stock', class: 'success', icon: FiCheckCircle };
  };

  if (loading || stockLoading) {
    return (
      <div className="container-fluid py-5" style={{ background: "#f8fdf9" }}>
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ background: "#f8fdf9", minHeight: "100vh" }}>
      <div className="row">
        {/* Reusable Sidebar */}
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          stats={stats}
        />

        {/* Main Content */}
        <div className={`${sidebarCollapsed ? 'col-lg-11' : 'col-lg-10'} col-md-9`}>
          {/* Mobile Header */}
          <AdminMobileHeader 
            title="Produit" 
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/* Header */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="h5 mb-1 fw-bold text-success">
                    <FiPackage className="me-2" />
                    Produits
                  </h2>
                  <p className="text-muted small mb-0">
                    Surveillez et gérez vos niveaux de stock
                  </p>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end">
                    <Link to="/admin/products/add" className="btn btn-success d-inline-flex align-items-center">
                      <FiPlus className="me-2" />
                      Nouveau Produit
                    </Link>
                    
                    <button 
                      className="btn btn-outline-success d-inline-flex align-items-center"
                      onClick={fetchAllProducts}
                    >
                      <FiRefreshCw className="me-2" />
                      Actualiser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-success text-white">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">En Stock</h6>
                      <h2 className="mb-2 fw-bold">{stats.stockStatus.inStock}</h2>
                      <div className="bg-white bg-opacity-20 rounded-pill px-2 py-1">
                        <small>Niveau optimal</small>
                      </div>
                    </div>
                    <FiCheckCircle size={32} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-warning text-dark">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">Stock Faible</h6>
                      <h2 className="mb-2 fw-bold">{stats.stockStatus.lowStock}</h2>
                      <div className="bg-dark bg-opacity-10 rounded-pill px-2 py-1">
                        <small>À réapprovisionner</small>
                      </div>
                    </div>
                    <FiAlertTriangle size={32} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-danger text-white">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">Rupture</h6>
                      <h2 className="mb-2 fw-bold">{stats.stockStatus.outOfStock}</h2>
                      <div className="bg-white bg-opacity-20 rounded-pill px-2 py-1">
                        <small>Stock épuisé</small>
                      </div>
                    </div>
                    <FiXCircle size={32} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-info text-white">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">Total Produits</h6>
                      <h2 className="mb-2 fw-bold">{stats.totalProducts}</h2>
                      <div className="bg-white bg-opacity-20 rounded-pill px-2 py-1">
                        <small>Inventaire total</small>
                      </div>
                    </div>
                    <FiPackage size={32} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-6">
                  <label className="form-label fw-medium text-success">Rechercher</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FiSearch size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-success"
                      placeholder="Rechercher par nom de produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium text-success">Filtrer par statut</label>
                  <select
                    className="form-select border-success"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Tous les produits</option>
                    <option value="in">En stock</option>
                    <option value="low">Stock faible</option>
                    <option value="out">Rupture</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-white border-0 rounded-top-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                <FiPackage className="me-2" />
                Inventaire des Produits ({filteredProducts.length})
              </h5>
              <div className="text-muted small">
                {filteredProducts.length} produit(s) trouvé(s)
              </div>
            </div>
            
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0">Produit</th>
                      <th className="border-0">Catégorie</th>
                      <th className="border-0 text-center">Stock Actuel</th>
                      <th className="border-0 text-center">Seuil d'Alerte</th>
                      <th className="border-0 text-center">Statut</th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => {
                      const status = getStockStatus(product);
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr key={product._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              {/* ✅ CORRECTION: Utilisation de la fonction getProductImage */}
                              <img 
                                src={getProductImage(product)} 
                                alt={product.name}
                                className="rounded me-3"
                                style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = getImageUrl('/images/placeholder-product.jpg');
                                }}
                              />
                              <div>
                                <div className="fw-medium">{product.name}</div>
                                <small className="text-muted">
                                  {product.category?.name || 'Non catégorisé'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {product.category?.name || 'Non catégorisé'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`fw-bold ${
                              product.stock === 0 ? 'text-danger' : 
                              product.stock <= (product.lowStockAlert || 10) ? 'text-warning' : 'text-success'
                            }`}>
                              {product.stock} unités
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="text-muted">{product.lowStockAlert || 10}</span>
                          </td>
                          <td className="text-center">
                            <span className={`badge bg-${status.class} d-flex align-items-center justify-content-center`}
                                  style={{ minWidth: '100px' }}>
                              <StatusIcon size={14} className="me-1" />
                              {status.label}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              
                              
                              
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    <FiPackage size={32} className="mb-2" />
                    <h5>Aucun produit trouvé</h5>
                    <small>
                      {searchTerm || filter !== 'all' 
                        ? "Essayez de modifier vos critères de recherche." 
                        : "Aucun produit n'est enregistré dans votre inventaire."}
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default StockManagement;
