import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "../../components/Layout/AdminSidebar.jsx";
import AdminMobileHeader from "../../components/Layout/AdminMobileHeader.jsx";
import { FiPlusCircle, FiCalendar, FiPackage, FiEdit, FiEye, FiXCircle } from 'react-icons/fi';
import { getImageUrl } from "../../utils/imageHelper.js";

const ProductManagement = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errorCategories, setErrorCategories] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Stats for sidebar
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: [],
    stockStatus: {
      outOfStock: 0,
      lowStock: 0,
      inStock: 0
    }
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}"}/dashboard/stats`, config);
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Fallback stats
      setStats({
        totalProducts: products.length,
        totalOrders: 328,
        totalCustomers: 1250,
        totalRevenue: 15780.50,
        recentOrders: [],
        stockStatus: {
          outOfStock: products.filter(p => p.stock === 0).length,
          lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
          inStock: products.filter(p => p.stock > 5).length,
          total: products.length
        }
      });
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}"}/categories`);
      const cats = Array.isArray(data) ? data : data.categories || [];
      setCategories(cats);
      setErrorCategories(null);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      setErrorCategories("Impossible de charger les catégories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}"}/products`,
        config
      );
      const productsData = Array.isArray(data.products) ? data.products : data || [];
      setProducts(productsData);
      
      // Update stats with actual product data
      setStats(prev => ({
        ...prev,
        totalProducts: productsData.length,
        stockStatus: {
          outOfStock: productsData.filter(p => p.stock === 0).length,
          lowStock: productsData.filter(p => p.stock > 0 && p.stock <= 5).length,
          inStock: productsData.filter(p => p.stock > 5).length,
          total: productsData.length
        }
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!token) return alert("Vous devez être connecté en tant qu'admin");
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(products.filter((p) => p._id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Erreur lors de la suppression du produit");
      }
    }
  };

  const handleStatusToggle = async (productId) => {
    if (!token) return alert("Vous devez être connecté en tant qu'admin");
    try {
      const product = products.find((p) => p._id === productId);
      const newStatus = product.status === "active" ? "inactive" : "active";
      await axios.put(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/products/${productId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(
        products.map((p) =>
          p._id === productId ? { ...p, status: newStatus } : p
        )
      );
    } catch (error) {
      console.error("Error updating product status:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  // Get product image with fallback
  const getProductImage = (product) => {
    if (product.mainImage) {
      return getImageUrl(product.mainImage);
    } else if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0]);
    } else {
      return 'https://placehold.co/400x400?text=Image';
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category?._id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  if (loading) {
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
            title="Gestion des produits" 
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/* Header */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="h5 mb-1 fw-bold text-success">
                    Gestion des produits
                  </h2>
                  <p className="text-muted small mb-0">
                    Gérez votre inventaire de produits
                  </p>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end">
                    <Link to="/admin/products/add" className="btn btn-success d-inline-flex align-items-center">
                      <FiPlusCircle className="me-2" />
                      Ajouter un produit
                    </Link>
                    
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

          {/* Filters */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label fw-medium text-success">Rechercher</label>
                  <input
                    type="text"
                    className="form-control border-success"
                    placeholder="Nom du produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                  <label className="form-label fw-medium text-success">Catégorie</label>
                  <select
                    className="form-select border-success"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={loadingCategories}
                  >
                    <option value="">
                      {loadingCategories
                        ? "Chargement..."
                        : "Toutes les catégories"}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errorCategories && (
                    <small className="text-danger">{errorCategories}</small>
                  )}
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("");
                    }}
                    disabled={!searchTerm && !selectedCategory}
                  >
                    Reset
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
                Produits ({filteredProducts.length})
              </h5>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success rounded-pill">
                  {stats.stockStatus?.inStock || 0} en stock
                </span>
                <span className="badge bg-warning rounded-pill">
                  {stats.stockStatus?.lowStock || 0} stock faible
                </span>
                <span className="badge bg-danger rounded-pill">
                  {stats.stockStatus?.outOfStock || 0} rupture
                </span>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0">Produit</th>
                      <th className="border-0">Catégorie</th>
                      <th className="border-0">Prix</th>
                      <th className="border-0">Stock</th>
                      <th className="border-0">Statut</th>
                      <th className="border-0">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={getProductImage(product)}
                              alt={product.name}
                              className="rounded me-3"
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/400x400?text=Image';
                              }}
                            />
                            <div>
                              <div className="fw-medium">{product.name}</div>
                              <small className="text-muted">
                                ID: {product._id?.toString().slice(-6)}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{product.category?.name || "-"}</td>
                        <td className="fw-bold text-success">{product.price?.toFixed(2)} DT</td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              product.stock === 0
                                ? "bg-danger"
                                : product.stock <= 5
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                          >
                            {product.stock} unités
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              product.status === "active"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {product.status === "active" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleStatusToggle(product._id)}
                            >
                              <FiEdit size={14} />
                            </button>
                            <Link
                              to={`/admin/products/edit/${product._id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <FiEye size={14} />
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <FiXCircle size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {currentProducts.length === 0 && (
                <div className="text-center py-5">
                  <FiPackage size={40} className="text-muted mb-3" />
                  <h5 className="text-muted">Aucun produit trouvé</h5>
                  <p className="text-muted">
                    {searchTerm || selectedCategory
                      ? "Essayez de modifier vos critères de recherche."
                      : "Commencez par ajouter votre premier produit."}
                  </p>
                  {!searchTerm && !selectedCategory && (
                    <Link to="/admin/products/add" className="btn btn-success mt-2">
                      <FiPlusCircle className="me-2" />
                      Ajouter un produit
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Précédent
                  </button>
                </li>
                {[...Array(totalPages)].map((_, index) => (
                  <li
                    key={index}
                    className={`page-item ${
                      currentPage === index + 1 ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Suivant
                  </button>
                </li>
              </ul>
            </nav>
          )}
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

export default ProductManagement;
