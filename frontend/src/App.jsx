import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CategoryProvider } from './context/CategoryContext';
import { ChatProvider } from './context/ChatContext';
import { StockProvider } from './context/StockContext';
import { PromotionProvider } from './context/PromotionContext';
import { ThemeProvider } from './context/ThemeContext';
import Products from './pages/Products';

import CategoriesPage from './pages/Categories.jsx';
import CategoryDetail from './pages/CategoryDetail.jsx';
//import About from './pages/About';

import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProductManagement from './pages/Admin/ProductManagement';
import OrderManagement from './pages/Admin/OrderManagement';
import UserManagement from './pages/Admin/UserManagement';
import PromotionManagement from './pages/Admin/PromotionManagement';
import ProductForm from './pages/Admin/ProductForm';
import AddCategory from './pages/Admin/AddCategory';
import CategoryManagement from './pages/Admin/CategoryManagement';
import StockManagement from './pages/Admin/StockManagement';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Chat from './pages/Chat';
import AdminChat from './pages/Admin/AdminChat';

import LoadingSpinner from './components/Common/LoadingSpinner';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/custom.css';

// Main App component with routing logic
function AppContent() {
  const { isAuthenticated, initialLoading, user } = useAuth();

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          
           {/* Category routes */}
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryDetail />} />
          
          {/* Auth routes with redirect if already authenticated */}
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/forgot-password" 
            element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/reset-password/:resetToken" 
            element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" replace />} 
          />

          {/* User protected routes */}
          <Route
            path="/orders"
            element={
              isAuthenticated ? <MyOrders /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/order/:id"
            element={
              isAuthenticated ? <OrderDetails /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/chat"
            element={
              isAuthenticated && user?.role !== 'admin' ? <Chat /> : <Navigate to="/" replace />
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              isAuthenticated && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/products"
            element={
              isAuthenticated && user?.role === 'admin' ? <ProductManagement /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/products/add"
            element={
              isAuthenticated && user?.role === 'admin' ? <ProductForm /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/products/edit/:productId"
            element={
              isAuthenticated && user?.role === 'admin' ? <ProductForm /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/promotions"
            element={
              isAuthenticated && user?.role === 'admin' ? <PromotionManagement /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/stock"
            element={
              isAuthenticated && user?.role === 'admin' ? <StockManagement /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/orders"
            element={
              isAuthenticated && user?.role === 'admin' ? <OrderManagement /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/customers"
            element={
              isAuthenticated && user?.role === 'admin' ? <UserManagement /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/categories/add"
            element={
              isAuthenticated && user?.role === 'admin' ? <AddCategory /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/categories"
            element={
              isAuthenticated && user?.role === 'admin' ? <CategoryManagement /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/admin/chat"
            element={
              isAuthenticated && user?.role === 'admin' ? <AdminChat /> : <Navigate to="/" replace />
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

// Main App wrapper with all providers - FIXED VERSION
function App() {
  return (
    <ThemeProvider> {/* ThemeProvider should be at the top level */}
      <AuthProvider>
        <CategoryProvider>
          <ProductProvider>
            <PromotionProvider>
              <CartProvider>
                <StockProvider>
                  <ChatProvider>
                    <Router>
                      <AppContent />
                    </Router>
                  </ChatProvider>
                </StockProvider>
              </CartProvider>
            </PromotionProvider>
          </ProductProvider>
        </CategoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
