// src/components/Layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect user after login
  useEffect(() => {
    if (
      isAuthenticated &&
      (location.pathname === '/login' || location.pathname === '/register')
    ) {
      navigate('/');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Apply theme to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('bg-dark', 'text-light');
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.body.classList.remove('bg-dark', 'text-light');
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  return (
    <nav
      className={`navbar navbar-expand-lg sticky-top transition-all ${
        scrolled 
          ? darkMode 
            ? 'navbar-dark bg-dark shadow-lg' 
            : 'navbar-light bg-white shadow-lg'
          : darkMode 
            ? 'navbar-dark bg-dark bg-opacity-90' 
            : 'navbar-light bg-white bg-opacity-95'
      }`}
      style={{
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <div className="container">
        {/* Logo */}
        <Link
          className="navbar-brand d-flex align-items-center fw-bold fs-4 text-decoration-none"
          to="/"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="position-relative">
            <i className="bi bi-capsule-pill text-primary fs-2 me-2"></i>
            <div className="position-absolute top-0 start-0 bg-primary rounded-circle opacity-25"
                 style={{ width: '30px', height: '30px', transform: 'translate(5px, 5px)' }}></div>
          </div>
          <div>
            <span className="text-primary">Pharma</span>
            <span className="text-dark">TN</span>
          </div>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="navbar-toggler border-0 p-2"
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
                className={`nav-link fw-semibold position-relative px-3 py-2 rounded ${
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
                className={`nav-link fw-semibold position-relative px-3 py-2 rounded ${
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
                className={`nav-link fw-semibold position-relative px-3 py-2 rounded ${
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

            <li className="nav-item mx-2">
              <Link
                className={`nav-link fw-semibold position-relative px-3 py-2 rounded ${
                  isActiveRoute('/about') 
                    ? 'text-primary active-link' 
                    : darkMode ? 'text-light hover-glow' : 'text-dark hover-glow'
                }`}
                to="/about"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="bi bi-info-circle me-2"></i>
                À propos
                {isActiveRoute('/about') && <span className="active-indicator"></span>}
              </Link>
            </li>
          </ul>

          {/* Right Section */}
          <ul className="navbar-nav align-items-center">
            {/* Theme Toggle */}
            <li className="nav-item me-3">
              <button
                className={`btn rounded-circle p-2 border-0 ${
                  darkMode ? 'bg-light text-dark' : 'bg-dark text-light'
                } hover-scale`}
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon'}`}></i>
              </button>
            </li>

            {/* Cart with Enhanced Badge */}
            <li className="nav-item me-3">
              <Link
                className={`nav-link position-relative p-2 rounded ${
                  isActiveRoute('/cart') 
                    ? 'text-primary active-link' 
                    : darkMode ? 'text-light' : 'text-dark'
                } hover-glow`}
                to="/cart"
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="bi bi-cart3 fs-5"></i>
                {cartItemsCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger pulse-animation">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    <span className="visually-hidden">articles dans le panier</span>
                  </span>
                )}
              </Link>
            </li>

            {/* Authentication Section */}
            {isAuthenticated ? (
              <>
                {/* User Dropdown */}
                <li className="nav-item dropdown">
                  <button
                    className={`btn nav-link dropdown-toggle d-flex align-items-center fw-semibold border-0 ${
                      darkMode ? 'text-light' : 'text-dark'
                    }`}
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <div className="position-relative me-2">
                      <i className="bi bi-person-circle fs-4"></i>
                      {user?.role === 'admin' && (
                        <span className="position-absolute top-0 end-0 badge bg-warning text-dark rounded-circle p-1"
                              style={{ fontSize: '6px', transform: 'translate(2px, -2px)' }}
                              title="Administrateur">
                          <i className="bi bi-star-fill"></i>
                        </span>
                      )}
                    </div>
                    <span className="d-none d-md-inline">
                      {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                    </span>
                  </button>

                  <div className={`dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 p-2 ${showUserDropdown ? 'show' : ''}`}
                       style={{ minWidth: '220px' }}>
                    {/* User Info */}
                    <div className="px-3 py-2 border-bottom">
                      <div className="fw-semibold text-dark">{user?.name || 'Utilisateur'}</div>
                      <small className="text-muted">{user?.email}</small>
                      {user?.role === 'admin' && (
                        <span className="badge bg-warning text-dark mt-1">Administrateur</span>
                      )}
                    </div>

                    {/* User Links */}
                    <div className="py-1">
                      <button
                        className="dropdown-item d-flex align-items-center py-2 rounded-2 hover-item"
                        onClick={() => handleNavLinkClick('/profile')}
                      >
                        <i className="bi bi-person me-3 text-primary"></i>
                        <div>
                          <div className="fw-medium">Mon Profil</div>
                          <small className="text-muted">Gérer votre compte</small>
                        </div>
                      </button>

                      <button
                        className="dropdown-item d-flex align-items-center py-2 rounded-2 hover-item"
                        onClick={() => handleNavLinkClick('/orders')}
                      >
                        <i className="bi bi-bag me-3 text-success"></i>
                        <div>
                          <div className="fw-medium">Mes Commandes</div>
                          <small className="text-muted">Historique des achats</small>
                        </div>
                      </button>

                      {/* Chat */}
                      {user?.role !== 'admin' && (
                        <button
                          className="dropdown-item d-flex align-items-center py-2 rounded-2 hover-item"
                          onClick={() => handleNavLinkClick('/chat')}
                        >
                          <i className="bi bi-chat me-3 text-info"></i>
                          <div>
                            <div className="fw-medium">Assistance</div>
                            <small className="text-muted">Support 24/7</small>
                          </div>
                        </button>
                      )}

                      {/* Admin Links */}
                      {user?.role === 'admin' && (
                        <>
                          <div className="dropdown-divider my-2"></div>
                          <button
                            className="dropdown-item d-flex align-items-center py-2 rounded-2 hover-item"
                            onClick={() => handleNavLinkClick('/admin/chat')}
                          >
                            <i className="bi bi-chat-dots me-3 text-info"></i>
                            <div>
                              <div className="fw-medium">Chat Admin</div>
                              <small className="text-muted">Support clients</small>
                            </div>
                          </button>

                          <button
                            className="dropdown-item d-flex align-items-center py-2 rounded-2 hover-item"
                            onClick={() => handleNavLinkClick('/admin')}
                          >
                            <i className="bi bi-speedometer2 me-3 text-warning"></i>
                            <div>
                              <div className="fw-medium">Dashboard</div>
                              <small className="text-muted">Administration</small>
                            </div>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="dropdown-divider my-2"></div>
                    <button
                      className="dropdown-item d-flex align-items-center py-2 rounded-2 text-danger hover-item"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-3"></i>
                      <div>
                        <div className="fw-medium">Déconnexion</div>
                        <small className="text-muted">Quitter la session</small>
                      </div>
                    </button>
                  </div>
                </li>
              </>
            ) : (
              <>
                {/* Login & Register Buttons */}
                <li className="nav-item me-2">
                  <button
                    className={`btn btn-outline-primary rounded-pill px-3 fw-semibold ${
                      darkMode ? 'border-light text-light' : ''
                    } hover-scale`}
                    onClick={() => handleNavLinkClick('/login')}
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Connexion
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-primary rounded-pill px-4 fw-semibold hover-glow"
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

      {/* Enhanced CSS Styles */}
      <style jsx>{`
        .navbar-toggler-icon {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          transition: all 0.3s ease;
        }
        .navbar-toggler-icon span {
          display: block;
          height: 2px;
          width: 100%;
          background-color: currentColor;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        .navbar-toggler-icon.open span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }
        .navbar-toggler-icon.open span:nth-child(2) {
          opacity: 0;
        }
        .navbar-toggler-icon.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }
        .active-link {
          position: relative;
        }
        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, var(--bs-primary), var(--bs-info));
          border-radius: 2px;
        }
        .hover-glow:hover {
          color: var(--bs-primary) !important;
          text-shadow: 0 0 10px rgba(var(--bs-primary-rgb), 0.3);
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        .hover-item:hover {
          background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%);
          color: white !important;
          transform: translateX(5px);
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        .dropdown-menu {
          backdrop-filter: blur(10px);
          background: rgba(var(--bs-body-bg-rgb), 0.95) !important;
        }
        .dropdown-item {
          transition: all 0.2s ease;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;