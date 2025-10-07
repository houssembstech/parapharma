import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiTrendingUp, FiPackage, FiClipboard, FiShoppingBag, 
  FiUser, FiTag, FiMail, FiSettings, FiLogOut, 
  FiX, FiChevronRight, FiChevronLeft, FiActivity
} from 'react-icons/fi';

const AdminSidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  stats = {}
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();

  const getActiveItem = () => {
    const path = location.pathname;
    if (path.includes('/admin/products')) return 'products';
    else if (path.includes('/admin/stock')) return 'stock';
    else if (path.includes('/admin/orders')) return 'orders';
    else if (path.includes('/admin/customers')) return 'customers';
    else if (path.includes('/admin/categories')) return 'categories';
    else if (path.includes('/admin/chat')) return 'chat';
    else if (path.includes('/admin/settings')) return 'settings';
    else return 'dashboard';
  };

  const activeItem = getActiveItem();

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
      notification: stats.recentOrders?.filter(o => o.status === 'pending').length || 0,
      description: 'Suivi des commandes'
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

  return (
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
                    {((stats.stockStatus?.inStock / (stats.totalProducts || 1)) * 100).toFixed(1)}%
                  </small>
                </div>
                <div className="progress mb-3 bg-white bg-opacity-20" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar bg-white" 
                    style={{ 
                      width: `${((stats.stockStatus?.inStock / (stats.totalProducts || 1)) * 100) || 0}%` 
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
                  {((stats.stockStatus?.inStock / (stats.totalProducts || 1)) * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;