import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AdminSidebar from "../../components/Layout/AdminSidebar";
import AdminMobileHeader from "../../components/Layout/AdminMobileHeader";
import { FiShoppingBag, FiSearch, FiCalendar, FiEye, FiPrinter, FiDownload } from 'react-icons/fi';

// ✅ Status config
const statusConfig = {
  pending: { label: "En attente", class: "bg-warning text-dark" },
  confirmed: { label: "Confirmée", class: "bg-info text-white" },
  processing: { label: "En préparation", class: "bg-primary text-white" },
  delivered: { label: "Livrée", class: "bg-success text-white" },
  cancelled: { label: "Annulée", class: "bg-danger text-white" },
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const ordersPerPage = 10;

  // ✅ Company information
  const companyInfo = {
    name: "Parapharmacie Naturelle",
    address: "123 Avenue de la Santé, 1000 Tunis, Tunisie",
    phone: "+216 70 000 000",
    email: "contact@parapharmacie-naturelle.tn",
    website: "www.parapharmacie-naturelle.tn",
    logo: "/images/logo.png",
    signature: "/images/signature.png",
    manager: "Directeur Commercial",
    managerTitle: "Responsable des Ventes"
  };

  // ✅ Enhanced token management
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // ✅ Check authentication
  const checkAuthentication = () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return false;
    }
    return true;
  };

  // ✅ Enhanced API call with better error handling
  const fetchOrders = async () => {
    if (!checkAuthentication()) return;
    
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/orders", {
        headers: { 
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
      });

      console.log("📦 Orders API response:", response.data);

      // Handle different response formats
      let ordersData = [];
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data && response.data.data) {
        ordersData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }

      setOrders(ordersData);
      
      if (ordersData.length === 0) {
        toast.info("Aucune commande trouvée");
      }

    } catch (error) {
      console.error("❌ Erreur API:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expirée. Redirection...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 403) {
        toast.error("Accès non autorisé");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Erreur de connexion au serveur");
      }
      
      // Set empty array as fallback
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // ✅ Enhanced status update with validation
  const handleStatusChange = async (orderId, newStatus) => {
    if (!checkAuthentication()) return;
    
    setUpdatingId(orderId);
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      toast.success(`Statut mis à jour: ${statusConfig[newStatus]?.label || newStatus} ✅`);
    } catch (error) {
      console.error("❌ Erreur mise à jour:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expirée");
        localStorage.removeItem("token");
        window.location.href = '/login';
      } else {
        toast.error(
          error.response?.data?.message || "Erreur lors de la mise à jour du statut"
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // ✅ Enhanced print function with better error handling
  const handlePrintOrder = (order) => {
    if (!order) {
      toast.error("Aucune commande sélectionnée");
      return;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (!printWindow) {
        toast.error("Veuillez autoriser les pop-ups pour l'impression");
        return;
      }

      const printDate = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Commande #${order.orderNumber || order._id}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333; 
              background: white;
              line-height: 1.4;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px; 
              border-bottom: 3px solid #28a745; 
              padding-bottom: 20px; 
            }
            .company-info { flex: 1; }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #28a745; 
              margin-bottom: 5px; 
            }
            .company-details { 
              font-size: 12px; 
              color: #666;
              line-height: 1.4;
            }
            .logo { 
              max-width: 150px; 
              max-height: 80px;
              object-fit: contain;
            }
            .invoice-title { 
              font-size: 20px; 
              margin: 20px 0; 
              text-align: center;
              background: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
              border: 1px solid #dee2e6;
            }
            .section { 
              margin-bottom: 25px; 
              page-break-inside: avoid;
            }
            .section-title { 
              font-weight: bold; 
              color: #28a745; 
              margin-bottom: 10px; 
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
              font-size: 16px;
            }
            .two-columns {
              display: flex;
              gap: 30px;
              margin-bottom: 20px;
            }
            .column {
              flex: 1;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
              font-size: 14px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #28a745; 
              color: white;
              font-weight: bold;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { 
              font-weight: bold; 
              background-color: #f8f9fa; 
            }
            .status-badge { 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: bold;
              display: inline-block;
            }
            .footer { 
              margin-top: 50px; 
              border-top: 2px solid #ddd; 
              padding-top: 20px; 
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .signature-section {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              width: 300px;
              margin: 40px auto 10px;
            }
            .thank-you {
              text-align: center;
              font-style: italic;
              color: #28a745;
              margin: 30px 0;
              padding: 15px;
              background: #f8fdf9;
              border-radius: 5px;
            }
            .no-print { display: none; }
            @media print {
              body { margin: 0; padding: 15px; }
              .header { margin-bottom: 20px; }
              .footer { margin-top: 30px; }
              .thank-you { margin: 20px 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="company-name">${companyInfo.name}</div>
              <div class="company-details">
                ${companyInfo.address}<br>
                Tél: ${companyInfo.phone} | Email: ${companyInfo.email}<br>
                Site: ${companyInfo.website}
              </div>
            </div>
            <div class="logo-section">
              <img src="${companyInfo.logo}" alt="Logo ${companyInfo.name}" class="logo" onerror="this.style.display='none'">
            </div>
          </div>

          <div class="invoice-title">
            FACTURE / COMMANDE #${order.orderNumber || order._id}
          </div>

          <div class="two-columns">
            <div class="column">
              <div class="section">
                <div class="section-title">Informations Client</div>
                <p><strong>Nom:</strong> ${order.user?.name || 'Non spécifié'}</p>
                <p><strong>Email:</strong> ${order.user?.email || 'Non spécifié'}</p>
                <p><strong>Téléphone:</strong> ${order.user?.phone || 'Non spécifié'}</p>
                <p><strong>Statut:</strong> 
                  <span class="status-badge" style="background-color: ${getStatusColor(order.status)}; color: white; margin-left: 10px;">
                    ${statusConfig[order.status]?.label || order.status}
                  </span>
                </p>
              </div>
            </div>
            
            <div class="column">
              <div class="section">
                <div class="section-title">Détails de la Commande</div>
                <p><strong>Date de commande:</strong> ${orderDate}</p>
                <p><strong>Date d'impression:</strong> ${printDate}</p>
                <p><strong>Statut paiement:</strong> 
                  <span style="color: ${order.paymentStatus === "paid" ? "#28a745" : "#ffc107"}; font-weight: bold;">
                    ${order.paymentStatus === "paid" ? "PAYÉ" : "EN ATTENTE"}
                  </span>
                </p>
                ${order.promotionCode ? `<p><strong>Code promotion:</strong> ${order.promotionCode}</p>` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Adresse de Livraison</div>
            <p>
              ${order.shippingAddress?.street || order.shippingAddress?.address || 'Non spécifié'},<br>
              ${order.shippingAddress?.city || 'Non spécifié'} ${order.shippingAddress?.postalCode || ''}<br>
              ${order.shippingAddress?.country || 'Tunisie'}
            </p>
          </div>

          <div class="section">
            <div class="section-title">Détails des Articles Commandés</div>
            <table>
              <thead>
                <tr>
                  <th>Article</th>
                  <th class="text-center">Quantité</th>
                  <th class="text-right">Prix Unitaire</th>
                  <th class="text-right">Total HT</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map(item => `
                  <tr>
                    <td><strong>${item.name || 'Produit sans nom'}</strong></td>
                    <td class="text-center">${item.quantity || 1}</td>
                    <td class="text-right">${(item.price || 0)?.toFixed(2)} DT</td>
                    <td class="text-right">${((item.price || 0) * (item.quantity || 1))?.toFixed(2)} DT</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                ${order.discountAmount ? `
                  <tr>
                    <td colspan="3" class="text-right"><strong>Sous-total</strong></td>
                    <td class="text-right">${(order.subtotal || order.total)?.toFixed(2)} DT</td>
                  </tr>
                  <tr>
                    <td colspan="3" class="text-right"><strong>Remise</strong></td>
                    <td class="text-right">-${order.discountAmount?.toFixed(2)} DT</td>
                  </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="3" class="text-right"><strong>Total Général</strong></td>
                  <td class="text-right"><strong>${(order.total || order.finalTotal || 0)?.toFixed(2)} DT</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="thank-you">
            Merci pour votre confiance ! Nous espérons vous revoir très bientôt.
          </div>

          <div class="footer">
            <div class="signature-section">
              <div class="signature-line"></div>
              <div style="margin-top: 10px;">
                <strong>${companyInfo.manager}</strong><br>
                ${companyInfo.managerTitle}<br>
                ${companyInfo.name}
              </div>
            </div>
            
            <div class="document-info">
              <small>
                Document généré le ${printDate}<br>
                Commande #${order.orderNumber || order._id}
              </small>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }
            
            window.onbeforeunload = function() {
              return 'Voulez-vous vraiment fermer cette fenêtre ?';
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      toast.success("Ouverture de l'impression...");
    } catch (error) {
      console.error("❌ Erreur d'impression:", error);
      toast.error("Erreur lors de l'impression");
    }
  };

  // Helper function to get status color for print
  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      processing: '#007bff',
      shipped: '#6c757d',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  // ✅ Filtered orders with safe data access
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (order.orderNumber || '').toLowerCase().includes(searchLower) ||
      (order.user?.name || '').toLowerCase().includes(searchLower) ||
      (order.user?.email || '').toLowerCase().includes(searchLower) ||
      (order._id || '').toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  // ✅ Enhanced pagination with validation
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  // ✅ Enhanced loader with better UX
  if (loading) {
    return (
      <div className="container-fluid py-5" style={{ background: "#f8fdf9" }}>
        <div className="text-center">
          <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement des commandes...</p>
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
            title="Gestion des Commandes" 
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/* Header */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="h5 mb-1 fw-bold text-success">
                    <FiShoppingBag className="me-2" />
                    Gestion des Commandes
                  </h2>
                  <p className="text-muted small mb-0">
                    {orders.length} commande(s) au total
                  </p>
                </div>
                
                <div className="col-md-6">
                  <div className="d-flex align-items-center gap-2 flex-wrap justify-content-md-end">
                    <button
                      className="btn btn-outline-success d-inline-flex align-items-center"
                      onClick={() => {
                        if (filteredOrders.length > 0) {
                          toast.info("Export CSV bientôt disponible");
                        } else {
                          toast.warning("Aucune donnée à exporter");
                        }
                      }}
                      disabled={filteredOrders.length === 0}
                    >
                      <FiDownload className="me-2" />
                      Exporter
                    </button>
                    
                    <button
                      className="btn btn-success d-inline-flex align-items-center"
                      onClick={fetchOrders}
                      disabled={loading}
                    >
                      <FiSearch className="me-2" />
                      Actualiser
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

          {/* Filters */}
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
                      placeholder="Numéro, client, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-medium text-success">Statut</label>
                  <select
                    className="form-select border-success"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStatus("");
                    }}
                    disabled={!searchTerm && !selectedStatus}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-white border-0 rounded-top-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                <FiShoppingBag className="me-2" />
                Commandes ({filteredOrders.length})
              </h5>
              <div className="text-muted small">
                Page {currentPage} sur {totalPages}
              </div>
            </div>
            
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0">Commande</th>
                      <th className="border-0">Client</th>
                      <th className="border-0">Articles</th>
                      <th className="border-0">Total</th>
                      <th className="border-0">Statut</th>
                      <th className="border-0">Date</th>
                      <th className="border-0 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <div className="fw-medium text-success">
                            #{order.orderNumber || order._id?.slice(-6)}
                          </div>
                          <span className={`badge ${order.paymentStatus === "paid" ? "bg-success" : "bg-warning text-dark"}`}>
                            {order.paymentStatus === "paid" ? "Payée" : "En attente"}
                          </span>
                        </td>
                        <td>
                          <div className="fw-medium">{order.user?.name || 'Client'}</div>
                          <small className="text-muted d-block">{order.user?.email || 'Email non fourni'}</small>
                          <small className="text-muted">{order.user?.phone || 'Tél non fourni'}</small>
                        </td>
                        <td>
                          <small>
                            {(order.items || []).slice(0, 2).map((item, idx) => (
                              <div key={idx}>
                                {item.name} × {item.quantity}
                              </div>
                            ))}
                            {(order.items || []).length > 2 && (
                              <small className="text-muted">
                                +{(order.items || []).length - 2} autre(s)
                              </small>
                            )}
                          </small>
                        </td>
                        <td className="fw-bold text-success">
                          {(order.total || order.finalTotal || 0)?.toFixed(2)} DT
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm border-0 text-white ${statusConfig[order.status]?.class || 'bg-secondary'}`}
                            value={order.status || 'pending'}
                            disabled={updatingId === order._id}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          >
                            {Object.entries(statusConfig).map(([key, { label }]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          {updatingId === order._id && (
                            <div className="spinner-border spinner-border-sm text-primary ms-1" role="status">
                              <span className="visually-hidden">Chargement...</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <small>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("fr-FR") : 'Date inconnue'}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-info d-flex align-items-center"
                              onClick={() => setSelectedOrder(order)}
                              title="Voir détails"
                            >
                              <FiEye size={14} />
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-primary d-flex align-items-center"
                              onClick={() => handlePrintOrder(order)}
                              title="Imprimer"
                            >
                              <FiPrinter size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {currentOrders.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    <FiShoppingBag size={32} className="mb-2" />
                    <h5>Aucune commande trouvée</h5>
                    <small>
                      {searchTerm || selectedStatus 
                        ? "Essayez de modifier vos critères de recherche." 
                        : "Aucune commande n'a été passée pour le moment."}
                    </small>
                    {!loading && (
                      <div className="mt-3">
                        <button 
                          className="btn btn-sm btn-outline-success"
                          onClick={fetchOrders}
                        >
                          Réessayer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <small className="text-muted">
                    Affichage de {Math.min(filteredOrders.length, indexOfFirstOrder + 1)} à {Math.min(filteredOrders.length, indexOfLastOrder)} sur {filteredOrders.length} commande(s)
                  </small>
                  <div className="d-flex gap-2 align-items-center flex-wrap">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      Première
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </button>
                    <span className="btn btn-sm btn-light disabled">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </button>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Dernière
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Order Detail Modal */}
      {selectedOrder && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-success text-white rounded-top-3">
                <h5 className="modal-title fw-bold">
                  <FiShoppingBag className="me-2" />
                  Commande #{selectedOrder.orderNumber || selectedOrder._id?.slice(-6)}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setSelectedOrder(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <h6 className="fw-bold text-success mb-3 border-bottom pb-2">
                      Informations Client
                    </h6>
                    <div className="mb-3">
                      <strong className="text-muted">Nom:</strong>
                      <div className="fw-medium">{selectedOrder.user?.name || 'Non spécifié'}</div>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted">Email:</strong>
                      <div className="fw-medium">{selectedOrder.user?.email || 'Non spécifié'}</div>
                    </div>
                    <div className="mb-3">
                      <strong className="text-muted">Téléphone:</strong>
                      <div className="fw-medium">{selectedOrder.user?.phone || 'Non spécifié'}</div>
                    </div>
                    
                    <h6 className="fw-bold text-success mt-4 mb-3 border-bottom pb-2">
                      Adresse de Livraison
                    </h6>
                    <p className="mb-0">
                      {selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address || 'Non spécifié'},<br />
                      {selectedOrder.shippingAddress?.city || 'Non spécifié'} {selectedOrder.shippingAddress?.postalCode || ''}<br />
                      {selectedOrder.shippingAddress?.country || 'Tunisie'}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold text-success mb-3 border-bottom pb-2">
                      Détails de la Commande
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead className="table-success">
                          <tr>
                            <th>Article</th>
                            <th className="text-center">Qté</th>
                            <th className="text-end">Prix</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedOrder.items || []).map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <small className="fw-medium">{item.name}</small>
                              </td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end">{item.price?.toFixed(2)} DT</td>
                              <td className="text-end fw-bold text-success">
                                {((item.price || 0) * (item.quantity || 1))?.toFixed(2)} DT
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-light">
                          {selectedOrder.discountAmount && (
                            <>
                              <tr>
                                <td colSpan="3" className="text-end"><strong>Sous-total</strong></td>
                                <td className="text-end">{(selectedOrder.subtotal || selectedOrder.total)?.toFixed(2)} DT</td>
                              </tr>
                              <tr>
                                <td colSpan="3" className="text-end"><strong>Remise</strong></td>
                                <td className="text-end text-danger">-{selectedOrder.discountAmount?.toFixed(2)} DT</td>
                              </tr>
                            </>
                          )}
                          <tr>
                            <th colSpan="3" className="text-end">Total Général</th>
                            <th className="text-end text-success">
                              {(selectedOrder.total || selectedOrder.finalTotal || 0)?.toFixed(2)} DT
                            </th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 bg-light rounded-bottom-3">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedOrder(null)}
                >
                  Fermer
                </button>
                <button 
                  className="btn btn-success d-flex align-items-center"
                  onClick={() => {
                    handlePrintOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  <FiPrinter className="me-2" />
                  Imprimer
                </button>
              </div>
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

export default OrderManagement;