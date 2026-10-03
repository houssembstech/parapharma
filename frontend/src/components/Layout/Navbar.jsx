// src/components/Layout/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { darkMode, setDarkMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [cartHovered, setCartHovered] = useState(false);

  // Track viewport size
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate dropdown position respecting viewport
  useEffect(() => {
    if (showUserDropdown && dropdownRef.current && dropdownMenuRef.current) {
      const buttonRect = dropdownRef.current.getBoundingClientRect();
      const menuHeight = dropdownMenuRef.current.offsetHeight;
      const menuWidth = dropdownMenuRef.current.offsetWidth;
      const padding = 10;

      let top = buttonRect.bottom + 8;
      let left = buttonRect.right - menuWidth;

      if (top + menuHeight > viewportSize.height - padding) {
        top = buttonRect.top - menuHeight - 8;
      }

      if (left + menuWidth > viewportSize.width - padding) {
        left = viewportSize.width - menuWidth - padding;
      }

      if (left < padding) {
        left = padding;
      }

      setDropdownPosition({ top, left });
    }
  }, [showUserDropdown, viewportSize]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

  // 🔥 CORRECTION : Redirection conditionnelle après login
  useEffect(() => {
    // Seulement rediriger si l'utilisateur est authentifié ET sur login/register
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);



  const handleLogout = () => {
    logout();
    // 🔥 CORRECTION : Rediriger vers l'accueil après déconnexion
    navigate('/');
    setShowMobileMenu(false);
    setShowUserDropdown(false);
  };

  const cartItemsCount = getCartItemsCount();

  const handleNavLinkClick = (path) => {
    navigate(path);
    setShowMobileMenu(false);
    setShowUserDropdown(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Check if user has admin/employer role
  const hasAdminAccess = user && ['admin', 'employer_product', 'employer_order'].includes(user.role);

  // Get role badge color and text
  const getRoleBadge = () => {
    if (!user?.role) return null;
    
    const roleConfig = {
      admin: { class: 'bg-warning text-dark', text: 'Admin' },
      employer_product: { class: 'bg-info text-white', text: 'Product Manager' },
      employer_order: { class: 'bg-success text-white', text: 'Order Manager' },
      customer: { class: 'bg-secondary text-white', text: 'Customer' }
    };
    
    const config = roleConfig[user.role] || { class: 'bg-secondary text-white', text: user.role };
    return (
      <span className={`badge ${config.class} mt-1`}>
        {config.text}
      </span>
    );
  };

  return (
    <nav
      className={`navbar navbar-expand-lg sticky-top premium-navbar ${
        scrolled 
          ? darkMode 
            ? 'navbar-dark bg-dark shadow-premium' 
            : 'navbar-light bg-white shadow-premium'
          : darkMode 
            ? 'navbar-dark bg-dark bg-opacity-90' 
            : 'navbar-light bg-white bg-opacity-95'
      }`}
      style={{
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
        zIndex: 1000,
        borderBottom: scrolled ? (darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)') : 'none'
      }}
    >
      <div className="container-fluid px-3 px-md-4">
        {/* Logo */}
        <Link
          className="navbar-brand d-flex align-items-center fw-bold fs-4 text-decoration-none premium-logo"
          to="/"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="position-relative logo-container">
            <i className="bi bi-capsule-pill text-primary fs-2 me-2"></i>
            <div className="logo-glow"></div>
          </div>
          <div className="logo-text">
            <span className="text-primary fw-bold">Parapharma</span>
            <span className={`fw-bold ${darkMode ? 'text-light' : 'text-dark'}`}>25</span>
          </div>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="navbar-toggler premium-toggler border-0 p-2"
          type="button"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Toggle navigation"
        >
          <span className={`navbar-toggler-icon ${showMobileMenu ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Navbar content */}
        <div
          className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`}
        >
          {/* Navigation Links */}
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item mx-2">
              <Link
                className={`nav-link fw-semibold premium-nav-link position-relative px-3 py-2 rounded ${
                  isActiveRoute('/') 
                    ? 'text-primary active-link' 
                    : darkMode ? 'text-light hover-glow' : 'text-dark hover-glow'
                }`}
                to="/"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="bi bi-house me-2"></i>
                Accueil
                {isActiveRoute('/') && <span className="active-indicator"></span>}
              </Link>
            </li>

            <li className="nav-item mx-2">
              <Link
                className={`nav-link fw-semibold premium-nav-link position-relative px-3 py-2 rounded ${
                  isActiveRoute('/products') 
                    ? 'text-primary active-link' 
                    : darkMode ? 'text-light hover-glow' : 'text-dark hover-glow'
                }`}
                to="/products"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="bi bi-grid me-2"></i>
                Produits
                {isActiveRoute('/products') && <span className="active-indicator"></span>}
              </Link>
            </li>

            <li className="nav-item mx-2">
              <Link
                className={`nav-link fw-semibold premium-nav-link position-relative px-3 py-2 rounded ${
                  isActiveRoute('/categories') 
                    ? 'text-primary active-link' 
                    : darkMode ? 'text-light hover-glow' : 'text-dark hover-glow'
                }`}
                to="/categories"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="bi bi-tags me-2"></i>
                Catégories
                {isActiveRoute('/categories') && <span className="active-indicator"></span>}
              </Link>
            </li>

            {hasAdminAccess && (
              <li className="nav-item mx-2">
                <Link
                  className={`nav-link fw-semibold premium-nav-link position-relative px-3 py-2 rounded ${
                    isActiveRoute('/admin') 
                      ? 'text-warning active-link' 
                      : darkMode ? 'text-light hover-glow' : 'text-dark hover-glow'
                  }`}
                  to="/admin"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                  {isActiveRoute('/admin') && <span className="active-indicator"></span>}
                </Link>
              </li>
            )}

            
          </ul>

          {/* Right Section */}
          <ul className="navbar-nav align-items-center gap-2">
            {/* Premium Theme Toggle */}
            <li className="nav-item">
              <div className="premium-theme-toggle">
                <button
                  className={`theme-toggle-btn ${darkMode ? 'dark' : 'light'}`}
                  onClick={() => setDarkMode(!darkMode)}
                  title={darkMode ? 'Mode clair' : 'Mode sombre'}
                  aria-label="Toggle theme"
                >
                  <div className="toggle-track">
                    <div className="toggle-thumb">
                      <i className={`bi ${darkMode ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
                    </div>
                  </div>
                  <span className="toggle-label">
                    {darkMode ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>
            </li>

            {/* Premium Cart Button */}
            <li className="nav-item">
              <Link
                className={`premium-cart-btn position-relative ${
                  isActiveRoute('/cart') ? 'active' : ''
                } ${darkMode ? 'dark' : 'light'}`}
                to="/cart"
                onMouseEnter={() => setCartHovered(true)}
                onMouseLeave={() => setCartHovered(false)}
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="cart-icon-wrapper">
                  <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <div className={`cart-glow ${cartHovered ? 'active' : ''}`}></div>
                </div>

                {cartItemsCount > 0 && (
                  <>
                    <span className="premium-badge">
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </span>
                    <span className="badge-glow"></span>
                  </>
                )}
              </Link>
            </li>

            {/* Authentication Section */}
            {isAuthenticated ? (
              <>
                {/* Premium User Dropdown */}
                <li className="nav-item dropdown position-relative" ref={dropdownRef}>
                  <button
                    className={`premium-user-btn fw-semibold border-0 d-flex align-items-center ${
                      darkMode ? 'dark' : 'light'
                    }`}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    aria-expanded={showUserDropdown}
                  >
                    <div className="user-avatar">
                      <i className="bi bi-person-circle"></i>
                      {hasAdminAccess && (
                        <span className="admin-badge">
                          <i className="bi bi-star-fill"></i>
                        </span>
                      )}
                    </div>
                    <span className="d-none d-md-inline user-name">
                      {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                    </span>
                    <i className={`bi bi-chevron-down ms-2 chevron-icon ${showUserDropdown ? 'open' : ''}`}></i>
                  </button>

                  {/* Custom Positioned Dropdown Menu */}
                  {showUserDropdown && (
                    <div
                      ref={dropdownMenuRef}
                      className={`premium-dropdown-menu shadow-lg border-0 rounded-3 ${darkMode ? 'dark' : 'light'}`}
                      style={{
                        position: 'fixed',
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        minWidth: '260px',
                        maxWidth: '90vw',
                        zIndex: 2000,
                        maxHeight: '80vh',
                        overflowY: 'auto'
                      }}
                    >
                      {/* User Info */}
                      <div className="user-info-header">
                        <div className="user-avatar-large">
                          <i className="bi bi-person-circle"></i>
                        </div>
                        <div className="user-details">
                          <div className="fw-semibold">{user?.name || 'Utilisateur'}</div>
                          <small className="text-muted">{user?.email}</small>
                          {getRoleBadge()}
                        </div>
                      </div>

                      {/* User Links */}
                      <div className="dropdown-items-container">
                        

                        <button
                          className="premium-dropdown-item"
                          onClick={() => handleNavLinkClick('/orders')}
                        >
                          <div className="item-icon">
                            <i className="bi bi-bag"></i>
                          </div>
                          <div className="item-content">
                            <div className="fw-medium">Mes Commandes</div>
                            <small>Historique des achats</small>
                          </div>
                        </button>

                        {user?.role === 'customer' && (
                          <button
                            className="premium-dropdown-item"
                            onClick={() => handleNavLinkClick('/chat')}
                          >
                            <div className="item-icon">
                              <i className="bi bi-chat"></i>
                            </div>
                            <div className="item-content">
                              <div className="fw-medium">Assistance</div>
                              <small>Support 24/7</small>
                            </div>
                          </button>
                        )}

                        {hasAdminAccess && (
                          <>
                            <div className="dropdown-divider"></div>
                            
                            <div className="dropdown-section-header">
                              <small className="text-muted fw-bold">ADMINISTRATION</small>
                            </div>

                            {user?.role === 'admin' && (
                              <>
                                <button
                                  className="premium-dropdown-item admin-item"
                                  onClick={() => handleNavLinkClick('/admin/chat')}
                                >
                                  <div className="item-icon">
                                    <i className="bi bi-chat-dots"></i>
                                  </div>
                                  <div className="item-content">
                                    <div className="fw-medium">Chat Admin</div>
                                    <small>Support clients</small>
                                  </div>
                                </button>

                                <button
                                  className="premium-dropdown-item admin-item"
                                  onClick={() => handleNavLinkClick('/admin/customers')}
                                >
                                  <div className="item-icon">
                                    <i className="bi bi-people"></i>
                                  </div>
                                  <div className="item-content">
                                    <div className="fw-medium">Gestion Utilisateurs</div>
                                    <small>Clients et employés</small>
                                  </div>
                                </button>
                              </>
                            )}

                            {(user?.role === 'admin' || user?.role === 'employer_product') && (
                              <button
                                className="premium-dropdown-item admin-item"
                                onClick={() => handleNavLinkClick('/admin/products')}
                              >
                                <div className="item-icon">
                                  <i className="bi bi-box"></i>
                                </div>
                                <div className="item-content">
                                  <div className="fw-medium">Gestion Produits</div>
                                  <small>Stock et inventaire</small>
                                </div>
                              </button>
                            )}

                            {(user?.role === 'admin' || user?.role === 'employer_order') && (
                              <button
                                className="premium-dropdown-item admin-item"
                                onClick={() => handleNavLinkClick('/admin/orders')}
                              >
                                <div className="item-icon">
                                  <i className="bi bi-cart-check"></i>
                                </div>
                                <div className="item-content">
                                  <div className="fw-medium">Gestion Commandes</div>
                                  <small>Suivi des ventes</small>
                                </div>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="dropdown-divider"></div>
                      <button
                        className="premium-dropdown-item logout-item"
                        onClick={handleLogout}
                      >
                        <div className="item-icon">
                          <i className="bi bi-box-arrow-right"></i>
                        </div>
                        <div className="item-content">
                          <div className="fw-medium">Déconnexion</div>
                          <small>Quitter la session</small>
                        </div>
                      </button>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                {/* Login & Register Buttons */}
                <li className="nav-item">
                  <button
                    className="premium-btn premium-btn-outline"
                    onClick={() => handleNavLinkClick('/login')}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Connexion
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className="premium-btn premium-btn-primary"
                    onClick={() => handleNavLinkClick('/register')}
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    S'inscrire
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Premium CSS Styles */}
      <style>{`
        /* ===== NAVBAR STYLES ===== */
        .premium-navbar {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .shadow-premium {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        /* ===== LOGO STYLES ===== */
        .logo-container {
          position: relative;
          display: inline-block;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, rgba(13, 110, 253, 0.2) 0%, transparent 70%);
          border-radius: 50%;
          animation: logoPulse 3s ease-in-out infinite;
        }

        @keyframes logoPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }

        /* ===== PREMIUM THEME TOGGLE ===== */
        .premium-theme-toggle {
          display: inline-block;
        }

        .theme-toggle-btn {
          position: relative;
          width: 60px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0;
          transition: all 0.3s ease;
        }

        .toggle-track {
          position: relative;
          width: 50px;
          height: 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          padding: 2px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
        }

        .toggle-thumb {
          position: relative;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          font-size: 14px;
          color: #fbbf24;
        }

        .theme-toggle-btn.dark .toggle-track {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        }

        .theme-toggle-btn.dark .toggle-thumb {
          transform: translateX(22px);
          color: #60a5fa;
        }

        .theme-toggle-btn.light .toggle-thumb {
          transform: translateX(0);
        }

        .toggle-label {
          font-size: 16px;
          display: none;
        }

        @media (max-width: 768px) {
          .toggle-label {
            display: inline-block;
          }
          .theme-toggle-btn {
            width: auto;
            gap: 12px;
          }
          .toggle-track {
            width: 44px;
            height: 24px;
          }
          .toggle-thumb {
            width: 20px;
            height: 20px;
            font-size: 12px;
          }
          .theme-toggle-btn.dark .toggle-thumb {
            transform: translateX(20px);
          }
        }

        /* ===== PREMIUM CART BUTTON ===== */
        .premium-cart-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.3s ease;
          background: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }

        .premium-cart-btn.light {
          background: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }

        .premium-cart-btn.dark {
          background: rgba(96, 165, 250, 0.15);
          color: #60a5fa;
        }

        .premium-cart-btn:hover {
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.2) 0%, rgba(13, 110, 253, 0.15) 100%);
          transform: scale(1.08);
        }

        .premium-cart-btn.active {
          background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
          color: white;
        }

        .cart-icon-wrapper {
          position: relative;
          display: inline-block;
        }

        .cart-icon {
          width: 24px;
          height: 24px;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: all 0.3s ease;
        }

        .cart-glow {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 56px;
          height: 56px;
          background: radial-gradient(circle, rgba(13, 110, 253, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .cart-glow.active {
          opacity: 1;
          animation: cartGlow 2s ease-in-out infinite;
        }

        @keyframes cartGlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        .premium-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-size: 11px;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 12px;
          min-width: 24px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
          animation: badgePulse 2s ease-in-out infinite;
        }

        .badge-glow {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 32px;
          height: 32px;
          background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: badgeGlow 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @keyframes badgeGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }

        /* ===== PREMIUM USER BUTTON ===== */
        .premium-user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(13, 110, 253, 0.08);
          border-radius: 12px;
          transition: all 0.3s ease;
          cursor: pointer;
          color: inherit;
        }

        .premium-user-btn.light {
          background: rgba(13, 110, 253, 0.08);
          color: #212529;
        }

        .premium-user-btn.dark {
          background: rgba(96, 165, 250, 0.1);
          color: #f1f5f9;
        }

        .premium-user-btn:hover {
          background: rgba(13, 110, 253, 0.15);
          transform: translateY(-2px);
        }

        .user-avatar {
          position: relative;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
        }

        .admin-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
        }

        .chevron-icon {
          transition: transform 0.3s ease;
          font-size: 14px;
        }

        .chevron-icon.open {
          transform: rotate(180deg);
        }

        /* ===== PREMIUM DROPDOWN MENU ===== */
        .premium-dropdown-menu {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 16px;
          animation: dropdownSlideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .premium-dropdown-menu.light {
          background: rgba(255, 255, 255, 0.95) !important;
          border-color: rgba(0, 0, 0, 0.08);
        }

        .premium-dropdown-menu.dark {
          background: rgba(30, 41, 59, 0.95) !important;
          border-color: rgba(255, 255, 255, 0.1);
        }

        @keyframes dropdownSlideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .user-info-header {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .user-avatar-large {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          flex-shrink: 0;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .user-details > div:first-child {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-details > small {
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-items-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dropdown-section-header {
          padding: 8px 12px 4px;
        }

        .premium-dropdown-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          font-size: 14px;
        }

        .premium-dropdown-item:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
          transform: translateX(4px);
        }

        .premium-dropdown-item.admin-item:hover {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.12) 100%);
        }

        .premium-dropdown-item.logout-item:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.12) 100%);
        }

        .item-icon {
          width: 36px;
          height: 36px;
          background: rgba(13, 110, 253, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d6efd;
          font-size: 16px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .premium-dropdown-item:hover .item-icon {
          background: #0d6efd;
          color: white;
          transform: scale(1.1);
        }

        .premium-dropdown-item.admin-item:hover .item-icon {
          background: #fbbf24;
          color: #212529;
        }

        .premium-dropdown-item.logout-item:hover .item-icon {
          background: #ef4444;
          color: white;
        }

        .item-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .item-content > div {
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-content > small {
          font-size: 12px;
          opacity: 0.6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
          margin: 8px 0;
        }

        .premium-dropdown-menu.dark .dropdown-divider {
          background: rgba(255, 255, 255, 0.1);
        }

        /* ===== PREMIUM BUTTONS ===== */
        .premium-btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .premium-btn-outline {
          background: transparent;
          color: #0d6efd;
          border: 2px solid #0d6efd;
        }

        .premium-btn-outline:hover {
          background: rgba(13, 110, 253, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
        }

        .premium-btn-primary {
          background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }

        .premium-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(13, 110, 253, 0.4);
        }

        /* ===== PREMIUM NAV LINKS ===== */
        .premium-nav-link {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .premium-nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.1) 0%, rgba(13, 110, 253, 0.05) 100%);
          transition: left 0.3s ease;
          border-radius: 8px;
        }

        .premium-nav-link:hover::before {
          left: 0;
        }

        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          background: linear-gradient(90deg, #0d6efd 0%, #0dcaf0 100%);
          border-radius: 2px;
          animation: activeIndicator 0.3s ease;
        }

        @keyframes activeIndicator {
          from {
            width: 0;
          }
          to {
            width: 20px;
          }
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 768px) {
          .premium-navbar {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
          }

          .user-name {
            display: none !important;
          }

          .premium-dropdown-item {
            padding: 10px;
          }

          .item-icon {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

          .premium-btn {
            padding: 8px 16px;
            font-size: 13px;
          }
        }

        /* ===== SCROLLBAR ===== */
        .premium-dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }

        .premium-dropdown-menu::-webkit-scrollbar-track {
          background: transparent;
        }

        .premium-dropdown-menu::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
        }

        .premium-dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5568d3 0%, #6a3f91 100%);
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
