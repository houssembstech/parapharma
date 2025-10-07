import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartWidget = () => {
  const { items, getCartItemsCount, getCartTotal } = useCart();
  const itemsCount = getCartItemsCount();
  const total = getCartTotal();

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-primary position-relative"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-cart3"></i>
        {itemsCount > 0 && (
          <span className="badge bg-danger cart-badge">
            {itemsCount}
          </span>
        )}
      </button>

      <div className="dropdown-menu dropdown-menu-end p-0" style={{ minWidth: '350px' }}>
        <div className="p-3 border-bottom">
          <h6 className="mb-0">Panier ({itemsCount} articles)</h6>
        </div>

        {items.length === 0 ? (
          <div className="p-4 text-center">
            <i className="bi bi-cart-x fs-1 text-muted"></i>
            <p className="text-muted mt-2 mb-0">Votre panier est vide</p>
          </div>
        ) : (
          <>
            <div className="cart-items" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {items.map(item => (
                <div key={item.id} className="d-flex align-items-center p-3 border-bottom">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="rounded me-3"
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-medium small">{item.name}</div>
                    <div className="text-muted small">
                      {item.quantity} x {item.price} DT
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold small">
                      {(item.price * item.quantity).toFixed(2)} DT
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Total:</span>
                <span className="fw-bold text-primary fs-5">
                  {total.toFixed(2)} DT
                </span>
              </div>
            </div>

            <div className="p-3">
              <div className="d-grid gap-2">
                <Link to="/cart" className="btn btn-primary">
                  Voir le panier
                </Link>
                <Link to="/checkout" className="btn btn-success">
                  Commander
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartWidget;