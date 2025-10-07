import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

// Axios instance with auth token
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const statusConfig = {
  pending: { label: "En attente", class: "bg-warning" },
  confirmed: { label: "Confirmée", class: "bg-info" },
  processing: { label: "En préparation", class: "bg-primary" },
  shipped: { label: "Expédiée", class: "bg-secondary" },
  delivered: { label: "Livrée", class: "bg-success" },
  cancelled: { label: "Annulée", class: "bg-danger" },
};

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/orders/${id}`);
      console.log("Order data:", data); // check backend response
      setOrder(data);
    } catch (error) {
      console.error("Erreur API:", error.response || error.message);
      toast.error("Impossible de charger la commande");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!order || !order._id) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-muted">Commande introuvable</h4>
        <Link to="/orders" className="btn btn-primary mt-3">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const customer = order.customer || order.user || {};
  const items = order.items || [];

  return (
    <div className="container py-5">
      <h2 className="mb-4">Commande {order.orderNumber || ""}</h2>
      <div className="row">
        <div className="col-md-6">
          <h5>Client</h5>
          <p><strong>Nom:</strong> {customer.name || "-"}</p>
          <p><strong>Email:</strong> {customer.email || "-"}</p>
          <p><strong>Téléphone:</strong> {customer.phone || "-"}</p>
          <h5>Adresse de livraison</h5>
          <p>
            {order.shippingAddress?.street || "-"}, {order.shippingAddress?.city || "-"} {order.shippingAddress?.postalCode || "-"}
          </p>
        </div>
        <div className="col-md-6">
          <h5>Statut de la commande</h5>
          <span className={`badge text-white ${statusConfig[order.status]?.class || "bg-secondary"}`}>
            {statusConfig[order.status]?.label || "Inconnu"}
          </span>

          <h5 className="mt-4">Articles</h5>
          {items.length > 0 ? (
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Qté</th>
                  <th>Prix</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name || "-"}</td>
                    <td>{item.quantity || 0}</td>
                    <td>{item.price?.toFixed(2) || 0} DT</td>
                    <td>{(item.price && item.quantity ? (item.price * item.quantity).toFixed(2) : 0)} DT</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3">Total</th>
                  <th>{order.total?.toFixed(2) || 0} DT</th>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p>Aucun article trouvé pour cette commande.</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <Link to="/orders" className="btn btn-secondary">
          Retour aux commandes
        </Link>
      </div>
    </div>
  );
};

export default OrderDetails;
