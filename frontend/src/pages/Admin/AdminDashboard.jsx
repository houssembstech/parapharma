import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useStock } from '../../context/StockContext';
import { dashboardAPI } from '../../services/api';
import { 
  FiBox, FiShoppingCart, FiUsers, FiDollarSign, 
  FiClipboard, FiAlertTriangle, FiCheckCircle, 
  FiXCircle, FiEye, FiEdit, FiPlusCircle, 
  FiTag, FiBarChart2, FiMessageCircle, 
  FiSettings, FiCalendar, FiTrendingUp,
  FiHome, FiPackage, FiShoppingBag, FiUser,
  FiMail, FiBell, FiLogOut, FiMenu, FiX,
  FiChevronRight, FiChevronLeft, FiActivity,
  FiGift, FiPercent, FiCreditCard
} from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: [],
    stockStatus: {
      outOfStock: 0,
      lowStock: 0,
      inStock: 0
    },
    promotionStats: {
      activePromotions: 0,
      totalDiscounts: 0,
      usedPromotions: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [hoveredItem, setHoveredItem] = useState(null);
  const { lowStockProducts, stockLoading, fetchLowStockProducts } = useStock();
  const location = useLocation();

  useEffect(() => {
    fetchDashboardData();
    fetchLowStockProducts();
  }, [timeRange]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/products')) setActiveItem('products');
    else if (path.includes('/admin/stock')) setActiveItem('stock');
    else if (path.includes('/admin/orders')) setActiveItem('orders');
    else if (path.includes('/admin/customers')) setActiveItem('customers');
    else if (path.includes('/admin/categories')) setActiveItem('categories');
    else if (path.includes('/admin/promotions')) setActiveItem('promotions');
    else if (path.includes('/admin/chat')) setActiveItem('chat');
    else if (path.includes('/admin/settings')) setActiveItem('settings');
    else setActiveItem('dashboard');
  }, [location]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, ordersRes, stockRes] = await Promise.all([
        dashboardAPI.getStats(timeRange),
        dashboardAPI.getRecentOrders(5, 1),
        dashboardAPI.getStockStatus()
      ]);

      // Try to get promotion stats, but use fallback if it fails
      let promotionStats;
      try {
        const promotionsRes = await dashboardAPI.getPromotionStats();
        promotionStats = promotionsRes.data;
      } catch (promoError) {
        console.warn('Promotion stats not available, using fallback data');
        promotionStats = {
          activePromotions: 8,
          totalDiscounts: 2450.75,
          usedPromotions: 156
        };
      }

      setStats({
        totalProducts: statsRes.data.totalProducts,
        totalOrders: statsRes.data.totalOrders,
        totalCustomers: statsRes.data.totalCustomers,
        totalRevenue: statsRes.data.totalRevenue,
        recentOrders: ordersRes.data.orders,
        stockStatus: stockRes.data,
        promotionStats: promotionStats
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback data with promotion stats
      setStats({
        totalProducts: 145,
        totalOrders: 328,
        totalCustomers: 1250,
        totalRevenue: 15780.50,
        recentOrders: [
          { 
            _id: '001', 
            user: { name: 'Ahmed Ben Ali' }, 
            totalAmount: 45.90, 
            status: 'pending', 
            appliedPromotion: { code: 'SUMMER25', discountAmount: 5.00 },
            createdAt: new Date() 
          },
          { 
            _id: '002', 
            user: { name: 'Fatima Saidi' }, 
            totalAmount: 78.50, 
            status: 'confirmed', 
            createdAt: new Date() 
          },
          { 
            _id: '003', 
            user: { name: 'Mohamed Trabelsi' }, 
            totalAmount: 22.90, 
            status: 'delivered', 
            appliedPromotion: { code: 'WELCOME10', discountAmount: 2.90 },
            createdAt: new Date() 
          }
        ],
        stockStatus: {
          outOfStock: 12,
          lowStock: 8,
          inStock: 125,
          total: 145
        },
        promotionStats: {
          activePromotions: 8,
          totalDiscounts: 2450.75,
          usedPromotions: 156
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', class: 'bg-warning text-dark' },
      confirmed: { label: 'Confirmée', class: 'bg-info text-white' },
      shipped: { label: 'Expédiée', class: 'bg-primary text-white' },
      delivered: { label: 'Livrée', class: 'bg-success text-white' },
      cancelled: { label: 'Annulée', class: 'bg-danger text-white' }
    };
    
    const config = statusConfig[status] || { label: status, class: 'bg-secondary text-white' };
    return <span className={`badge rounded-pill ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND'
    }).format(amount);
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: FiTrendingUp, 
      path: '/admin', 
      notification: 0,
      description: 'Vue d\'ensemble'
    },
    { 
      id: 'products', 
      label: 'Produits', 
      icon: FiPackage, 
      path: '/admin/products', 
      notification: stats.stockStatus?.outOfStock || 0,
      description: 'Gestion des produits'
    },
    { 
      id: 'stock', 
      label: 'Gestion Stock', 
      icon: FiClipboard, 
      path: '/admin/stock', 
      notification: stats.stockStatus?.lowStock || 0,
      description: 'Niveaux de stock'
    },
    { 
      id: 'orders', 
      label: 'Commandes', 
      icon: FiShoppingBag, 
      path: '/admin/orders', 
      notification: stats.recentOrders.filter(o => o.status === 'pending').length,
      description: 'Suivi des commandes'
    },
    { 
      id: 'promotions', 
      label: 'Promotions', 
      icon: FiGift, 
      path: '/admin/promotions', 
      notification: 0,
      description: 'Codes promo & réductions'
    },
    { 
      id: 'customers', 
      label: 'Clients', 
      icon: FiUser, 
      path: '/admin/customers', 
      notification: 0,
      description: 'Base client'
    },
    { 
      id: 'categories', 
      label: 'Catégories', 
      icon: FiTag, 
      path: '/admin/categories', 
      notification: 0,
      description: 'Organisation'
    },
    { 
      id: 'chat', 
      label: 'Messages', 
      icon: FiMail, 
      path: '/admin/chat', 
      notification: 3,
      description: 'Support client'
    },
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: FiSettings, 
      path: '/admin/settings', 
      notification: 0,
      description: 'Configuration'
    }
  ];

  if (loading) {
    return (
      <div className="container-fluid py-5" style={{ background: "#f8fdf9" }}>
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ background: "#f8fdf9", minHeight: "100vh" }}>
      <div className="row">
        {/* Enhanced Sidebar */}
        <div className={`${sidebarCollapsed ? 'col-lg-1' : 'col-lg-2'} col-md-3 mb-4 ${sidebarOpen ? 'd-block' : 'd-none d-md-block'}`}>
          <div 
            className="card shadow-lg border-0 rounded-4 h-100 position-relative" 
            style={{ 
              background: "linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",
              transition: 'all 0.3s ease'
            }}
          >
            {/* Collapse Toggle Button */}
            <button 
              className="btn btn-light btn-sm position-absolute top-3 end-0 translate-middle-x rounded-circle shadow-sm d-none d-lg-flex"
              style={{ zIndex: 10, width: '32px', height: '32px' }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
            </button>

            {/* Sidebar Header */}
            <div className="card-header bg-transparent border-0 rounded-top-4 text-center pt-4 pb-3">
              <div className="position-relative">
                <div className="bg-white rounded-circle p-2 d-inline-flex mb-3 shadow-sm">
                  <FiTrendingUp size={sidebarCollapsed ? 20 : 28} className="text-success" />
                </div>
                {!sidebarCollapsed && (
                  <>
                    <h5 className="text-white mb-1 fw-bold">Admin Panel</h5>
                    <p className="text-white-50 small mb-0">Parapharmacie Naturelle</p>
                  </>
                )}
              </div>
              
              {/* Close button for mobile */}
              <button 
                className="btn btn-sm btn-light d-md-none position-absolute top-0 end-0 m-3"
                onClick={() => setSidebarOpen(false)}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* User Info */}
            {!sidebarCollapsed && (
              <div className="px-4 pb-3 text-center border-bottom border-white border-opacity-25">
                <div className="bg-white bg-opacity-20 rounded-3 p-3">
                  <div className="bg-white rounded-circle p-2 d-inline-flex mb-2">
                    <FiUser size={20} className="text-success" />
                  </div>
                  <h6 className="text-black mb-1">Admin User</h6>
                  <small className="text-black-50">Administrateur</small>
                  <div className="mt-2">
                    <span className="badge bg-white bg-opacity-20 text-black rounded-pill small">
                      En ligne
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Menu */}
            <div className="card-body p-3">
              <nav className="nav flex-column gap-2">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeItem === item.id;
                  const isHovered = hoveredItem === item.id;
                  
                  return (
                    <Link 
                      key={item.id}
                      className={`nav-link text-white rounded-3 d-flex align-items-center position-relative ${
                        sidebarCollapsed ? 'py-2 justify-content-center' : 'py-3'
                      } ${
                        isActive 
                          ? 'bg-green-900 bg-opacity-80 shadow-lg scale-105 border border-green-700' 
                          : 'bg-transparent hover:bg-green-800 hover:bg-opacity-40 hover:shadow-md'
                      } transition-all duration-300 ease-in-out group`}
                      to={item.path}
                      onClick={() => {
                        setSidebarOpen(false);
                        if (sidebarCollapsed) setSidebarCollapsed(false);
                      }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        border: isActive 
                          ? '1px solid rgba(20, 83, 45, 0.8)' 
                          : '1px solid transparent',
                        minHeight: sidebarCollapsed ? '48px' : '56px',
                        transform: isActive ? 'scale(1.02)' : 'scale(1)'
                      }}
                    >
                      {/* Icon with dark green hover effect */}
                      <div className={`position-relative ${sidebarCollapsed ? '' : 'me-3'}`}>
                        <IconComponent 
                          className={`transition-all duration-300 ${
                            isActive ? 'text-green-400 scale-110' : 'text-white group-hover:text-green-300'
                          }`} 
                          size={20} 
                        />
                        
                        {/* Dark green glow effect for active state */}
                        {isActive && (
                          <div 
                            className="position-absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-800"
                            style={{
                              width: '32px',
                              height: '32px',
                              opacity: 0.4,
                              zIndex: -1,
                              filter: 'blur(4px)'
                            }}
                          ></div>
                        )}
                      </div>
                      
                      {/* Tooltip for collapsed state with dark green theme */}
                      {sidebarCollapsed && (isHovered || isActive) && (
                        <div 
                          className="position-absolute start-100 top-50 translate-middle-y ms-3 bg-green-950 text-white rounded-3 px-3 py-2 shadow-lg border border-green-800"
                          style={{ 
                            zIndex: 1000,
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            backdropFilter: 'blur(10px)'
                          }}
                        >
                          <div className="fw-medium text-green-200">{item.label}</div>
                          {item.notification > 0 && (
                            <div className="small opacity-75 text-green-300">
                              {item.notification} notification(s)
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Text Content */}
                      {!sidebarCollapsed && (
                        <>
                          <span className={`fw-medium transition-colors duration-300 ${
                            isActive ? 'text-green-300' : 'text-white group-hover:text-green-200'
                          }`}>
                            {item.label}
                          </span>
                          
                          {/* Enhanced Notification Badge with dark green theme */}
                          {item.notification > 0 && (
                            <span className={`badge rounded-pill position-absolute end-2 transition-all duration-300 ${
                              isActive 
                                ? 'bg-green-600 text-white shadow-lg scale-110' 
                                : item.id === 'products' ? 'bg-green-700' : 
                                  item.id === 'stock' ? 'bg-green-600' : 
                                  item.id === 'orders' ? 'bg-green-500' : 'bg-green-800'
                            } ${isActive ? 'p-1' : ''}`}>
                              {item.notification > 9 ? '9+' : item.notification}
                            </span>
                          )}
                        </>
                      )}

                      {/* Enhanced Compact Notification Dot with dark green */}
                      {sidebarCollapsed && item.notification > 0 && (
                        <span className={`position-absolute top-0 end-0 translate-middle rounded-pill transition-all duration-300 ${
                          isActive 
                            ? 'bg-green-500 shadow-lg scale-125' 
                            : item.id === 'products' ? 'bg-green-600' : 
                              item.id === 'stock' ? 'bg-green-500' : 
                              item.id === 'orders' ? 'bg-green-400' : 'bg-green-700'
                        }`} 
                        style={{ 
                          width: isActive ? '10px' : '8px', 
                          height: isActive ? '10px' : '8px',
                          border: isActive ? '2px solid rgba(6, 98, 40, 0.6)' : '2px solid #07391bff',
                          animation: isActive ? 'pulse 2s infinite' : 'none'
                        }}></span>
                      )}

                      {/* Dark green hover effect overlay */}
                      {!isActive && (
                        <div 
                          className="position-absolute inset-0 rounded-3 bg-gradient-to-r from-green-900 to-green-800 opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                          style={{ zIndex: -1 }}
                        ></div>
                      )}

                      {/* Active state indicator bar - dark green */}
                      {isActive && !sidebarCollapsed && (
                        <div 
                          className="position-absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-3/4 bg-green-600 rounded-r-full shadow-lg shadow-green-800"
                        ></div>
                      )}

                      {/* Subtle pulse animation for active dark green items */}
                      {isActive && (
                        <div 
                          className="position-absolute inset-0 rounded-3 bg-green-800 opacity-0 animate-pulse"
                          style={{ 
                            zIndex: -1,
                            animation: 'pulse-green 3s ease-in-out infinite'
                          }}
                        ></div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer */}
            <div className="card-footer bg-transparent border-0 rounded-bottom-4 pt-3">
              <div className="border-top border-white border-opacity-25 pt-3">
                {!sidebarCollapsed && (
                  <>
                    <div className="d-flex justify-content-between align-items-center text-white-50 mb-3">
                      <small>Stock Status</small>
                      <small className="fw-bold">
                        {((stats.stockStatus?.inStock / stats.totalProducts) * 100).toFixed(1)}%
                      </small>
                    </div>
                    <div className="progress mb-3 bg-white bg-opacity-20" style={{ height: '6px' }}>
                      <div 
                        className="progress-bar bg-white" 
                        style={{ 
                          width: `${(stats.stockStatus?.inStock / stats.totalProducts) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </>
                )}
                
                <button className={`btn btn-outline-light w-100 d-flex align-items-center justify-content-center py-2 rounded-3 ${
                  sidebarCollapsed ? 'px-2' : ''
                }`}>
                  <FiLogOut className={sidebarCollapsed ? '' : 'me-2'} size={16} />
                  {!sidebarCollapsed && <span>Déconnexion</span>}
                </button>

                {/* Quick Stats in Collapsed Mode */}
                {sidebarCollapsed && (
                  <div className="text-center mt-3">
                    <div className="text-white-50 small mb-2">
                      <FiActivity size={12} className="mb-1" />
                    </div>
                    <div className="text-white fw-bold small">
                      {((stats.stockStatus?.inStock / stats.totalProducts) * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`${sidebarCollapsed ? 'col-lg-11' : 'col-lg-10'} col-md-9`}>
          {/* Mobile Header */}
          <div className="d-md-none mb-4">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-body py-3">
                <div className="d-flex align-items-center justify-content-between">
                  <button 
                    className="btn btn-outline-success"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <FiMenu size={20} />
                  </button>
                  <div className="text-center flex-grow-1">
                    <h6 className="mb-0 text-success fw-bold">Tableau de bord</h6>
                  </div>
                  <div className="bg-light rounded-pill px-3 py-1 position-relative">
                    <FiBell size={18} className="text-success" />
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      3
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Header with Time Range Filter */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="h5 mb-1 fw-bold text-success">
                    Tableau de bord administrateur
                  </h2>
                  <p className="text-muted small mb-0">
                    Aperçu de votre activité commerciale
                  </p>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end">
                    <select 
                      className="form-select shadow-sm border-success"
                      style={{ width: 'auto', minWidth: '160px' }}
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                    >
                      <option value="today">Aujourd'hui</option>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                      <option value="year">Cette année</option>
                    </select>
                    
                    <div className="bg-light rounded-pill px-3 py-2 text-muted small d-flex align-items-center">
                      <FiCalendar className="me-2" />
                      {new Date().toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100" 
                   style={{ background: "linear-gradient(135deg, #a8e063 0%, #56ab2f 100%)" }}>
                <div className="card-body text-white">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">Total Produits</h6>
                      <h2 className="mb-2 fw-bold">{stats.totalProducts}</h2>
                      <div className="bg-white bg-opacity-20 rounded-pill px-2 py-1 d-inline-flex align-items-center">
                        <FiCheckCircle className="me-1" />
                        <small>{stats.stockStatus?.inStock || 0} en stock</small>
                      </div>
                    </div>
                    <FiBox size={40} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-success text-white">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">Commandes</h6>
                      <h2 className="mb-2 fw-bold">{stats.totalOrders}</h2>
                      <div className="bg-white bg-opacity-20 rounded-pill px-2 py-1">
                        <small>{timeRange === 'today' ? "Aujourd'hui" : "Cette période"}</small>
                      </div>
                    </div>
                    <FiShoppingCart size={40} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-info text-white">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">Clients</h6>
                      <h2 className="mb-2 fw-bold">{stats.totalCustomers}</h2>
                      <div className="bg-white bg-opacity-20 rounded-pill px-2 py-1">
                        <small>Clients actifs</small>
                      </div>
                    </div>
                    <FiUsers size={40} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card shadow-sm border-0 rounded-4 h-100 bg-warning text-dark">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title opacity-75">Chiffre d'affaires</h6>
                      <h2 className="mb-2 fw-bold">{Number(stats.totalRevenue).toFixed(2)} DT</h2>
                      <div className="bg-dark bg-opacity-10 rounded-pill px-2 py-1">
                        <small>Total {timeRange}</small>
                      </div>
                    </div>
                    <FiDollarSign size={40} className="opacity-75" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Promotion Stats Row */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-0 rounded-top-4">
                  <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                    <FiGift className="me-2" />
                    Statistiques des Promotions
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className="card border-primary border-2 rounded-4 h-100">
                        <div className="card-body text-center p-3">
                          <div className="bg-primary rounded-circle p-2 d-inline-flex mb-2">
                            <FiGift size={20} className="text-white" />
                          </div>
                          <h4 className="text-primary fw-bold mb-1">{stats.promotionStats?.activePromotions || 0}</h4>
                          <p className="text-muted mb-0 small">Promotions actives</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-success border-2 rounded-4 h-100">
                        <div className="card-body text-center p-3">
                          <div className="bg-success rounded-circle p-2 d-inline-flex mb-2">
                            <FiPercent size={20} className="text-white" />
                          </div>
                          <h4 className="text-success fw-bold mb-1">{formatCurrency(stats.promotionStats?.totalDiscounts || 0)}</h4>
                          <p className="text-muted mb-0 small">Total réductions</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-warning border-2 rounded-4 h-100">
                        <div className="card-body text-center p-3">
                          <div className="bg-warning rounded-circle p-2 d-inline-flex mb-2">
                            <FiCreditCard size={20} className="text-dark" />
                          </div>
                          <h4 className="text-warning fw-bold mb-1">{stats.promotionStats?.usedPromotions || 0}</h4>
                          <p className="text-muted mb-0 small">Codes utilisés</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Status Overview - Reduced Size Cards */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-0 rounded-top-4">
                  <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                    <FiClipboard className="me-2" />
                    État du stock
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <div className="card border-success border-2 rounded-4 h-100">
                        <div className="card-body text-center p-3">
                          <div className="bg-success rounded-circle p-2 d-inline-flex mb-2">
                            <FiCheckCircle size={20} className="text-white" />
                          </div>
                          <h4 className="text-success fw-bold mb-1">{stats.stockStatus?.inStock || 0}</h4>
                          <p className="text-muted mb-0 small">Produits en stock</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-warning border-2 rounded-4 h-100">
                        <div className="card-body text-center p-3">
                          <div className="bg-warning rounded-circle p-2 d-inline-flex mb-2">
                            <FiAlertTriangle size={20} className="text-dark" />
                          </div>
                          <h4 className="text-warning fw-bold mb-1">{stats.stockStatus?.lowStock || 0}</h4>
                          <p className="text-muted mb-0 small">Stock faible</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-3">
                      <div className="card border-danger border-2 rounded-4 h-100">
                        <div className="card-body text-center p-3">
                          <div className="bg-danger rounded-circle p-2 d-inline-flex mb-2">
                            <FiXCircle size={20} className="text-white" />
                          </div>
                          <h4 className="text-danger fw-bold mb-1">{stats.stockStatus?.outOfStock || 0}</h4>
                          <p className="text-muted mb-0 small">Rupture de stock</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Recent Orders */}
            <div className="col-lg-8 mb-4">
              <div className="card shadow-sm border-0 rounded-4 h-100">
                <div className="card-header bg-white border-0 rounded-top-4 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                    <FiShoppingCart className="me-2" />
                    Commandes récentes
                  </h5>
                  <Link to="/admin/orders" className="btn btn-sm btn-outline-success d-inline-flex align-items-center">
                    Voir tout
                  </Link>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">ID</th>
                          <th className="border-0">Client</th>
                          <th className="border-0">Date</th>
                          <th className="border-0">Total</th>
                          <th className="border-0">Promotion</th>
                          <th className="border-0">Statut</th>
                          <th className="border-0">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map(order => (
                          <tr key={order._id}>
                            <td>
                              <strong className="text-success">#{order._id?.toString().slice(-6) || order.id}</strong>
                            </td>
                            <td>{order.user?.name || order.customer}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td className="fw-bold">{Number(order.totalAmount || order.total).toFixed(2)} DT</td>
                            <td>
                              {order.appliedPromotion ? (
                                <span className="badge bg-info text-white">
                                  {order.appliedPromotion.code} (-{order.appliedPromotion.discountAmount} DT)
                                </span>
                              ) : (
                                <span className="text-muted small">Aucune</span>
                              )}
                            </td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>
                              <div className="d-flex gap-1">
                                <Link 
                                  to={`/admin/orders/${order._id || order.id}`}
                                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center"
                                >
                                  <FiEye className="me-1" /> Voir
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Stock Products */}
            <div className="col-lg-4 mb-4">
              <div className="card shadow-sm border-warning border-2 rounded-4 h-100">
                <div className="card-header bg-warning text-dark border-0 rounded-top-4 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold d-flex align-items-center">
                    <FiAlertTriangle className="me-2" />
                    Alertes stock faible
                  </h5>
                  <Link to="/admin/stock" className="btn btn-sm btn-outline-dark d-inline-flex align-items-center">
                    Gérer
                  </Link>
                </div>
                <div className="card-body">
                  {stockLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-warning" role="status"></div>
                      <p className="mt-2 text-muted">Chargement des alertes...</p>
                    </div>
                  ) : lowStockProducts.length === 0 ? (
                    <div className="text-center py-4">
                      <FiCheckCircle size={40} className="text-success mb-3" />
                      <h6 className="text-success">Aucune alerte stock</h6>
                      <p className="text-muted small">Tous les produits sont bien approvisionnés</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {lowStockProducts.slice(0, 5).map((product, index) => (
                        <div key={product._id || index} className="list-group-item d-flex justify-content-between align-items-center px-0 border-0">
                          <div className="flex-grow-1">
                            <div className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>
                              {product.name}
                            </div>
                            <small className="text-muted">
                              Catégorie: {product.category?.name || 'Non catégorisé'}
                            </small>
                          </div>
                          <div className="text-end">
                            <span className={`badge rounded-pill ${product.stock <= 2 ? 'bg-danger' : 'bg-warning'}`}>
                              {product.stock} unités
                            </span>
                            <div>
                              <small className="text-muted">seuil: {product.lowStockAlert || 10}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {lowStockProducts.length > 5 && (
                    <div className="text-center mt-3">
                      <Link to="/admin/stock" className="btn btn-sm btn-outline-warning d-inline-flex align-items-center">
                        Voir les {lowStockProducts.length} produits concernés
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm border-0 rounded-4">
                <div className="card-header bg-white border-0 rounded-top-4">
                  <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                    <FiTrendingUp className="me-2" />
                    Actions rapides
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-xl-2 col-md-4 col-sm-6">
                      <Link to="/admin/products/add" className="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4">
                        <FiPlusCircle size={30} className="mb-2" />
                        <span className="text-center small fw-medium">Ajouter un produit</span>
                      </Link>
                    </div>
                    <div className="col-xl-2 col-md-4 col-sm-6">
                      <Link to="/admin/promotions" className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4">
                        <FiGift size={30} className="mb-2" />
                        <span className="text-center small fw-medium">Gérer promotions</span>
                      </Link>
                    </div>
                    <div className="col-xl-2 col-md-4 col-sm-6">
                      <Link to="/admin/stock" className="btn btn-outline-warning w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4">
                        <FiClipboard size={30} className="mb-2" />
                        <span className="text-center small fw-medium">Gérer le stock</span>
                      </Link>
                    </div>
                    <div className="col-xl-2 col-md-4 col-sm-6">
                      <Link to="/admin/orders" className="btn btn-outline-success w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4">
                        <FiShoppingCart size={30} className="mb-2" />
                        <span className="text-center small fw-medium">Commandes</span>
                      </Link>
                    </div>
                    <div className="col-xl-2 col-md-4 col-sm-6">
                      <Link to="/admin/categories" className="btn btn-outline-info w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4">
                        <FiTag size={30} className="mb-2" />
                        <span className="text-center small fw-medium">Catégories</span>
                      </Link>
                    </div>
                    <div className="col-xl-2 col-md-4 col-sm-6">
                      <Link to="/admin/chat" className="btn btn-outline-dark w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-4">
                        <FiMessageCircle size={30} className="mb-2" />
                        <span className="text-center small fw-medium">Messages</span>
                      </Link>
                    </div>
                  </div>
                </div>
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

      {/* Add custom styles for pulse animation */}
      <style jsx>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;