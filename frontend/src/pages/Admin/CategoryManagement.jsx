import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminMobileHeader from "../../components/Layout/AdminMobileHeader";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiCalendar, FiTag } from 'react-icons/fi';

const CategoryManagement = () => {
  // State variables
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ _id: "", name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Stats for sidebar
  const [stats] = useState({
    totalProducts: 145,
    totalOrders: 328,
    totalCustomers: 1250,
    recentOrders: [],
    stockStatus: {
      outOfStock: 12,
      lowStock: 8,
      inStock: 125,
      total: 145
    }
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch categories with pagination + search
  const fetchCategories = async (page = 1, limit = 10, searchTerm = "") => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}"}/categories`, {
        params: { page, limit, search: searchTerm },
      });

      setCategories(response.data.categories);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.response?.data?.message || "Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, 10, search);
  }, [search]);

  const resetCreateForm = () => {
    setCreateForm({ name: "", description: "" });
    setError("");
    setSuccessMessage("");
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!createForm.name || createForm.name.trim().length < 2) {
      setError("Category name must be at least 2 characters long");
      return;
    }

    const duplicate = categories.find(
      (cat) => cat.name.toLowerCase() === createForm.name.trim().toLowerCase()
    );
    if (duplicate) {
      setError("Category name already exists");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await axios.post(`${import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}"}/categories`, {
        name: createForm.name.trim(),
        description: createForm.description ? createForm.description.trim() : "",
      });

      setSuccessMessage(response.data.message || "Category created successfully");
      resetCreateForm();
      setShowCreateModal(false);
      fetchCategories(currentPage, 10, search);
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err.response?.data?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  // Update Category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();

    if (!editForm.name || editForm.name.trim().length < 2) {
      setError("Category name must be at least 2 characters long");
      return;
    }

    const duplicate = categories.find(
      (cat) =>
        cat.name.toLowerCase() === editForm.name.trim().toLowerCase() &&
        cat._id !== editForm._id
    );
    if (duplicate) {
      setError("Category name already exists");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/categories/${editForm._id}`,
        {
          name: editForm.name.trim(),
          description: editForm.description ? editForm.description.trim() : "",
        }
      );

      setSuccessMessage(response.data.message || "Category updated successfully");
      setEditForm({ _id: "", name: "", description: "" });
      setShowEditModal(false);
      fetchCategories(currentPage, 10, search);
    } catch (err) {
      console.error("Error updating category:", err);
      setError(err.response?.data?.message || "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/categories/${id}`
      );

      setSuccessMessage(response.data.message || "Category deleted successfully");
      fetchCategories(
        categories.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage,
        10,
        search
      );
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err.response?.data?.message || "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchCategories(newPage, 10, search);
  };

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
            title="Gestion des Catégories" 
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/* Header */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="h5 mb-1 fw-bold text-success">
                    <FiTag className="me-2" />
                    Gestion des Catégories
                  </h2>
                  <p className="text-muted small mb-0">
                    Organisez vos produits par catégories
                  </p>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end">
                    <button
                      className="btn btn-success d-inline-flex align-items-center"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <FiPlus className="me-2" />
                      Nouvelle Catégorie
                    </button>
                    
                    <div className="bg-light rounded-pill px-3 py-2 text-muted small d-flex align-items-center">
                      <FiCalendar className="me-2" />
                      {new Date().toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-8">
                  <label className="form-label fw-medium text-success">Rechercher</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FiSearch size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-success"
                      placeholder="Rechercher une catégorie..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setSearch("")}
                    disabled={!search}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {successMessage}
              <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
            </div>
          )}

          {/* Categories Table */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-white border-0 rounded-top-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                <FiTag className="me-2" />
                Catégories ({categories.length})
              </h5>
              <div className="text-muted small">
                Page {currentPage} sur {totalPages}
              </div>
            </div>
            
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="border-0">Nom</th>
                        <th className="border-0">Description</th>
                        <th className="border-0 text-center" style={{ width: '150px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <tr key={cat._id}>
                            <td>
                              <strong className="text-success">{cat.name}</strong>
                            </td>
                            <td>
                              <span className="text-muted">
                                {cat.description || "Aucune description"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  className="btn btn-sm btn-outline-warning d-flex align-items-center"
                                  onClick={() => {
                                    setEditForm({
                                      _id: cat._id,
                                      name: cat.name,
                                      description: cat.description || "",
                                    });
                                    setShowEditModal(true);
                                  }}
                                  disabled={loading}
                                >
                                  <FiEdit size={14} className="me-1" />
                                  Modifier
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger d-flex align-items-center"
                                  onClick={() => handleDeleteCategory(cat._id)}
                                  disabled={loading}
                                >
                                  <FiTrash2 size={14} className="me-1" />
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-5 text-muted">
                            <FiTag size={32} className="mb-2" />
                            <p>Aucune catégorie trouvée</p>
                            <small>
                              {search ? "Essayez de modifier vos critères de recherche." : "Commencez par créer votre première catégorie."}
                            </small>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Affichage de {categories.length} catégorie(s)
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      Précédent
                    </button>
                    <span className="btn btn-sm btn-light">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Nouvelle Catégorie</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}></button>
              </div>
              <form onSubmit={handleCreateCategory}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom de la catégorie *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Ex: Soins Visage"
                      required
                      minLength={2}
                      maxLength={50}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Description optionnelle de la catégorie..."
                      maxLength={500}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? "Création..." : "Créer la Catégorie"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Modifier la Catégorie</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowEditModal(false);
                  setEditForm({ _id: "", name: "", description: "" });
                }}></button>
              </div>
              <form onSubmit={handleUpdateCategory}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nom de la catégorie *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      minLength={2}
                      maxLength={50}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      maxLength={500}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditForm({ _id: "", name: "", description: "" });
                    }}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? "Mise à jour..." : "Mettre à Jour"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

export default CategoryManagement;
