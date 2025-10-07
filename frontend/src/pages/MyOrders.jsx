import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import {
  FiPackage,
  FiCalendar,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiTruck,
  FiXCircle,
  FiEye,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiShoppingBag,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      const ordersData = response.data;
      
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Erreur API:", error);
      toast.error("Impossible de charger vos commandes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyOrders();
  };

  const handleCancelOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir annuler la commande ${orderNumber} ?`)) {
      return;
    }

    try {
      await orderAPI.cancelOrder(orderId);
      toast.success("Commande annulée avec succès");
      fetchMyOrders(); // Refresh the list
    } catch (error) {
      console.error("Erreur d'annulation:", error);
      toast.error("Impossible d'annuler la commande");
    }
  };

  const getStatusBadge = (order) => {
    const statusConfig = {
      pending: { color: "warning", text: "En attente", icon: <FiClock className="me-1" /> },
      confirmed: { color: "info", text: "Confirmée", icon: <FiCheckCircle className="me-1" /> },
      processing: { color: "primary", text: "En traitement", icon: <FiPackage className="me-1" /> },
      shipped: { color: "secondary", text: "Expédiée", icon: <FiTruck className="me-1" /> },
      delivered: { color: "success", text: "Livrée", icon: <FiCheckCircle className="me-1" /> },
      cancelled: { color: "danger", text: "Annulée", icon: <FiXCircle className="me-1" /> }
    };

    const config = statusConfig[order.status] || statusConfig.pending;
    
    return (
      <span className={`badge bg-${config.color} d-flex align-items-center`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const getPaymentBadge = (order) => {
    if (order.paymentStatus === "paid") {
      return (
        <span className="badge bg-success d-flex align-items-center">
          <FiCheckCircle className="me-1" />
          Payée
        </span>
      );
    } else if (order.paymentStatus === "pending") {
      return (
        <span className="badge bg-warning text-dark d-flex align-items-center">
          <FiClock className="me-1" />
          En attente
        </span>
      );
    } else {
      return (
        <span className="badge bg-danger d-flex align-items-center">
          <FiXCircle className="me-1" />
          Échoué
        </span>
      );
    }
  };

  const canCancelOrder = (order) => {
    return order.status === 'pending' || order.status === 'confirmed';
  };

  const getOrderItemsCount = (order) => {
    return order.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  // Calculate total of all orders
  const calculateTotalOrdersAmount = () => {
    return orders.reduce((total, order) => {
      return total + (order.finalTotal || 0);
    }, 0);
  };

  const filteredAndSortedOrders = orders
    .filter(order => {
      const matchesSearch = order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order._id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "highest":
          return b.finalTotal - a.finalTotal;
        case "lowest":
          return a.finalTotal - b.finalTotal;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="container-fluid py-5" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-4" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <h4 className="text-dark">Chargement de vos commandes...</h4>
            <p className="text-muted">Veuillez patienter un instant</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h2 fw-bold text-dark mb-2">
                  <FiPackage className="me-3 text-primary" />
                  Mes Commandes
                </h1>
                <p className="text-muted mb-0">
                  {filteredAndSortedOrders.length} commande{filteredAndSortedOrders.length !== 1 ? 's' : ''} trouvée{filteredAndSortedOrders.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button 
                className="btn btn-outline-primary btn-lg d-flex align-items-center rounded-3 px-4"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FiRefreshCw className={`me-2 ${refreshing ? 'spinner' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <FiSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Rechercher par numéro de commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="processing">En traitement</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Plus récentes</option>
              <option value="oldest">Plus anciennes</option>
              <option value="highest">Montant (haut)</option>
              <option value="lowest">Montant (bas)</option>
            </select>
          </div>
        </div>

        {filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <div className="bg-white rounded-circle p-5 d-inline-flex shadow-sm">
                <FiPackage size={80} className="text-muted opacity-50" />
              </div>
            </div>
            <h3 className="fw-bold text-dark mb-3">Aucune commande trouvée</h3>
            <p className="text-muted mb-4 fs-5">
              {searchTerm || statusFilter !== "all" 
                ? "Aucune commande ne correspond à vos critères de recherche."
                : "Vous n'avez passé aucune commande pour le moment."
              }
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Link to="/" className="btn btn-primary btn-lg px-5 py-3 rounded-3 fw-bold d-flex align-items-center">
                <FiShoppingBag className="me-2" />
                Découvrir nos produits
              </Link>
              {(searchTerm || statusFilter !== "all") && (
                <button 
                  className="btn btn-outline-primary btn-lg px-5 py-3 rounded-3 fw-bold d-flex align-items-center"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  <FiFilter className="me-2" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-12">
              {/* Desktop Table View */}
              <div className="d-none d-lg-block">
                <div className="card border-0 shadow-sm rounded-3">
                  <div className="card-header bg-white border-0 py-3">
                    <h5 className="mb-0 fw-bold text-dark">Historique des commandes</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-4">Commande</th>
                            <th>Date</th>
                            <th>Articles</th>
                            <th>Total</th>
                            <th>Statut Paiement</th>
                            <th>Statut Commande</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAndSortedOrders.map((order) => (
                            <tr key={order._id} className="position-relative">
                              <td className="ps-4">
                                <div className="fw-bold text-primary">{order.orderNumber}</div>
                                <small className="text-muted">{order._id}</small>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <FiCalendar className="me-2 text-muted" />
                                  {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </div>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark">
                                  {getOrderItemsCount(order)} article{getOrderItemsCount(order) !== 1 ? 's' : ''}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center fw-bold text-dark">
                                  <FiDollarSign className="me-1 text-success" />
                                  {order.finalTotal?.toFixed(2)} DT
                                </div>
                              </td>
                              <td>{getPaymentBadge(order)}</td>
                              <td>{getStatusBadge(order)}</td>
                              <td className="text-center">
                                <div className="d-flex justify-content-center gap-2">
                                  <Link 
                                    to={`/order/${order._id}`}
                                    className="btn btn-outline-primary btn-sm d-flex align-items-center rounded-3 px-3"
                                  >
                                    <FiEye className="me-1" />
                                    Détails
                                  </Link>
                                  {canCancelOrder(order) && (
                                    <button
                                      className="btn btn-outline-danger btn-sm d-flex align-items-center rounded-3 px-3"
                                      onClick={() => handleCancelOrder(order._id, order.orderNumber)}
                                    >
                                      <FiXCircle className="me-1" />
                                      Annuler
                                    </button>
                                  )}
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

              {/* Mobile Card View */}
              <div className="d-block d-lg-none">
                <div className="row g-3">
                  {filteredAndSortedOrders.map((order) => (
                    <div key={order._id} className="col-12">
                      <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-body">
                          {/* Order Header */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="fw-bold text-primary mb-1">{order.orderNumber}</h6>
                              <small className="text-muted">{order._id}</small>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold text-dark fs-5">
                                {order.finalTotal?.toFixed(2)} DT
                              </div>
                              <small className="text-muted">
                                {getOrderItemsCount(order)} article{getOrderItemsCount(order) !== 1 ? 's' : ''}
                              </small>
                            </div>
                          </div>

                          {/* Order Details */}
                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <small className="text-muted d-block">Date</small>
                              <div className="d-flex align-items-center">
                                <FiCalendar className="me-1 text-muted" size={14} />
                                <small>{new Date(order.createdAt).toLocaleDateString("fr-FR")}</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block">Paiement</small>
                              {getPaymentBadge(order)}
                            </div>
                            <div className="col-12">
                              <small className="text-muted d-block">Statut</small>
                              {getStatusBadge(order)}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="d-flex gap-2">
                            <Link 
                              to={`/order/${order._id}`}
                              className="btn btn-outline-primary btn-sm d-flex align-items-center flex-fill justify-content-center rounded-3"
                            >
                              <FiEye className="me-1" />
                              Détails
                            </Link>
                            {canCancelOrder(order) && (
                              <button
                                className="btn btn-outline-danger btn-sm d-flex align-items-center rounded-3 px-3"
                                onClick={() => handleCancelOrder(order._id, order.orderNumber)}
                              >
                                <FiXCircle className="me-1" />
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {filteredAndSortedOrders.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body py-3">
                  <div className="row text-center">
                    <div className="col-md-2 col-6 border-end">
                      <div className="fw-bold text-primary fs-4">{orders.length}</div>
                      <small className="text-muted">Total commandes</small>
                    </div>
                    <div className="col-md-2 col-6 border-end">
                      <div className="fw-bold text-success fs-4">
                        {orders.filter(o => o.paymentStatus === 'paid').length}
                      </div>
                      <small className="text-muted">Commandes payées</small>
                    </div>
                    <div className="col-md-2 col-6 border-end">
                      <div className="fw-bold text-warning fs-4">
                        {orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length}
                      </div>
                      <small className="text-muted">En cours</small>
                    </div>
                    <div className="col-md-2 col-6 border-end">
                      <div className="fw-bold text-info fs-4">
                        {orders.filter(o => o.status === 'delivered').length}
                      </div>
                      <small className="text-muted">Livrées</small>
                    </div>
                    <div className="col-md-4 col-12">
                      <div className="fw-bold text-success fs-4">
                        <FiDollarSign className="me-1" />
                        {calculateTotalOrdersAmount().toFixed(2)} DT
                      </div>
                      <small className="text-muted">Montant total des commandes</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;